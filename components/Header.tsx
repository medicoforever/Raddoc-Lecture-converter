
import React, { useState } from 'react';
import { BrainCircuitIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

export const Header: React.FC = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <header className="text-center px-2 sm:px-4">
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <BrainCircuitIcon className="w-9 h-9 sm:w-12 sm:h-12 text-blue-500 flex-shrink-0" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text text-left sm:text-center">
          RADDOC's Radiology lecture audio to docx/pdf
        </h1>
      </div>
      <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-gray-400">
        Transform your radiology lecture recordings into polished, professional documents with the power of Gemini AI.
      </p>
      
      {/* Interactive Guide Toggle - Mobile & Desktop friendly */}
      <div className="max-w-3xl mx-auto mt-4 sm:mt-6 text-left bg-gray-900/60 rounded-xl border border-gray-800 backdrop-blur-sm overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors focus:outline-none"
          aria-expanded={isGuideOpen}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-200 text-sm sm:text-base flex items-center gap-1.5">
              <span>📖 How to Use & Export Guide</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/50">DOCX</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/50">Google Docs</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-red-950/70 text-rose-300 border border-red-800/50">PDF</span>
            </div>
          </div>
          <span className="text-xs text-blue-400 flex items-center gap-1 font-medium flex-shrink-0 ml-2">
            {isGuideOpen ? 'Hide Guide' : 'View Instructions'}
            {isGuideOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </span>
        </button>

        {isGuideOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-800/80 text-gray-300 text-sm md:text-base space-y-3">
            <h3 className="font-semibold text-gray-200 text-base">How to Use This App:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm md:text-base pl-1">
              <li>Select the Gemini AI model and upload your audio, video, or PDF file(s).</li>
              <li>Click <strong>Start Processing</strong> to let the AI transcribe/extract and analyze the content.</li>
              <li>Once complete, choose your preferred output method:</li>
            </ol>
            <div className="pl-4 sm:pl-6 text-sm md:text-base space-y-2">
              <p>
                <strong className="text-gray-200">1. Download DOCX:</strong> Click the "Download .docx" button to save the file for Microsoft Word or other editors.
              </p>
              <p>
                <strong className="text-gray-200">2. Open in Google Docs:</strong> Click "Open in Docs". A new blank Google Doc will open. Simply press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Ctrl+V</kbd> (Windows) or <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Cmd+V</kbd> (Mac) to paste the formatted content from your clipboard.
              </p>
            </div>
            <h3 className="font-semibold text-gray-200 pt-2 text-base">How to Get a PDF:</h3>
            <p className="text-sm md:text-base">
              You can easily create a PDF from either format. In Google Docs or MS Word, simply go to <strong>File &gt; Download &gt; PDF Document</strong> or use the "Export as PDF" option.
            </p>
          </div>
        )}
      </div>
    </header>
  );
};
