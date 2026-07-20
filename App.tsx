
import { CorrectionMode } from './types';
import React from 'react';
import { ModelSelector } from './components/ModelSelector';
import { FileUpload } from './components/FileUpload';
import { FileProcessor } from './components/FileProcessor';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { Header } from './components/Header';

const CorrectionModeSelector: React.FC<{
  correctionMode: CorrectionMode;
  setCorrectionMode: (mode: CorrectionMode) => void;
  disabled: boolean;
}> = ({ correctionMode, setCorrectionMode, disabled }) => {
  const modes = [
    { key: CorrectionMode.STANDARD, label: 'Standard', description: 'Standard fact-checking for good accuracy.' },
    { key: CorrectionMode.ENHANCED, label: 'Enhanced', description: 'Multi-agent system for higher accuracy. (Slower)' },
    { key: CorrectionMode.GEMINI_3_1_PRO, label: 'Gemini 3.1 Pro', description: 'Uses Gemini 3.1 Pro for analysis. (Best Quality)' },
  ];

  const selectedModeDetails = modes.find(m => m.key === correctionMode);

  return (
    <div className="flex flex-col items-center">
      <label className="mb-2 font-semibold text-gray-300">Fact-Checking Mode</label>
      <div className="flex items-center space-x-1 bg-gray-900 border border-gray-700 rounded-lg p-1 overflow-x-auto">
        {modes.map(mode => (
          <button
            key={mode.key}
            onClick={() => setCorrectionMode(mode.key)}
            disabled={disabled}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              correctionMode === mode.key ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {selectedModeDetails && (
        <p className="text-xs text-gray-500 mt-2 text-center h-4">{selectedModeDetails.description}</p>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
    files,
    groups,
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
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-brand-surface rounded-2xl border border-gray-800 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={isProcessing} />
            <FileUpload onFilesAdded={handleFilesAdded} disabled={isProcessing} />
          </div>
          
          <div className="mt-6">
            <CorrectionModeSelector 
              correctionMode={correctionMode} 
              setCorrectionMode={setCorrectionMode} 
              disabled={isProcessing} 
            />
          </div>

          {(files.length > 0 || groups.length > 0) && !isProcessing && (
            <div className="mt-8 text-center">
              <button
                onClick={startProcessing}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-lg transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || totalQueueCount === 0}
              >
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
      </div>
    </div>
  );
};

export default App;
