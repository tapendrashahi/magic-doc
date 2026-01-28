import React, { useEffect, useRef, useState } from 'react';
import katexService from '../services/katex';
import clipboardService from '../services/clipboard';

type ConversionFormat = 'katex' | 'plain_html';

interface MathpixPreviewProps {
  html: string;
  loading?: boolean;
  error?: string | null;
  format?: ConversionFormat;
  stats?: any;
}

export const MathpixPreview: React.FC<MathpixPreviewProps> = React.memo(({
  html,
  loading = false,
  error = null,
  format = 'katex',
  stats,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [outputTab, setOutputTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

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

  const handleCopyHTML = async () => {
    try {
      await clipboardService.copyHTML(html, 'HTML copied to clipboard!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[MathpixPreview] Copy error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-300">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">
          {outputTab === 'preview' ? '👁️ Preview' : '📄 HTML Code'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {outputTab === 'preview' ? 'Rendered output' : 'LMS-compatible HTML'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-2">
        <button
          onClick={() => setOutputTab('preview')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            outputTab === 'preview'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          👁️ Preview
        </button>
        <button
          onClick={() => setOutputTab('code')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            outputTab === 'code'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📄 HTML Code
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
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
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">HTML Fragment</h3>
              <button
                onClick={handleCopyHTML}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {copied ? '✅ Copied!' : '📋 Copy HTML'}
              </button>
            </div>

            <pre className="bg-gray-50 border border-gray-300 rounded-lg p-4 overflow-auto max-h-96 text-xs text-gray-700 font-mono">
              {html}
            </pre>

            {stats && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Statistics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>
                    <span className="font-semibold">Total Equations:</span> {stats.total_equations || 0}
                  </div>
                  <div>
                    <span className="font-semibold">Display:</span> {stats.display_equations || 0}
                  </div>
                  <div>
                    <span className="font-semibold">Inline:</span> {stats.inline_equations || 0}
                  </div>
                  <div>
                    <span className="font-semibold">Sections:</span> {stats.sections || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MathpixPreview.displayName = 'MathpixPreview';

export default MathpixPreview;
