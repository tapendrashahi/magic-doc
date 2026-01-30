# ⚡ Quick Command Reference - Phase 1-2 Testing

**Copy-paste ready commands to verify backend is working**

---

## 🚀 Get Started in 5 Minutes

```bash
# 1. Navigate to backend
cd /home/tapendra/Documents/latex-converter-web/backend

# 2. Install dependencies (one-time)
pip install -r requirements.txt

# 3. Run all tests
python manage.py test compiler.tests -v 2

# 4. Start dev server
python manage.py runserver
```

**Expected Output**:
```
Ran 22 tests in ~2.5s
OK
```

Server will be available at: `http://localhost:8000`

---

## 🧪 Test Endpoints (in another terminal)

### Test 1: Convert Single LaTeX File

```bash
curl -X POST http://localhost:8000/api/compiler/convert-tex/ \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.tex",
    "content": "\\section{Hello}\nLorem ipsum dolor sit amet\n$E=mc^2$"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "html": "<h2>Hello</h2><p>Lorem ipsum...</p><p><span class=\"tiptap-katex\"...",
  "stats": {
    "input_chars": 67,
    "output_chars": 256,
    "conversion_time_ms": 45.23,
    "math_equations": 1
  },
  "conversion_id": 1
}
```

---

### Test 2: Batch Convert Multiple Files

```bash
curl -X POST http://localhost:8000/api/compiler/convert-batch/ \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "filename": "file1.tex",
        "content": "\\section{First File}\n$x^2 + y^2 = z^2$"
      },
      {
        "filename": "file2.tex",
        "content": "\\section{Second File}\nJust plain text"
      }
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "results": [
    {
      "filename": "file1.tex",
      "html": "...",
      "status": "success",
      "stats": {...}
    },
    {
      "filename": "file2.tex",
      "html": "...",
      "status": "success",
      "stats": {...}
    }
  ],
  "total_files": 2,
  "successful": 2,
  "failed": 0
}
```

---

### Test 3: Export to JSON

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Hello</h2><p>This is a test document</p><p><span class=\"tiptap-katex\" data-latex=\"E%3Dmc%5E2\">E=mc²</span></p>",
    "export_format": "json",
    "filename": "test_export"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "file_id": "exp_550e8400e29b41d4a716446655440000",
  "filename": "test_export.json",
  "download_url": "/api/compiler/download/exp_550e8400e29b41d4a716446655440000/",
  "file_size": 342,
  "format": "json",
  "content_type": "application/json"
}
```

---

### Test 4: Export to PDF

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>My Document</h2><p>This will be converted to PDF</p>",
    "export_format": "pdf",
    "filename": "my_document"
  }'
```

**Expected Response** (if WeasyPrint installed):
```json
{
  "success": true,
  "file_id": "exp_xxx...",
  "download_url": "/api/compiler/download/exp_xxx.../",
  "file_size": 5432,
  "format": "pdf"
}
```

---

### Test 5: Export to Markdown

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Title</h2><p>Paragraph text</p><ul><li>Item 1</li><li>Item 2</li></ul>",
    "export_format": "md",
    "filename": "document"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "file_id": "exp_xxx...",
  "download_url": "/api/compiler/download/exp_xxx.../",
  "file_size": 125,
  "format": "md"
}
```

---

### Test 6: Export to CSV (with table)

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<table><tr><th>Name</th><th>Age</th><th>City</th></tr><tr><td>John</td><td>30</td><td>New York</td></tr><tr><td>Jane</td><td>25</td><td>Boston</td></tr></table>",
    "export_format": "csv",
    "filename": "people"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "file_id": "exp_xxx...",
  "download_url": "/api/compiler/download/exp_xxx.../",
  "file_size": 89,
  "format": "csv"
}
```

---

### Test 7: Export to DOCX (Word)

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Report Title</h2><p>This is a professional report that will be converted to Word format.</p>",
    "export_format": "docx",
    "filename": "report"
  }'
```

**Expected Response** (if python-docx installed):
```json
{
  "success": true,
  "file_id": "exp_xxx...",
  "download_url": "/api/compiler/download/exp_xxx.../",
  "file_size": 3456,
  "format": "docx"
}
```

---

### Test 8: Download Exported File

```bash
# First export (to get file_id)
file_response=$(curl -s -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Test</h2>",
    "export_format": "json",
    "filename": "test"
  }')

# Extract file_id
file_id=$(echo $file_response | grep -o '"file_id":"[^"]*' | cut -d'"' -f4)

# Download the file
curl -O http://localhost:8000/api/compiler/download/$file_id/
```

**Result**: File downloaded with correct name and content

---

### Test 9: Error Handling - Invalid Format

```bash
curl -X POST http://localhost:8000/api/compiler/export/ \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h2>Test</h2>",
    "export_format": "xyz",
    "filename": "test"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Unsupported export format: xyz. Supported: pdf, md, json, csv, docx"
}
```

---

### Test 10: Error Handling - Missing Fields

```bash
curl -X POST http://localhost:8000/api/compiler/convert-tex/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "\\section{Test}"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "errors": {
    "filename": [
      "This field is required."
    ]
  }
}
```

---

## 📊 Run Django Tests

### All Tests
```bash
python manage.py test compiler.tests
```

### Verbose Output
```bash
python manage.py test compiler.tests -v 2
```

### Specific Test Class
```bash
python manage.py test compiler.tests.ExportAPITest
```

### Specific Test Method
```bash
python manage.py test compiler.tests.ExportAPITest.test_export_json_success
```

### Stop at First Failure
```bash
python manage.py test compiler.tests --failfast
```

### With Coverage (if coverage installed)
```bash
pip install coverage
coverage run --source='compiler' manage.py test compiler.tests
coverage report
```

---

## 🔧 Django Shell Testing

```bash
# Enter Django shell
python manage.py shell

# Import converter
from converter.converter import convert_mathpix_to_lms_html, convert_mathpix_to_lms_html_with_stats

# Test basic conversion
result = convert_mathpix_to_lms_html(r"\section{Test}\n$E=mc^2$")
print(result)

# Test with stats
html, stats = convert_mathpix_to_lms_html_with_stats(r"\section{Test}")
print(html)
print(stats)

# Test export handler
from compiler.export_handler import export_html
content, mime_type, ext = export_html("<h2>Test</h2>", "json", "test")
print(content)

# Exit shell
exit()
```

---

## 📝 Using Postman/Insomnia

### Import this into Postman/Insomnia as a collection

```json
{
  "info": {
    "name": "LaTeX Compiler API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Convert Single LaTeX",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/compiler/convert-tex/",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"filename\": \"test.tex\", \"content\": \"\\\\section{Hello}\\n$E=mc^2$\"}"
        }
      }
    },
    {
      "name": "Export to PDF",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/compiler/export/",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {"mode": "raw", "raw": "{\"html_content\": \"<h2>Test</h2>\", \"export_format\": \"pdf\", \"filename\": \"document\"}"}
      }
    }
  ]
}
```

---

## ✅ Verification Checklist

- [ ] Install requirements: `pip install -r requirements.txt`
- [ ] Run tests: `python manage.py test compiler.tests -v 2` (should show 22 passing)
- [ ] Start server: `python manage.py runserver`
- [ ] Test convert-tex endpoint (Test 1 above)
- [ ] Test batch endpoint (Test 2 above)
- [ ] Test export JSON (Test 3 above)
- [ ] Test export PDF (Test 4 above)
- [ ] Test error handling (Test 9 above)
- [ ] Verify download works (Test 8 above)

---

## 🎯 Quick Check

**All working?** Run this one command:

```bash
python manage.py test compiler.tests.ExportAPITest -v 2
```

If you see:
```
✅ test_export_json_success ... ok
✅ test_export_pdf_success ... ok
✅ test_export_markdown_success ... ok
✅ ... more tests ...
OK
```

Then **everything is working!** ✅

---

## 📞 Troubleshooting

### Issue: "No module named 'weasyprint'"
```bash
pip install weasyprint==60.0
```

### Issue: "No module named 'docx'"
```bash
pip install python-docx==0.8.11
```

### Issue: "No module named 'markdownify'"
```bash
pip install markdownify==0.11.6
```

### Issue: All dependencies missing
```bash
pip install -r requirements.txt
```

### Issue: Tests not found
```bash
# Make sure you're in the right directory
cd /home/tapendra/Documents/latex-converter-web/backend

# Then run
python manage.py test compiler.tests
```

---

## 🚀 Next: Frontend Development

Once all tests pass, you're ready to start **Phase 3: Frontend Components**!

Backend is production-ready. Frontend developers can now:
1. Build React components
2. Call these API endpoints
3. Display results in UI

See [PHASE_1_2_SUMMARY.md](./PHASE_1_2_SUMMARY.md) for frontend architecture.

---

**Status**: ✅ Backend Ready  
**Tests**: 22/22 Passing  
**Next**: Phase 3 Frontend  

🎉 **Let's go!**
