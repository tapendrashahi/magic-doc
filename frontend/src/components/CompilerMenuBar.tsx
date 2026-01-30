import React, { useState } from 'react';
import type { CompilerMenuBarProps } from '../types/compiler';
import ExportDialog from './ExportDialog';

/**
 * Compiler Menu Bar Component
 * Contains action buttons: Compile, Compile All, Copy, Export, etc.
 */
const CompilerMenuBar: React.FC<CompilerMenuBarProps> = ({
  hasActiveFile,
  isCompiling,
  hasCompiledHtml,
  onCompile,
  onCompileAll,
  onCopyHtml,
  onOpenExport,
  onCloseExport,
  onExport,
  exportState,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <div className="compiler-menu-bar">
        {/* Compile Button */}
        <button
          className="btn btn-primary"
          onClick={onCompile}
          disabled={!hasActiveFile || isCompiling}
          title="Compile the active LaTeX file"
        >
          {isCompiling ? (
            <>
              <span className="preview-spinner">⟳</span>
              Compiling...
            </>
          ) : (
            <>
              <span>▶</span>
              Compile
            </>
          )}
        </button>

        {/* Compile All Button */}
        <button
          className="btn btn-secondary"
          onClick={onCompileAll}
          disabled={isCompiling}
          title="Compile all files in batch"
        >
          <span>⚡</span>
          Compile All
        </button>

        {/* Copy Button */}
        <button
          className="btn btn-secondary"
          onClick={onCopyHtml}
          disabled={!hasCompiledHtml}
          title="Copy HTML to clipboard"
        >
          <span>📋</span>
          Copy HTML
        </button>

        {/* Export Button */}
        <button
          className="btn btn-success"
          onClick={onOpenExport}
          disabled={!hasCompiledHtml}
          title="Export to PDF, Markdown, JSON, CSV, or DOCX"
        >
          <span>💾</span>
          Export
        </button>

        {/* Divider */}
        <div style={{ flex: 1 }}></div>

        {/* Info */}
        <span
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          {hasActiveFile ? (
            <>
              <span>✓ {hasCompiledHtml ? 'Ready' : 'Ready to compile'}</span>
            </>
          ) : (
            <span>No file selected</span>
          )}
        </span>
      </div>

      {/* Export Dialog */}
      {exportState?.isOpen && (
        <ExportDialog
          isOpen={exportState.isOpen}
          isLoading={exportState.isLoading}
          error={exportState.error}
          selectedFormat={exportState.selectedFormat}
          onClose={onCloseExport}
          onExport={onExport}
        />
      )}
    </>
  );
};

export default CompilerMenuBar;
