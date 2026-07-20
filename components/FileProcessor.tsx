
import React, { useState, useMemo } from 'react';
import { AudioFile, ProcessingStatus, MergeGroup } from '../types';
import { FileIcon, DownloadIcon, AlertTriangleIcon, RefreshCwIcon, ScissorsIcon, CheckCircle2Icon, LoaderIcon, CombineIcon, GoogleDocsIcon, MergeIcon, VideoIcon, TrashIcon } from './icons';

interface FileProcessorProps {
  files: AudioFile[];
  groups: MergeGroup[];
  onRetry: (fileId: string) => void;
  onRetryGroup: (groupId: string) => void;
  onSplitAndRetry: (fileId: string) => void;
  onMerge: (fileIds: string[], name: string) => void;
  onDownload: (id: string, type: 'file' | 'group') => void;
  onOpenInGoogleDocs: (id: string, type: 'file' | 'group') => void;
  onRemoveFile: (id: string) => void;
  onRemoveGroup: (id: string) => void;
}

const statusInfo: Record<ProcessingStatus, { text: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }> = {
  [ProcessingStatus.QUEUED]: { text: 'Queued', icon: FileIcon, color: 'text-gray-400' },
  [ProcessingStatus.TRANSCRIBING]: { text: 'Transcribing...', icon: LoaderIcon, color: 'text-blue-400' },
  [ProcessingStatus.ANALYZING]: { text: 'Analyzing...', icon: LoaderIcon, color: 'text-purple-400' },
  [ProcessingStatus.ENHANCING]: { text: 'Fact-Checking...', icon: LoaderIcon, color: 'text-teal-400' },
  [ProcessingStatus.GENERATING]: { text: 'Generating Docs...', icon: LoaderIcon, color: 'text-indigo-400' },
  [ProcessingStatus.COMPLETE]: { text: 'Complete', icon: CheckCircle2Icon, color: 'text-green-400' },
  [ProcessingStatus.ERROR]: { text: 'Error', icon: AlertTriangleIcon, color: 'text-red-400' },
  [ProcessingStatus.SPLITTING]: { text: 'Splitting...', icon: ScissorsIcon, color: 'text-yellow-400' },
  [ProcessingStatus.COMBINING]: { text: 'Combining...', icon: CombineIcon, color: 'text-yellow-400' },
};


const FileItem: React.FC<{
  file: AudioFile, 
  onRetry: (id: string) => void, 
  onSplitAndRetry: (id: string) => void, 
  onDownload: (id: string, type: 'file' | 'group') => void, 
  onOpenInGoogleDocs: (id: string, type: 'file' | 'group') => void,
  onRemove: (id: string) => void,
  isSelected: boolean,
  onSelect: (id: string) => void,
  isSelectable: boolean,
}> = ({ file, onRetry, onSplitAndRetry, onDownload, onOpenInGoogleDocs, onRemove, isSelected, onSelect, isSelectable }) => {
  const { icon: Icon, text, color } = statusInfo[file.status];
  const isProcessing = [ProcessingStatus.TRANSCRIBING, ProcessingStatus.ANALYZING, ProcessingStatus.ENHANCING, ProcessingStatus.GENERATING, ProcessingStatus.SPLITTING, ProcessingStatus.COMBINING].includes(file.status);
  
  if (file.isSplit || file.groupId) return null;

  const isAudio = file.file.type.startsWith('audio/');
  const FileTypeIcon = file.file.type.startsWith('video/') ? VideoIcon : FileIcon;

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 w-full sm:w-1/3">
        {isSelectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file.id)}
            className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 flex-shrink-0"
          />
        )}
        <FileTypeIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
        <span className="truncate text-gray-300" title={file.file.name}>{file.file.name}</span>
      </div>
      
      <div className="flex-grow w-full sm:w-1/3">
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${file.progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${color}`}>
          <Icon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">{text}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
        {file.status === ProcessingStatus.COMPLETE && (
          <>
            <button onClick={() => onDownload(file.id, 'file')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
              <DownloadIcon className="w-4 h-4" /> Download .docx
            </button>
            <button onClick={() => onOpenInGoogleDocs(file.id, 'file')} title="Copies content and opens a new Google Doc" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
              <GoogleDocsIcon className="w-4 h-4" /> Open in Docs
            </button>
          </>
        )}
        {file.status === ProcessingStatus.ERROR && (
          <>
            <button onClick={() => onRetry(file.id)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
              <RefreshCwIcon className="w-4 h-4" /> Retry
            </button>
            {isAudio && (
              <button onClick={() => onSplitAndRetry(file.id)} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
                <ScissorsIcon className="w-4 h-4" /> Split & Retry
              </button>
            )}
          </>
        )}
        <button onClick={() => onRemove(file.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove file">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      {file.errorMessage && file.status === ProcessingStatus.ERROR && (
        <p className="text-xs text-red-400 mt-2 w-full sm:col-span-3 text-center sm:text-left">{file.errorMessage}</p>
      )}
    </div>
  );
};

const GroupItem: React.FC<{
  group: MergeGroup;
  filesInGroup: AudioFile[];
  onRetryGroup: (groupId: string) => void;
  onDownload: (id: string, type: 'file' | 'group') => void;
  onOpenInGoogleDocs: (id: string, type: 'file' | 'group') => void;
  onRemoveGroup: (id: string) => void;
}> = ({ group, filesInGroup, onRetryGroup, onDownload, onOpenInGoogleDocs, onRemoveGroup }) => {
  const { icon: Icon, text, color } = statusInfo[group.status];
  const isProcessing = [ProcessingStatus.TRANSCRIBING, ProcessingStatus.ANALYZING, ProcessingStatus.ENHANCING, ProcessingStatus.GENERATING, ProcessingStatus.COMBINING].includes(group.status);

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-blue-800 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-1/3">
          <MergeIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <span className="truncate text-lg font-bold text-blue-300" title={group.name}>{group.name}</span>
        </div>
        
        <div className="flex-grow w-full sm:w-1/3">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${group.progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
          <div className={`flex items-center gap-2 mt-1 ${color}`}>
            <Icon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{text}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
          {group.status === ProcessingStatus.COMPLETE && (
            <>
              <button onClick={() => onDownload(group.id, 'group')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
                <DownloadIcon className="w-4 h-4" /> Download .docx
              </button>
              <button onClick={() => onOpenInGoogleDocs(group.id, 'group')} title="Copies content and opens a new Google Doc" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
                <GoogleDocsIcon className="w-4 h-4" /> Open in Docs
              </button>
            </>
          )}
          {group.status === ProcessingStatus.ERROR && (
            <button onClick={() => onRetryGroup(group.id)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-transform transform hover:scale-105">
              <RefreshCwIcon className="w-4 h-4" /> Retry Group
            </button>
          )}
          <button onClick={() => onRemoveGroup(group.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove group">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {group.errorMessage && group.status === ProcessingStatus.ERROR && (
          <p className="text-xs text-red-400 w-full text-center sm:text-left">{group.errorMessage}</p>
        )}

      <div className="pl-9 space-y-2 border-l-2 border-gray-700 ml-3">
        {filesInGroup.map(file => {
            const FileTypeIcon = file.file.type.startsWith('video/') ? VideoIcon : FileIcon;
            return (
              <div key={file.id} className="flex items-center gap-2 text-sm text-gray-400">
                <FileTypeIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{file.file.name}</span>
              </div>
            );
        })}
      </div>
    </div>
  );
}


export const FileProcessor: React.FC<FileProcessorProps> = ({ files, groups, onRetry, onRetryGroup, onSplitAndRetry, onMerge, onDownload, onOpenInGoogleDocs, onRemoveFile, onRemoveGroup }) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const selectableFiles = useMemo(() => files.filter(f => !f.groupId && f.status === ProcessingStatus.QUEUED && !f.isSplit), [files]);
  
  const handleSelect = (id: string) => {
    setSelectedFileIds(prev => prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]);
  };
  
  const handleMergeClick = () => {
    if (groupName.trim() && selectedFileIds.length >= 2) {
      onMerge(selectedFileIds, groupName.trim());
      setSelectedFileIds([]);
      setGroupName('');
    }
  };

  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-10 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">Processing Queue</h2>
      
      {selectableFiles.length >=2 && (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-4 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter merge group name..."
            className="w-full sm:w-auto flex-grow bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
            disabled={selectedFileIds.length < 2}
            aria-label="Merge group name"
          />
          <button
            onClick={handleMergeClick}
            disabled={selectedFileIds.length < 2 || !groupName.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MergeIcon className="w-5 h-5" />
            Merge {selectedFileIds.length} Selected Files
          </button>
        </div>
      )}

      <div className="space-y-3">
        {groups.map(group => (
          <GroupItem 
            key={group.id}
            group={group}
            filesInGroup={files.filter(f => group.fileIds.includes(f.id))}
            onRetryGroup={onRetryGroup}
            onDownload={onDownload}
            onOpenInGoogleDocs={onOpenInGoogleDocs}
            onRemoveGroup={onRemoveGroup}
          />
        ))}
        {files.map(file => (
          <FileItem 
            key={file.id} 
            file={file} 
            onRetry={onRetry} 
            onSplitAndRetry={onSplitAndRetry} 
            onDownload={onDownload} 
            onOpenInGoogleDocs={onOpenInGoogleDocs}
            onRemove={onRemoveFile}
            isSelected={selectedFileIds.includes(file.id)}
            onSelect={handleSelect}
            isSelectable={selectableFiles.some(sf => sf.id === file.id)}
          />
        ))}
      </div>
    </div>
  );
};
