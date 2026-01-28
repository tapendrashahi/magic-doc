# 🗂️ EDITOR PAGE FILES DEPENDENCY MAP

## Component Hierarchy

```
App.tsx
│
└─ Router
    ├─ /login (LoginPage)
    ├─ /notes (Notes.tsx)
    ├─ /converter (Converter.tsx) ← Current Mathpix page
    │
    └─ /editor (Editor.tsx) ← TARGET PAGE
        │
        ├─ Sidebar Layout
        │   └─ Notes List Panel
        │       └─ Note item list
        │
        ├─ Main Content Area
        │   │
        │   ├─ Header Bar
        │   │   ├─ Sidebar Toggle [◀]
        │   │   ├─ Title Input
        │   │   ├─ Auto-save Status
        │   │   ├─ Format Toggle (KaTeX | LMS)
        │   │   ├─ Copy HTML Button
        │   │   ├─ Export Dropdown
        │   │   └─ All Notes Button
        │   │
        │   ├─ Main Grid (60% | 40%)
        │   │   │
        │   │   ├─ LaTeXInput.tsx
        │   │   │   ├─ Textarea with syntax highlighting
        │   │   │   ├─ Highlight overlay
        │   │   │   └─ Character counter
        │   │   │
        │   │   └─ HTMLPreview.tsx
        │   │       ├─ KaTeX renderer
        │   │       └─ HTML display
        │   │
        │   └─ Action Bar
        │       ├─ [💾 Save Note]
        │       ├─ [📝 Back to Notes]
        │       └─ Keyboard shortcuts info
        │
        └─ Services Used
            ├─ apiClient (API calls)
            ├─ keyboardManager (Shortcuts)
            ├─ toastManager (Notifications)
            ├─ ExportService (Export)
            ├─ katexService (Math rendering)
            └─ clipboardService (Copy)
```

---

## File Interconnections

```
FRONTEND/SRC/

├─ pages/
│   └─ Editor.tsx (914 lines) ⭐ MAIN PAGE
│       ├─ imports: LaTeXInput, HTMLPreview
│       ├─ imports: useNoteStore
│       ├─ imports: apiClient
│       ├─ imports: keyboardManager
│       ├─ imports: toastManager
│       ├─ imports: ExportService
│       └─ renders: Sidebar + Header + Grid + ActionBar
│
├─ components/
│   ├─ LaTeXInput.tsx (150 lines) ← Used in Editor
│   │   ├─ Syntax highlighting
│   │   ├─ Real-time conversion
│   │   └─ Scroll sync
│   │
│   ├─ HTMLPreview.tsx (132 lines) ← Used in Editor
│   │   ├─ KaTeX rendering
│   │   ├─ Format-aware display
│   │   └─ Scroll container
│   │
│   ├─ Layout.tsx (sidebar layout)
│   │
│   ├─ MathpixConverter.tsx (499 lines) ← CONVERTER PAGE
│   │   ├─ Tab interface
│   │   ├─ File upload
│   │   ├─ Preview & output
│   │   └─ Copy buttons
│   │
│   └─ ToastContainer.tsx (global toasts)
│
├─ services/
│   ├─ apiClient.ts
│   │   ├─ convertLatex()
│   │   ├─ getNote()
│   │   ├─ updateNote()
│   │   ├─ createNote()
│   │   ├─ deleteNote()
│   │   └─ getNotes()
│   │
│   ├─ clipboard.ts
│   │   └─ copyHTML()
│   │
│   ├─ export.ts
│   │   ├─ copyToClipboard()
│   │   ├─ exportMarkdown()
│   │   └─ exportHTML()
│   │
│   ├─ keyboard.ts
│   │   ├─ register()
│   │   └─ handleKeyDown()
│   │
│   ├─ toast.ts
│   │   ├─ success()
│   │   ├─ error()
│   │   └─ warning()
│   │
│   ├─ katex.ts
│   │   ├─ init()
│   │   ├─ render()
│   │   └─ isInitialized()
│   │
│   └─ converter.ts
│       └─ convertLatex() [real-time]
│
├─ store/
│   └─ noteStore.ts
│       ├─ State: loading, error
│       ├─ createNote()
│       └─ useNoteStore() hook
│
├─ api/
│   └─ client.ts
│       └─ API client setup
│
├─ contexts/
│   ├─ AuthContext.tsx
│   └─ NoteContext.tsx
│
└─ types/
    └─ index.ts

BACKEND/API/ (Django)

├─ converter/
│   ├─ views.py
│   │   └─ /api/convert/ endpoint
│   │
│   ├─ models.py
│   │   └─ Conversion models
│   │
│   ├─ serializers.py
│   │   └─ Data serialization
│   │
│   └─ converter.py
│       └─ Core conversion logic
│
└─ api/
    ├─ views.py
    │   ├─ /api/notes/ (list/create)
    │   ├─ /api/notes/{id}/ (get/update/delete)
    │   └─ /api/convert/ (convert LaTeX)
    │
    └─ serializers.py
        └─ Note serialization
```

---

## File Dependencies by Type

### Component Files (Used in Editor)

```
LaTeXInput.tsx
├─ imports: React hooks
├─ imports: converterService
├─ imports: useNoteStore
└─ Props: value, onChange, onConvert, conversionFormat

HTMLPreview.tsx
├─ imports: React hooks
├─ imports: katexService
└─ Props: html, loading, error, format, note
```

### Service Files (Called from Editor)

```
apiClient.ts
├─ convertLatex(latex, format) → Promise
├─ getNote(id) → Promise
├─ updateNote(id, data) → Promise
├─ createNote(data) → Promise
├─ deleteNote(id) → Promise
└─ getNotes() → Promise

clipboardService.ts
├─ copyHTML(content) → Promise
└─ getClipboardContent() → Promise

ExportService.ts
├─ copyToClipboard(content) → Promise
├─ exportMarkdown(html, title) → void
├─ exportHTML(html, title) → void
└─ exportLatex(latex, title) → void

keyboardManager.ts
├─ register(shortcut) → void
└─ handleKeyDown(event) → void

toastManager.ts
├─ success(message) → void
├─ error(message) → void
└─ warning(message) → void

katexService.ts
├─ init() → Promise
├─ render(container) → Promise
└─ isInitialized() → boolean
```

### Store Files

```
noteStore.ts
├─ State: loading, error
├─ State: notes array
├─ Methods: createNote()
└─ Hook: useNoteStore()
```

---

## Data Flow in Editor

```
1. PAGE MOUNT
   Editor.tsx
   ├─ Check URL params for note ID
   ├─ If ID exists:
   │  └─ apiClient.getNote(id)
   │     ├─ Backend: /api/notes/{id}/
   │     └─ Get: {title, latex_content, html_content}
   └─ If no ID:
      └─ Create new note with default title

2. LATEX EDITING
   LaTeXInput.tsx
   ├─ User types in textarea
   ├─ onChangeHandler triggers
   ├─ converterService.convertLatex()
   │  ├─ API: /api/convert/
   │  ├─ Convert: LaTeX → HTML
   │  └─ Return: {html_content, stats}
   └─ onConvert callback
      └─ HTMLPreview.tsx receives new HTML
         └─ katexService renders math

3. AUTO-SAVE
   Editor.tsx
   ├─ useEffect watches: [hasChanges, title, latex]
   ├─ After 2 seconds of inactivity:
   │  └─ apiClient.updateNote(id, {title, latex_content, html_content})
   │     ├─ Backend: PUT /api/notes/{id}/
   │     └─ Database: Update note
   └─ Show "Saved" status

4. COPY HTML
   Editor.tsx
   ├─ handleCopyHTML() called
   ├─ clipboardService.copyHTML(html)
   │  └─ Browser: navigator.clipboard.writeText()
   └─ toastManager.success() notification

5. EXPORT
   Editor.tsx
   ├─ handleExportHTML() / handleExportMarkdown()
   ├─ ExportService methods
   ├─ Create blob
   └─ Browser download
```

---

## API Calls from Editor

```
1. Initial Load
   GET /api/notes/{id}/
   └─ Get note data

2. Real-time Conversion
   POST /api/convert/
   {
     "text": "LaTeX content",
     "format": "katex" | "plain_html"
   }

3. Format Switch
   POST /api/convert/
   {
     "text": "LaTeX content",
     "format": "new_format"
   }

4. Save Note
   PUT /api/notes/{id}/
   {
     "title": "Note Title",
     "latex_content": "LaTeX",
     "html_content": "HTML"
   }

5. Delete Note
   DELETE /api/notes/{id}/

6. Rename Note
   PUT /api/notes/{id}/
   {"title": "New Title"}

7. List Notes
   GET /api/notes/
   └─ Get all notes for sidebar
```

---

## Component Props Interface

### LaTeXInput Props
```typescript
interface LaTeXInputProps {
  value: string;
  onChange: (value: string) => void;
  onConvert: (html: string) => void;
  conversionFormat?: 'katex' | 'plain_html';
}
```

### HTMLPreview Props
```typescript
interface HTMLPreviewProps {
  html: string;
  loading: boolean;
  error: string | null;
  format?: 'katex' | 'plain_html';
  note?: any;
}
```

---

## Key State Variables in Editor

```typescript
// Note Content
const [title, setTitle] = useState('');          // Note title
const [latex, setLatex] = useState('');          // LaTeX source
const [html, setHtml] = useState('');            // Rendered HTML
const [note, setNote] = useState<any>(null);     // Full note object

// UI State
const [sidebarOpen, setSidebarOpen] = useState(true);
const [settingsOpen, setSettingsOpen] = useState(false);
const [exportOpen, setExportOpen] = useState(false);
const [copied, setCopied] = useState(false);

// Save State
const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
const [hasChanges, setHasChanges] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// Loading & Errors
const [isLoading, setIsLoading] = useState(!!id);
const [error, setError] = useState('');

// Sidebar
const [allNotes, setAllNotes] = useState<Note[]>([]);
const [notesLoading, setNotesLoading] = useState(true);

// Note Operations
const [renamingNoteId, setRenamingNoteId] = useState<number | null>(null);
const [renameValue, setRenameValue] = useState('');
const [noteMenuOpen, setNoteMenuOpen] = useState<number | null>(null);

// Conversion
const [conversionFormat, setConversionFormat] = useState<'katex' | 'plain_html'>('katex');
```

---

## Summary

**Total Files Used by Editor Page:** 15+
- **Component files:** 4 (LaTeXInput, HTMLPreview, Layout, ToastContainer)
- **Service files:** 7 (apiClient, clipboard, export, keyboard, toast, katex, converter)
- **Store files:** 1 (noteStore)
- **API files:** 1 (client)
- **Type files:** 1 (types/index.ts)
- **Context files:** 2 (AuthContext, NoteContext)

**Main Lines of Code:**
- Editor.tsx: 914 lines
- LaTeXInput.tsx: 150 lines
- HTMLPreview.tsx: 132 lines
- Other components: ~500 lines
- Services: ~1500 lines
- **Total: ~3200 lines of frontend code**

---

## 🎯 Next Action

Now that we've mapped out the Editor page, what would you like to implement?

**Option A:** Add Mathpix converter as a tab in the Editor page header
**Option B:** Create a "Import from Mathpix" section in the editor
**Option C:** Replace LaTeX editor with Mathpix converter in a tab
**Option D:** Something else?

Your choice? 💭
