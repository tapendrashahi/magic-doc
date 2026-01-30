import React, { useState, useCallback, useRef, useEffect } from 'react';
import '../styles/compiler.css';
import type { CompilerState } from '../types/compiler';
import { compilerService } from '../services/compilerService';
import katexService from '../services/katex';
import CompilerLayout from '../components/CompilerLayout';

/**
 * Main Compiler Page Component
 * Manages state and orchestrates the compiler workflow
 */
const Compiler: React.FC = () => {
  // ========== State Management ==========
  const [state, setState] = useState<CompilerState>({
    files: [],
    activeFileId: null,
    compiledHtml: {},
    isCompiling: {},
    compileErrors: {},
    exportState: {
      isOpen: false,
      isLoading: false,
      selectedFormat: 'pdf',
      error: null,
    },
    successMessage: null,
    errorMessage: null,
    uploadProgress: 0,
  });

  // Separate state for transient messages to avoid re-rendering the preview panel
  const [messageDisplay, setMessageDisplay] = useState<{
    success: string | null;
    error: string | null;
  }>({
    success: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute derived values early
  const activeFile = state.files.find((f) => f.id === state.activeFileId);
  const compiledHtml = activeFile ? state.compiledHtml[activeFile.id] : null;

  // ========== Effects ==========

  /**
   * Initialize KaTeX CSS on component mount
   */
  useEffect(() => {
    katexService.init().catch((error) => {
      console.error('Failed to initialize KaTeX:', error);
    });
  }, []);

  /**
   * Render KaTeX equations when compiled HTML changes
   */
  useEffect(() => {
    if (compiledHtml) {
      console.log('[Compiler] compiledHtml changed, triggering KaTeX render');
      console.log('[Compiler] HTML length:', compiledHtml.length);
      
      // Use setTimeout to ensure DOM is updated first
      setTimeout(() => {
        // Target the actual content div, not the container
        const previewHtml = document.querySelector('.preview-html');
        console.log('[Compiler] Preview HTML element found:', !!previewHtml);
        
        if (previewHtml) {
          const tiptapCount = previewHtml.querySelectorAll('.tiptap-katex').length;
          console.log('[Compiler] TipTap equations in DOM:', tiptapCount);
          
          katexService.render(previewHtml)
            .then(() => {
              console.log('[Compiler] KaTeX render completed successfully');
            })
            .catch((error) => {
              console.error('[Compiler] Failed to render KaTeX:', error);
            });
        } else {
          console.warn('[Compiler] Preview HTML element not found!');
          console.log('[Compiler] Available preview elements:', Array.from(document.querySelectorAll('[class*="preview"]')).map(el => el.className));
        }
      }, 0);
    } else {
      console.log('[Compiler] No compiledHtml available');
    }
  }, [compiledHtml]);

  // ========== Handlers ==========

  /**
   * Handle file upload from input or drag-drop
   */
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files).filter((file) =>
        file.name.endsWith('.tex')
      );

      if (fileArray.length === 0) {
        setMessageDisplay({
          success: null,
          error: 'Only .tex files are supported',
        });
        setTimeout(() => {
          setMessageDisplay((prev) => ({
            ...prev,
            error: null,
          }));
        }, 3000);
        return;
      }

      // Create new file entries
      const newFiles = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        content: '',
        file: file,
        uploadedAt: new Date(),
        status: 'uploading' as const,
      }));

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...newFiles],
        activeFileId: newFiles[0]?.id || prev.activeFileId,
      }));

      // Read file contents
      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const fileId = newFiles[index].id;

          setState((prev) => ({
            ...prev,
            files: prev.files.map((f) =>
              f.id === fileId ? { ...f, content, status: 'ready' as const } : f
            ),
          }));
        };
        reader.onerror = () => {
          setState((prev) => ({
            ...prev,
            files: prev.files.map((f) =>
              f.id === newFiles[index].id
                ? { ...f, status: 'error' as const }
                : f
            ),
          }));
          setMessageDisplay({
            success: null,
            error: `Failed to read file: ${file.name}`,
          });
        };
        reader.readAsText(file);
      });

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setState((prev) => ({
        ...prev,
        successMessage: `${fileArray.length} file(s) uploaded successfully`,
      }));
      setMessageDisplay({
        success: `${fileArray.length} file(s) uploaded successfully`,
        error: null,
      });
      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          success: null,
        }));
      }, 3000);
    },
    []
  );

  /**
   * Handle file selection from sidebar
   */
  const handleSelectFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      activeFileId: fileId,
    }));
  }, []);

  /**
   * Handle file deletion
   */
  const handleDeleteFile = useCallback((fileId: string) => {
    setState((prev) => {
      const updatedFiles = prev.files.filter((f) => f.id !== fileId);
      const newActiveId =
        prev.activeFileId === fileId ? updatedFiles[0]?.id || null : prev.activeFileId;

      const newCompiledHtml = { ...prev.compiledHtml };
      delete newCompiledHtml[fileId];

      const newIsCompiling = { ...prev.isCompiling };
      delete newIsCompiling[fileId];

      const newCompileErrors = { ...prev.compileErrors };
      delete newCompileErrors[fileId];

      return {
        ...prev,
        files: updatedFiles,
        activeFileId: newActiveId,
        compiledHtml: newCompiledHtml,
        isCompiling: newIsCompiling,
        compileErrors: newCompileErrors,
      };
    });
  }, []);

  /**
   * Compile active file
   */
  const handleCompile = useCallback(async () => {
    const activeFile = state.files.find((f) => f.id === state.activeFileId);
    if (!activeFile || !activeFile.content) {
      setMessageDisplay({
        success: null,
        error: 'No file selected or file is empty',
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      isCompiling: {
        ...prev.isCompiling,
        [activeFile.id]: true,
      },
      compileErrors: {
        ...prev.compileErrors,
        [activeFile.id]: undefined,
      },
    }));

    try {
      const response = await compilerService.convertTex({
        content: activeFile.content,
        filename: activeFile.name,
      });

      setState((prev) => ({
        ...prev,
        compiledHtml: {
          ...prev.compiledHtml,
          [activeFile.id]: response.html_output || response.html || '',
        },
        isCompiling: {
          ...prev.isCompiling,
          [activeFile.id]: false,
        },
      }));

      // Use separate state for message display to avoid re-rendering the preview panel
      setMessageDisplay({
        success: 'Compilation successful!',
        error: null,
      });

      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          success: null,
        }));
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Compilation failed';

      setState((prev) => ({
        ...prev,
        compileErrors: {
          ...prev.compileErrors,
          [activeFile.id]: errorMessage,
        },
        isCompiling: {
          ...prev.isCompiling,
          [activeFile.id]: false,
        },
      }));

      // Use separate state for message display to avoid re-rendering the preview panel
      setMessageDisplay({
        success: null,
        error: errorMessage,
      });

      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          error: null,
        }));
      }, 3000);
    }
  }, [state.files, state.activeFileId]);

  /**
   * Compile all files (batch)
   */
  const handleCompileAll = useCallback(async () => {
    if (state.files.length === 0) {
      setMessageDisplay({
        success: null,
        error: 'No files to compile',
      });
      return;
    }

    // Mark all as compiling
    const isCompilingMap: { [key: string]: boolean } = state.files.reduce(
      (acc, f) => ({
        ...acc,
        [f.id]: true,
      }),
      {}
    );

    setState((prev) => ({
      ...prev,
      isCompiling: isCompilingMap,
      compileErrors: Object.fromEntries(
        state.files.map((f) => [f.id, undefined])
      ),
    }));

    try {
      const response = await compilerService.convertBatch({
        files: state.files.map((f) => ({
          content: f.content,
          filename: f.name,
        })),
      });

      const htmlMap: { [key: string]: string } = {};
      response.results.forEach((result, index) => {
        const fileId = state.files[index].id;
        htmlMap[fileId] = result.html || '';
      });

      setState((prev) => ({
        ...prev,
        compiledHtml: {
          ...prev.compiledHtml,
          ...htmlMap,
        },
        isCompiling: Object.fromEntries(
          state.files.map((f) => [f.id, false])
        ),
      }));

      setMessageDisplay({
        success: `All ${state.files.length} file(s) compiled successfully!`,
        error: null,
      });

      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          success: null,
        }));
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Batch compilation failed';

      setState((prev) => ({
        ...prev,
        isCompiling: Object.fromEntries(
          state.files.map((f) => [f.id, false])
        ),
      }));

      setMessageDisplay({
        success: null,
        error: errorMessage,
      });

      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          error: null,
        }));
      }, 3000);
    }
  }, [state.files]);

  /**
   * Copy HTML to clipboard
   */
  const handleCopyHtml = useCallback(async () => {
    const activeFile = state.files.find((f) => f.id === state.activeFileId);
    const html = activeFile ? state.compiledHtml[activeFile.id] : null;

    if (!html) {
      setMessageDisplay({
        success: null,
        error: 'No compiled HTML to copy',
      });
      return;
    }

    try {
      await compilerService.copyToClipboard(html);
      setMessageDisplay({
        success: 'HTML copied to clipboard!',
        error: null,
      });

      setTimeout(() => {
        setMessageDisplay((prev) => ({
          ...prev,
          success: null,
        }));
      }, 2000);
    } catch (error) {
      setMessageDisplay({
        success: null,
        error: 'Failed to copy to clipboard',
      });
    }
  }, [state.files, state.activeFileId, state.compiledHtml]);

  /**
   * Open export dialog
   */
  const handleOpenExport = useCallback(() => {
    const activeFile = state.files.find((f) => f.id === state.activeFileId);
    const html = activeFile ? state.compiledHtml[activeFile.id] : null;

    if (!html) {
      setState((prev) => ({
        ...prev,
        errorMessage: 'No compiled HTML to export',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      exportState: {
        ...prev.exportState,
        isOpen: true,
        error: null,
      },
    }));
  }, [state.files, state.activeFileId, state.compiledHtml]);

  /**
   * Close export dialog
   */
  const handleCloseExport = useCallback(() => {
    setState((prev) => ({
      ...prev,
      exportState: {
        ...prev.exportState,
        isOpen: false,
      },
    }));
  }, []);

  /**
   * Handle export
   */
  const handleExport = useCallback(
    async (format: string) => {
      const activeFile = state.files.find((f) => f.id === state.activeFileId);
      const html = activeFile ? state.compiledHtml[activeFile.id] : null;

      if (!html) {
        setState((prev) => ({
          ...prev,
          exportState: {
            ...prev.exportState,
            error: 'No compiled HTML to export',
          },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        exportState: {
          ...prev.exportState,
          isLoading: true,
          error: null,
        },
      }));

      try {
        const response = await compilerService.export({
          html_content: html,
          format: format as any,
          filename: activeFile?.name.replace('.tex', ''),
        });

        // Download the file
        const blob = new Blob([response.file_content || ''], {
          type: response.mime_type || 'application/octet-stream',
        });

        compilerService.triggerDownload(blob, response.filename || 'export');

        setState((prev) => ({
          ...prev,
          exportState: {
            ...prev.exportState,
            isLoading: false,
            isOpen: false,
          },
          successMessage: `File exported as ${format.toUpperCase()}!`,
        }));

        setTimeout(
          () =>
            setState((prev) => ({
              ...prev,
              successMessage: null,
            })),
          3000
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Export failed';

        setState((prev) => ({
          ...prev,
          exportState: {
            ...prev.exportState,
            isLoading: false,
            error: errorMessage,
          },
        }));
      }
    },
    [state.files, state.activeFileId, state.compiledHtml]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const isCompiling = activeFile ? state.isCompiling[activeFile.id] : false;
  const compileError = activeFile ? state.compileErrors[activeFile.id] : null;

  return (
    <div
      className="compiler-page"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Alerts */}
      {messageDisplay.success && (
        <div className="alert alert-success" style={{ margin: '1rem' }}>
          <span>✓</span>
          <span>{messageDisplay.success}</span>
        </div>
      )}
      {messageDisplay.error && (
        <div className="alert alert-error" style={{ margin: '1rem' }}>
          <span>✕</span>
          <span>{messageDisplay.error}</span>
        </div>
      )}

      <CompilerLayout
        files={state.files}
        activeFileId={state.activeFileId}
        compiledHtml={compiledHtml}
        isCompiling={isCompiling ?? false}
        compileError={compileError}
        exportState={state.exportState}
        fileInputRef={fileInputRef}
        onSelectFile={handleSelectFile}
        onDeleteFile={handleDeleteFile}
        onFileUpload={handleFileUpload}
        onCompile={handleCompile}
        onCompileAll={handleCompileAll}
        onCopyHtml={handleCopyHtml}
        onOpenExport={handleOpenExport}
        onCloseExport={handleCloseExport}
        onExport={handleExport}
      />
    </div>
  );
};

export default Compiler;
