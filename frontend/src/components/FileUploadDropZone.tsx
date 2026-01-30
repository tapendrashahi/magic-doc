import React, { useRef, useState } from 'react';
import type { FileUploadDropZoneProps } from '../types/compiler';

/**
 * File Upload Drop Zone Component
 * Handles drag-and-drop file uploads
 */
const FileUploadDropZone: React.FC<FileUploadDropZoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    onFilesSelected(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".tex"
        onChange={handleInputChange}
        className="file-input"
        disabled={disabled}
      />

      <div className="dropzone-icon">📁</div>
      <div className="dropzone-text">
        Drag and drop .tex files here or click to browse
      </div>
      <div className="dropzone-hint">
        Supports multiple files
      </div>
    </div>
  );
};

export default FileUploadDropZone;
