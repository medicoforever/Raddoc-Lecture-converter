
import { CorrectionMode } from './types';
import React from 'react';
import { ModelSelector } from './components/ModelSelector';
import { FileUpload } from './components/FileUpload';
import { FileProcessor } from './components/FileProcessor';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { Header } from './components/Header';
import { SparklesIcon, LoaderIcon } from './components/icons';

const CorrectionModeSelector: React.FC<{
  correctionMode: CorrectionMode;
  setCorrectionMode: (mode: CorrectionMode) => void;
  disabled: boolean;
}> = ({ correctionMode, setCorrectionMode, disabled }) => {
  const modes = [
    { key: CorrectionMode.STANDARD, label: 'Standard', description: 'Standard fact-checking for good accuracy.' },
    { key: CorrectionMode.ENHANCED, label: 'Enhanced', description: 'Multi-agent system for higher accuracy (Slower).' },
    { key: CorrectionMode.GEMINI_3_1_PRO, label: 'Gemini 3.1 Pro', description: 'Uses Gemini 3.1 Pro for analysis (Best Quality).' },
  ];

  const selectedModeDetails = modes.find(m => m.key === correctionMode);

  return (
    <div className="flex flex-col items-center w-full">
      <label className="mb-2 font-semibold text-gray-200 text-sm sm:text-base">Fact-Checking Mode</label>
      <div className="grid grid-cols-3 gap-1.5 w-full max-w-lg bg-gray-900/90 border border-gray-700/80 rounded-xl p-1.5">
        {modes.map(mode => {
          const isSelected = correctionMode === mode.key;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => setCorrectionMode(mode.key)}
              disabled={disabled}
              className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all min-h-[40px] text-center ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40 ring-1 ring-blue-400/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/80'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      {selectedModeDetails && (
        <p className="text-xs text-gray-400 mt-2 text-center px-2">{selectedModeDetails.description}</p>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
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
  } = useAudioProcessor();
  
  const queuedFileCount = files.filter(f => f.status === 'queued' && !f.groupId).length;
  const queuedGroupCount = groups.filter(g => g.status === 'queued').length;
  const totalQueueCount = queuedFileCount + queuedGroupCount;

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden pb-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <Header />
        
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-brand-surface rounded-2xl border border-gray-800 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={isProcessing || isUploading} />
            <FileUpload 
              onFilesAdded={handleFilesAdded} 
              disabled={isProcessing} 
              uploadProgressList={uploadProgressList}
              isUploading={isUploading}
              onClearProgressItem={clearUploadProgressItem}
              onClearAllProgress={clearAllUploadProgress}
            />
          </div>
          
          <div className="mt-5 sm:mt-6 pt-5 border-t border-gray-800/80">
            <CorrectionModeSelector 
              correctionMode={correctionMode} 
              setCorrectionMode={setCorrectionMode} 
              disabled={isProcessing} 
            />
          </div>

          {(files.length > 0 || groups.length > 0) && !isProcessing && (
            <div className="mt-6 text-center">
              <button
                onClick={startProcessing}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-8 sm:px-12 rounded-xl transition-all shadow-lg hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base inline-flex items-center justify-center gap-2"
                disabled={isProcessing || totalQueueCount === 0}
              >
                <SparklesIcon className="w-4 h-4" />
                Start Processing {totalQueueCount} {totalQueueCount === 1 ? 'Item' : 'Items'}
              </button>
            </div>
          )}
        </div>

        <FileProcessor
          files={files}
          groups={groups}
          onRetry={handleRetry}
          onRetryGroup={handleRetryGroup}
          onSplitAndRetry={handleSplitAndRetry}
          onMerge={handleMergeFiles}
          onDownload={downloadFile}
          onOpenInGoogleDocs={openFileInGoogleDocs}
          onRemoveFile={removeFile}
          onRemoveGroup={removeGroup}
        />

        {/* Floating Convenience Sticky Bar for Mobile and Desktop when scrolled */}
        {totalQueueCount > 0 && !isProcessing && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-gray-900/95 backdrop-blur-md border border-blue-500/50 p-2.5 sm:p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0 pl-1">
              <p className="text-xs font-semibold text-blue-300 truncate">Ready to Process</p>
              <p className="text-[11px] text-gray-400 truncate">{totalQueueCount} {totalQueueCount === 1 ? 'item' : 'items'} in queue</p>
            </div>
            <button
              onClick={startProcessing}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[38px]"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Process Queue
            </button>
          </div>
        )}

        {/* Floating status banner when processing */}
        {isProcessing && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-gray-900/95 backdrop-blur-md border border-blue-500/60 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <LoaderIcon className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-blue-300">Processing Media...</p>
              <p className="text-[11px] text-gray-400 truncate">AI transcription, fact-checking & doc generation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
