# QUICK REFERENCE: Implementation Plan for Your Project

## 🎯 What You Need to Build

**Goal:** Convert Mathpix LaTeX → KaTeX HTML Fragment for LMS code view

**Input:** `mathpix_output.txt` (with $ and $$ delimiters)  
**Output:** HTML fragment ready to paste into LMS (NO <!DOCTYPE>, no <html>, no <head>, no <body>)

---

## 📊 Comparison: Your Options

### ❌ What You Tried (Wrong):
1. **Plain HTML approach** - Removed all equations, lost math content
2. **Standalone HTML documents** - Has DOCTYPE/html/head/body tags, can't paste into LMS

### ✅ What You Need (Right):
**KaTeX HTML Fragment** - Content only, ready to paste

---

## 🏗️ Implementation Phases

### Phase 1: Understand Your LMS (COMPLETE ✓)
- Your LMS has **code view** that shows KaTeX HTML
- Already expects `<span class="__se__katex katex">` format
- Needs HTML fragments, NOT full documents
- Already has KaTeX CSS loaded

### Phase 2: Extract LaTeX Equations
**From:** `mathpix_output.txt`  
**Extract:**
```
$...$        → inline equations
$$...$$      → display equations
\section*{}  → headings
```

**Python code:**
```python
# Find display math
import re
display_pattern = r'\$\$([\s\S]*?)\$\$'
for match in re.finditer(display_pattern, text):
    equation = match.group(1)  # The LaTeX
```

### Phase 3: Render KaTeX HTML
**From:** Raw LaTeX string  
**To:** KaTeX HTML with `<span class="katex-mathml">` and `<span class="katex-html">`

**Node.js (10 lines):**
```javascript
const katex = require('katex');
const html = katex.renderToString(latex, {
    displayMode: true,  // or false for inline
    throwOnError: false
});
```

### Phase 4: Wrap for LMS
**From:** KaTeX HTML  
**To:** LMS-formatted span

```html
<span class="__se__katex katex" 
      contenteditable="false" 
      data-exp="ORIGINAL_LATEX" 
      data-font-size="1em" 
      style="font-size: 16px">
    KATEX_HTML_HERE
</span>
```

### Phase 5: Assemble Fragment
**Reconstruct:** Original text + equations + sections  
**Output:** Pure HTML fragment (no wrapper tags)

---

## 📁 Files to Create/Modify

### Backend Files

**NEW:** `backend/converter/latex_extractor.py` (200 lines)
- Extract equations
- Extract sections
- Normalize LaTeX

**NEW:** `backend/converter/katex_renderer.py` (100 lines)
- Render KaTeX via Node.js subprocess

**NEW:** `backend/converter/html_assembler.py` (200 lines)
- Assemble fragments
- Format text
- Wrap equations

**NEW:** `backend/assets/render_katex.js` (30 lines)
- Node.js script to render KaTeX
- Called by Python via subprocess

**MODIFY:** `backend/converter/converter.py`
- Add `convert_mathpix_to_lms_html()` function
- Remove full HTML document wrapping
- Use new modules

**MODIFY:** `backend/api/views.py`
- Add `/api/convert/` endpoint
- Accept `mathpix_text` in POST
- Return HTML fragment

### Frontend Files

**MODIFY:** `frontend/src/components/Converter.tsx`
- Update API call
- Show HTML fragment preview
- Add copy-to-clipboard

---

## 🔧 Step-by-Step Implementation

### Step 1: Setup Node.js KaTeX
```bash
cd backend/assets
npm init -y
npm install katex
```

### Step 2: Create Backend Modules
1. `latex_extractor.py` - Extract equations/sections
2. `katex_renderer.py` - Render to HTML
3. `html_assembler.py` - Assemble fragments
4. `render_katex.js` - Node.js helper

### Step 3: Update Converter
```python
def convert_mathpix_to_lms_html(mathpix_text):
    # Extract equations and sections
    equations = LatexExtractor.extract_equations(mathpix_text)
    sections = LatexExtractor.extract_sections(mathpix_text)
    
    # Render KaTeX
    equations = KaTeXRenderer.render_batch(equations)
    
    # Assemble fragment
    html_fragment = HTMLAssembler.assemble_fragment(
        mathpix_text, equations, sections
    )
    
    return html_fragment
```

### Step 4: Add API Endpoint
```python
@api_view(['POST'])
def convert_mathpix(request):
    mathpix_text = request.data.get('mathpix_text')
    html_fragment = convert_mathpix_to_lms_html(mathpix_text)
    return Response({'html_fragment': html_fragment})
```

### Step 5: Update Frontend UI
- Call `/api/convert/`
- Display HTML fragment
- Add copy button

---

## 📊 Output Format Reference

### Input Example (mathpix_output.txt):
```
1. Binomial example: $(x+2)$

\section*{2. Theorem}

The formula is:
$$
(a+x)^n = \sum_{r=0}^{n} C(n,r) a^{n-r} x^r
$$
```

### Output Example (HTML Fragment):
```html
<div>1. Binomial example: <span class="__se__katex katex" contenteditable="false" data-exp="(x+2)" data-font-size="1em" style="font-size: 16px"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><semantics><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mn>2</mn><mo>)</mo></mrow><annotation encoding="application/x-tex">(x+2)</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">2</span><span class="mclose">)</span></span></span></span></div>

<h2>2. Theorem</h2>

<div>The formula is:</div>

<div><span class="__se__katex katex" contenteditable="false" data-exp="(a+x)^n = \sum_{r=0}^{n} C(n,r) a^{n-r} x^r" data-font-size="1em" style="font-size: 16px"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block">...</math></span><span class="katex-html" aria-hidden="true">...</span></span></div>
```

---

## ✅ Success Criteria

Your implementation is complete when:

- [ ] `convert_mathpix_to_lms_html()` works end-to-end
- [ ] Output has NO `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`
- [ ] All equations wrapped with `__se__katex` class
- [ ] `data-exp` contains original LaTeX
- [ ] Sections converted to `<h2>`, `<h3>`
- [ ] HTML can be pasted directly into LMS code view
- [ ] Equations render correctly in LMS
- [ ] No syntax errors in HTML output
- [ ] API endpoint returns properly formatted fragment

---

## 🚀 Quick Start Command Sequence

```bash
# 1. Create backend modules
touch backend/converter/latex_extractor.py
touch backend/converter/katex_renderer.py
touch backend/converter/html_assembler.py
mkdir -p backend/assets
touch backend/assets/render_katex.js

# 2. Setup Node.js KaTeX
cd backend/assets
npm init -y
npm install katex
cd ../..

# 3. Add dependencies to Python
pip install beautifulsoup4 regex

# 4. Test extraction
python manage.py shell
# Test LatexExtractor

# 5. Test rendering
node backend/assets/render_katex.js
# Pipe: {"latex": "x^2", "displayMode": false}

# 6. Test conversion
python manage.py shell
# from backend.converter import convert_mathpix_to_lms_html
# result = convert_mathpix_to_lms_html(open('mathpix_output.txt').read())

# 7. Test API
curl -X POST http://localhost:8000/api/convert/ \
  -H "Content-Type: application/json" \
  -d '{"mathpix_text": "$(x+2)$"}'
```

---

## 📋 Validation Checklist Before Going Live

```
EXTRACTION:
 [ ] All $...$ found correctly
 [ ] All $$...$$ found correctly
 [ ] Overlaps handled (no double processing)
 [ ] Positions accurate for reconstruction

RENDERING:
 [ ] KaTeX produces valid HTML
 [ ] No errors for complex equations
 [ ] Error handling for malformed LaTeX

ASSEMBLY:
 [ ] Text reconstructed in correct order
 [ ] No text missing between equations
 [ ] Sections properly converted
 [ ] Spacing preserved

OUTPUT:
 [ ] No DOCTYPE/html/head/body tags
 [ ] Valid HTML structure
 [ ] All required attributes present
 [ ] UTF-8 encoding correct

LMS COMPATIBILITY:
 [ ] Paste test in LMS works
 [ ] Equations render
 [ ] Layout looks correct
 [ ] No encoding issues

PERFORMANCE:
 [ ] Processes mathpix_output.txt < 5 seconds
 [ ] Memory usage reasonable
 [ ] Works with large files (>1000 equations)
```

---

## 📞 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing equations in output | Not all $$ found | Check regex patterns |
| KaTeX errors | Malformed LaTeX | Use `throwOnError: false` |
| Extra HTML tags in output | Document wrapper not removed | Check converter.py |
| data-exp missing | Not storing original LaTeX | Add to EquationObject |
| Inline equations on new line | Wrong displayMode | Use `displayMode: false` |
| Can't paste in LMS | Invalid HTML | Validate with html.parser |

---

## 📚 Documentation Files Created

1. **LMS_ARCHITECTURE_ANALYSIS.md** - Your LMS requirements analysis
2. **IMPLEMENTATION_SPECIFICATION.md** - Complete technical spec
3. **QUICK_REFERENCE.md** - This file

---

*Now you have a clear path forward. The specification is complete and implementation-ready.*
