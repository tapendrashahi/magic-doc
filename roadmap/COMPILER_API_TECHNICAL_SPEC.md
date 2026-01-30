# Compiler API Specification & Technical Architecture

## 📐 System Architecture

### Component Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)               │
│  /compiler route with sidebar, editor, preview panels      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼────────────┐          ┌────────▼──────────┐
    │  API Layer     │          │  File Storage     │
    │  (views.py)    │          │  (media/)         │
    └───┬────────────┘          └────────┬──────────┘
        │                                │
    ┌───▼────────────────────────────────▼──────────┐
    │  Converter Pipeline                           │
    │  ┌────────────┐ ┌────────┐ ┌────────────┐    │
    │  │ Normalizer │→│Extract │→│KaTeX       │    │
    │  │            │ │        │ │Renderer    │    │
    │  └────────────┘ └────────┘ └────┬───────┘    │
    │                                  │             │
    │  ┌──────────────────────────────▼─┐           │
    │  │  HTML Assembler (TipTap Format) │           │
    │  └──────────────────────────────────┘          │
    └────────────────────────────────────────────────┘
        │
    ┌───▼────────────────────────────────────────┐
    │  Export Handlers                           │
    │  ├── PDF (weasyprint)                      │
    │  ├── Markdown (html2markdown)              │
    │  ├── JSON (custom serializer)              │
    │  ├── CSV (equation extractor)              │
    │  └── DOCX (python-docx)                    │
    └────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints Specification

### 1. Single File Conversion

**Endpoint**: `POST /api/compiler/convert-tex/`

**Request**:
```json
{
    "tex_content": "\\documentclass{article}\n\\begin{document}\n...",
    "filename": "document.tex",
    "options": {
        "normalize": true,
        "extract_stats": true
    }
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "data": {
        "id": "conv_abc123def456",
        "filename": "document.tex",
        "html": "<h1>...</h1><p><span class=\"tiptap-katex\" data-latex=\"...\">...</span></p>",
        "stats": {
            "equations_found": 42,
            "equations_rendered": 41,
            "equations_failed": 1,
            "processing_time_ms": 523,
            "sections_found": 8,
            "file_size_bytes": 15240,
            "language_detected": "en"
        },
        "failed_equations": [
            {
                "index": 25,
                "latex": "\\invalid{command}",
                "error": "Unknown command: \\invalid"
            }
        ]
    }
}
```

**Response (400 Bad Request)**:
```json
{
    "success": false,
    "error": "Invalid .tex file format",
    "details": "File must be UTF-8 encoded LaTeX document"
}
```

**Response (413 Payload Too Large)**:
```json
{
    "success": false,
    "error": "File size exceeds limit",
    "max_size_mb": 10
}
```

---

### 2. Batch File Conversion

**Endpoint**: `POST /api/compiler/convert-batch/`

**Request**:
```json
{
    "files": [
        {
            "name": "file1.tex",
            "content": "..."
        },
        {
            "name": "file2.tex",
            "content": "..."
        }
    ],
    "parallel": true,
    "stop_on_error": false
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "data": {
        "batch_id": "batch_xyz789",
        "total_files": 2,
        "successful": 2,
        "failed": 0,
        "results": [
            {
                "file_index": 0,
                "filename": "file1.tex",
                "status": "success",
                "conversion_id": "conv_abc123",
                "html": "...",
                "stats": {...}
            },
            {
                "file_index": 1,
                "filename": "file2.tex",
                "status": "success",
                "conversion_id": "conv_def456",
                "html": "...",
                "stats": {...}
            }
        ],
        "total_processing_time_ms": 1045
    }
}
```

---

### 3. Export to Different Formats

**Endpoint**: `POST /api/compiler/export/`

**Request**:
```json
{
    "html_content": "<h1>...</h1>...",
    "format": "pdf",
    "filename": "document",
    "options": {
        "include_metadata": true,
        "page_size": "A4",
        "margins_mm": [20, 20, 20, 20]
    }
}
```

**Supported Formats**:
- `pdf` - PDF document
- `markdown` - Markdown (.md)
- `json` - JSON structure
- `csv` - CSV file (equations only)
- `docx` - Microsoft Word document

**Response (200 OK)**:
```json
{
    "success": true,
    "data": {
        "format": "pdf",
        "file_id": "export_file_123",
        "download_url": "/api/compiler/download/export_file_123",
        "file_size_bytes": 125430,
        "generation_time_ms": 1230,
        "expires_at": "2026-02-13T10:30:00Z"
    }
}
```

---

### 4. File Download

**Endpoint**: `GET /api/compiler/download/<file_id>/`

**Response**: File stream with appropriate Content-Type header

**Headers**:
```
Content-Type: application/pdf (or appropriate type)
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 125430
```

---

### 5. Get Compilation Statistics

**Endpoint**: `GET /api/compiler/stats/<conversion_id>/`

**Response (200 OK)**:
```json
{
    "success": true,
    "data": {
        "conversion_id": "conv_abc123",
        "filename": "document.tex",
        "created_at": "2026-01-30T10:15:00Z",
        "status": "completed",
        "stats": {
            "file_size_bytes": 15240,
            "processing_time_ms": 523,
            "equations": {
                "total_found": 42,
                "successfully_rendered": 41,
                "failed": 1,
                "inline_count": 28,
                "block_count": 13
            },
            "content": {
                "sections": 8,
                "subsections": 15,
                "paragraphs": 47,
                "tables": 3,
                "lists": 12,
                "images": 5
            }
        }
    }
}
```

---

## 🗂️ Database Models

```python
# backend/compiler/models.py (if persistence needed)

class CompilerConversion(models.Model):
    """Store conversion history and results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    
    # Input
    original_filename = models.CharField(max_length=255)
    tex_content = models.TextField()
    file_size = models.IntegerField()  # bytes
    
    # Output
    compiled_html = models.TextField()
    conversion_status = models.CharField(
        max_length=20,
        choices=[('success', 'Success'), ('failed', 'Failed'), ('partial', 'Partial')]
    )
    
    # Statistics
    equations_total = models.IntegerField(default=0)
    equations_rendered = models.IntegerField(default=0)
    equations_failed = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    error_message = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]


class CompilerExport(models.Model):
    """Store exported files for download"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    conversion = models.ForeignKey(CompilerConversion, on_delete=models.CASCADE)
    
    export_format = models.CharField(max_length=10)  # pdf, md, json, csv, docx
    file_path = models.FileField(upload_to='compiler_exports/%Y/%m/%d/')
    file_size = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # For cleanup
    
    class Meta:
        ordering = ['-created_at']
```

---

## 🔄 Conversion Pipeline Details

### Step 1: LaTeX Normalization
**File**: `backend/converter/latex_normalizer.py`

**Input**: Raw LaTeX from .tex file
**Output**: Normalized LaTeX

**Operations**:
- Fix Mathpix-specific commands:
  - `\varangle` → `\angle`
  - `\overparen` → `\widehat`
  - `\mathrm` → `\mathrm` (standardize)
- Handle encoding issues
- Remove unsupported packages
- Fix common LaTeX errors

```python
# Example
normalizer = LatexNormalizer()
normalized = normalizer.normalize(tex_content)
```

---

### Step 2: LaTeX Extraction
**File**: `backend/converter/latex_extractor.py`

**Input**: Normalized LaTeX
**Output**: Equations and sections

**Operations**:
- Extract inline math: `$...$`
- Extract block math: `$$...$$` or `\[...\]`
- Extract document structure: `\section`, `\subsection`
- Extract tables: `\begin{tabular}`
- Extract lists: `\begin{enumerate}`

```python
# Example
extractor = LatexExtractor()
equations, sections = extractor.extract_all(normalized_text)

# equations: List of {'type': 'inline'|'block', 'latex': '...', 'position': ...}
# sections: List of {'level': 1-6, 'title': '...', 'content': '...'}
```

---

### Step 3: KaTeX Rendering
**File**: `backend/converter/katex_renderer.py`

**Input**: LaTeX equations
**Output**: URL-encoded LaTeX for data-latex attribute

**Operations**:
- Validate LaTeX syntax
- URL-encode LaTeX for HTML attribute
- Handle rendering errors gracefully
- Generate fallback text

```python
# Example
renderer = KaTeXRenderer()
results = renderer.render_batch(equations, stop_on_error=False)

# results: List of RenderResult(success=bool, latex=str, encoded=str, error=str)
```

---

### Step 4: HTML Assembly
**File**: `backend/converter/html_assembler.py`

**Input**: Extracted content + rendered equations
**Output**: TipTap-compatible HTML

**Template**:
```html
<h{level}>{section_title}</h{level}>
<p>
    Regular text with 
    <span class="tiptap-katex" data-latex="{URL_ENCODED_LATEX}">{fallback_text}</span>
    more text.
</p>
```

**Key Functions**:
- `assemble_fragment()` - Combine all parts
- `validate_html()` - Check output validity
- `add_metadata()` - Optional metadata inclusion

```python
# Example
assembler = HTMLAssembler()
html_fragment = assembler.assemble_fragment(normalized_text, equations, sections)
is_valid, error_msg = assembler.validate_html(html_fragment)
```

---

## 📦 Export Implementations

### PDF Export
```python
# backend/converter/export_handler.py

class PDFExporter(BaseExporter):
    """Export HTML to PDF using weasyprint"""
    
    def export(self, html_content, filename, options=None):
        # Render equations as images (KaTeX → SVG → PDF)
        # Apply CSS styling
        # Generate PDF
        # Return bytes
        pass
```

### Markdown Export
```python
class MarkdownExporter(BaseExporter):
    """Export HTML to Markdown"""
    
    def export(self, html_content, filename, options=None):
        # Convert HTML to Markdown
        # Extract LaTeX from data-latex attributes
        # Format as code blocks
        # Return markdown string
        pass
```

### JSON Export
```python
class JSONExporter(BaseExporter):
    """Export as structured JSON"""
    
    def export(self, html_content, filename, options=None):
        # Create JSON structure with:
        # - metadata
        # - content sections
        # - equations list
        # - statistics
        # Return JSON string
        pass
```

### CSV Export
```python
class CSVExporter(BaseExporter):
    """Export equations to CSV"""
    
    def export(self, html_content, filename, options=None):
        # Extract all equations
        # Create CSV with columns:
        # - equation_id
        # - type (inline/block)
        # - latex_code
        # - position
        # - section
        # Return CSV string
        pass
```

### DOCX Export
```python
class DOCXExporter(BaseExporter):
    """Export to Microsoft Word format"""
    
    def export(self, html_content, filename, options=None):
        # Parse HTML structure
        # Create Word document
        # Add headings, paragraphs, tables
        # Embed equation images
        # Add metadata
        # Return DOCX bytes
        pass
```

---

## 🧪 Test Cases

### Backend Tests
```python
# backend/compiler/tests/test_api.py

class CompilerAPITests(TestCase):
    
    def test_convert_simple_tex(self):
        """Test basic LaTeX file conversion"""
        tex = r"""
        \documentclass{article}
        \begin{document}
        \section{Introduction}
        The equation is $E=mc^2$.
        \end{document}
        """
        response = self.client.post('/api/compiler/convert-tex/', {
            'tex_content': tex,
            'filename': 'test.tex'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('tiptap-katex', response.json()['data']['html'])
    
    def test_convert_complex_equations(self):
        """Test complex LaTeX equations"""
        # Load from 82f1d41c-1d57-41c6-91fc-4a86d4328095.tex
        pass
    
    def test_batch_conversion(self):
        """Test multiple files"""
        pass
    
    def test_export_pdf(self):
        """Test PDF export"""
        pass
    
    def test_export_markdown(self):
        """Test Markdown export"""
        pass
    
    def test_large_file_handling(self):
        """Test file size limits"""
        pass
    
    def test_error_recovery(self):
        """Test invalid LaTeX handling"""
        pass
```

---

## 🔐 Security Considerations

1. **File Upload Validation**:
   - Only accept .tex files
   - Check MIME type
   - Scan for malicious content
   - Enforce size limits (10MB)

2. **Input Sanitization**:
   - Validate LaTeX syntax
   - Prevent arbitrary code execution
   - Use sandboxed LaTeX rendering

3. **Rate Limiting**:
   - 100 conversions per hour per user
   - 20 batch conversions per hour
   - Prevent abuse

4. **Access Control**:
   - Require authentication for API
   - Each user can only access their conversions
   - Temporary files cleanup

5. **Data Privacy**:
   - Don't store sensitive .tex content
   - Auto-cleanup exported files after 24 hours
   - HTTPS only

---

## ⚡ Performance Optimization

1. **Caching**:
   - Cache KaTeX rendering results
   - Cache conversion results for identical input
   - TTL: 24 hours

2. **Async Processing**:
   - Use Celery for batch conversions
   - Background task for PDF generation
   - Notify user when ready

3. **Database Indexing**:
   - Index on user_id, created_at
   - Index on conversion_status
   - Composite index on user_id + created_at

4. **File Optimization**:
   - Compress exported files
   - Use CDN for downloads
   - Stream large files

---

## 📋 Dependencies

### Backend
```
Django>=3.2
djangorestframework>=3.12
weasyprint>=54.0  # PDF export
python-docx>=0.8.11  # DOCX export
markdownify>=0.11  # HTML to Markdown
Pillow>=8.0  # Image processing
celery>=5.0  # Async tasks
redis>=3.5  # Caching
```

### Frontend
```
react>=17.0
typescript>=4.0
react-ace>=10.0  # Code editor
react-dropdown-menu>=1.0
axios>=0.21  # HTTP client
```

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026
