import React, { useEffect, useRef } from 'react';
import type { CompilerPreviewPanelProps } from '../types/compiler';

/**
 * Compiler Preview Panel Component
 * Shows the compiled HTML output
 */
const CompilerPreviewPanel: React.FC<CompilerPreviewPanelProps> = ({
  compiledHtml,
  isCompiling,
  error,
}) => {
  const previewHtmlRef = useRef<HTMLDivElement>(null);
  const currentHtmlRef = useRef<string>('');

  // Only update HTML when compiledHtml actually changes
  useEffect(() => {
    if (compiledHtml && compiledHtml !== currentHtmlRef.current && previewHtmlRef.current) {
      console.log('[PreviewPanel] Updating preview HTML');
      currentHtmlRef.current = compiledHtml;
      previewHtmlRef.current.innerHTML = compiledHtml;
    }
  }, [compiledHtml]);

  return (
    <div className="compiler-preview-panel">
      {/* Header */}
      <div className="preview-panel-header">
        <span>👁️ Preview</span>
        {isCompiling && <span style={{ fontSize: '0.85rem' }}>⟳ Compiling...</span>}
      </div>

      {/* Content */}
      <div className="preview-content">
        {error ? (
          <div
            className="alert alert-error"
            style={{
              margin: 0,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Compilation Error</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {error}
              </p>
            </div>
          </div>
        ) : isCompiling ? (
          <div className="preview-loading">
            <span className="preview-spinner" style={{ fontSize: '2rem' }}>
              ⟳
            </span>
            <span>Compiling LaTeX...</span>
          </div>
        ) : compiledHtml ? (
          <div
            ref={previewHtmlRef}
            className="preview-html"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-tertiary)',
              fontSize: '0.95rem',
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}
          >
            <div>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>
                📋
              </div>
              <p>Select a file and click "Compile" to see the preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerPreviewPanel;
