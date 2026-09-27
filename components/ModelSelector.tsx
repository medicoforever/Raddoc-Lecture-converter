
import React from 'react';
import { GeminiModel } from '../types';
import { SparklesIcon } from './icons';

interface ModelSelectorProps {
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  disabled: boolean;
}

const MODELS: { id: GeminiModel; label: string; badge?: string }[] = [
  { id: GeminiModel.GEMINI_3_8_FLASH, label: 'Gemini 3.8 Flash', badge: 'Latest' },
  { id: GeminiModel.GEMINI_3_7_FLASH, label: 'Gemini 3.7 Flash' },
  { id: GeminiModel.GEMINI_3_5_FLASH, label: 'Gemini 3.5 Flash' },
  { id: GeminiModel.GEMINI_3_1_PRO, label: 'Gemini 3.1 Pro' },
  { id: GeminiModel.GEMINI_3_FLASH, label: 'Gemini 3 Flash' },
  { id: GeminiModel.GEMINI_3_PRO, label: 'Gemini 3 Pro' },
  { id: GeminiModel.FLASH, label: 'Gemini 2.5 Flash' },
  { id: GeminiModel.PRO, label: 'Gemini 2.5 Pro' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, disabled }) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold text-gray-200 text-sm sm:text-base flex items-center gap-1.5">
          <span>AI Model</span>
          <span className="text-xs font-normal text-gray-400">({MODELS.length} available)</span>
        </label>
        <span className="text-[11px] text-blue-400 font-medium hidden sm:inline">
          Ordered Newest → Oldest
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 bg-gray-900/90 border border-gray-700/80 rounded-xl p-1.5">
        {MODELS.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onModelChange(model.id)}
              disabled={disabled}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 min-h-[42px] select-none ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold ring-1 ring-blue-400/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/80 active:bg-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
            >
              {model.badge && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-blue-800/80 text-blue-100' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                }`}>
                  <SparklesIcon className="w-2.5 h-2.5" />
                  {model.badge}
                </span>
              )}
              <span className="truncate">{model.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
