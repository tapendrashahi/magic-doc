import React, { useState } from 'react';
import type { ExportDialogProps } from '../types/compiler';

/**
 * Export Dialog Component
 * Modal for selecting export format and handling export
 */
const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  isLoading,
  error,
  selectedFormat: initialFormat,
  onClose,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState(initialFormat || 'pdf');

  if (!isOpen) return null;

  const formats = [
    {
      id: 'pdf',
      label: 'PDF',
      icon: '📄',
      description: 'Portable Document Format',
    },
    {
      id: 'markdown',
      label: 'Markdown',
      icon: '📝',
      description: 'Markdown text format',
    },
    {
      id: 'json',
      label: 'JSON',
      icon: '{ }',
      description: 'JSON data format',
    },
    {
      id: 'csv',
      label: 'CSV',
      icon: '📊',
      description: 'Comma-separated values',
    },
    {
      id: 'docx',
      label: 'DOCX',
      icon: '📘',
      description: 'Microsoft Word document',
    },
  ];

  const handleExport = () => {
    onExport(selectedFormat);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">Export HTML</div>

        <div className="modal-body">
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.95rem',
            }}
          >
            Choose an export format:
          </p>

          <div className="export-format-options">
            {formats.map((format) => (
              <div
                key={format.id}
                className={`export-format-option ${
                  selectedFormat === format.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="export-format-icon">{format.icon}</div>
                <div className="export-format-label">{format.label}</div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    marginTop: '2px',
                  }}
                >
                  {format.description}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              className="alert alert-error"
              style={{
                marginTop: 'var(--spacing-md)',
              }}
            >
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="preview-spinner">⟳</span>
                Exporting...
              </>
            ) : (
              <>
                <span>💾</span>
                Export as {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
