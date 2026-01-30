/**
 * TypeScript types and interfaces for the Compiler
 * These define the shape of data throughout the frontend
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ConvertTexRequest {
  filename?: string;
  content: string;
}

export interface ConvertTexResponse {
  success: boolean;
  html_output: string;
  html?: string;
  stats: {
    input_chars: number;
    output_chars: number;
    conversion_time_ms: number;
    math_equations?: number;
    [key: string]: any;
  };
  conversion_id?: number;
  error?: string;
}

export interface ConvertBatchRequest {
  files: Array<{
    filename: string;
    content: string;
  }>;
}

export interface ConvertBatchResponse {
  success: boolean;
  results: Array<{
    filename: string;
    html?: string;
    stats?: any;
    status: 'success' | 'error';
    error?: string;
  }>;
  total_files: number;
  successful: number;
  failed: number;
}

export interface ExportRequest {
  html_content: string;
  format: 'pdf' | 'md' | 'markdown' | 'json' | 'csv' | 'docx';
  filename?: string;
}

export interface ExportResponse {
  success: boolean;
  file_id?: string;
  filename?: string;
  file_content?: string;
  download_url?: string;
  mime_type?: string;
  file_size?: number;
  format?: string;
  content_type?: string;
  error?: string;
}

export interface ConversionStats {
  conversion_id: number;
  filename: string;
  status: 'success' | 'error' | 'partial';
  conversion_time: number;
  input_size: number;
  output_size: number;
  created_at: string;
}

// ============================================================================
// Application State Types
// ============================================================================

export interface CompilerFile {
  id: string;
  name: string;
  filename?: string;
  content: string;
  file?: File;
  uploadedAt?: Date;
  status: 'ready' | 'uploading' | 'compiling' | 'success' | 'error';
  error?: string;
  html?: string;
  stats?: any;
}

export interface ExportState {
  isOpen: boolean;
  isLoading: boolean;
  selectedFormat: string;
  error: string | null;
}

export interface CompilerState {
  files: CompilerFile[];
  activeFileId: string | null;
  compiledHtml: { [fileId: string]: string };
  isCompiling: { [fileId: string]: boolean };
  compileErrors: { [fileId: string]: string | undefined };
  exportState: ExportState;
  errorMessage: string | null;
  successMessage: string | null;
  uploadProgress: number;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface CompilerLayoutProps {
  files: CompilerFile[];
  activeFileId: string | null;
  compiledHtml: string | null;
  isCompiling: boolean;
  compileError: string | undefined;
  exportState: ExportState;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onFileUpload: (files: FileList | null) => void;
  onCompile: () => Promise<void>;
  onCompileAll: () => Promise<void>;
  onCopyHtml: () => Promise<void>;
  onOpenExport: () => void;
  onCloseExport: () => void;
  onExport: (format: string) => Promise<void>;
}

export interface CompilerSidebarProps {
  files: CompilerFile[];
  activeFileId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onFileUpload: (files: FileList | null) => void;
}

export interface CompilerCodePanelProps {
  file: CompilerFile | null;
  onFileChange?: (content: string) => void;
}

export interface CompilerPreviewPanelProps {
  compiledHtml: string | null;
  isCompiling: boolean;
  error: string | undefined;
}

export interface CompilerMenuBarProps {
  hasActiveFile: boolean;
  isCompiling: boolean;
  hasCompiledHtml: boolean;
  exportState?: ExportState;
  onCompile: () => Promise<void>;
  onCompileAll: () => Promise<void>;
  onCopyHtml: () => Promise<void>;
  onOpenExport: () => void;
  onCloseExport?: () => void;
  onExport?: (format: string) => Promise<void>;
}

export interface ExportDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedFormat: string;
  onClose: () => void;
  onExport: (format: string) => Promise<void>;
}

export interface FileUploadDropZoneProps {
  onFilesSelected: (files: FileList | null) => void;
  disabled?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

export type ExportFormat = 'pdf' | 'md' | 'markdown' | 'json' | 'csv' | 'docx';

export interface ExportFormatOption {
  value: ExportFormat;
  label: string;
  icon: string;
  description: string;
}
