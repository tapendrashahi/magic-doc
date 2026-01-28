import React, { useEffect, useRef, useState } from 'react';
import katexService from '../services/katex';

type ConversionFormat = 'katex' | 'plain_html';

interface MathpixPreviewProps {
  html: string;
  loading?: boolean;
  error?: string | null;
  format?: ConversionFormat;
}

export const MathpixPreview: React.FC<MathpixPreviewProps> = React.memo(({
  html,
  loading = false,
  error = null,
  format = 'katex',
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const preElementRef = useRef<HTMLPreElement>(null);
  const [outputTab, setOutputTab] = useState<'preview' | 'code'>('preview');

  // Initialize KaTeX only if format is 'katex'
  useEffect(() => {
    if (format !== 'katex' || !html) {
      return;
    }

    let isMounted = true;

    const initKaTeX = async () => {
      try {
        await katexService.init();
        if (isMounted && previewRef.current) {
          await katexService.render(previewRef.current);
        }
      } catch (err) {
        console.error('[MathpixPreview] KaTeX error:', err);
      }
    };

    initKaTeX();

    return () => {
      isMounted = false;
    };
  }, [format, html]);



  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-300">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {outputTab === 'preview' ? 'Preview' : 'HTML Code'}
        </h2>

        {/* Claude-style icon toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setOutputTab('preview')}
            className={`p-2 rounded-md transition-colors ${outputTab === 'preview'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            title="Preview"
            aria-label="Show preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => setOutputTab('code')}
            className={`p-2 rounded-md transition-colors ${outputTab === 'code'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            title="HTML Code"
            aria-label="Show HTML code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col min-h-0">
        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Converting Mathpix...</p>
            </div>
          </div>
        )}

        {!loading && !html && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-lg font-semibold">No conversion yet</p>
              <p className="text-sm">Upload or paste Mathpix LaTeX to convert</p>
            </div>
          </div>
        )}

        {!loading && html && outputTab === 'preview' && (
          <div
            ref={previewRef}
            className="prose prose-sm max-w-none"
            style={{ fontSize: '14px' }}
          />
        )}

        {!loading && html && outputTab === 'code' && (
          <div ref={codeContainerRef} className="flex-1 flex flex-col min-h-0 w-full">
            <pre ref={preElementRef} className="bg-gray-50 border border-gray-300 rounded-lg p-4 overflow-auto flex-1 text-xs text-gray-700 font-mono break-words whitespace-pre-wrap">
              {html}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

MathpixPreview.displayName = 'MathpixPreview';

export default MathpixPreview;
