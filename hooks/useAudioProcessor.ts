
import { useState, useCallback, useEffect } from 'react';
import { GeminiModel, ProcessingStatus, CorrectionMode } from '../types';
import type { AudioFile, MergeGroup, UploadProgressItem } from '../types';
import { transcribeAudio, analyzeTranscript, enhanceAndCorrectContent, agenticEnhancement } from '../services/geminiService';
import { downloadDocuments, openInGoogleDocs } from '../services/documentService';
import { addFile, getFile, deleteFile } from '../services/dbService';
import { formatSpeed } from '../services/fileUtils';

// Helper to convert an AudioBuffer to a WAV file Blob.
const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferView = new DataView(new ArrayBuffer(length));
  const channels = [];
  let i, sample;
  let offset = 0;
  let pos = 0;

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(bufferView, pos, 'RIFF'); pos += 4;
  bufferView.setUint32(pos, 36 + buffer.length * numOfChan * 2, true); pos += 4;
  writeString(bufferView, pos, 'WAVE'); pos += 4;

  // fmt chunk
  writeString(bufferView, pos, 'fmt '); pos += 4;
  bufferView.setUint32(pos, 16, true); pos += 4; // Sub-chunk size
  bufferView.setUint16(pos, 1, true); pos += 2; // Audio format (PCM)
  bufferView.setUint16(pos, numOfChan, true); pos += 2;
  bufferView.setUint32(pos, buffer.sampleRate, true); pos += 4;
  bufferView.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true); pos += 4; // Byte rate
  bufferView.setUint16(pos, numOfChan * 2, true); pos += 2; // Block align
  bufferView.setUint16(pos, 16, true); pos += 2; // Bits per sample

  // data chunk
  writeString(bufferView, pos, 'data'); pos += 4;
  bufferView.setUint32(pos, buffer.length * numOfChan * 2, true); pos += 4;

  // Write PCM data
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  offset = 44;
  for (i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      bufferView.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([bufferView], { type: 'audio/wav' });
};

// Splits an audio file into two halves using the Web Audio API.
const splitAudioFile = async (file: File): Promise<[File, File]> => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const { numberOfChannels, sampleRate, length } = originalBuffer;
    const midpoint = Math.floor(length / 2);

    const firstHalfBuffer = audioContext.createBuffer(numberOfChannels, midpoint, sampleRate);
    const secondHalfBuffer = audioContext.createBuffer(numberOfChannels, length - midpoint, sampleRate);

    for (let i = 0; i < numberOfChannels; i++) {
        const channelData = originalBuffer.getChannelData(i);
        firstHalfBuffer.copyToChannel(channelData.subarray(0, midpoint), i);
        secondHalfBuffer.copyToChannel(channelData.subarray(midpoint), i);
    }
    
    const firstHalfBlob = audioBufferToWavBlob(firstHalfBuffer);
    const secondHalfBlob = audioBufferToWavBlob(secondHalfBuffer);

    const getBaseName = (name: string) => name.substring(0, name.lastIndexOf('.')) || name;

    const firstHalfFile = new File([firstHalfBlob], `${getBaseName(file.name)}-part1.wav`, { type: 'audio/wav' });
    const secondHalfFile = new File([secondHalfBlob], `${getBaseName(file.name)}-part2.wav`, { type: 'audio/wav' });

    return [firstHalfFile, secondHalfFile];
};

const LOCAL_STORAGE_KEYS = {
  FILES_META: 'raddoc_files_meta',
  GROUPS: 'raddoc_groups',
  MODEL: 'raddoc_model',
  CORRECTION_MODE: 'raddoc_correction_mode',
};

const IN_PROGRESS_STATUSES = [
  ProcessingStatus.TRANSCRIBING,
  ProcessingStatus.ANALYZING,
  ProcessingStatus.ENHANCING,
  ProcessingStatus.GENERATING,
  ProcessingStatus.SPLITTING,
  ProcessingStatus.COMBINING,
];

export const useAudioProcessor = () => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [groups, setGroups] = useState<MergeGroup[]>([]);
  const [uploadProgressList, setUploadProgressList] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GeminiModel.GEMINI_3_8_FLASH);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>(CorrectionMode.STANDARD);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL) as GeminiModel;
        if (storedModel && Object.values(GeminiModel).includes(storedModel)) {
          setSelectedModel(storedModel);
        }
        
        const storedCorrectionMode = localStorage.getItem(LOCAL_STORAGE_KEYS.CORRECTION_MODE) as CorrectionMode;
        if (storedCorrectionMode && Object.values(CorrectionMode).includes(storedCorrectionMode)) {
          setCorrectionMode(storedCorrectionMode);
        }
        
        const storedGroupsJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.GROUPS);
        if (storedGroupsJSON) {
          const loadedGroups = JSON.parse(storedGroupsJSON) as MergeGroup[];
          const restoredGroups = loadedGroups.map(group => {
            if (IN_PROGRESS_STATUSES.includes(group.status)) {
                let progress = 0;
                if (group.initialContent) progress = 75;
                else progress = 0;
                return { ...group, status: ProcessingStatus.QUEUED, progress, errorMessage: undefined };
            }
            return group;
          });
          setGroups(restoredGroups);
        }

        const storedFilesMetaJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.FILES_META);
        if (storedFilesMetaJSON) {
          type StoredFileMeta = Omit<AudioFile, 'file'> & { file: { name: string; type: string } };
          const filesMeta = JSON.parse(storedFilesMetaJSON) as StoredFileMeta[];

          const restoredFilesPromises = filesMeta.map(async (meta) => {
            const fileBlob = await getFile(meta.id);
            if (!fileBlob) return null;
            
            const file = new File([fileBlob], meta.file.name, { type: meta.file.type });
            const restoredFile = { ...meta, file };

            if (IN_PROGRESS_STATUSES.includes(restoredFile.status)) {
              restoredFile.status = ProcessingStatus.QUEUED;
              if (restoredFile.initialContent) {
                  restoredFile.progress = 70;
              } else if (restoredFile.transcript) {
                  restoredFile.progress = 40;
              } else {
                  restoredFile.progress = 0;
              }
              restoredFile.errorMessage = undefined;
            }
            return restoredFile;
          });

          const restoredFiles = (await Promise.all(restoredFilesPromises)).filter((f): f is AudioFile => f !== null);
          setFiles(restoredFiles);
        }
      } catch (error) {
        console.error("Failed to load state from storage:", error);
        Object.values(LOCAL_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      } finally {
        setIsInitialized(true);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const filesMeta = files.map(({ file, ...meta }) => ({
        ...meta,
        file: { name: file.name, type: file.type },
      }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.FILES_META, JSON.stringify(filesMeta));
      localStorage.setItem(LOCAL_STORAGE_KEYS.GROUPS, JSON.stringify(groups));
      localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, selectedModel);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CORRECTION_MODE, correctionMode);
    } catch (error) {
      console.error("Failed to save state to storage:", error);
    }
  }, [files, groups, selectedModel, correctionMode, isInitialized]);

  const updateFileState = useCallback((id: string, updates: Partial<AudioFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  const updateGroupState = useCallback((id: string, updates: Partial<MergeGroup>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const removeFile = useCallback(async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    try {
        await deleteFile(id);
    } catch (error) {
        console.error("Failed to delete file from DB:", error);
    }
  }, []);

  const removeGroup = useCallback(async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    // Also remove the files that were part of this group
    const filesToRemove = files.filter(f => group.fileIds.includes(f.id));
    setFiles(prev => prev.filter(f => !group.fileIds.includes(f.id)));
    
    try {
        await Promise.all(filesToRemove.map(f => deleteFile(f.id)));
    } catch (error) {
        console.error("Failed to delete group files from DB:", error);
    }
  }, [files, groups]);

  const processFile = useCallback(async (file: AudioFile) => {
    try {
      let transcript = file.transcript;
      
      if (!transcript) {
        updateFileState(file.id, { status: ProcessingStatus.TRANSCRIBING, progress: 10 });
        transcript = await transcribeAudio(file.file, selectedModel, file.part);
        updateFileState(file.id, { transcript, status: ProcessingStatus.ANALYZING, progress: 40 });
      } else {
        updateFileState(file.id, { status: ProcessingStatus.ANALYZING, progress: 40 });
      }
      
      let initialContent = file.initialContent;

      if (!initialContent) {
        initialContent = await analyzeTranscript(transcript!, selectedModel);
        updateFileState(file.id, { initialContent, status: ProcessingStatus.ENHANCING, progress: 70 });
      } else {
        updateFileState(file.id, { status: ProcessingStatus.ENHANCING, progress: 70 });
      }
      
      let enhancements;
      if (correctionMode === CorrectionMode.ENHANCED) {
        enhancements = await agenticEnhancement(initialContent!, selectedModel);
      } else if (correctionMode === CorrectionMode.GEMINI_3_1_PRO) {
        enhancements = await enhanceAndCorrectContent(initialContent!, GeminiModel.GEMINI_3_1_PRO);
      } else {
        enhancements = await enhanceAndCorrectContent(initialContent!, selectedModel);
      }
      
      const finalContent = initialContent! + enhancements;
      
      updateFileState(file.id, { finalContent, status: ProcessingStatus.COMPLETE, progress: 100 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      updateFileState(file.id, { status: ProcessingStatus.ERROR, errorMessage, progress: 0 });
    }
  }, [selectedModel, updateFileState, correctionMode]);

  const processGroup = useCallback(async (group: MergeGroup) => {
    const groupFiles = files.filter(f => group.fileIds.includes(f.id));
    
    try {
      updateGroupState(group.id, { status: ProcessingStatus.TRANSCRIBING, progress: 10 });
      
      const transcripts = await Promise.all(
        groupFiles.map(file => {
          if (file.transcript) {
            // If already transcribed, ensure visual state is consistent
            if (file.status !== ProcessingStatus.COMPLETE) {
               updateFileState(file.id, { status: ProcessingStatus.COMPLETE, progress: 100 });
            }
            return Promise.resolve(file.transcript);
          }
          
          updateFileState(file.id, { status: ProcessingStatus.TRANSCRIBING, progress: 10 });
          return transcribeAudio(file.file, selectedModel).then(transcript => {
            updateFileState(file.id, { transcript, status: ProcessingStatus.COMPLETE, progress: 100 });
            return transcript;
          });
        })
      );

      let initialContent = group.initialContent;
      
      if (!initialContent) {
        updateGroupState(group.id, { status: ProcessingStatus.ANALYZING, progress: 50 });
        const combinedTranscript = transcripts.join('\n\n---\n\n');
        
        initialContent = await analyzeTranscript(combinedTranscript, selectedModel);
        updateGroupState(group.id, { initialContent, status: ProcessingStatus.ENHANCING, progress: 75 });
      } else {
        updateGroupState(group.id, { status: ProcessingStatus.ENHANCING, progress: 75 });
      }

      let enhancements;
      if (correctionMode === CorrectionMode.ENHANCED) {
        enhancements = await agenticEnhancement(initialContent!, selectedModel);
      } else if (correctionMode === CorrectionMode.GEMINI_3_1_PRO) {
        enhancements = await enhanceAndCorrectContent(initialContent!, GeminiModel.GEMINI_3_1_PRO);
      } else {
        enhancements = await enhanceAndCorrectContent(initialContent!, selectedModel);
      }
      
      const finalContent = initialContent! + enhancements;
      
      updateGroupState(group.id, { finalContent, status: ProcessingStatus.COMPLETE, progress: 100 });
      groupFiles.forEach(f => updateFileState(f.id, { status: ProcessingStatus.COMPLETE }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during group processing.";
      updateGroupState(group.id, { status: ProcessingStatus.ERROR, errorMessage, progress: 0 });
      groupFiles.forEach(f => updateFileState(f.id, { status: ProcessingStatus.ERROR, errorMessage }));
    }
  }, [files, selectedModel, updateFileState, updateGroupState, correctionMode]);
  
  const processSplitFile = useCallback(async (originalFile: AudioFile) => {
    const part1 = files.find(f => f.originalId === originalFile.id && f.part === 1);
    const part2 = files.find(f => f.originalId === originalFile.id && f.part === 2);

    if(!part1 || !part2) return;

    try {
        updateFileState(originalFile.id, { status: ProcessingStatus.TRANSCRIBING, progress: 10 });
        
        const processPart = async (part: AudioFile) => {
            if (part.transcript) {
                if (part.status !== ProcessingStatus.COMPLETE) {
                    updateFileState(part.id, { status: ProcessingStatus.COMPLETE, progress: 100 });
                }
                return part.transcript;
            }
            updateFileState(part.id, { status: ProcessingStatus.TRANSCRIBING, progress: 10 });
            const t = await transcribeAudio(part.file, selectedModel, part.part);
            updateFileState(part.id, { transcript: t, status: ProcessingStatus.COMPLETE, progress: 100 });
            return t;
        };

        const [transcript1, transcript2] = await Promise.all([processPart(part1), processPart(part2)]);
        
        let initialContent = originalFile.initialContent;

        if (!initialContent) {
            updateFileState(originalFile.id, { status: ProcessingStatus.COMBINING, progress: 50 });
            const combinedTranscript = `${transcript1}\n${transcript2}`;
            
            updateFileState(originalFile.id, { status: ProcessingStatus.ANALYZING, progress: 60 });
            initialContent = await analyzeTranscript(combinedTranscript, selectedModel);
            updateFileState(originalFile.id, { initialContent, status: ProcessingStatus.ENHANCING, progress: 80 });
        } else {
            updateFileState(originalFile.id, { status: ProcessingStatus.ENHANCING, progress: 80 });
        }

        const enhancements = correctionMode === CorrectionMode.ENHANCED
          ? await agenticEnhancement(initialContent!, selectedModel)
          : correctionMode === CorrectionMode.GEMINI_3_1_PRO
          ? await enhanceAndCorrectContent(initialContent!, GeminiModel.GEMINI_3_1_PRO)
          : await enhanceAndCorrectContent(initialContent!, selectedModel);
        
        const finalContent = initialContent! + enhancements;
        
        updateFileState(originalFile.id, { finalContent, status: ProcessingStatus.COMPLETE, progress: 100 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during split processing.";
        updateFileState(originalFile.id, { status: ProcessingStatus.ERROR, errorMessage, progress: 0 });
        if (part1) updateFileState(part1.id, { status: ProcessingStatus.ERROR, errorMessage });
        if (part2) updateFileState(part2.id, { status: ProcessingStatus.ERROR, errorMessage });
    }

  }, [files, selectedModel, updateFileState, correctionMode]);


  const startProcessing = useCallback(async () => {
    setIsProcessing(true);
    
    const filesToProcess = files.filter(f => !f.groupId && f.status === ProcessingStatus.QUEUED && !f.isSplit);
    const groupsToProcess = groups.filter(g => g.status === ProcessingStatus.QUEUED);

    const filePromises = filesToProcess.map(processFile);
    const groupPromises = groupsToProcess.map(processGroup);

    await Promise.all([...filePromises, ...groupPromises]);

    setIsProcessing(false);
  }, [files, groups, processFile, processGroup]);

  useEffect(() => {
    const splitOriginals = files.filter(f => f.status === ProcessingStatus.SPLITTING);
    if(splitOriginals.length > 0){
        setIsProcessing(true);
        const processingPromises = splitOriginals.map(processSplitFile);
        Promise.all(processingPromises).then(() => setIsProcessing(false));
    }
  }, [files, processSplitFile]);

  const clearUploadProgressItem = useCallback((id: string) => {
    setUploadProgressList(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearAllUploadProgress = useCallback(() => {
    setUploadProgressList([]);
  }, []);

  const handleFilesAdded = useCallback(async (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    const validFiles = Array.from(incomingFiles).filter(
      file => file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type === 'application/pdf'
    );

    if (validFiles.length === 0) return;

    setIsUploading(true);

    const initialUploadItems: UploadProgressItem[] = validFiles.map(file => ({
      id: `upload-${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      loadedBytes: 0,
      totalBytes: file.size || 1,
      percentage: 0,
      status: 'uploading',
      speed: '0 B/s',
    }));

    setUploadProgressList(prev => [...prev, ...initialUploadItems]);

    // Process each file with progress
    const uploadPromises = validFiles.map(async (file, index) => {
      const uploadItem = initialUploadItems[index];
      const newFileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      const total = file.size || 1;
      const startTime = Date.now();

      // Chunk size between 256KB and 2MB
      const chunkSize = Math.max(256 * 1024, Math.min(2 * 1024 * 1024, Math.ceil(total / 25)));

      try {
        let loaded = 0;
        
        // Chunked read to track actual upload bytes
        for (let offset = 0; offset < total; offset += chunkSize) {
          const chunk = file.slice(offset, offset + chunkSize);
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              loaded = Math.min(total, offset + chunk.size);
              const elapsedSec = Math.max(0.05, (Date.now() - startTime) / 1000);
              const bytesPerSec = loaded / elapsedSec;
              const percent = Math.min(92, Math.round((loaded / total) * 92));
              
              setUploadProgressList(prev => prev.map(item => 
                item.id === uploadItem.id 
                  ? { 
                      ...item, 
                      loadedBytes: loaded, 
                      percentage: percent, 
                      speed: formatSpeed(bytesPerSec) 
                    } 
                  : item
              ));
              resolve();
            };
            reader.onerror = () => reject(reader.error || new Error('File read error'));
            reader.readAsArrayBuffer(chunk);
          });
        }

        // Indexing / storing phase
        setUploadProgressList(prev => prev.map(item => 
          item.id === uploadItem.id 
            ? { ...item, status: 'indexing', percentage: 96, loadedBytes: total } 
            : item
        ));

        await addFile(newFileId, file);

        const newAudioFile: AudioFile = {
          id: newFileId,
          file,
          size: file.size,
          status: ProcessingStatus.QUEUED,
          progress: 0,
          isSplit: false,
        };

        setFiles(prev => [...prev, newAudioFile]);

        setUploadProgressList(prev => prev.map(item => 
          item.id === uploadItem.id 
            ? { 
                ...item, 
                status: 'completed', 
                percentage: 100, 
                loadedBytes: total, 
                completedAt: Date.now() 
              } 
            : item
        ));

      } catch (error) {
        console.error("Upload error for file:", file.name, error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file.";
        setUploadProgressList(prev => prev.map(item => 
          item.id === uploadItem.id 
            ? { ...item, status: 'error', errorMessage } 
            : item
        ));
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
  }, []);
  
  const handleMergeFiles = (fileIds: string[], name: string) => {
    const newGroup: MergeGroup = {
      id: `group-${name.replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      fileIds,
      status: ProcessingStatus.QUEUED,
      progress: 0,
    };
    setGroups(prev => [...prev, newGroup]);
    setFiles(prev => prev.map(f => fileIds.includes(f.id) ? { ...f, groupId: newGroup.id, status: ProcessingStatus.QUEUED } : f));
  };

  const handleRetry = (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (fileToRetry) {
        let resumeProgress = 0;
        if (fileToRetry.initialContent) resumeProgress = 70;
        else if (fileToRetry.transcript) resumeProgress = 40;

        updateFileState(fileId, { status: ProcessingStatus.QUEUED, errorMessage: undefined, progress: resumeProgress });
        setIsProcessing(true);
        processFile(fileToRetry).finally(() => setIsProcessing(false));
    }
  };
  
  const handleRetryGroup = (groupId: string) => {
    const groupToRetry = groups.find(g => g.id === groupId);
    if (groupToRetry) {
        let resumeProgress = 0;
        if (groupToRetry.initialContent) resumeProgress = 75;

        updateGroupState(groupId, { status: ProcessingStatus.QUEUED, errorMessage: undefined, progress: resumeProgress });
        const groupFiles = files.filter(f => groupToRetry.fileIds.includes(f.id));
        groupFiles.forEach(f => updateFileState(f.id, { status: ProcessingStatus.QUEUED, errorMessage: undefined, progress: f.transcript ? 100 : 0 }));
        setIsProcessing(true);
        processGroup(groupToRetry).finally(() => setIsProcessing(false));
    }
  };

  const handleSplitAndRetry = (fileId: string) => {
    const fileToSplit = files.find(f => f.id === fileId);
    if (!fileToSplit || !fileToSplit.file.type.startsWith('audio/')) return;

    updateFileState(fileId, { status: ProcessingStatus.SPLITTING, progress: 5, errorMessage: undefined });

    splitAudioFile(fileToSplit.file).then(async ([part1File, part2File]) => {
        const part1: AudioFile = {
            id: `${fileToSplit.id}-part1`,
            file: part1File,
            status: ProcessingStatus.QUEUED,
            progress: 0,
            isSplit: true,
            originalId: fileToSplit.id,
            part: 1,
        };
        const part2: AudioFile = {
            id: `${fileToSplit.id}-part2`,
            file: part2File,
            status: ProcessingStatus.QUEUED,
            progress: 0,
            isSplit: true,
            originalId: fileToSplit.id,
            part: 2,
        };
        await Promise.all([addFile(part1.id, part1.file), addFile(part2.id, part2.file)]);
        setFiles(prev => [...prev, part1, part2]);
    }).catch(error => {
        console.error("Failed to split audio file:", error);
        const errorMessage = error instanceof Error ? `Audio splitting failed: ${error.message}` : "Failed to split audio file.";
        updateFileState(fileId, { status: ProcessingStatus.ERROR, errorMessage });
    });
  };
  
  const downloadFile = (id: string, type: 'file' | 'group') => {
    if (type === 'group') {
      const group = groups.find(g => g.id === id);
      if (group?.finalContent) {
        updateGroupState(id, { status: ProcessingStatus.GENERATING });
        downloadDocuments(group.finalContent, group.name).finally(() => {
          updateGroupState(id, { status: ProcessingStatus.COMPLETE });
        });
      }
    } else {
        const file = files.find(f => f.id === id);
        if(file?.finalContent) {
          updateFileState(file.id, { status: ProcessingStatus.GENERATING });
          const baseFileName = file.file.name.substring(0, file.file.name.lastIndexOf('.'));
          downloadDocuments(file.finalContent, baseFileName).finally(() => {
            updateFileState(file.id, { status: ProcessingStatus.COMPLETE });
          });
        }
    }
  };

  const openFileInGoogleDocs = (id: string, type: 'file' | 'group') => {
    if (type === 'group') {
      const group = groups.find(g => g.id === id);
      if (group?.finalContent) {
        openInGoogleDocs(group.finalContent);
      }
    } else {
      const file = files.find(f => f.id === id);
      if (file?.finalContent) {
        openInGoogleDocs(file.finalContent);
      }
    }
  };

  return {
    files,
    groups,
    uploadProgressList,
    isUploading,
    clearUploadProgressItem,
    clearAllUploadProgress,
    selectedModel,
    isProcessing,
    correctionMode,
    setCorrectionMode,
    setSelectedModel,
    handleFilesAdded,
    startProcessing,
    handleRetry,
    handleRetryGroup,
    handleSplitAndRetry,
    handleMergeFiles,
    downloadFile,
    openFileInGoogleDocs,
    removeFile,
    removeGroup,
  };
};
