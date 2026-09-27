
import React, { useState, useMemo } from 'react';
import { AudioFile, ProcessingStatus, MergeGroup } from '../types';
import { FileIcon, DownloadIcon, AlertTriangleIcon, RefreshCwIcon, ScissorsIcon, CheckCircle2Icon, LoaderIcon, CombineIcon, GoogleDocsIcon, MergeIcon, VideoIcon, FileTextIcon, TrashIcon } from './icons';
import { formatBytes } from '../services/fileUtils';

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
  [ProcessingStatus.TRANSCRIBING]: { text: 'Transcribing', icon: LoaderIcon, color: 'text-blue-400' },
  [ProcessingStatus.ANALYZING]: { text: 'Analyzing', icon: LoaderIcon, color: 'text-purple-400' },
  [ProcessingStatus.ENHANCING]: { text: 'Fact-Checking', icon: LoaderIcon, color: 'text-teal-400' },
  [ProcessingStatus.GENERATING]: { text: 'Generating Docs', icon: LoaderIcon, color: 'text-indigo-400' },
  [ProcessingStatus.COMPLETE]: { text: 'Complete', icon: CheckCircle2Icon, color: 'text-green-400' },
  [ProcessingStatus.ERROR]: { text: 'Error', icon: AlertTriangleIcon, color: 'text-red-400' },
  [ProcessingStatus.SPLITTING]: { text: 'Splitting Audio', icon: ScissorsIcon, color: 'text-yellow-400' },
  [ProcessingStatus.COMBINING]: { text: 'Combining', icon: CombineIcon, color: 'text-yellow-400' },
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
  const isVideo = file.file.type.startsWith('video/');
  const isPdf = file.file.type === 'application/pdf';
  
  const FileTypeIcon = isVideo ? VideoIcon : isPdf ? FileTextIcon : FileIcon;
  const fileSize = file.file?.size || file.size || 0;

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
        {isSelectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file.id)}
            className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer"
          />
        )}
        <FileTypeIcon className={`w-6 h-6 flex-shrink-0 ${isVideo ? 'text-purple-400' : isPdf ? 'text-rose-400' : 'text-blue-400'}`} />
        <div className="truncate flex-1 min-w-0">
          <p className="truncate text-gray-200 text-sm font-medium" title={file.file.name}>{file.file.name}</p>
          {fileSize > 0 && (
            <p className="text-xs text-gray-500">{formatBytes(fileSize)}</p>
          )}
        </div>
      </div>
      
      <div className="flex-grow w-full sm:w-1/3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <div className={`flex items-center gap-1.5 font-medium ${color}`}>
            <Icon className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{text}</span>
          </div>
          <span className="font-semibold text-gray-300">{file.progress}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              file.status === ProcessingStatus.COMPLETE 
                ? 'bg-green-500' 
                : file.status === ProcessingStatus.ERROR 
                ? 'bg-red-500' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-400'
            }`} 
            style={{ width: `${Math.max(file.status === ProcessingStatus.QUEUED ? 5 : 0, file.progress)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto sm:justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
        {file.status === ProcessingStatus.COMPLETE && (
          <>
            <button
              onClick={() => onDownload(file.id, 'file')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
            >
              <DownloadIcon className="w-4 h-4" /> Download .docx
            </button>
            <button
              onClick={() => onOpenInGoogleDocs(file.id, 'file')}
              title="Copies content and opens a new Google Doc"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
            >
              <GoogleDocsIcon className="w-4 h-4" /> Open in Docs
            </button>
          </>
        )}
        {file.status === ProcessingStatus.ERROR && (
          <>
            <button
              onClick={() => onRetry(file.id)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
            >
              <RefreshCwIcon className="w-4 h-4" /> Retry
            </button>
            {isAudio && (
              <button
                onClick={() => onSplitAndRetry(file.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
              >
                <ScissorsIcon className="w-4 h-4" /> Split & Retry
              </button>
            )}
          </>
        )}
        <button
          onClick={() => onRemove(file.id)}
          className="p-2 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors ml-auto sm:ml-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Remove file"
          aria-label={`Remove ${file.file.name}`}
        >
          <TrashIcon className="w-4 h-4" />
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
    <div className="bg-gray-900/60 p-4 rounded-xl border border-blue-900/60 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
          <MergeIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div className="truncate min-w-0">
            <span className="truncate text-base font-bold text-blue-300 block" title={group.name}>{group.name}</span>
            <span className="text-xs text-gray-400">{filesInGroup.length} merged files</span>
          </div>
        </div>
        
        <div className="flex-grow w-full sm:w-1/3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <div className={`flex items-center gap-1.5 font-medium ${color}`}>
              <Icon className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{text}</span>
            </div>
            <span className="font-semibold text-gray-300">{group.progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                group.status === ProcessingStatus.COMPLETE 
                  ? 'bg-green-500' 
                  : group.status === ProcessingStatus.ERROR 
                  ? 'bg-red-500' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-400'
              }`} 
              style={{ width: `${Math.max(group.status === ProcessingStatus.QUEUED ? 5 : 0, group.progress)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto sm:justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
          {group.status === ProcessingStatus.COMPLETE && (
            <>
              <button
                onClick={() => onDownload(group.id, 'group')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
              >
                <DownloadIcon className="w-4 h-4" /> Download .docx
              </button>
              <button
                onClick={() => onOpenInGoogleDocs(group.id, 'group')}
                title="Copies content and opens a new Google Doc"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
              >
                <GoogleDocsIcon className="w-4 h-4" /> Open in Docs
              </button>
            </>
          )}
          {group.status === ProcessingStatus.ERROR && (
            <button
              onClick={() => onRetryGroup(group.id)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-transform transform active:scale-95 shadow-sm min-h-[38px] sm:min-h-[34px]"
            >
              <RefreshCwIcon className="w-4 h-4" /> Retry Group
            </button>
          )}
          <button
            onClick={() => onRemoveGroup(group.id)}
            className="p-2 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors ml-auto sm:ml-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Remove group"
            aria-label={`Remove ${group.name}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {group.errorMessage && group.status === ProcessingStatus.ERROR && (
          <p className="text-xs text-red-400 w-full text-center sm:text-left">{group.errorMessage}</p>
        )}

      <div className="pl-6 space-y-1.5 border-l-2 border-gray-800 ml-3">
        {filesInGroup.map(file => {
            const isVideo = file.file.type.startsWith('video/');
            const isPdf = file.file.type === 'application/pdf';
            const FileTypeIcon = isVideo ? VideoIcon : isPdf ? FileTextIcon : FileIcon;
            const fileSize = file.file?.size || file.size || 0;
            return (
              <div key={file.id} className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2 truncate mr-2">
                  <FileTypeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{file.file.name}</span>
                </div>
                {fileSize > 0 && <span className="text-gray-500 flex-shrink-0">{formatBytes(fileSize)}</span>}
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'processing' | 'complete' | 'error'>('all');

  const selectableFiles = useMemo(() => files.filter(f => !f.groupId && f.status === ProcessingStatus.QUEUED && !f.isSplit), [files]);
  
  const handleSelect = (id: string) => {
    setSelectedFileIds(prev => prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === selectableFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(selectableFiles.map(f => f.id));
    }
  };
  
  const handleMergeClick = () => {
    if (groupName.trim() && selectedFileIds.length >= 2) {
      onMerge(selectedFileIds, groupName.trim());
      setSelectedFileIds([]);
      setGroupName('');
    }
  };

  const completedFiles = useMemo(() => files.filter(f => f.status === ProcessingStatus.COMPLETE && !f.groupId && !f.isSplit), [files]);
  const completedGroups = useMemo(() => groups.filter(g => g.status === ProcessingStatus.COMPLETE), [groups]);
  const totalCompleted = completedFiles.length + completedGroups.length;

  const handleDownloadAllCompleted = () => {
    completedGroups.forEach(g => onDownload(g.id, 'group'));
    completedFiles.forEach(f => onDownload(f.id, 'file'));
  };

  const handleClearCompleted = () => {
    completedGroups.forEach(g => onRemoveGroup(g.id));
    completedFiles.forEach(f => onRemoveFile(f.id));
  };

  const activeProcessingCount = useMemo(() => {
    const processingStatuses = [
      ProcessingStatus.TRANSCRIBING,
      ProcessingStatus.ANALYZING,
      ProcessingStatus.ENHANCING,
      ProcessingStatus.GENERATING,
      ProcessingStatus.SPLITTING,
      ProcessingStatus.COMBINING
    ];
    return files.filter(f => processingStatuses.includes(f.status) && !f.groupId).length +
      groups.filter(g => processingStatuses.includes(g.status)).length;
  }, [files, groups]);

  const queuedCount = useMemo(() => {
    return files.filter(f => f.status === ProcessingStatus.QUEUED && !f.groupId).length +
      groups.filter(g => g.status === ProcessingStatus.QUEUED).length;
  }, [files, groups]);

  const errorCount = useMemo(() => {
    return files.filter(f => f.status === ProcessingStatus.ERROR && !f.groupId).length +
      groups.filter(g => g.status === ProcessingStatus.ERROR).length;
  }, [files, groups]);

  const filteredFiles = useMemo(() => {
    if (statusFilter === 'all') return files;
    if (statusFilter === 'queued') return files.filter(f => f.status === ProcessingStatus.QUEUED);
    if (statusFilter === 'complete') return files.filter(f => f.status === ProcessingStatus.COMPLETE);
    if (statusFilter === 'error') return files.filter(f => f.status === ProcessingStatus.ERROR);
    if (statusFilter === 'processing') {
      const processingStatuses = [
        ProcessingStatus.TRANSCRIBING,
        ProcessingStatus.ANALYZING,
        ProcessingStatus.ENHANCING,
        ProcessingStatus.GENERATING,
        ProcessingStatus.SPLITTING,
        ProcessingStatus.COMBINING
      ];
      return files.filter(f => processingStatuses.includes(f.status));
    }
    return files;
  }, [files, statusFilter]);

  const filteredGroups = useMemo(() => {
    if (statusFilter === 'all') return groups;
    if (statusFilter === 'queued') return groups.filter(g => g.status === ProcessingStatus.QUEUED);
    if (statusFilter === 'complete') return groups.filter(g => g.status === ProcessingStatus.COMPLETE);
    if (statusFilter === 'error') return groups.filter(g => g.status === ProcessingStatus.ERROR);
    if (statusFilter === 'processing') {
      const processingStatuses = [
        ProcessingStatus.TRANSCRIBING,
        ProcessingStatus.ANALYZING,
        ProcessingStatus.ENHANCING,
        ProcessingStatus.GENERATING,
        ProcessingStatus.COMBINING
      ];
      return groups.filter(g => processingStatuses.includes(g.status));
    }
    return groups;
  }, [groups, statusFilter]);

  if (files.length === 0 && groups.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8 sm:mt-10 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Queue Header with Actions and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">Processing Queue</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {files.length} {files.length === 1 ? 'file' : 'files'} in workspace
          </p>
        </div>

        {/* Global Queue Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {totalCompleted >= 2 && (
            <button
              type="button"
              onClick={handleDownloadAllCompleted}
              className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs shadow-sm transition-all min-h-[34px]"
              title="Download all completed documents as .docx"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              Download All ({totalCompleted})
            </button>
          )}

          {totalCompleted > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-1.5 px-3 rounded-lg text-xs border border-gray-700 transition-all min-h-[34px]"
              title="Clear finished items from queue"
            >
              <TrashIcon className="w-3.5 h-3.5 text-gray-400" />
              Clear Completed ({totalCompleted})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs / Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap min-h-[32px] ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
          }`}
        >
          All ({files.length + groups.length})
        </button>

        {queuedCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('queued')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap min-h-[32px] ${
              statusFilter === 'queued'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
            }`}
          >
            Queued ({queuedCount})
          </button>
        )}

        {activeProcessingCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 ${
              statusFilter === 'processing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-900 text-blue-400 hover:text-blue-300 border border-blue-900/60'
            }`}
          >
            <LoaderIcon className="w-3 h-3 animate-spin" />
            Processing ({activeProcessingCount})
          </button>
        )}

        {totalCompleted > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('complete')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap min-h-[32px] ${
              statusFilter === 'complete'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-900 text-green-400 hover:text-green-300 border border-green-900/60'
            }`}
          >
            Completed ({totalCompleted})
          </button>
        )}

        {errorCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('error')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap min-h-[32px] ${
              statusFilter === 'error'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-900 text-red-400 hover:text-red-300 border border-red-900/60'
            }`}
          >
            Errors ({errorCount})
          </button>
        )}
      </div>
      
      {/* File Merging Toolbar */}
      {selectableFiles.length >= 2 && (
        <div className="bg-gray-900 p-3.5 sm:p-4 rounded-xl border border-gray-700 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-gray-800 hover:bg-gray-750 px-3 py-2 rounded-lg border border-gray-700 flex-shrink-0 min-h-[38px] transition-colors"
          >
            {selectedFileIds.length === selectableFiles.length ? 'Deselect All' : `Select All (${selectableFiles.length})`}
          </button>
          
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter merge group name..."
            className="w-full sm:w-auto flex-grow bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[38px]"
            disabled={selectedFileIds.length < 2}
            aria-label="Merge group name"
          />
          <button
            onClick={handleMergeClick}
            disabled={selectedFileIds.length < 2 || !groupName.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[38px]"
          >
            <MergeIcon className="w-4 h-4" />
            Merge {selectedFileIds.length} Selected Files
          </button>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-3">
        {filteredGroups.map(group => (
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
        {filteredFiles.map(file => (
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
