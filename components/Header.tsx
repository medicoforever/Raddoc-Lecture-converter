
import React from 'react';
import { BrainCircuitIcon } from './icons';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <BrainCircuitIcon className="w-12 h-12 text-blue-500" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              RADDOC's Radiology lecture audio to docx/pdf
            </h1>
          </div>
          <p className="max-w-3xl mx-auto text-lg text-gray-400">
            Transform your radiology lecture recordings into polished, professional documents with the power of Gemini AI.
          </p>
          
          <div className="max-w-3xl mx-auto mt-6 text-left text-gray-400 bg-gray-900/50 p-4 rounded-lg border border-gray-800 backdrop-blur-sm">
            <h3 className="font-semibold text-gray-200 mb-2 text-lg">How to Use This App:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm md:text-base">
              <li>Select the Gemini AI model and upload your audio, video, or PDF file(s).</li>
              <li>Click <strong>Start Processing</strong> to let the AI transcribe/extract and analyze the content.</li>
              <li>Once complete, choose your preferred output method:</li>
            </ol>
            <div className="mt-3 pl-6 text-sm md:text-base space-y-2">
                <p>
                  <strong className="text-gray-200">1. Download DOCX:</strong> Click the "Download .docx" button to save the file for Microsoft Word or other editors.
                </p>
                <p>
                  <strong className="text-gray-200">2. Open in Google Docs:</strong> Click "Open in Docs". A new blank Google Doc will open. Simply press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Ctrl+V</kbd> (Windows) or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Cmd+V</kbd> (Mac) to paste the formatted content from your clipboard.
                </p>
            </div>
             <h3 className="font-semibold text-gray-200 mt-4 mb-2 text-lg">How to Get a PDF:</h3>
             <p className="text-sm md:text-base">
               You can easily create a PDF from either format. In Google Docs or MS Word, simply go to <strong>File &gt; Download &gt; PDF Document</strong> or use the "Export as PDF" option.
             </p>
          </div>
        </header>
    );
};
