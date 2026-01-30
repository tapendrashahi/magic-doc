import React, { useRef } from 'react';
import type { CompilerSidebarProps } from '../types/compiler';
import FileUploadDropZone from './FileUploadDropZone';

/**
 * Compiler Sidebar Component
 * Shows list of files and file management controls
 */
const CompilerSidebar: React.FC<CompilerSidebarProps> = ({
  files,
  activeFileId,
  fileInputRef,
  onSelectFile,
  onDeleteFile,
  onFileUpload,
}) => {
  const handleUploadClick = () => {
    fileInputRef?.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e.target.files);
  };

  return (
    <div className="compiler-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        📄 Files ({files.length})
      </div>

      {/* File List */}
      <div className="sidebar-file-list">
        {files.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.9rem',
              padding: 'var(--spacing-md)',
            }}
          >
            No files uploaded yet.
            <br />
            Click "Upload" below or drag files here.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`sidebar-file-item ${
                file.id === activeFileId ? 'active' : ''
              } ${file.status === 'error' ? 'error' : ''} ${
                file.status === 'uploading' ? 'compiling' : ''
              }`}
              onClick={() => onSelectFile(file.id)}
              title={file.name}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    marginTop: '2px',
                  }}
                >
                  {file.status === 'uploading' && '⟳ Uploading...'}
                  {file.status === 'ready' && '✓ Ready'}
                  {file.status === 'error' && '✕ Error'}
                </div>
              </div>

              {/* Delete Button */}
              <button
                className="btn btn-small btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file.id);
                }}
                style={{
                  opacity: 0,
                  transition: 'opacity var(--transition-fast)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.opacity = '1')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = '0')
                }
                title="Delete file"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upload Section */}
      <div className="sidebar-upload">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".tex"
          onChange={handleInputChange}
          className="file-input"
        />
        <button
          className="sidebar-upload-button"
          onClick={handleUploadClick}
          title="Upload .tex files"
        >
          ⬆ Upload Files
        </button>
      </div>
    </div>
  );
};

export default CompilerSidebar;
