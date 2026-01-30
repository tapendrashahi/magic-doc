# Frontend Component Architecture & UI Specifications

## 🎨 UI Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Top Menu Bar                                   │
│  [Compile ▶] [Export ▼] [Copy] [More ▼] | Status: Ready | Time: 0ms   │
├──────────────┬──────────────────────────┬────────────────────────────────┤
│              │                          │                                │
│   Sidebar    │    Code Editor Panel     │    Preview/HTML Panel          │
│              │                          │                                │
│ Files List   │  ┌──────────────────┐   │ ┌─────────────────────────┐   │
│              │  │ Line | .tex Code  │   │ │ [Preview] [HTML Code]   │   │
│ • test.tex   │  ├──────────────────┤   │ ├─────────────────────────┤   │
│ • main.tex   │  │ 1   | \section   │   │ │                         │   │
│ • aux.tex    │  │ 2   | {Intro}    │   │ │ <h2>Introduction</h2>   │   │
│              │  │ ... |            │   │ │ <p>...<span class=      │   │
│              │  │     |            │   │ │ "tiptap-katex"...       │   │
│ + Upload     │  │     |            │   │ │                         │   │
│   Files      │  └──────────────────┘   │ │ [Copy HTML] [Fullscreen]│   │
│              │  [Format: tex]           │ └─────────────────────────┘   │
│              │  Chars: 2,401 Lines: 42 │                                │
│              │                          │                                │
└──────────────┴──────────────────────────┴────────────────────────────────┘
```

---

## 📁 Component File Structure

```
frontend/src/
├── pages/
│   └── Compiler.tsx                    # Main page component
│
├── components/
│   ├── CompilerLayout.tsx              # Layout wrapper
│   ├── CompilerSidebar.tsx             # Left sidebar
│   ├── CompilerCodePanel.tsx           # Center code editor
│   ├── CompilerPreviewPanel.tsx        # Right preview/output
│   ├── CompilerMenuBar.tsx             # Top menu
│   ├── ExportDialog.tsx                # Export modal
│   ├── FileUploadDropZone.tsx          # Drag & drop area
│   └── CompilationStats.tsx            # Stats display
│
├── hooks/
│   └── useCompilerState.ts             # Custom hook for state management
│
├── services/
│   └── compilerService.ts              # API calls
│
├── types/
│   └── compiler.ts                     # TypeScript interfaces
│
└── styles/
    └── compiler.module.css             # Styling
```

---

## 🔧 Type Definitions

```typescript
// frontend/src/types/compiler.ts

export interface CompilerFile {
  id: string;
  name: string;
  content: string;
  status: 'pending' | 'compiling' | 'success' | 'error';
  compiledHtml?: string;
  error?: string;
  uploadedAt: Date;
  stats?: CompilationStats;
}

export interface CompilationStats {
  equations_found: number;
  equations_rendered: number;
  equations_failed: number;
  processing_time_ms: number;
  sections_found: number;
  file_size_bytes: number;
  failed_equations?: FailedEquation[];
}

export interface FailedEquation {
  index: number;
  latex: string;
  error: string;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'csv' | 'docx';
  filename: string;
  includeMetadata?: boolean;
  pageSize?: 'A4' | 'Letter' | 'A3';
  margins?: [number, number, number, number]; // top, right, bottom, left
}

export interface CompilationResult {
  id: string;
  filename: string;
  html: string;
  stats: CompilationStats;
  createdAt: Date;
}

export enum PreviewMode {
  PREVIEW = 'preview',
  HTML = 'html'
}
```

---

## 🎯 Component Specifications

### 1. Compiler Page (Main Component)

**File**: `frontend/src/pages/Compiler.tsx`

**Props**: None (uses React Router params)

**State**:
```typescript
const [files, setFiles] = useState<CompilerFile[]>([]);
const [activeFileId, setActiveFileId] = useState<string | null>(null);
const [compiledHtml, setCompiledHtml] = useState<string>("");
const [isCompiling, setIsCompiling] = useState(false);
const [error, setError] = useState<string>("");
const [previewMode, setPreviewMode] = useState<PreviewMode>(PreviewMode.PREVIEW);
const [exportDialogOpen, setExportDialogOpen] = useState(false);
const [darkMode, setDarkMode] = useState(false);
```

**Key Methods**:
```typescript
const handleFileUpload = (newFiles: File[]) => {
  // Process uploaded files
  // Add to files state
  // Validate .tex format
}

const handleCompile = async (fileId?: string) => {
  // Call API to compile
  // Update file status
  // Display preview
  // Show stats
}

const handleBatchCompile = async () => {
  // Compile all files
  // Show progress
}

const handleExport = async (options: ExportOptions) => {
  // Trigger export
  // Download file
}

const handleCopy = () => {
  // Copy HTML to clipboard
  // Show toast notification
}

const handleDelete = (fileId: string) => {
  // Remove file from state
}
```

---

### 2. Sidebar Component

**File**: `frontend/src/components/CompilerSidebar.tsx`

**Props**:
```typescript
interface CompilerSidebarProps {
  files: CompilerFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  onFilesUpload: (files: File[]) => void;
  onFileRename?: (fileId: string, newName: string) => void;
}
```

**Features**:
- File list with scrolling
- Active file highlighting
- Status indicator (✓ success, ✗ error, ⟳ compiling, ⊘ pending)
- Delete button per file
- Drag & drop upload area
- Click to upload button
- Upload progress indicator
- Right-click context menu (rename, delete, duplicate)

**UI Mockup**:
```
┌──────────────────┐
│ 📁 Files         │
├──────────────────┤
│ ✓ test.tex      │ ← Active
│ ✓ main.tex      │
│ ✗ aux.tex       │ ← Error
│ ⟳ new.tex       │ ← Compiling
├──────────────────┤
│ + Upload Files   │
│                  │
│ (Drag files     │
│  here to add)    │
└──────────────────┘
```

**Component JSX**:
```typescript
export const CompilerSidebar: React.FC<CompilerSidebarProps> = ({
  files,
  activeFileId,
  onFileSelect,
  onFileDelete,
  onFilesUpload,
}) => {
  const handleDrop = (e: React.DragEvent) => {
    // Handle drag & drop
  };

  return (
    <aside className="compiler-sidebar">
      <h3>Files</h3>
      <ul className="file-list">
        {files.map(file => (
          <li 
            key={file.id}
            className={`file-item ${activeFileId === file.id ? 'active' : ''}`}
            onClick={() => onFileSelect(file.id)}
          >
            <span className="status-icon">{getStatusIcon(file.status)}</span>
            <span className="file-name">{file.name}</span>
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.id);
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      
      <FileUploadDropZone onUpload={onFilesUpload} />
    </aside>
  );
};
```

---

### 3. Code Panel Component

**File**: `frontend/src/components/CompilerCodePanel.tsx`

**Props**:
```typescript
interface CompilerCodePanelProps {
  file: CompilerFile | null;
  isCompiling: boolean;
  onCompile: () => void;
}
```

**Features**:
- Syntax-highlighted LaTeX editor (using react-ace)
- Line numbers
- Current filename display
- Word/line count
- Read-only during compilation
- Keyboard shortcuts hint
- Undo/redo support

**Settings**:
- Theme: Dark/Light
- Font size: 12-18px
- Tab size: 2/4/8 spaces
- Line wrap: On/Off

**UI Mockup**:
```
┌────────────────────────────────────┐
│ document.tex | 42 lines, 2,401 ch  │
├────────────────────────────────────┤
│  1 | \documentclass{article}       │
│  2 | \begin{document}              │
│  3 | \section{Introduction}        │
│  4 |                               │
│  5 | Regular text with $E=mc^2$.   │
│  6 | \begin{equation}              │
│  7 |   x^2 + y^2 = z^2             │
│  8 | \end{equation}                │
│    | ...                           │
└────────────────────────────────────┘
```

**Component** (using react-ace):
```typescript
import AceEditor from "react-ace";

export const CompilerCodePanel: React.FC<CompilerCodePanelProps> = ({
  file,
  isCompiling,
  onCompile,
}) => {
  return (
    <div className="code-panel">
      <div className="code-header">
        <span className="filename">{file?.name}</span>
        <span className="stats">
          {file?.content.split('\n').length} lines, 
          {file?.content.length} chars
        </span>
      </div>
      
      <AceEditor
        mode="latex"
        theme="monokai"
        value={file?.content || ""}
        readOnly={isCompiling}
        name="latex_editor"
        width="100%"
        height="100%"
        fontSize={14}
        showPrintMargin={false}
        highlightActiveLine={true}
      />
    </div>
  );
};
```

---

### 4. Preview Panel Component

**File**: `frontend/src/components/CompilerPreviewPanel.tsx`

**Props**:
```typescript
interface CompilerPreviewPanelProps {
  html: string;
  stats: CompilationStats | null;
  isLoading: boolean;
  error?: string;
  onCopy: () => void;
}
```

**Features**:
- Two tabs: Preview & HTML Code
- Preview: Rendered TipTap HTML with math rendering
- HTML Code: Syntax-highlighted HTML with copy button
- Statistics display
- Scroll to sync option
- Search/find in preview
- Fullscreen toggle
- Error display

**Rendered Example**:
```
┌──────────────────────────────────────┐
│ [Preview] [HTML Code]   [⛶ Fullscreen]│
├──────────────────────────────────────┤
│                                      │
│ Introduction                         │
│                                      │
│ Regular text with E=mc² inline.      │
│                                      │
│ x² + y² = z²                         │
│                                      │
│ Statistics:                          │
│ • Equations: 14/15 rendered          │
│ • Processing: 234ms                  │
│                                      │
│ [Copy HTML]                          │
└──────────────────────────────────────┘
```

**Component**:
```typescript
export const CompilerPreviewPanel: React.FC<CompilerPreviewPanelProps> = ({
  html,
  stats,
  isLoading,
  error,
  onCopy,
}) => {
  const [mode, setMode] = useState<'preview' | 'code'>('preview');

  if (isLoading) {
    return <div className="preview-loading">Converting...</div>;
  }

  if (error) {
    return <div className="preview-error">{error}</div>;
  }

  return (
    <div className="preview-panel">
      <div className="preview-tabs">
        <button 
          className={`tab ${mode === 'preview' ? 'active' : ''}`}
          onClick={() => setMode('preview')}
        >
          Preview
        </button>
        <button 
          className={`tab ${mode === 'code' ? 'active' : ''}`}
          onClick={() => setMode('code')}
        >
          HTML Code
        </button>
      </div>

      {mode === 'preview' ? (
        <div className="preview-content">
          <div 
            className="rendered-html"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {stats && <CompilationStats stats={stats} />}
        </div>
      ) : (
        <div className="html-code">
          <AceEditor
            mode="html"
            theme="monokai"
            value={html}
            readOnly={true}
            width="100%"
            height="100%"
          />
          <button className="copy-btn" onClick={onCopy}>
            📋 Copy HTML
          </button>
        </div>
      )}
    </div>
  );
};
```

---

### 5. Menu Bar Component

**File**: `frontend/src/components/CompilerMenuBar.tsx`

**Props**:
```typescript
interface CompilerMenuBarProps {
  isCompiling: boolean;
  hasCompiledOutput: boolean;
  onCompile: () => void;
  onBatchCompile: () => void;
  onExport: (format: string) => void;
  onCopy: () => void;
  onMore?: () => void;
  status: string;
  processingTime?: number;
}
```

**Features**:
- Compile button (main action)
- Export dropdown menu
- Copy button (copy to clipboard)
- More dropdown (settings, help, about)
- Status display
- Processing time display
- Keyboard shortcut hints

**Menu Structure**:
```
[Compile ▶] [Export ▼] [Copy] [More ▼] | Status: Ready | ⏱ 234ms

Export Menu:
  📄 PDF
  📝 Markdown
  { } JSON
  📊 CSV
  📘 Word (DOCX)

More Menu:
  ⚙️ Settings
  ⌨️ Keyboard Shortcuts
  ℹ️ About
  📚 Documentation
```

**Component**:
```typescript
export const CompilerMenuBar: React.FC<CompilerMenuBarProps> = ({
  isCompiling,
  hasCompiledOutput,
  onCompile,
  onExport,
  onCopy,
  status,
  processingTime,
}) => {
  return (
    <div className="menu-bar">
      <div className="menu-actions">
        <button 
          className="btn btn-primary"
          onClick={onCompile}
          disabled={isCompiling}
        >
          {isCompiling ? '⟳ Compiling...' : '▶ Compile'}
        </button>

        <ExportDropdown onExport={onExport} />

        <button 
          className="btn"
          onClick={onCopy}
          disabled={!hasCompiledOutput}
          title="Copy HTML to clipboard (Ctrl+Shift+C)"
        >
          📋 Copy
        </button>

        <MoreDropdown />
      </div>

      <div className="menu-status">
        <span className="status-text">{status}</span>
        {processingTime && (
          <span className="processing-time">⏱ {processingTime}ms</span>
        )}
      </div>
    </div>
  );
};
```

---

### 6. Export Dialog Component

**File**: `frontend/src/components/ExportDialog.tsx`

**Props**:
```typescript
interface ExportDialogProps {
  isOpen: boolean;
  html: string;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}
```

**Features**:
- Format selection with icons
- Format-specific options
- Filename input
- Preview of settings
- Export button
- Progress indicator
- Success/error notification

**UI Mockup**:
```
┌─────────────────────────────────────┐
│ Export Compiled Document            │
├─────────────────────────────────────┤
│                                     │
│ Select Format:                      │
│ ○ 📄 PDF (portable, print-ready)   │
│ ○ 📝 Markdown (editable text)      │
│ ○ { } JSON (structured data)        │
│ ○ 📊 CSV (spreadsheet)              │
│ ○ 📘 Word DOCX (office ready)       │
│                                     │
│ PDF Options:                        │
│ Page Size: [A4 ▼]                  │
│ Margins: 20mm                       │
│ ☑ Include metadata                 │
│                                     │
│ Filename: document                  │
│                                     │
│ [Cancel]  [Export]                 │
└─────────────────────────────────────┘
```

**Component**:
```typescript
export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  html,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<string>('pdf');
  const [filename, setFilename] = useState('document');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format: format as any,
        filename,
        includeMetadata: true,
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <h2>Export Document</h2>
        
        <div className="format-selector">
          {EXPORT_FORMATS.map(fmt => (
            <label key={fmt.id} className="format-option">
              <input 
                type="radio" 
                value={fmt.id}
                checked={format === fmt.id}
                onChange={(e) => setFormat(e.target.value)}
              />
              <span className="icon">{fmt.icon}</span>
              <span className="name">{fmt.name}</span>
              <span className="desc">{fmt.description}</span>
            </label>
          ))}
        </div>

        <div className="filename-input">
          <label>Filename:</label>
          <input 
            type="text" 
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="document"
          />
          <span className="extension">.{format}</span>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 7. File Upload Drop Zone

**File**: `frontend/src/components/FileUploadDropZone.tsx`

**Props**:
```typescript
interface FileUploadDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}
```

**Features**:
- Drag & drop area
- Click to select files
- Multiple file selection
- File size validation
- File type validation (.tex only)
- Upload progress
- Error display

**UI**:
```
┌──────────────────────────────┐
│  ⬇️  Drag .tex files here      │
│     or click to browse        │
│                              │
│  Max: 10MB per file          │
│  Format: .tex only           │
└──────────────────────────────┘
```

---

## 🎨 Styling & Theme

### CSS Classes Structure
```css
/* Main containers */
.compiler-page { ... }
.compiler-header { ... }
.compiler-layout { ... }
.compiler-sidebar { ... }
.code-panel { ... }
.preview-panel { ... }
.menu-bar { ... }

/* UI elements */
.btn { ... }
.btn-primary { ... }
.btn-secondary { ... }
.tab { ... }
.tab.active { ... }
.status-icon { ... }

/* Dark mode */
.compiler-page.dark-mode { ... }
.btn.dark-mode { ... }

/* Responsive */
@media (max-width: 768px) {
  .compiler-layout {
    flex-direction: column;
  }
}
```

### Color Scheme
```
Light Mode:
  Primary: #0066cc
  Success: #00cc00
  Error: #cc0000
  Background: #ffffff
  Text: #000000

Dark Mode:
  Primary: #66b3ff
  Success: #00ff00
  Error: #ff6666
  Background: #1e1e1e
  Text: #e0e0e0
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Compile current file |
| `Ctrl+Shift+Enter` | Batch compile all files |
| `Ctrl+Shift+C` | Copy HTML to clipboard |
| `Ctrl+Shift+E` | Open export dialog |
| `Ctrl+S` | Save compiled output (download) |
| `F11` | Toggle fullscreen preview |
| `Ctrl+.` | Toggle dark mode |

---

## 📱 Responsive Design Breakpoints

```
Desktop (≥1400px):
  - 3-column layout (sidebar, code, preview)
  - Side-by-side panels

Tablet (768px - 1399px):
  - 2-column layout (sidebar, tabbed code/preview)
  - Stacked panels with tabs

Mobile (<768px):
  - Single column with tabs
  - Full-width panels
  - Sidebar as drawer/modal
```

---

## 🧪 Component Testing

```typescript
// Example test
describe('Compiler Page', () => {
  it('should upload and compile .tex file', async () => {
    const { getByText, getByRole } = render(<Compiler />);
    
    // Upload file
    const file = new File(['\\section{Test}'], 'test.tex');
    const input = getByRole('input');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Compile
    fireEvent.click(getByText('Compile'));
    
    // Verify
    await waitFor(() => {
      expect(getByText(/tiptap-katex/)).toBeInTheDocument();
    });
  });
});
```

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026
