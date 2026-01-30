import React, { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-latex';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-monokai';
import type { CompilerCodePanelProps } from '../types/compiler';

/**
 * Compiler Code Panel Component
 * Shows LaTeX code editor using ACE Editor
 */
const CompilerCodePanel: React.FC<CompilerCodePanelProps> = ({
  file,
  onFileChange,
}) => {
  const editorRef = useRef<any>(null);
  const isDarkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  useEffect(() => {
    if (editorRef.current && file?.content) {
      editorRef.current.setValue(file.content, 1);
    }
  }, [file?.id]);

  return (
    <div className="compiler-code-panel">
      {/* Header */}
      <div className="code-panel-header">
        <span>📝 LaTeX Code</span>
        {file && (
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-tertiary)',
            }}
          >
            {file.content.length} chars
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="code-editor-wrapper">
        {file ? (
          <AceEditor
            ref={editorRef}
            mode="latex"
            theme={isDarkMode ? 'monokai' : 'chrome'}
            value={file.content}
            onChange={(newValue) => {
              // State managed by parent component
              onFileChange?.(newValue);
            }}
            fontSize={14}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              tabSize: 2,
              useWorker: false,
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
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
            }}
          >
            Select or upload a file to begin
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerCodePanel;
