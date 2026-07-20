
import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloudIcon } from './icons';

interface FileUploadProps {
  onFilesAdded: (files: FileList) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesAdded, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadFilesClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleUploadFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's click handler
    if (!disabled) {
      folderInputRef.current?.click();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesAdded(event.target.files);
      event.target.value = ''; // Reset input to allow re-uploading the same file/folder
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
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

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesAdded(files);
    }
  };
  
  const dynamicClasses = isDragging 
    ? 'border-blue-500 bg-gray-800' 
    : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800';

  return (
    <div className="flex flex-col">
      <label className="mb-2 font-semibold text-gray-300">Upload Media</label>
      <div
        onClick={handleUploadFilesClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex justify-center items-center w-full px-4 py-2 bg-gray-900 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dynamicClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="text-center py-4">
          <UploadCloudIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
          <p className="font-semibold text-gray-300">
            {isDragging ? 'Drop files here' : 'Drag & drop or click to upload files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports MP3, WAV, MP4, WebM, PDF. You can also{' '}
            <span
              onClick={handleUploadFolderClick}
              className="text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
              aria-label="Upload a folder"
              role="button"
            >
              upload a folder
            </span>.
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>
    </div>
  );
};
