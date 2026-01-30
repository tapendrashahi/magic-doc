import React from 'react';
import type { CompilerLayoutProps } from '../types/compiler';
import CompilerMenuBar from './CompilerMenuBar';
import CompilerSidebar from './CompilerSidebar';
import CompilerCodePanel from './CompilerCodePanel';
import CompilerPreviewPanel from './CompilerPreviewPanel';

/**
 * Compiler Layout Component
 * Arranges the main UI sections (menu, sidebar, code, preview)
 */
const CompilerLayout: React.FC<CompilerLayoutProps> = ({
  files,
  activeFileId,
  compiledHtml,
  isCompiling,
  compileError,
  exportState,
  fileInputRef,
  onSelectFile,
  onDeleteFile,
  onFileUpload,
  onCompile,
  onCompileAll,
  onCopyHtml,
  onOpenExport,
  onCloseExport,
  onExport,
}) => {
  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <>
      {/* Menu Bar */}
      <CompilerMenuBar
        hasActiveFile={!!activeFile}
        isCompiling={isCompiling}
        hasCompiledHtml={!!compiledHtml}
        onCompile={onCompile}
        onCompileAll={onCompileAll}
        onCopyHtml={onCopyHtml}
        onOpenExport={onOpenExport}
      />

      {/* Main Container */}
      <div className="compiler-container">
        {/* Sidebar */}
        <CompilerSidebar
          files={files}
          activeFileId={activeFileId}
          fileInputRef={fileInputRef}
          onSelectFile={onSelectFile}
          onDeleteFile={onDeleteFile}
          onFileUpload={onFileUpload}
        />

        {/* Code Panel */}
        <CompilerCodePanel
          file={activeFile}
          onFileChange={(content) => {
            // File content is managed by parent component
          }}
        />

        {/* Preview Panel */}
        <CompilerPreviewPanel
          compiledHtml={compiledHtml}
          isCompiling={isCompiling}
          error={compileError}
        />
      </div>

      {/* Export Dialog - rendered via portal in CompilerMenuBar */}
    </>
  );
};

export default CompilerLayout;
