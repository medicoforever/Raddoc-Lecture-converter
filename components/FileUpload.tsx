
import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloudIcon, FileIcon, VideoIcon, FileTextIcon, LoaderIcon, CheckCircle2Icon, AlertTriangleIcon, XIcon, FolderIcon } from './icons';
import { UploadProgressItem } from '../types';
import { formatBytes } from '../services/fileUtils';

interface FileUploadProps {
  onFilesAdded: (files: FileList) => void;
  disabled: boolean;
  uploadProgressList?: UploadProgressItem[];
  isUploading?: boolean;
  onClearProgressItem?: (id: string) => void;
  onClearAllProgress?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesAdded, 
  disabled, 
  uploadProgressList = [], 
  isUploading = false,
  onClearProgressItem,
  onClearAllProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadFilesClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleUploadFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's click handler
    if (!disabled && !isUploading) {
      folderInputRef.current?.click();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesAdded(event.target.files);
      event.target.value = ''; // Reset input to allow re-uploading the same file/folder
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesAdded(files);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) {
      return <VideoIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    }
    if (fileType === 'application/pdf') {
      return <FileTextIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />;
    }
    return <FileIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />;
  };

  const completedCount = uploadProgressList.filter(item => item.status === 'completed').length;
  const activeCount = uploadProgressList.filter(item => item.status === 'uploading' || item.status === 'indexing').length;
  const hasItems = uploadProgressList.length > 0;
  
  const dynamicClasses = isDragging 
    ? 'border-blue-500 bg-blue-950/30 scale-[1.01]' 
    : isUploading
    ? 'border-blue-700/60 bg-gray-900/80'
    : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/80';

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold text-gray-200 flex items-center gap-2">
          <span>Upload Media</span>
          {isUploading && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-blue-300 border border-blue-700/50 animate-pulse">
              <LoaderIcon className="w-3 h-3 animate-spin" /> Uploading...
            </span>
          )}
        </label>
        {hasItems && completedCount > 0 && !isUploading && onClearAllProgress && (
          <button
            type="button"
            onClick={onClearAllProgress}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Clear list
          </button>
        )}
      </div>

      <div
        onClick={handleUploadFilesClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex justify-center items-center w-full px-4 py-3 bg-gray-900 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${dynamicClasses} ${(disabled && !isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="text-center py-2 sm:py-3 w-full max-w-sm mx-auto">
          <UploadCloudIcon className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 transition-transform duration-200 ${isDragging ? 'scale-110 text-blue-400' : isUploading ? 'text-blue-500 animate-bounce' : 'text-gray-400'}`} />
          <p className="font-semibold text-gray-200 text-sm sm:text-base">
            {isDragging 
              ? 'Drop files here to upload' 
              : isUploading 
              ? 'Uploading your media files...' 
              : 'Drag & drop or tap to browse'}
          </p>
          
          {/* Quick Action Buttons for High Touch & Desktop Usability */}
          <div className="flex items-center justify-center gap-2 mt-3 mb-2 flex-wrap">
            <button
              type="button"
              onClick={handleUploadFilesClick}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-all min-h-[38px] sm:min-h-[36px]"
            >
              <FileIcon className="w-4 h-4" />
              Browse Files
            </button>

            <button
              type="button"
              onClick={handleUploadFolderClick}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 active:bg-gray-750 border border-gray-700 rounded-lg transition-all min-h-[38px] sm:min-h-[36px]"
            >
              <FolderIcon className="w-4 h-4 text-amber-400" />
              Upload Folder
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 flex-wrap mt-2 text-[11px] text-gray-400">
            <span className="text-gray-400 mr-1">Formats:</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">Audio</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">Video</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">PDF</span>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isUploading}
          accept="audio/*,video/*,application/pdf"
        />
        <input
          type="file"
          ref={folderInputRef}
          multiple
          // @ts-expect-error: webkitdirectory is a non-standard property
          webkitdirectory="true"
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Real-time Upload Progress Section */}
      {hasItems && (
        <div className="mt-3 space-y-2.5">
          {uploadProgressList.map(item => {
            const isCompleted = item.status === 'completed';
            const isError = item.status === 'error';
            const isIndexing = item.status === 'indexing';
            const isItemUploading = item.status === 'uploading';

            return (
              <div 
                key={item.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gray-900/90 border-green-800/60' 
                    : isError
                    ? 'bg-red-950/30 border-red-800/60'
                    : 'bg-gray-900/90 border-blue-800/70 shadow-md shadow-blue-950/40'
                }`}
              >
                {/* Header: Icon, filename, size, and percentage / status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(item.fileType)}
                    <span className="text-xs sm:text-sm font-medium text-gray-200 truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      ({formatBytes(item.fileSize)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-950/60 border border-green-700/50 px-2 py-0.5 rounded-full">
                        <CheckCircle2Icon className="w-3.5 h-3.5" />
                        100% Uploaded
                      </span>
                    )}

                    {isError && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-950/60 border border-red-700/50 px-2 py-0.5 rounded-full">
                        <AlertTriangleIcon className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}

                    {(isItemUploading || isIndexing) && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-600/60 px-2 py-0.5 rounded-full">
                        <LoaderIcon className="w-3 h-3 animate-spin text-blue-400" />
                        {item.percentage}%
                      </span>
                    )}

                    {onClearProgressItem && isCompleted && (
                      <button
                        type="button"
                        onClick={() => onClearProgressItem(item.id)}
                        className="text-gray-500 hover:text-gray-300 p-0.5 rounded transition-colors"
                        title="Dismiss"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar with percentage */}
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden relative">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500' 
                        : isError
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${Math.max(3, item.percentage)}%` }}
                  />
                </div>

                {/* Footer: Detailed stats (bytes loaded, speed, status message) */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <div>
                    {isCompleted ? (
                      <span className="text-green-400/90 font-medium">Ready for processing</span>
                    ) : isError ? (
                      <span className="text-red-400 font-medium">{item.errorMessage || 'Upload failed'}</span>
                    ) : isIndexing ? (
                      <span className="text-cyan-300">Finalizing & indexing file in database...</span>
                    ) : (
                      <span>
                        Uploaded {formatBytes(item.loadedBytes)} of {formatBytes(item.totalBytes)}
                      </span>
                    )}
                  </div>

                  {!isCompleted && !isError && item.speed && (
                    <div className="text-gray-400 font-mono">
                      {item.speed}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Batch Summary Banner */}
          {completedCount > 0 && activeCount === 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-green-950/30 border border-green-800/40 rounded-lg text-xs text-green-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                {completedCount === 1 
                  ? 'File uploaded successfully and added to queue.' 
                  : `All ${completedCount} files uploaded successfully and added to queue.`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
