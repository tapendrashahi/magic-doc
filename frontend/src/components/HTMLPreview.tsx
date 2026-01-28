import React, { useEffect, useRef } from 'react';
import MathJaxService from '../services/mathjax';
import { ExportService } from '../services/export';
import { toastManager } from '../services/toast';
import type { Note } from '../types';

interface HTMLPreviewProps {
  html: string;
  loading: boolean;
  error: string | null;
  note?: Note | null;
}

export const HTMLPreview: React.FC<HTMLPreviewProps> = ({
  html,
  loading,
  error,
  note,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[HTMLPreview] Component mounted');
    const initMathJax = async () => {
      console.log('[HTMLPreview] Initializing MathJax...');
      try {
        await MathJaxService.init();
        console.log('[HTMLPreview] ✓ MathJax init complete');
      } catch (err) {
        console.error('[HTMLPreview] MathJax init error:', err);
      }
    };
    initMathJax();
  }, []);

  useEffect(() => {
    console.log('[HTMLPreview] html changed:', {
      htmlLength: html?.length,
      hasRef: !!previewRef.current,
      loading,
      error
    });
    
    if (previewRef.current && html) {
      console.log('[HTMLPreview] Calling MathJax.typeset on preview element');
      MathJaxService.typeset(previewRef.current)
        .then(() => console.log('[HTMLPreview] ✓ MathJax typeset complete'))
        .catch(err => console.error('[HTMLPreview] typeset error:', err));
    } else {
      console.log('[HTMLPreview] Skip typeset - no ref or no html');
    }
  }, [html]);

  const handleCopyHTML = async () => {
    try {
      console.log('[HTMLPreview] Copying HTML to clipboard');
      await ExportService.copyToClipboard(html);
      console.log('[HTMLPreview] ✓ Copy successful');
      toastManager.success('HTML copied to clipboard!');
    } catch (err) {
      console.error('[HTMLPreview] Copy failed:', err);
      toastManager.error('Failed to copy to clipboard');
    }
  };

  const handleExportMarkdown = () => {
    console.log('[HTMLPreview] Exporting as Markdown');
    if (note) {
      ExportService.exportAsMarkdown(note);
      toastManager.success('Exported as Markdown');
    }
  };

  const handleExportHTML = () => {
    console.log('[HTMLPreview] Exporting as HTML');
    if (note) {
      ExportService.exportAsHTML(note);
      toastManager.success('Exported as HTML');
    }
  };

  const handlePrint = () => {
    console.log('[HTMLPreview] Print requested');
    if (note) {
      ExportService.print(note);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📖 Preview</h2>
        {loading && (
          <span className="text-sm text-blue-600 font-semibold animate-pulse">
            ✨ Updating...
          </span>
        )}
        {!loading && html && (
          <span className="text-sm text-green-600 font-semibold">✓ Ready</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          ❌ {error}
        </div>
      )}

      <div
        ref={previewRef}
        className="flex-1 overflow-auto p-4 bg-gray-50 rounded border border-gray-200 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html:
            html ||
            '<p style="color: #999; font-style: italic;">Enter LaTeX to see preview...</p>',
        }}
      />

      {html && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={handleCopyHTML}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold text-sm"
            title="Ctrl+Shift+C"
          >
            📋 Copy HTML
          </button>
          {note && (
            <>
              <button
                onClick={handleExportMarkdown}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold text-sm"
                title="Export as .md"
              >
                📥 Markdown
              </button>
              <button
                onClick={handleExportHTML}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition font-semibold text-sm"
                title="Export as .html"
              >
                🖥️ HTML
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-semibold text-sm"
                title="Ctrl+P"
              >
                🖨️ Print
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
