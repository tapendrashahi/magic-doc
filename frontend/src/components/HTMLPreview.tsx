import React, { useEffect, useRef, useMemo } from 'react';
import katexService from '../services/katex';

type ConversionFormat = 'katex' | 'plain_html';

interface HTMLPreviewProps {
  html: string;
  loading: boolean;
  error: string | null;
  format?: ConversionFormat;
  note?: any;
}

export const HTMLPreview: React.FC<HTMLPreviewProps> = React.memo(({
  html,
  loading,
  error,
  format = 'katex',
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize KaTeX only if format is 'katex'
  useEffect(() => {
    if (format !== 'katex') {
      console.log('[HTMLPreview] Format is plain_html, skipping KaTeX initialization');
      return;
    }

    console.log('[HTMLPreview] Initializing KaTeX for format:', format);
    let isMounted = true;
    
    const initKaTeX = async () => {
      console.log('[HTMLPreview] Initializing KaTeX...');
      try {
        await katexService.init();
        if (isMounted) {
          console.log('[HTMLPreview] ✓ KaTeX init complete');
          // After init, immediately render if we have HTML
          if (previewRef.current && html) {
            console.log('[HTMLPreview] Rendering after init with existing HTML');
            await katexService.render(previewRef.current);
            console.log('[HTMLPreview] ✓ Initial render complete');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[HTMLPreview] KaTeX init error:', err);
        }
      }
    };
    
    initKaTeX();
    
    return () => {
      isMounted = false;
    };
  }, [format]); // Only on format change

  // Re-render KaTeX when HTML changes (but only if katex format)
  useEffect(() => {
    console.log('[HTMLPreview] html changed:', {
      htmlLength: html?.length,
      hasRef: !!previewRef.current,
      loading,
      error,
      format
    });

    // If plain_html format, skip KaTeX rendering
    if (format === 'plain_html') {
      console.log('[HTMLPreview] Format is plain_html, skipping KaTeX render');
      return;
    }

    // For KaTeX format, check if initialized
    if (!katexService.isInitialized()) {
      console.log('[HTMLPreview] KaTeX not initialized yet, skipping render');
      return;
    }

    if (previewRef.current && html) {
      console.log('[HTMLPreview] Calling KaTeX.render on preview element');
      katexService.render(previewRef.current)
        .then(() => console.log('[HTMLPreview] ✓ KaTeX render complete'))
        .catch((err: Error) => {
          console.error('[HTMLPreview] render error:', err);
        });
    } else {
      console.log('[HTMLPreview] Skip render - no ref or no html');
    }
  }, [html, format]);

  const displayHtml = useMemo(() => {
    return html || '<p style="color: #999; font-style: italic;">Enter LaTeX to see preview...</p>';
  }, [html]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Preview</h2>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            {format === 'katex' ? 'KaTeX' : 'Plain HTML'}
          </span>
        </div>
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
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      <div
        ref={previewRef}
        className="flex-1 overflow-auto p-4 bg-gray-50 rounded border border-gray-200 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: displayHtml,
        }}
      />
    </div>
  );
});
