# 🧪 Phase 2 Testing & Verification Guide

**Quick reference for testing all Phase 2 backend implementations**

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Navigate to backend
cd /home/tapendra/Documents/latex-converter-web/backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run all tests
python manage.py test compiler.tests -v 2

# 4. Start server
python manage.py runserver
```

---

## ✅ Endpoint Testing Checklist

### POST /api/compiler/convert-tex/
- [ ] Convert valid .tex file
- [ ] Reject non-.tex files
- [ ] Handle empty content
- [ ] Verify HTML output contains `tiptap-katex`
- [ ] Check stats are returned

**Quick Test**:
```bash
curl -X POST http://localhost:8000/api/compiler/convert-tex/ \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.tex",
    "content": "\\section{Hello}\n$E=mc^2$"
  }'
```

### POST /api/compiler/convert-batch/
- [ ] Convert 2+ files successfully
- [ ] Mix of valid and invalid files
- [ ] Verify stats on successful count
- [ ] Verify failed count

**Quick Test**:
```bash
curl -X POST http://localhost:8000/api/compiler/convert-batch/ \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {"filename": "test1.tex", "content": "\\section{One}"},
      {"filename": "test2.tex", "content": "\\section{Two}"}
    ]
  }'
```

### POST /api/compiler/export/
- [ ] Export to JSON format
- [ ] Export to CSV format (with table)
- [ ] Export to Markdown
- [ ] Export to PDF (if WeasyPrint installed)
- [ ] Export to DOCX (if python-docx installed)
- [ ] Reject invalid formats
- [ ] Get file_id in response

**Test JSON**:
```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Test</h2><p>Content</p><p><span class=\"tiptap-katex\" data-latex=\"E%3Dmc%5E2\">E=mc²</span></p>",
    "export_format": "json",
    "filename": "test"
  }'
```

**Test PDF**:
```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Test</h2><p>Content</p>",
    "export_format": "pdf",
    "filename": "document"
  }'
```

**Test CSV** (with table):
```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>",
    "export_format": "csv",
    "filename": "table"
  }'
```

### GET /api/compiler/download/<file_id>/
- [ ] Download after export
- [ ] Verify correct content-type header
- [ ] Verify attachment header
- [ ] Handle non-existent file_id
- [ ] File size header correct

**Quick Test**:
```bash
# First, export to get file_id
export_response=$(curl -s -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Test</h2>",
    "export_format": "json"
  }')

file_id=$(echo $export_response | grep -o '"file_id":"[^"]*' | cut -d'"' -f4)

# Then download
curl -O -X GET http://localhost:8000/api/compiler/download/$file_id/
```

### GET /api/compiler/stats/<conversion_id>/
- [ ] Return stats for valid conversion
- [ ] Handle non-existent conversion
- [ ] Verify all fields present

---

## 🧪 Test Suite Commands

### Run All Tests
```bash
python manage.py test compiler.tests
```

### Run Specific Test Class
```bash
# Convert tests
python manage.py test compiler.tests.ConvertTexAPITest

# Batch tests
python manage.py test compiler.tests.ConvertBatchAPITest

# Export tests
python manage.py test compiler.tests.ExportAPITest

# Download tests
python manage.py test compiler.tests.DownloadAPITest
```

### Run Specific Test
```bash
python manage.py test compiler.tests.ExportAPITest.test_export_json_success
```

### Run with Verbose Output
```bash
python manage.py test compiler.tests -v 2
```

### Run with Failed Test Details
```bash
python manage.py test compiler.tests --failfast
```

---

## 📊 Expected Test Results

All 22 tests should pass:

```
ConvertTexAPITest:
  ✅ test_convert_tex_success
  ✅ test_convert_tex_with_math
  ✅ test_convert_tex_invalid_filename
  ✅ test_convert_tex_empty_content
  ✅ test_convert_tex_missing_filename
  ✅ test_convert_tex_saves_history

ConvertBatchAPITest:
  ✅ test_convert_batch_success
  ✅ test_convert_batch_mixed_results
  ✅ test_convert_batch_empty_list
  ✅ test_convert_batch_missing_files
  ✅ test_convert_batch_large_batch

ExportAPITest:
  ✅ test_export_json_success
  ✅ test_export_csv_success
  ✅ test_export_markdown_success
  ✅ test_export_pdf_success
  ✅ test_export_docx_success
  ✅ test_export_invalid_format
  ✅ test_export_empty_html
  ✅ test_export_missing_fields

DownloadAPITest:
  ✅ test_download_nonexistent_file
  ✅ test_export_and_download_flow

StatsAPITest:
  ✅ test_stats_nonexistent_conversion

Ran 22 tests in ~2.5s
OK - All tests passed!
```

---

## 🔍 Debugging Tips

### Check What Tests Are Available
```bash
python manage.py test compiler.tests --collect-only
```

### Test in Django Shell
```bash
python manage.py shell

# Import and test converter
from converter.converter import convert_mathpix_to_lms_html
result = convert_mathpix_to_lms_html(r"\section{Test}")
print(result)
```

### Check Export Handler Directly
```bash
python manage.py shell

# Import and test export
from compiler.export_handler import export_html
html = "<h2>Test</h2>"
content, content_type, ext = export_html(html, "json", "test")
print(content)
```

### View API Documentation
```
# If using DRF's browsable API
http://localhost:8000/api/compiler/convert-tex/
http://localhost:8000/api/compiler/export/
```

---

## 📁 File Locations

```
Backend Files:
  ✅ /backend/compiler/export_handler.py      (500+ lines)
  ✅ /backend/compiler/views.py               (Endpoints)
  ✅ /backend/compiler/urls.py                (Routing)
  ✅ /backend/compiler/tests.py               (22 tests)
  ✅ /backend/requirements.txt                (Dependencies)

Key Classes in export_handler.py:
  - TipTapHTMLParser()       - Parse TipTap HTML
  - parse_tiptap_html()      - Extract content
  - export_to_pdf()          - PDF handler
  - export_to_markdown()     - Markdown handler
  - export_to_json()         - JSON handler
  - export_to_csv()          - CSV handler
  - export_to_docx()         - DOCX handler
  - export_html()            - Main dispatcher
```

---

## ✅ Verification Checklist

- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] All 22 tests passing
- [ ] convert-tex endpoint returns HTML with `tiptap-katex`
- [ ] convert-batch processes multiple files
- [ ] export endpoint works for all 5 formats
- [ ] download endpoint returns files with correct headers
- [ ] stats endpoint returns conversion details
- [ ] Error handling works (invalid format, empty content, etc.)
- [ ] Missing dependencies handled gracefully (503 error)
- [ ] File IDs are unique
- [ ] Download uses proper content-type headers

---

## 🚀 When All Tests Pass

You're ready for Phase 3! Frontend can now:
1. Call `/api/compiler/convert-tex/` to compile LaTeX
2. Call `/api/compiler/export/` to export to any format
3. Call `/api/compiler/download/<id>/` to get the file
4. Display results in the preview panel

---

**Backend Status**: ✅ READY FOR INTEGRATION

Test this checklist and move forward to Phase 3 Frontend build!
