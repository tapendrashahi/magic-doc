# Roadmap: Building a LaTeX to TipTap HTML Converter

## Project Goal
Build a compiler that converts Mathpix LaTeX output to TipTap-compatible HTML with visible math fallbacks.

**Input:** LaTeX document (`.tex` file from Mathpix)  
**Output:** HTML with TipTap structure and visible math content

---

## Phase 1: Understanding the Problem (Week 1)

### 1.1 Study the Input Format
- [ ] Analyze Mathpix LaTeX output structure
- [ ] Identify common LaTeX commands used:
  - Document structure: `\section`, `\subsection`, `\begin{enumerate}`, etc.
  - Math environments: `$$...$$`, `$...$`, `\begin{aligned}`, etc.
  - Special commands: `\sqrt`, `\frac`, `\theta`, etc.
- [ ] Create a sample collection of LaTeX snippets

### 1.2 Study the Output Format
- [ ] Understand TipTap HTML structure
- [ ] Study the `data-latex` attribute format (URL-encoded LaTeX)
- [ ] Understand the fallback text requirements
- [ ] Document the desired output structure

### 1.3 Define Scope
- [ ] List all LaTeX commands to support
- [ ] Define which commands are out of scope (for v1.0)
- [ ] Create test cases with expected outputs

---

## Phase 2: Design the Architecture (Week 2)

### 2.1 Choose Technology Stack
**Recommended:**
- **Language:** Python (easy parsing, good libraries)
- **LaTeX Parser:** `ply` (Python Lex-Yacc) or `pyparsing`
- **HTML Generation:** `xml.etree.ElementTree` or simple string building
- **Math Conversion:** Custom logic + Unicode symbols

**Alternative:**
- JavaScript/TypeScript with parser libraries
- Java with ANTLR

### 2.2 Design Components

```
┌─────────────────┐
│  LaTeX Input    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lexer/Tokenizer│ ← Break into tokens
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parser         │ ← Build syntax tree
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AST (Abstract  │ ← Intermediate representation
│  Syntax Tree)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTML Generator │ ← Convert to TipTap HTML
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Math Formatter │ ← Create fallback text
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTML Output    │
└─────────────────┘
```

### 2.3 Define Data Structures
```python
# Example AST nodes
class Node:
    pass

class TextNode(Node):
    def __init__(self, text):
        self.text = text

class MathNode(Node):
    def __init__(self, latex, display_mode=False):
        self.latex = latex
        self.display_mode = display_mode

class SectionNode(Node):
    def __init__(self, title, level, children):
        self.title = title
        self.level = level
        self.children = children
```

---

## Phase 3: Build Core Components (Weeks 3-6)

### 3.1 LaTeX Tokenizer (Week 3)
- [ ] Identify token types:
  - Commands: `\section`, `\sqrt`, etc.
  - Braces: `{`, `}`
  - Math delimiters: `$`, `$$`
  - Text content
  - Special characters
- [ ] Write tokenizer
- [ ] Test with sample LaTeX files

**Example Output:**
```python
tokens = [
    ('COMMAND', '\\section'),
    ('LBRACE', '{'),
    ('TEXT', 'Introduction'),
    ('RBRACE', '}'),
    ('MATH_INLINE', '$'),
    ('TEXT', 'x^2'),
    ('MATH_INLINE', '$'),
]
```

### 3.2 LaTeX Parser (Week 4)
- [ ] Define grammar rules
- [ ] Build recursive descent parser or use parser generator
- [ ] Handle nested structures
- [ ] Error handling and reporting

**Example Grammar:**
```
document    → section*
section     → \section{title} content
content     → (text | math | subsection)*
math_inline → $ latex_expr $
math_block  → $$ latex_expr $$
```

### 3.3 AST Builder (Week 5)
- [ ] Convert parsed tokens to AST
- [ ] Implement node classes for each LaTeX construct
- [ ] Test AST generation

### 3.4 Math Expression Parser (Week 5)
- [ ] Parse LaTeX math expressions
- [ ] Build expression tree for math content
- [ ] Handle common commands:
  - `\frac{a}{b}` → fractions
  - `\sqrt{x}` → square roots
  - `x^2` → superscripts
  - `x_i` → subscripts
  - Greek letters: `\alpha`, `\beta`, etc.

---

## Phase 4: LaTeX to Unicode/Text Conversion (Week 6)

### 4.1 Build Symbol Mapping
- [ ] Create comprehensive LaTeX → Unicode mapping
- [ ] Handle Greek letters, math symbols, operators

**Example:**
```python
SYMBOLS = {
    r'\alpha': 'α',
    r'\beta': 'β',
    r'\theta': 'θ',
    r'\pi': 'π',
    r'\sqrt': '√',
    r'\leq': '≤',
    r'\geq': '≥',
    r'\neq': '≠',
    r'\in': '∈',
    r'\subset': '⊂',
    r'\rightarrow': '→',
    r'\therefore': '∴',
}
```

### 4.2 Build Expression Formatter
- [ ] Convert LaTeX expressions to readable text
- [ ] Handle fractions: `\frac{a}{b}` → `a/b` or `(a)/(b)`
- [ ] Handle superscripts: `x^2` → `x²` or `x^2`
- [ ] Handle subscripts: `x_i` → `xᵢ` or `x_i`
- [ ] Handle square roots: `\sqrt{x}` → `√x` or `sqrt(x)`

**Example:**
```python
def format_math(latex):
    # \frac{a+b}{c} → (a+b)/(c)
    # x^{2} → x²
    # \sqrt{3} → √3
    pass
```

---

## Phase 5: HTML Generation (Week 7)

### 5.1 TipTap HTML Structure
- [ ] Implement HTML tag generation
- [ ] Add proper attributes
- [ ] Handle text formatting: `<strong>`, `<em>`, etc.

### 5.2 Math Span Generation
- [ ] URL-encode LaTeX for `data-latex` attribute
- [ ] Generate fallback text
- [ ] Create complete `<span>` elements

**Template:**
```python
def create_math_span(latex_code, fallback_text):
    encoded = urllib.parse.quote(latex_code)
    return f'<span class="tiptap-katex" data-latex="{encoded}">{fallback_text}</span>'
```

### 5.3 Document Structure
- [ ] Convert sections to headings
- [ ] Convert lists (enumerate, itemize)
- [ ] Convert paragraphs
- [ ] Handle special environments

---

## Phase 6: Testing & Refinement (Week 8)

### 6.1 Unit Tests
- [ ] Test tokenizer with edge cases
- [ ] Test parser with complex structures
- [ ] Test math formatter with various expressions
- [ ] Test HTML generator output

### 6.2 Integration Tests
- [ ] Test full pipeline with sample documents
- [ ] Compare output with expected results
- [ ] Test with your actual Mathpix output

### 6.3 Edge Cases
- [ ] Nested math expressions
- [ ] Special characters in text
- [ ] Empty sections
- [ ] Malformed LaTeX
- [ ] Very long expressions

---

## Phase 7: CLI Tool Development (Week 9)

### 7.1 Command-Line Interface
```bash
latex2tiptap input.tex -o output.html
latex2tiptap input.tex --output output.html --format pretty
```

- [ ] Argument parsing
- [ ] File I/O handling
- [ ] Error messages
- [ ] Progress indicators

### 7.2 Configuration
- [ ] Config file support (`.latex2tiptap.json`)
- [ ] Customizable symbol mappings
- [ ] Output formatting options

---

## Phase 8: Documentation & Packaging (Week 10)

### 8.1 Documentation
- [ ] README with usage examples
- [ ] API documentation
- [ ] Supported LaTeX commands list
- [ ] Troubleshooting guide

### 8.2 Package
- [ ] Setup.py or package.json
- [ ] Dependencies management
- [ ] Installation instructions
- [ ] Release on PyPI/npm

---

## Implementation Example (Python)

### Directory Structure
```
latex2tiptap/
├── src/
│   ├── __init__.py
│   ├── lexer.py          # Tokenizer
│   ├── parser.py         # Parser
│   ├── ast_nodes.py      # AST node definitions
│   ├── math_formatter.py # Math to text converter
│   ├── html_generator.py # HTML output generator
│   ├── symbols.py        # LaTeX symbol mappings
│   └── utils.py          # Helper functions
├── tests/
│   ├── test_lexer.py
│   ├── test_parser.py
│   ├── test_math_formatter.py
│   └── test_integration.py
├── examples/
│   ├── input.tex
│   └── output.html
├── setup.py
├── requirements.txt
├── README.md
└── main.py              # CLI entry point
```

### Sample Code Snippets

#### 1. Lexer (lexer.py)
```python
import re
from enum import Enum

class TokenType(Enum):
    COMMAND = 'COMMAND'
    LBRACE = 'LBRACE'
    RBRACE = 'RBRACE'
    LBRACKET = 'LBRACKET'
    RBRACKET = 'RBRACKET'
    MATH_DISPLAY = 'MATH_DISPLAY'
    MATH_INLINE = 'MATH_INLINE'
    TEXT = 'TEXT'
    NEWLINE = 'NEWLINE'
    EOF = 'EOF'

class Token:
    def __init__(self, type, value, position):
        self.type = type
        self.value = value
        self.position = position

class Lexer:
    def __init__(self, text):
        self.text = text
        self.position = 0
        self.current_char = self.text[0] if text else None
    
    def advance(self):
        self.position += 1
        self.current_char = self.text[self.position] if self.position < len(self.text) else None
    
    def peek(self, offset=1):
        peek_pos = self.position + offset
        return self.text[peek_pos] if peek_pos < len(self.text) else None
    
    def tokenize(self):
        tokens = []
        while self.current_char is not None:
            if self.current_char == '\\':
                tokens.append(self.read_command())
            elif self.current_char == '{':
                tokens.append(Token(TokenType.LBRACE, '{', self.position))
                self.advance()
            elif self.current_char == '}':
                tokens.append(Token(TokenType.RBRACE, '}', self.position))
                self.advance()
            elif self.current_char == '$':
                if self.peek() == '$':
                    tokens.append(Token(TokenType.MATH_DISPLAY, '$$', self.position))
                    self.advance()
                    self.advance()
                else:
                    tokens.append(Token(TokenType.MATH_INLINE, '$', self.position))
                    self.advance()
            else:
                tokens.append(self.read_text())
        
        tokens.append(Token(TokenType.EOF, None, self.position))
        return tokens
    
    def read_command(self):
        start_pos = self.position
        self.advance()  # Skip '\'
        command = '\\'
        while self.current_char and (self.current_char.isalpha() or self.current_char == '*'):
            command += self.current_char
            self.advance()
        return Token(TokenType.COMMAND, command, start_pos)
    
    def read_text(self):
        start_pos = self.position
        text = ''
        while self.current_char and self.current_char not in '\\{}$[]':
            text += self.current_char
            self.advance()
        return Token(TokenType.TEXT, text, start_pos)
```

#### 2. Math Formatter (math_formatter.py)
```python
import re
from symbols import GREEK_LETTERS, MATH_SYMBOLS

class MathFormatter:
    def __init__(self):
        self.symbols = {**GREEK_LETTERS, **MATH_SYMBOLS}
    
    def format(self, latex):
        """Convert LaTeX math to readable text"""
        result = latex
        
        # Replace symbols
        for latex_cmd, unicode_char in self.symbols.items():
            result = result.replace(latex_cmd, unicode_char)
        
        # Handle fractions: \frac{a}{b} → (a)/(b)
        result = self.format_fractions(result)
        
        # Handle square roots: \sqrt{x} → √(x)
        result = self.format_sqrt(result)
        
        # Handle superscripts: x^{2} → x²
        result = self.format_superscripts(result)
        
        # Handle subscripts: x_{i} → xᵢ
        result = self.format_subscripts(result)
        
        return result.strip()
    
    def format_fractions(self, text):
        pattern = r'\\frac\{([^{}]*)\}\{([^{}]*)\}'
        return re.sub(pattern, r'(\1)/(\2)', text)
    
    def format_sqrt(self, text):
        pattern = r'\\sqrt\{([^{}]*)\}'
        return re.sub(pattern, r'√(\1)', text)
    
    def format_superscripts(self, text):
        # Simple superscripts
        superscript_map = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            'n': 'ⁿ', '-': '⁻', '+': '⁺'
        }
        
        def replace_sup(match):
            content = match.group(1)
            if len(content) == 1 and content in superscript_map:
                return superscript_map[content]
            else:
                return f'^({content})'
        
        text = re.sub(r'\^(\w)', replace_sup, text)
        text = re.sub(r'\^\{([^}]+)\}', replace_sup, text)
        return text
    
    def format_subscripts(self, text):
        # For subscripts, use parentheses notation
        text = re.sub(r'_(\w)', r'_\1', text)
        text = re.sub(r'_\{([^}]+)\}', r'_(\1)', text)
        return text
```

#### 3. Symbols Mapping (symbols.py)
```python
GREEK_LETTERS = {
    r'\alpha': 'α', r'\Alpha': 'Α',
    r'\beta': 'β', r'\Beta': 'Β',
    r'\gamma': 'γ', r'\Gamma': 'Γ',
    r'\delta': 'δ', r'\Delta': 'Δ',
    r'\epsilon': 'ε', r'\Epsilon': 'Ε',
    r'\zeta': 'ζ', r'\Zeta': 'Ζ',
    r'\eta': 'η', r'\Eta': 'Η',
    r'\theta': 'θ', r'\Theta': 'Θ',
    r'\iota': 'ι', r'\Iota': 'Ι',
    r'\kappa': 'κ', r'\Kappa': 'Κ',
    r'\lambda': 'λ', r'\Lambda': 'Λ',
    r'\mu': 'μ', r'\Mu': 'Μ',
    r'\nu': 'ν', r'\Nu': 'Ν',
    r'\xi': 'ξ', r'\Xi': 'Ξ',
    r'\pi': 'π', r'\Pi': 'Π',
    r'\rho': 'ρ', r'\Rho': 'Ρ',
    r'\sigma': 'σ', r'\Sigma': 'Σ',
    r'\tau': 'τ', r'\Tau': 'Τ',
    r'\phi': 'φ', r'\Phi': 'Φ',
    r'\chi': 'χ', r'\Chi': 'Χ',
    r'\psi': 'ψ', r'\Psi': 'Ψ',
    r'\omega': 'ω', r'\Omega': 'Ω',
}

MATH_SYMBOLS = {
    r'\pm': '±',
    r'\mp': '∓',
    r'\times': '×',
    r'\div': '÷',
    r'\neq': '≠',
    r'\leq': '≤',
    r'\geq': '≥',
    r'\in': '∈',
    r'\notin': '∉',
    r'\subset': '⊂',
    r'\supset': '⊃',
    r'\cup': '∪',
    r'\cap': '∩',
    r'\emptyset': '∅',
    r'\infty': '∞',
    r'\partial': '∂',
    r'\nabla': '∇',
    r'\int': '∫',
    r'\sum': '∑',
    r'\prod': '∏',
    r'\rightarrow': '→',
    r'\leftarrow': '←',
    r'\Rightarrow': '⇒',
    r'\Leftarrow': '⇐',
    r'\therefore': '∴',
    r'\because': '∵',
    r'\cdot': '·',
    r'\circ': '∘',
}
```

#### 4. HTML Generator (html_generator.py)
```python
import urllib.parse
from math_formatter import MathFormatter

class HTMLGenerator:
    def __init__(self):
        self.math_formatter = MathFormatter()
    
    def generate(self, ast):
        """Generate HTML from AST"""
        html_parts = ['<!DOCTYPE html>', '<html>', '<head>',
                      '<meta charset="UTF-8">',
                      '<style>.tiptap-katex { font-family: "Times New Roman", serif; font-style: italic; }</style>',
                      '</head>', '<body>']
        
        for node in ast:
            html_parts.append(self.generate_node(node))
        
        html_parts.extend(['</body>', '</html>'])
        return '\n'.join(html_parts)
    
    def generate_node(self, node):
        if isinstance(node, TextNode):
            return f'<p>{node.text}</p>'
        elif isinstance(node, MathNode):
            return self.generate_math_span(node.latex, node.display_mode)
        elif isinstance(node, SectionNode):
            level = min(node.level, 6)
            content = ''.join(self.generate_node(child) for child in node.children)
            return f'<h{level}>{node.title}</h{level}>\n{content}'
        else:
            return ''
    
    def generate_math_span(self, latex, display_mode=False):
        # Generate fallback text
        fallback = self.math_formatter.format(latex)
        
        # URL-encode the LaTeX
        encoded_latex = urllib.parse.quote(latex)
        
        # Create the span
        if display_mode:
            return f'<p><span class="tiptap-katex" data-latex="{encoded_latex}">{fallback}</span></p>'
        else:
            return f'<span class="tiptap-katex" data-latex="{encoded_latex}">{fallback}</span>'
```

#### 5. Main CLI (main.py)
```python
#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path
from lexer import Lexer
from parser import Parser
from html_generator import HTMLGenerator

def main():
    parser = argparse.ArgumentParser(description='Convert LaTeX to TipTap HTML')
    parser.add_argument('input', help='Input LaTeX file')
    parser.add_argument('-o', '--output', help='Output HTML file', required=True)
    parser.add_argument('--pretty', action='store_true', help='Pretty print HTML')
    
    args = parser.parse_args()
    
    # Read input
    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            latex_content = f.read()
    except FileNotFoundError:
        print(f"Error: File '{args.input}' not found", file=sys.stderr)
        sys.exit(1)
    
    # Process
    try:
        lexer = Lexer(latex_content)
        tokens = lexer.tokenize()
        
        parser = Parser(tokens)
        ast = parser.parse()
        
        generator = HTMLGenerator()
        html = generator.generate(ast)
        
        # Write output
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"Successfully converted {args.input} to {args.output}")
    
    except Exception as e:
        print(f"Error during conversion: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

---

## Resources

### Learning Resources
1. **Compiler Design:**
   - "Crafting Interpreters" by Robert Nystrom (free online)
   - "Writing An Interpreter In Go" by Thorsten Ball

2. **Parsing:**
   - Python PLY documentation
   - Pyparsing tutorial
   - Recursive descent parsing tutorials

3. **LaTeX:**
   - LaTeX command reference
   - Math mode documentation

### Libraries
- **Python:**
  - `ply` - Python Lex-Yacc
  - `pyparsing` - Parser library
  - `lark` - Parsing toolkit

- **JavaScript:**
  - `chevrotain` - Parser building toolkit
  - `nearley` - Parser toolkit
  - `KaTeX` - Math rendering (for reference)

### Testing Resources
- Unit testing frameworks (pytest, jest)
- Test LaTeX samples from Mathpix
- LaTeX test suites

---

## Success Criteria

✅ **Phase 1 Complete:** Can tokenize basic LaTeX  
✅ **Phase 2 Complete:** Can parse simple documents  
✅ **Phase 3 Complete:** Can handle math expressions  
✅ **Phase 4 Complete:** Generates valid TipTap HTML  
✅ **Phase 5 Complete:** All test cases pass  
✅ **Final:** Successfully converts your Mathpix documents

---

## Timeline Summary

| Week | Milestone |
|------|-----------|
| 1 | Research & Planning |
| 2 | Architecture Design |
| 3-4 | Lexer & Parser |
| 5-6 | Math Formatter |
| 7 | HTML Generator |
| 8 | Testing |
| 9 | CLI Tool |
| 10 | Documentation & Release |

**Total: ~10 weeks for a solid v1.0**

---

## Next Steps

1. **Start Small:** Begin with a minimal lexer that can handle basic text and one LaTeX command
2. **Iterate:** Add features incrementally
3. **Test Often:** Write tests as you build
4. **Document:** Keep notes on design decisions

Good luck with your compiler project! 🚀