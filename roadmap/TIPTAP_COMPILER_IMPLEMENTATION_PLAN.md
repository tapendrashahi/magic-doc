# TipTap LaTeX Compiler Implementation Plan

## 🎯 Project Overview

**Objective**: Build a dedicated `/compiler` route that converts `.tex` files to TipTap-compatible HTML with enhanced UI/UX and export functionality.

**Output Format**: HTML with `<span class="tiptap-katex" data-latex="URL_ENCODED_LATEX">` pattern  
**Input**: `.tex` files (individual or batch)  
**Core Engine**: Existing `convert_mathpix_to_lms_html()` from backend converter

---

## 📋 Requirements Summary

| Requirement | Status | Priority |
|---|---|---|
| .tex file upload with drag & drop | ✅ Required | 1 |
| Live preview of conversion output | ✅ Required | 1 |
| Copy HTML button | ✅ Required | 1 |
| Export formats (PDF, MD, CSV, JSON, DOCX) | ✅ Required | 2 |
| Batch file conversion | ✅ Required | 2 |
| UI similar to `/editor` page | ✅ Required | 1 |
| Left sidebar file list | ✅ Required | 1 |
| Center code panel with syntax highlighting | ✅ Required | 1 |
| Right preview panel | ✅ Required | 1 |
| Top menu (Compile, Export, Copy, More) | ✅ Required | 1 |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    /compiler Route                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Top Menu Bar                                │  │
│  │  [Compile] [Export ▼] [Copy] [More ▼]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────┬──────────────────────┬──────────────────────┐    │
│  │ Left     │ Center Panel         │ Right Panel          │    │
│  │ Sidebar  │ (Code Input)         │ (Preview/Output)     │    │
│  │          │                      │                      │    │
│  │ • File 1 │ ┌────────────────┐   │ ┌────────────────┐  │    │
│  │ • File 2 │ │ .tex File      │   │ │ Compiled HTML  │  │    │
│  │ • File 3 │ │ Editor         │   │ │ (TipTap Format)│  │    │
│  │          │ │ (Syntax HL)    │   │ │                │  │    │
│  │ + Upload │ │                │   │ │ Preview:       │  │    │
│  │   Files  │ └────────────────┘   │ │ - Rendered     │  │    │
│  │          │ [Drag & Drop Area]   │ │   content      │  │    │
│  │          │                      │ │ - HTML Code    │  │    │
│  │          │                      │ │ - Copy Button  │  │    │
│  │          │                      │ └────────────────┘  │    │
│  └──────────┴──────────────────────┴──────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

         ↓ Backend API (/api/compiler)
         
┌─────────────────────────────────────────────────────────────────┐
│                    Django Backend                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • /api/compiler/convert-tex/         (POST .tex → HTML)        │
│  • /api/compiler/convert-batch/       (POST multiple files)     │
│  • /api/compiler/export/              (GET export formats)      │
│  • /api/compiler/preview/             (GET rendered preview)    │
│                                                                  │
│  Converter Pipeline:                                            │
│  .tex → LaTeX Normalization → Extraction →                     │
│  KaTeX Rendering → HTML Assembly → TipTap HTML                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 📅 Phase-Wise Implementation Plan

---

## PHASE 1: Analysis & Backend API Design
**Duration**: 2-3 days  
**Goal**: Prepare backend API endpoints and understand current converter pipeline

### Phase 1.1: Analyze Current Converter Pipeline ✅
- [ ] Review existing converter modules:
  - `latex_normalizer.py` - LaTeX command normalization
  - `latex_extractor.py` - Extract equations & sections
  - `katex_renderer.py` - Render LaTeX via KaTeX
  - `html_assembler.py` - Build TipTap HTML
  - `unicode_converter.py` - Unicode fallback
- [ ] Test `convert_mathpix_to_lms_html()` with sample .tex files
- [ ] Document current output format and edge cases
- [ ] Create test cases from the attached .tex files

**Deliverables**:
- Analysis document: `CONVERTER_ANALYSIS.md`
- Sample input/output pairs with TipTap HTML format
- Known limitations & improvements needed

### Phase 1.2: Design Backend API Endpoints
- [ ] Define `/api/compiler/convert-tex/` endpoint spec
- [ ] Define `/api/compiler/convert-batch/` endpoint spec
- [ ] Define `/api/compiler/export/` endpoint spec
- [ ] Define error handling & response formats
- [ ] Plan file storage strategy (temporary files)

**Request/Response Examples**:

```python
# POST /api/compiler/convert-tex/
{
    "tex_content": "\\section{...}",
    "filename": "document.tex"
}

# Response
{
    "success": true,
    "html": "<h2>...</h2><p><span class=\"tiptap-katex\" data-latex=\"...\">",
    "stats": {
        "equations_found": 15,
        "equations_rendered": 14,
        "processing_time_ms": 245
    }
}

# POST /api/compiler/export/
{
    "html": "<h2>...</h2>...",
    "format": "pdf", // or md, json, csv, docx
    "filename": "output"
}

# Response
{
    "success": true,
    "download_url": "/api/compiler/download/file_id"
}
```

**Deliverables**:
- API specification document: `COMPILER_API_SPEC.md`
- Error handling strategy document

### Phase 1.3: Plan Database Schema (if needed)
- [ ] Decide: Store conversion history or temporary only?
- [ ] Plan file storage location (media files)
- [ ] Plan cache strategy for multiple conversions

**Deliverables**:
- Database schema (if applicable)
- File storage strategy document

---

## PHASE 2: Backend API Implementation
**Duration**: 4-5 days  
**Goal**: Implement Django API endpoints for tex conversion & export

### Phase 2.1: Create Compiler API Views
- [ ] Create `backend/compiler/` app (or extend `api` app)
- [ ] Implement `CompilerViewSet` with endpoints:
  - `convert_single_tex()` - Convert one .tex file
  - `convert_batch_tex()` - Convert multiple files
  - `preview_conversion()` - Get preview without storing
- [ ] Add file upload handling (multipart/form-data)
- [ ] Implement error handling & validation
- [ ] Add logging for debugging

**File**: `backend/converter/views.py` (or new `backend/compiler/views.py`)

```python
# Key methods to implement:
- @action(detail=False, methods=['post'])
  def convert_tex(self, request)

- @action(detail=False, methods=['post'])
  def convert_batch(self, request)

- @action(detail=False, methods=['post'])
  def preview(self, request)

- @action(detail=False, methods=['post'])
  def export(self, request)
```

### Phase 2.2: Create Export Handler Module
- [ ] Create `backend/converter/export_handler.py`
- [ ] Implement exporters:
  - `ExportToPDF` - HTML → PDF (use `weasyprint` or `pdfkit`)
  - `ExportToMarkdown` - HTML → Markdown
  - `ExportToJSON` - HTML → JSON structure
  - `ExportToCSV` - Extract equations to CSV
  - `ExportToDOCX` - HTML → DOCX (use `python-docx`)
- [ ] Base class: `BaseExporter`

```python
class BaseExporter:
    def export(self, html_content, filename):
        raise NotImplementedError
    
class PDFExporter(BaseExporter):
    def export(self, html_content, filename):
        # Convert TipTap HTML to PDF
        pass

# Usage:
exporter = PDFExporter()
pdf_bytes = exporter.export(html, "document.pdf")
```

### Phase 2.3: Update URL Routing
- [ ] Add routes to `backend/api/urls.py` or create `backend/compiler/urls.py`:
  ```python
  path('api/compiler/convert-tex/', convert_tex, name='convert_tex'),
  path('api/compiler/convert-batch/', convert_batch, name='convert_batch'),
  path('api/compiler/export/', export_file, name='export'),
  path('api/compiler/download/<file_id>/', download_file, name='download'),
  ```

### Phase 2.4: Add Input Validation & Error Handling
- [ ] Validate .tex file format
- [ ] Handle LaTeX parsing errors gracefully
- [ ] Validate export format requests
- [ ] Add file size limits
- [ ] Add rate limiting if needed

**Deliverables**:
- Backend API implementation complete
- API specification updated with examples
- Error handling test cases

---

## PHASE 3: Frontend Compiler Page Implementation
**Duration**: 5-6 days  
**Goal**: Build React component for `/compiler` route with UI similar to `/editor`

### Phase 3.1: Create Compiler Route & Main Component
- [ ] Create `frontend/src/pages/Compiler.tsx`
- [ ] Create `frontend/src/components/CompilerLayout.tsx`
- [ ] Replicate `/editor` layout structure:
  - Left sidebar with file list
  - Center code input panel
  - Right preview panel
  - Top menu bar
- [ ] Set up routing: `/compiler` in main Router

**Key State Variables**:
```typescript
const [files, setFiles] = useState<CompilerFile[]>([]);
const [activeFileId, setActiveFileId] = useState<string | null>(null);
const [compiledHtml, setCompiledHtml] = useState<string>("");
const [isCompiling, setIsCompiling] = useState(false);
const [error, setError] = useState<string>("");
const [previewMode, setPreviewMode] = useState<'preview' | 'html'>('preview');
```

### Phase 3.2: Build Left Sidebar Component
- [ ] Create `frontend/src/components/CompilerSidebar.tsx`
- [ ] File list with:
  - File name display
  - File status indicator (pending/compiling/done/error)
  - Delete button
  - Rename functionality
- [ ] File upload area:
  - Drag & drop zone
  - Click to upload button
  - Upload progress indicator
  - Multiple file support

```typescript
// CompilerFile interface
interface CompilerFile {
  id: string;
  name: string;
  content: string;
  status: 'pending' | 'compiling' | 'done' | 'error';
  compiledHtml?: string;
  error?: string;
  uploadedAt: Date;
}
```

### Phase 3.3: Build Center Code Panel Component
- [ ] Create `frontend/src/components/CompilerCodePanel.tsx`
- [ ] Features:
  - Syntax-highlighted .tex editor (use `react-ace` or `monaco-editor`)
  - Line numbers
  - Read-only display or editable toggle
  - Current filename display
  - Character/line count
- [ ] Code editor configuration:
  - Language: LaTeX syntax highlighting
  - Theme: Dark/light mode support
  - Font size adjustable
  - Auto-indent

### Phase 3.4: Build Right Preview Panel Component
- [ ] Create `frontend/src/components/CompilerPreviewPanel.tsx`
- [ ] Two view modes:
  - **Preview Tab**: Rendered HTML with TipTap LaTeX math rendering
  - **HTML Tab**: Raw HTML code with syntax highlighting
- [ ] Features in both tabs:
  - Code copy button
  - Scroll sync option
  - Search/find functionality
  - Fullscreen toggle

### Phase 3.5: Build Top Menu Bar Component
- [ ] Create `frontend/src/components/CompilerMenuBar.tsx`
- [ ] Menu items:
  - **[Compile]** - Convert active file or all files
  - **[Export ▼]** - Dropdown with format options
    - PDF
    - Markdown
    - JSON
    - CSV
    - DOCX
  - **[Copy]** - Copy compiled HTML to clipboard
  - **[More ▼]** - Additional options
    - Settings
    - Keyboard shortcuts
    - About
- [ ] Status display: "Ready" / "Compiling..." / "Success" / "Error"

### Phase 3.6: Implement File Upload Handler
- [ ] Drag & drop file handling
- [ ] Multiple file batch upload
- [ ] File validation (.tex only)
- [ ] Upload progress tracking
- [ ] Error handling for invalid files
- [ ] File size limit enforcement

### Phase 3.7: Implement Compile Functionality
- [ ] Single file compilation
- [ ] Batch file compilation
- [ ] Real-time preview update
- [ ] Error display with line numbers
- [ ] Success notification
- [ ] Processing time display
- [ ] Prevent duplicate compilation

**Flow**:
```
User clicks [Compile] 
  → Prepare .tex content
  → Call /api/compiler/convert-tex/
  → Update state with compiled HTML
  → Display preview
  → Show statistics
```

### Phase 3.8: Implement Copy Functionality
- [ ] Copy compiled HTML to clipboard
- [ ] Show toast notification "Copied!"
- [ ] Provide "Copy LaTeX only" option
- [ ] Provide "Copy HTML + LaTeX" option

### Phase 3.9: Add Dark Mode Support
- [ ] Use existing dark mode context from Editor
- [ ] Apply to code panels
- [ ] Apply to preview panel
- [ ] Apply to menus

**Deliverables**:
- Complete Compiler page implementation
- All UI components created
- File upload working
- Compilation flow working
- Preview displaying correctly

---

## PHASE 4: Export Functionality Implementation
**Duration**: 3-4 days  
**Goal**: Implement all export formats

### Phase 4.1: Implement Export Modal/Dialog
- [ ] Create `frontend/src/components/ExportDialog.tsx`
- [ ] Format selection with icons
- [ ] Format-specific options:
  - **PDF**: Page size, margins, header/footer
  - **Markdown**: Include table of contents, math format
  - **JSON**: Pretty print option
  - **CSV**: Column options
  - **DOCX**: Include styles, metadata
- [ ] Download button
- [ ] Cancel button
- [ ] Progress indicator for large files

### Phase 4.2: Implement PDF Export
- [ ] Backend: Use `weasyprint` library
- [ ] Handle KaTeX rendering in PDF (rendered as images)
- [ ] Maintain formatting
- [ ] Test with various .tex documents
- [ ] Frontend: Trigger PDF download

### Phase 4.3: Implement Markdown Export
- [ ] Backend: Convert HTML → Markdown
- [ ] Extract LaTeX equations
- [ ] Format as code blocks or inline
- [ ] Handle tables, lists, headings
- [ ] Frontend: Download .md file

### Phase 4.4: Implement JSON Export
- [ ] Backend: Convert HTML to JSON structure
- [ ] Include metadata (title, author, created_at)
- [ ] Include equations with original LaTeX
- [ ] Include conversion statistics
- [ ] Frontend: Download .json file

### Phase 4.5: Implement CSV Export
- [ ] Backend: Extract all equations to CSV
- [ ] Columns: Equation number, LaTeX, Position, Type (inline/block)
- [ ] Optional: Extract text content
- [ ] Frontend: Download .csv file

### Phase 4.6: Implement DOCX Export
- [ ] Backend: Use `python-docx` library
- [ ] Add document structure (headings, paragraphs)
- [ ] Render KaTeX equations as images in DOCX
- [ ] Add metadata (title, created date)
- [ ] Format: Professional document style
- [ ] Frontend: Download .docx file

**Deliverables**:
- All export formats working
- Export dialog polished
- Download working for all formats
- Error handling for export failures

---

## PHASE 5: Testing & Optimization
**Duration**: 3-4 days  
**Goal**: Thoroughly test all functionality and optimize performance

### Phase 5.1: Backend Testing
- [ ] Unit tests for each API endpoint
- [ ] Test with sample .tex files from roadmap folder
- [ ] Test batch conversion with multiple files
- [ ] Test each export format
- [ ] Test error handling:
  - Malformed .tex files
  - Missing dependencies
  - File size limits
  - Network timeouts
- [ ] Test performance:
  - Large .tex files (>10MB)
  - Batch conversion (10+ files)
  - Export generation time

```python
# Test file: backend/compiler/tests.py
class CompilerAPITests(TestCase):
    def test_convert_single_tex(self):
        # Load sample .tex file
        # Call API
        # Verify HTML output format
        pass
    
    def test_batch_conversion(self):
        pass
    
    def test_export_formats(self):
        pass
```

### Phase 5.2: Frontend Testing
- [ ] Test file upload (drag & drop, click)
- [ ] Test compilation workflow
- [ ] Test preview rendering
- [ ] Test all export formats
- [ ] Test copy functionality
- [ ] Test responsive design
- [ ] Test dark mode toggle
- [ ] Test error messages display

```typescript
// Test file: frontend/src/pages/Compiler.test.tsx
describe('Compiler Page', () => {
  it('should upload .tex file', () => {});
  it('should compile and show preview', () => {});
  it('should copy HTML to clipboard', () => {});
  it('should export to PDF', () => {});
});
```

### Phase 5.3: Integration Testing
- [ ] Test full workflow end-to-end:
  1. Upload .tex file
  2. Compile to HTML
  3. View preview
  4. Copy HTML
  5. Export to PDF/MD/etc
- [ ] Test with real .tex files from roadmap
- [ ] Test batch conversion workflow
- [ ] Test error recovery

### Phase 5.4: Performance Optimization
- [ ] Optimize API response times
- [ ] Cache compiled results if same file uploaded
- [ ] Lazy load preview content
- [ ] Optimize export generation
- [ ] Add loading skeletons
- [ ] Add progress indicators for long operations

### Phase 5.5: UX Refinement
- [ ] Test keyboard shortcuts
- [ ] Test tooltip messages
- [ ] Refine error messages
- [ ] Add helpful hints
- [ ] Test on different screen sizes
- [ ] Test on mobile devices

**Deliverables**:
- Test suite with >80% coverage
- All tests passing
- Performance benchmarks documented
- UX polish complete

---

## PHASE 6: Documentation & Deployment
**Duration**: 2-3 days  
**Goal**: Document system and prepare for production deployment

### Phase 6.1: Create Documentation
- [ ] **User Guide**: How to use compiler
  - File upload
  - Compilation
  - Export options
  - Tips & tricks
- [ ] **API Documentation**: Auto-generated from code
  - Endpoint details
  - Request/response examples
  - Error codes
- [ ] **Architecture Documentation**: System design
  - Component diagram
  - Data flow
  - Error handling
  - Performance considerations
- [ ] **Troubleshooting Guide**: Common issues & solutions

### Phase 6.2: Create Deployment Checklist
- [ ] Environment variables set up
- [ ] Dependencies installed
- [ ] Database migrations run (if any)
- [ ] Static files collected
- [ ] S3/media storage configured (for exports)
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Error logging configured

### Phase 6.3: Prepare for Production
- [ ] Add monitoring & alerts
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up backup strategy
- [ ] Security review:
  - File upload validation
  - File size limits
  - Rate limiting
  - CSRF protection
  - SQL injection prevention

### Phase 6.4: Create Migration Guide
- [ ] Document changes to existing code
- [ ] List new dependencies
- [ ] List new environment variables
- [ ] Update existing documentation

**Deliverables**:
- Complete documentation
- Deployment checklist
- Production-ready code
- Migration guide

---

## 📊 Implementation Timeline

```
Week 1:
  Mon-Wed: Phase 1 (Analysis & Design)
  Thu-Fri: Phase 2 (Backend API - Part 1)

Week 2:
  Mon-Tue: Phase 2 (Backend API - Part 2)
  Wed-Fri: Phase 3 (Frontend - Part 1)

Week 3:
  Mon-Thu: Phase 3 (Frontend - Part 2)
  Fri: Phase 4 (Export - Part 1)

Week 4:
  Mon-Wed: Phase 4 (Export - Part 2)
  Thu-Fri: Phase 5 (Testing - Part 1)

Week 5:
  Mon-Wed: Phase 5 (Testing - Part 2)
  Thu-Fri: Phase 6 (Documentation & Deployment)
```

---

## 🔄 Key Files to Create/Modify

### Backend Files
```
backend/compiler/
├── __init__.py
├── admin.py
├── apps.py
├── models.py (if needed)
├── serializers.py
├── views.py          # NEW: API endpoints
├── urls.py           # NEW: URL routing
├── export_handler.py # NEW: Export logic
├── tests.py
└── migrations/

backend/converter/
├── converter.py      # MODIFY: Add batch conversion
├── export_handler.py # NEW: Export handlers
└── ...
```

### Frontend Files
```
frontend/src/pages/
├── Compiler.tsx      # NEW: Main page

frontend/src/components/
├── CompilerLayout.tsx
├── CompilerSidebar.tsx
├── CompilerCodePanel.tsx
├── CompilerPreviewPanel.tsx
├── CompilerMenuBar.tsx
├── ExportDialog.tsx
└── ...
```

---

## 🚀 Success Criteria

- ✅ Compiler page loads without errors
- ✅ File upload (single & batch) works
- ✅ Compilation produces valid TipTap HTML format
- ✅ Preview displays correctly with proper math rendering
- ✅ Copy button copies valid HTML
- ✅ All export formats work (PDF, MD, JSON, CSV, DOCX)
- ✅ Error messages display clearly
- ✅ UI is responsive on all screen sizes
- ✅ Performance: Compilation < 500ms per file
- ✅ Performance: Export generation < 2s
- ✅ Tests: >80% code coverage
- ✅ Documentation complete

---

## 📝 Notes

### TipTap HTML Format Reference
The output should maintain this pattern:
```html
<h2>Section Title</h2>
<p>Regular text with <span class="tiptap-katex" data-latex="E%3Dmc%5E2">fallback text</span> inline math.</p>
<p><span class="tiptap-katex" data-latex="%5Cbegin%7Baligned%7D...%5Cend%7Baligned%7D">Block equation fallback</span></p>
```

### Important Constraints
- .tex file format only (not raw LaTeX text input initially)
- Focus on mathematical & scientific documents
- Support CommonMark LaTeX extensions
- Handle Mathpix-generated LaTeX output

### Potential Challenges
1. **Large file handling**: Implement chunked uploads
2. **KaTeX rendering limits**: Some complex LaTeX may fail
3. **PDF export with equations**: May require server-side rendering
4. **Batch conversion performance**: May need async task queue
5. **Storage of exported files**: Implement cleanup strategy

---

## 🎓 Resources & References

- TipTap Editor: https://tiptap.dev/
- KaTeX Documentation: https://katex.org/
- Weasyprint (PDF): https://weasyprint.org/
- Python-docx: https://python-docx.readthedocs.io/
- React Ace Editor: https://github.com/securingdev/react-ace

---

## ✅ Next Steps

1. **Immediate**: Start Phase 1 analysis
2. **Review**: Current converter pipeline performance
3. **Test**: Sample .tex files with existing converter
4. **Design**: API specification with team
5. **Implement**: Phase 2 backend first
6. **Parallel**: Phase 3 frontend development
7. **Integrate**: Connect backend & frontend
8. **Test**: End-to-end workflows
9. **Deploy**: Production release

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026  
**Status**: Ready for Implementation
