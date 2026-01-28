# Detailed Implementation Specification for LMS-Ready KaTeX HTML Converter

## 📋 Executive Summary

Your LMS has an HTML/KaTeX code view that expects specific KaTeX HTML format. The current output includes full HTML document structure, but you need HTML fragments that can be pasted directly into the LMS editor.

**Target Output Format:** KaTeX HTML Fragment (no DOCTYPE, html, head, body tags)

---

## 🔍 Output Format Specification

### ✅ CORRECT Format (What Your LMS Expects):

```html
<!-- NO DOCTYPE, html, head, body tags -->

<h2>2. Binomial Theorem:</h2>

<div> </div>

<div>The binomial theorem for natural numbers states that:</div>

<div>
  <span class="__se__katex katex" 
        contenteditable="false" 
        data-exp="(a+x)^{n}={ }^{n} C_{0} a^{n} x^{0}+{ }^{n} C_{1} a^{n-1} x" 
        data-font-size="1em" 
        style="font-size: 16px">
    <span class="katex-mathml">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <!-- KaTeX MathML output -->
      </math>
    </span>
    <span class="katex-html" aria-hidden="true">
      <!-- KaTeX HTML rendering -->
    </span>
  </span>
</div>

<div> </div>

<div>Note: Total number of terms...</div>
```

### ❌ WRONG Format (Currently Generated):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Content</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/...katex.min.css">
</head>
<body>
  <!-- Content here -->
</body>
</html>
```

---

## 🏗️ Conversion Pipeline Specification

### Input: mathpix_output.txt

```
1. A binomial is an algebraic expression of two terms...e.g. $(x+2)$

\section*{2. Binomial Theorem:}

The binomial theorem for natural numbers states that...
$$
\begin{aligned}
& (a+x)^{n}={ }^{n} C_{0} a^{n-1} x^{0}+{ }^{n} C_{1} a^{n-1} x+{ }^{n} C_{2} a^{n-2} x^{2}+\cdots
\end{aligned}
$$

\section*{Note:}
(i) Total number of terms after binomial expansion of $(a+x)^{n}$ is $(n+1)$
```

### Processing Steps:

#### Step 1: Extract LaTeX Equations
**Extract all math expressions** while tracking original positions

```python
Find all patterns:
- Display: $$...$$
- Inline: $...$
- Alignment: \begin{aligned}...\end{aligned}
- Environments: \begin{*}...\end{*}

Store:
{
  'type': 'display' | 'inline',
  'latex': 'original LaTeX string',
  'start_pos': int,
  'end_pos': int,
  'original_text': '$$...$$ or $...$'
}
```

#### Step 2: Convert LaTeX to KaTeX HTML
**For each equation, render KaTeX HTML**

```javascript
// Using Node.js KaTeX library
const katex = require('katex');

function renderEquation(latex, isDisplay = false) {
  return katex.renderToString(latex, {
    displayMode: isDisplay,
    throwOnError: false,
    output: 'html',
    trust: false,
    strict: 'warn'
  });
}
```

#### Step 3: Wrap in LMS Format
**Wrap KaTeX output with LMS-specific attributes**

```python
def wrap_katex_for_lms(latex, katex_html):
  return f'''<span class="__se__katex katex" 
        contenteditable="false" 
        data-exp="{escape_html(latex)}" 
        data-font-size="1em" 
        style="font-size: 16px">
    {katex_html}
</span>'''
```

#### Step 4: Assemble Document
**Reconstruct document using position-based insertion**

```python
def assemble_content(original_text, equations_list):
  """
  equations_list: sorted by start_pos
  
  Process:
  1. Iterate through equations by position
  2. Add text before each equation
  3. Insert wrapped KaTeX HTML
  4. Continue after equation end
  5. Convert sections to headings
  6. Format paragraphs
  7. Return fragment only
  """
```

#### Step 5: Format Sections & Paragraphs
**Convert LaTeX formatting to HTML**

```python
# Sections
\section*{Title} -> <h2>Title</h2>
\subsection*{Title} -> <h3>Title</h3>

# Paragraphs
Text\nText -> <div>Text</div><div>Text</div>
Double newline -> <div> </div> (spacer)

# Text formatting
\textbf{} -> <strong>
\textit{} -> <em>
\underline{} -> <u>
```

---

## 💾 Implementation Architecture

### File Structure Your Project Should Have:

```
backend/
├── converter/
│   ├── converter.py           ← Main orchestrator
│   ├── latex_extractor.py     ← NEW: Extract equations
│   ├── katex_renderer.py      ← NEW: Render KaTeX
│   ├── html_assembler.py      ← NEW: Assemble fragments
│   └── unicode_converter.py   ← Existing
├── api/
│   ├── views.py               ← API endpoints
│   └── serializers.py
└── requirements.txt           ← Add: katex, beautifulsoup4

frontend/
├── src/
│   ├── components/
│   │   └── Converter.tsx      ← UI for conversion
│   └── services/
│       └── converterService.ts ← API calls
```

### Core Modules Needed:

#### 1. LaTeX Extractor Module (`latex_extractor.py`)
```python
class LatexExtractor:
    def extract_equations(text):
        """Extract all $$ and $ patterns with metadata"""
        # Returns: List[EquationObject]
        
    def extract_sections(text):
        """Extract \section, \subsection"""
        # Returns: List[SectionObject]
        
    def normalize_latex(latex_str):
        """Clean up Mathpix artifacts"""
        # Remove \b, \begin{aligned}, etc.
```

#### 2. KaTeX Renderer Module (`katex_renderer.py`)
```python
class KaTeXRenderer:
    def render_single(latex, display_mode):
        """Render one equation via Node.js KaTeX"""
        # Calls: subprocess.run(['node', 'render.js', ...])
        # Returns: KaTeX HTML
        
    def render_batch(equations):
        """Render multiple equations efficiently"""
```

#### 3. HTML Assembler Module (`html_assembler.py`)
```python
class HTMLAssembler:
    def assemble_fragment(text, equations, sections):
        """Build HTML fragment (no document wrapper)"""
        # Returns: HTML string ready for LMS
        
    def format_content(text):
        """Convert text formatting to HTML"""
        
    def validate_html(html):
        """Ensure valid HTML structure"""
```

#### 4. Main Converter (Refactored `converter.py`)
```python
def convert_mathpix_to_lms_html(mathpix_text):
    """
    Pipeline:
    1. Extract equations & sections
    2. Normalize LaTeX
    3. Render KaTeX HTML
    4. Assemble fragments
    5. Return clean HTML fragment
    """
    
    # Step 1
    equations = LatexExtractor.extract_equations(mathpix_text)
    sections = LatexExtractor.extract_sections(mathpix_text)
    
    # Step 2
    equations = [normalize_latex(eq) for eq in equations]
    
    # Step 3
    equations = [render_katex(eq) for eq in equations]
    
    # Step 4
    html_fragment = HTMLAssembler.assemble_fragment(
        mathpix_text, equations, sections
    )
    
    # Step 5
    return html_fragment
```

---

## 🔧 Detailed Implementation Guide

### Module 1: LaTeX Extractor

**File:** `backend/converter/latex_extractor.py`

```python
import re
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Equation:
    """Represents a LaTeX equation"""
    type: str  # 'display' or 'inline'
    latex: str
    start_pos: int
    end_pos: int
    original_text: str
    
@dataclass
class Section:
    """Represents a section heading"""
    level: int  # 1=\section, 2=\subsection, etc.
    title: str
    start_pos: int
    end_pos: int

class LatexExtractor:
    # Display math: $$ ... $$
    DISPLAY_PATTERN = r'\$\$([\s\S]*?)\$\$'
    
    # Inline math: $...$  (but not $$)
    INLINE_PATTERN = r'(?<!\$)\$([^\$]+)\$(?!\$)'
    
    # Sections: \section*{Title}
    SECTION_PATTERN = r'\\(sub)*section\*?\{([^}]+)\}'
    
    @classmethod
    def extract_equations(cls, text: str) -> List[Equation]:
        """Extract all equations with positions"""
        equations = []
        
        # Find display math (handle these first)
        for match in re.finditer(cls.DISPLAY_PATTERN, text):
            equations.append(Equation(
                type='display',
                latex=match.group(1).strip(),
                start_pos=match.start(),
                end_pos=match.end(),
                original_text=match.group(0)
            ))
        
        # Find inline math
        for match in re.finditer(cls.INLINE_PATTERN, text):
            # Check this isn't part of a display equation already found
            is_display = any(
                eq.start_pos <= match.start() <= eq.end_pos 
                for eq in equations
            )
            if not is_display:
                equations.append(Equation(
                    type='inline',
                    latex=match.group(1).strip(),
                    start_pos=match.start(),
                    end_pos=match.end(),
                    original_text=match.group(0)
                ))
        
        # Sort by position
        return sorted(equations, key=lambda e: e.start_pos)
    
    @classmethod
    def extract_sections(cls, text: str) -> List[Section]:
        """Extract section headings"""
        sections = []
        
        for match in re.finditer(cls.SECTION_PATTERN, text):
            is_subsection = match.group(1) is not None
            level = 2 if is_subsection else 1
            
            sections.append(Section(
                level=level,
                title=match.group(2),
                start_pos=match.start(),
                end_pos=match.end()
            ))
        
        return sorted(sections, key=lambda s: s.start_pos)
    
    @classmethod
    def normalize_latex(cls, latex: str) -> str:
        """Clean up Mathpix artifacts"""
        # Remove \b (Mathpix artifact)
        latex = latex.replace(r'\b', '')
        
        # Handle aligned blocks
        if r'\begin{aligned}' in latex:
            latex = re.sub(
                r'\\begin\{aligned\}(.*?)\\end\{aligned\}',
                r'\1',
                latex,
                flags=re.DOTALL
            )
        
        # Remove line break markers \\
        latex = latex.replace(r'\\', ' ')
        
        # Remove alignment markers &
        latex = latex.replace('&', '')
        
        # Trim whitespace
        return latex.strip()
```

### Module 2: KaTeX Renderer

**File:** `backend/converter/katex_renderer.py`

```python
import subprocess
import json
import os
from typing import Optional

class KaTeXRenderer:
    # Path to Node.js script
    RENDERER_SCRIPT = os.path.join(
        os.path.dirname(__file__),
        '..', 'assets', 'render_katex.js'
    )
    
    @classmethod
    def render_single(
        cls, 
        latex: str, 
        display_mode: bool = False
    ) -> Optional[str]:
        """
        Render a single LaTeX equation to KaTeX HTML
        
        Returns: KaTeX HTML string or None on error
        """
        try:
            # Call Node.js script
            result = subprocess.run(
                ['node', cls.RENDERER_SCRIPT],
                input=json.dumps({
                    'latex': latex,
                    'displayMode': display_mode
                }),
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                print(f"KaTeX Error: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"Rendering failed: {e}")
            return None
    
    @classmethod
    def render_batch(cls, equations):
        """Render multiple equations"""
        for eq in equations:
            katex_html = cls.render_single(
                eq.latex,
                display_mode=(eq.type == 'display')
            )
            eq.katex_html = katex_html
        return equations
```

**Node.js Helper Script:** `backend/assets/render_katex.js`

```javascript
const katex = require('katex');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    try {
        const data = JSON.parse(line);
        const { latex, displayMode } = data;
        
        const html = katex.renderToString(latex, {
            displayMode: displayMode || false,
            throwOnError: false,
            output: 'html',
            trust: false,
            strict: 'warn'
        });
        
        console.log(html);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    
    process.exit(0);
});
```

### Module 3: HTML Assembler

**File:** `backend/converter/html_assembler.py`

```python
import html
import re

class HTMLAssembler:
    @classmethod
    def assemble_fragment(cls, text: str, equations, sections) -> str:
        """
        Assemble HTML fragment from text, equations, and sections
        
        NO DOCTYPE, html, head, body tags
        """
        result = []
        last_pos = 0
        
        # Sort both equations and sections by position
        all_items = sorted(
            [(e.start_pos, 'equation', e) for e in equations] +
            [(s.start_pos, 'section', s) for s in sections],
            key=lambda x: x[0]
        )
        
        for pos, item_type, item in all_items:
            # Add text before this item
            text_before = text[last_pos:pos]
            if text_before.strip():
                # Format as divs/paragraphs
                formatted = cls.format_text(text_before)
                result.append(formatted)
            
            if item_type == 'equation':
                # Add equation
                eq_html = cls.wrap_equation(item)
                result.append(eq_html)
                last_pos = item.end_pos
                
            elif item_type == 'section':
                # Add section heading
                heading_html = cls.format_section(item)
                result.append(heading_html)
                last_pos = item.end_pos
        
        # Add remaining text
        remaining = text[last_pos:]
        if remaining.strip():
            result.append(cls.format_text(remaining))
        
        # Join and clean up
        html_fragment = '\n\n'.join(result)
        return html_fragment
    
    @classmethod
    def wrap_equation(cls, equation) -> str:
        """Wrap equation in LMS-compatible format"""
        if not equation.katex_html:
            return ""
        
        latex_escaped = html.escape(equation.latex)
        
        # Add wrapper div
        if equation.type == 'display':
            return f'''<div>
  <span class="__se__katex katex" 
        contenteditable="false" 
        data-exp="{latex_escaped}" 
        data-font-size="1em" 
        style="font-size: 16px">
    {equation.katex_html}
  </span>
</div>'''
        else:  # inline
            return f'''<span class="__se__katex katex" 
      contenteditable="false" 
      data-exp="{latex_escaped}" 
      data-font-size="1em" 
      style="font-size: 16px">
  {equation.katex_html}
</span>'''
    
    @classmethod
    def format_section(cls, section) -> str:
        """Format section heading"""
        heading_level = 1 + section.level  # Level 1->h2, Level 2->h3
        return f'<h{heading_level}>{html.escape(section.title)}</h{heading_level}>'
    
    @classmethod
    def format_text(cls, text: str) -> str:
        """Format plain text into HTML divs"""
        # Split by multiple newlines for paragraphs
        paragraphs = re.split(r'\n\n+', text.strip())
        
        result = []
        for para in paragraphs:
            para = para.strip()
            if para:
                # Handle formatting
                para = cls.apply_text_formatting(para)
                result.append(f'<div>{para}</div>')
        
        return '\n\n'.join(result)
    
    @classmethod
    def apply_text_formatting(cls, text: str) -> str:
        """Apply text formatting (bold, italic, etc.)"""
        # \textbf{} -> <strong>
        text = re.sub(r'\\textbf\{([^}]+)\}', r'<strong>\1</strong>', text)
        
        # \textit{} -> <em>
        text = re.sub(r'\\textit\{([^}]+)\}', r'<em>\1</em>', text)
        
        # \text{} -> remove command
        text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
        
        # Remove any remaining LaTeX commands
        text = re.sub(r'\\[a-zA-Z]+\{([^}]+)\}', r'\1', text)
        
        return text
```

---

## 🔌 API Integration

### API Endpoint (`backend/api/views.py`)

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from backend.converter.converter import convert_mathpix_to_lms_html

@api_view(['POST'])
def convert_mathpix(request):
    """
    Convert Mathpix LaTeX to LMS-ready KaTeX HTML
    
    Input:
    {
        "mathpix_text": "Full Mathpix output text...",
        "output_format": "html_fragment"  # or "lms_fragment"
    }
    
    Output:
    {
        "success": true,
        "html_fragment": "HTML ready for LMS paste",
        "stats": {
            "equations_found": 42,
            "sections_found": 5,
            "processing_time": 2.34
        }
    }
    """
    try:
        mathpix_text = request.data.get('mathpix_text', '')
        
        # Convert
        html_fragment = convert_mathpix_to_lms_html(mathpix_text)
        
        return Response({
            'success': True,
            'html_fragment': html_fragment,
            'stats': {
                'characters': len(html_fragment),
                'equations_found': mathpix_text.count('$'),
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=400)
```

---

## 📝 Dependencies to Add

### `requirements.txt`

```
Django>=4.0
djangorestframework
beautifulsoup4>=4.10
regex>=2022.0
```

### `package.json` (Backend Node.js)

```json
{
  "dependencies": {
    "katex": "^0.16.9"
  }
}
```

---

## ✅ Testing Checklist

### Unit Tests
- [ ] Equation extraction finds all $$ and $ patterns
- [ ] Equation normalization removes Mathpix artifacts
- [ ] KaTeX rendering produces valid HTML
- [ ] HTML assembly preserves text order
- [ ] Section extraction and formatting works

### Integration Tests
- [ ] End-to-end: mathpix_output.txt → HTML fragment
- [ ] No DOCTYPE, html, head, body tags in output
- [ ] All equations wrapped with `__se__katex` class
- [ ] data-exp attribute contains original LaTeX
- [ ] HTML valid and well-formed

### LMS Compatibility Tests
- [ ] Copy-paste directly into LMS code view
- [ ] Equations render correctly
- [ ] Inline equations display inline
- [ ] Display equations on own line
- [ ] No layout issues

---

## 🚀 Expected Output Example

### Input (mathpix_output.txt excerpt):
```
1. A binomial is an algebraic expression of two terms which are connected by the operations ' + ' or ' - '. e.g. $(x+2)$

\section*{2. Binomial Theorem:}

The binomial theorem for natural numbers states that -
$$
(a+x)^{n}={ }^{n} C_{0} a^{n} x^{0}+{ }^{n} C_{1} a^{n-1} x^{1}
$$
```

### Output (HTML Fragment - Ready for LMS):
```html
<div>1. A binomial is an algebraic expression of two terms which are connected by the operations ' + ' or ' - '. e.g. <span class="__se__katex katex" contenteditable="false" data-exp="(x+2)" data-font-size="1em" style="font-size: 16px"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">...</math></span><span class="katex-html" aria-hidden="true">...</span></span></div>

<h2>2. Binomial Theorem:</h2>

<div>The binomial theorem for natural numbers states that -</div>

<div>
  <span class="__se__katex katex" contenteditable="false" data-exp="(a+x)^{n}={ }^{n} C_{0} a^{n} x^{0}+{ }^{n} C_{1} a^{n-1} x^{1}" data-font-size="1em" style="font-size: 16px">
    <span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block">...</math></span>
    <span class="katex-html" aria-hidden="true">...</span>
  </span>
</div>
```

---

*This specification provides everything needed to implement the LMS-ready converter.*
