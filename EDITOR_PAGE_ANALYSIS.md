# 📊 EDITOR PAGE ANALYSIS & RELATED FILES

## Current Editor Page Structure

**Location:** `http://localhost:5180/editor/`  
**File:** `/frontend/src/pages/Editor.tsx` (914 lines)

---

## 🏗️ Current Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EDITOR PAGE LAYOUT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │   SIDEBAR       │    │         MAIN CONTENT AREA               │ │
│  │                 │    │  ┌─────────────────────────────────────┐ │ │
│  │ [✏️ New]       │    │  │  Header: Title | Formats | Buttons  │ │ │
│  │ ─────────────── │    │  └─────────────────────────────────────┘ │ │
│  │                 │    │  ┌─────────────────────────────────────┐ │ │
│  │ Notes List      │    │  │  Title Input                        │ │ │
│  │ [Scrollable]    │    │  │  "Enter note title..."              │ │ │
│  │                 │    │  └─────────────────────────────────────┘ │ │
│  │ • Note 1  ◀─┐   │    │  ┌──────────────────┬──────────────────┐ │ │
│  │ • Note 2    │   │    │  │   LaTeX Input    │  HTML Preview    │ │ │
│  │ • Note 3    │   │    │  │   60% Width      │  40% Width       │ │ │
│  │             │   │    │  │                  │                  │ │ │
│  └─────────────┼───┘    │  │ [Beautiful       │ [Rendered        │ │ │
│                │         │  │  Code Editor]    │  Content]        │ │ │
│                │         │  │                  │                  │ │ │
│                │         │  │ • Syntax         │ • KaTeX/HTML     │ │ │
│                │         │  │   Highlighting   │ • Scrollable     │ │ │
│                │         │  │ • Line Numbers   │                  │ │ │
│                │         │  │ • Scroll Sync    │                  │ │ │
│                │         │  │                  │                  │ │ │
│                │         │  └──────────────────┴──────────────────┘ │ │
│                │         │  ┌─────────────────────────────────────┐ │ │
│                └────────→│  │  Action Bar: [Save] [Back] [Copy]  │ │ │
│                          │  │  Auto-save enabled                  │ │ │
│                          │  └─────────────────────────────────────┘ │ │
│                          └─────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Related Files & Components

### **Core Page File**
- **[`Editor.tsx`](frontend/src/pages/Editor.tsx)** (914 lines)
  - Main editor page component
  - State management (title, latex, html, formats)
  - Auto-save logic
  - Note loading/creation/updating
  - Keyboard shortcuts
  - Sidebar with notes list
  - Header with format toggle and copy button
  - Main content grid (LaTeXInput | HTMLPreview)
  - Action bar at bottom

### **Component Files Used**

#### 1. **[`LaTeXInput.tsx`](frontend/src/components/LaTeXInput.tsx)** (150 lines)
**Purpose:** Beautiful code editor with syntax highlighting
```tsx
Props:
  - value: string (LaTeX content)
  - onChange: (value: string) => void
  - onConvert: (html: string) => void (real-time conversion)
  - conversionFormat?: 'katex' | 'plain_html'

Features:
  • Syntax highlighting overlay (colors: red, purple, orange, green)
  • Textarea with transparent bg to show highlights
  • Real-time LaTeX conversion (debounced)
  • Character counter
  • Scroll synchronization
```

#### 2. **[`HTMLPreview.tsx`](frontend/src/components/HTMLPreview.tsx)** (132 lines)
**Purpose:** Display rendered HTML with KaTeX math
```tsx
Props:
  - html: string (HTML content)
  - loading: boolean
  - error: string | null
  - format?: 'katex' | 'plain_html'
  - note?: any

Features:
  • KaTeX rendering for math expressions
  • MathJax fallback
  • Format-aware rendering
  • Responsive container
  • Error handling
```

### **Service Files**

#### 1. **[`apiClient.ts`](frontend/src/api/client.ts)**
```tsx
Methods:
  - convertLatex(latex: string, format: 'katex' | 'plain_html')
  - getNote(id: number)
  - createNote(data: {title, latex_content})
  - updateNote(id: number, data: {...})
  - deleteNote(id: number)
  - getNotes()
```

#### 2. **[`clipboard.ts`](frontend/src/services/clipboard.ts)**
- Copy HTML to clipboard functionality

#### 3. **[`export.ts`](frontend/src/services/export.ts)**
- Export as LaTeX, HTML, Markdown
- Copy to clipboard utilities

#### 4. **[`keyboard.ts`](frontend/src/services/keyboard.ts)**
- Keyboard shortcut manager
- Shortcuts: `Ctrl+S` (Save), `Ctrl+Shift+C` (Copy HTML)

#### 5. **[`toast.ts`](frontend/src/services/toast.ts)**
- Toast notifications (success, error, warning)

#### 6. **[`katex.ts`](frontend/src/services/katex.ts)**
- KaTeX initialization and rendering
- Math expression rendering

### **Store Files**

#### 1. **[`noteStore.ts`](frontend/src/store/noteStore.ts)**
- Zustand store for note management
- State: `loading`, `error`, `createNote()`

### **Type Files**

- **[`types/index.ts`](frontend/src/types/index.ts)** - TypeScript interfaces and types

---

## 🎨 Current Features

### **Editor Features**
✅ Title input with auto-save  
✅ LaTeX code editor with syntax highlighting  
✅ Real-time HTML preview  
✅ Format toggle (KaTeX / LMS Plain HTML)  
✅ Copy HTML to clipboard  
✅ Export options (LaTeX, HTML, Markdown)  
✅ Auto-save every 2 seconds after changes  
✅ Keyboard shortcuts (Ctrl+S, Ctrl+Shift+C)  
✅ Notes sidebar with list  
✅ Create new notes  
✅ Rename notes  
✅ Delete notes  
✅ Note search/filtering  
✅ Auto-convert on load  

### **Layout Features**
✅ Responsive sidebar (toggleable)  
✅ Header with title input  
✅ 60% LaTeX | 40% Preview split  
✅ Full-height utilization  
✅ Action bar below editor  
✅ Format selector buttons  
✅ Last saved timestamp indicator  
✅ Auto-save status display  

---

## 🔄 Data Flow

```
1. PAGE LOAD
   └─ Check if note ID in URL
   └─ If yes: loadNote() from API
      └─ Get title, latex_content, html_content
      └─ Set state
      └─ If html empty but latex exists:
         └─ Auto-convert LaTeX to HTML
   └─ If no: Create new note with default title

2. USER EDITS LATEX
   └─ handleLatexChange() updates state
   └─ LaTeX component calls onConvert()
   └─ API converts LaTeX → HTML
   └─ HTMLPreview re-renders with new HTML
   └─ KaTeX renders math expressions

3. FORMAT TOGGLE
   └─ User clicks KaTeX or LMS button
   └─ setConversionFormat() changes state
   └─ Effect hook triggers re-conversion
   └─ API converts with new format
   └─ Preview updates

4. AUTO-SAVE
   └─ Every 2 seconds after changes
   └─ updateNote() API call
   └─ Show "Saved" status
   └─ Track lastSaved timestamp

5. COPY HTML
   └─ User clicks copy button
   └─ ExportService.copyToClipboard()
   └─ HTML copied to clipboard
   └─ Toast notification shows

6. EXPORT
   └─ User clicks export dropdown
   └─ Choose format (LaTeX, HTML, Markdown)
   └─ Browser downloads file
```

---

## 🎯 State Management

**Component State in Editor.tsx:**
```tsx
// Note data
const [title, setTitle] = useState('');
const [latex, setLatex] = useState('');
const [html, setHtml] = useState('');
const [note, setNote] = useState<any>(null);

// UI state
const [sidebarOpen, setSidebarOpen] = useState(true);
const [settingsOpen, setSettingsOpen] = useState(false);
const [exportOpen, setExportOpen] = useState(false);
const [copied, setCopied] = useState(false);

// Save state
const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
const [hasChanges, setHasChanges] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// Loading & errors
const [isLoading, setIsLoading] = useState(!!id);
const [error, setError] = useState('');

// Sidebar notes
const [allNotes, setAllNotes] = useState<Note[]>([]);
const [notesLoading, setNotesLoading] = useState(true);

// Note operations
const [renamingNoteId, setRenamingNoteId] = useState<number | null>(null);
const [renameValue, setRenameValue] = useState('');
const [noteMenuOpen, setNoteMenuOpen] = useState<number | null>(null);

// Conversion format
const [conversionFormat, setConversionFormat] = useState<'katex' | 'plain_html'>('katex');
```

---

## 🔌 API Endpoints Used

**Backend:** `http://localhost:8000/api/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/convert/` | POST | Convert LaTeX to HTML |
| `/api/notes/` | GET, POST | List/create notes |
| `/api/notes/{id}/` | GET, PUT, DELETE | Get/update/delete note |

---

## 📐 Current Styling

**Grid Layout:**
```tsx
<div className="grid grid-cols-[60%_40%] gap-4 flex-1 min-h-96">
  <LaTeXInput ... />      {/* 60% width */}
  <HTMLPreview ... />     {/* 40% width */}
</div>
```

**Colors & Styling:**
- Header: `bg-white border-b shadow-sm`
- Editor: `border border-gray-300 rounded-lg`
- Preview: `border border-gray-300 rounded-lg bg-white`
- Buttons: Tailwind color classes (blue, green, gray)
- Error: `p-2 bg-red-100 border-l-4 border-red-500 text-red-700`
- Success: `text-green-600`
- Loading: `animate-spin`

---

## 🎛️ Header Components (Top Bar)

```
┌─────────────────────────────────────────────────────────────┐
│ [◀] Title Input | Auto-save Status | Formats | [Copy] [Menu] │
└─────────────────────────────────────────────────────────────┘

Left Side:
  • Sidebar toggle button
  • Title input (max-w-md)
  
Middle:
  • Auto-save status indicator (Saving... / Saved / Unsaved / Error)
  • Last saved timestamp

Right Side:
  • Format selector (KaTeX | LMS)
  • Copy HTML button
  • Export dropdown
  • All Notes button
```

---

## 🎯 What We Want to Integrate

**Goal:** Add Mathpix Converter beautifully to Editor page

**Current Mathpix Page Location:** `/converter`  
**Target Location:** Integrate into `/editor/`

**Options:**
1. Add a new "📊 Converter" tab to Editor page
2. Replace current LaTeX editor with Mathpix converter
3. Add Mathpix converter as a sidebar section

---

## 🔑 Key Files to Understand

| File | Lines | Purpose | Key Functions |
|------|-------|---------|----------------|
| Editor.tsx | 914 | Main page | loadNote, handleSaveNote, handleLatexChange |
| LaTeXInput.tsx | 150 | Code editor | handleChange, highlightLatex |
| HTMLPreview.tsx | 132 | Preview | useEffect for KaTeX init |
| apiClient.ts | ~200 | API calls | convertLatex, updateNote, createNote |
| noteStore.ts | ~100 | State | createNote, error handling |

---

## 💡 What's Ready to Use

✅ **LaTeXInput** - Beautiful code editor with all features  
✅ **HTMLPreview** - KaTeX/HTML rendering component  
✅ **apiClient** - API call utilities  
✅ **Auto-save** - Auto-save mechanism  
✅ **Export** - Export functionality  
✅ **Keyboard shortcuts** - Keyboard manager  
✅ **Toast notifications** - Toast system  
✅ **Layout** - Responsive sidebar + main content  

---

## 🚀 Next Steps

Would you like to:
1. **Add a Mathpix tab** to the Editor page header?
2. **Replace LaTeX editor** with Mathpix converter?
3. **Add Mathpix converter** to sidebar as new section?
4. **Create hybrid page** with both editors?

Which approach do you prefer? 🤔
