
import React from 'react';
import { GeminiModel } from '../types';

interface ModelSelectorProps {
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  disabled: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, disabled }) => {
  return (
    <div className="flex flex-col">
      <label className="mb-2 font-semibold text-gray-300">Select AI Model</label>
      <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-lg p-1 overflow-x-auto">
        <button
          onClick={() => onModelChange(GeminiModel.PRO)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.PRO ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 2.5 Pro
        </button>
        <button
          onClick={() => onModelChange(GeminiModel.FLASH)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.FLASH ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 2.5 Flash
        </button>
        <button
          onClick={() => onModelChange(GeminiModel.GEMINI_3_PRO)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.GEMINI_3_PRO ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 3 Pro
        </button>
        <button
          onClick={() => onModelChange(GeminiModel.GEMINI_3_FLASH)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.GEMINI_3_FLASH ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 3 Flash
        </button>
        <button
          onClick={() => onModelChange(GeminiModel.GEMINI_3_1_PRO)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.GEMINI_3_1_PRO ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 3.1 Pro
        </button>
        <button
          onClick={() => onModelChange(GeminiModel.GEMINI_3_5_FLASH)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            selectedModel === GeminiModel.GEMINI_3_5_FLASH ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Gemini 3.5 Flash
        </button>
      </div>
    </div>
  );
};
