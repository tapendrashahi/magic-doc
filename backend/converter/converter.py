"""
Converter module - Convert LaTeX to HTML
"""
import re
import time


def convert_latex_to_html(latex_text):
    """
    Convert LaTeX text to HTML with MathJax support
    
    Handles:
    - LaTeX sections (\section*{}) -> <h2>
    - Inline math ($...$) -> spans with MathJax
    - Display math ($$...$$) -> divs
    - Alignment environments (\begin{aligned}...\end{aligned})
    - Array environments (\begin{array}...\end{array})
    - Text formatting (\textbf{}, \textit{}, etc)
    - Markdown images ![](url)
    - Lists and more
    """
    if not latex_text or not latex_text.strip():
        return ""
    
    text = latex_text.strip()
    
    # PRESERVE MATH ENVIRONMENTS - extract them first to avoid breaking them
    math_blocks = []
    
    # Extract display math blocks ($$...$$)
    def extract_display_math(match):
        math_blocks.append(match.group(0))
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\$\$[\s\S]*?\$\$', extract_display_math, text)
    
    # Extract aligned environments
    def extract_aligned(match):
        content = match.group(1)
        # Replace & with alignment markers, \\ with line breaks
        content = content.replace('&', '&nbsp;&nbsp;&nbsp;')
        math_blocks.append(f'\\[\n{content}\n\\]')
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}', extract_aligned, text)
    
    # Extract array environments  
    def extract_array(match):
        content = match.group(1)
        math_blocks.append(f'\\[\n\\begin{{array}}{{{match.group(0).split("}")[0].split("{")[1]}}}\n{content}\n\\end{{array}}\n\\]')
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\\begin\{array\}\{([^}]+)\}([\s\S]*?)\\end\{array\}', extract_array, text)
    
    # Extract bmatrix environments
    def extract_bmatrix(match):
        content = match.group(1)
        math_blocks.append(f'\\[\n\\begin{{bmatrix}}\n{content}\n\\end{{bmatrix}}\n\\]')
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}', extract_bmatrix, text)
    
    # Convert sections
    text = re.sub(r'\\section\*\{([^}]+)\}', r'<h2>\1</h2>', text)
    text = re.sub(r'\\section\{([^}]+)\}', r'<h2>\1</h2>', text)
    text = re.sub(r'\\subsection\*\{([^}]+)\}', r'<h3>\1</h3>', text)
    text = re.sub(r'\\subsection\{([^}]+)\}', r'<h3>\1</h3>', text)
    text = re.sub(r'\\subsubsection\*\{([^}]+)\}', r'<h4>\1</h4>', text)
    text = re.sub(r'\\subsubsection\{([^}]+)\}', r'<h4>\1</h4>', text)
    
    # Convert inline math to MathJax format (single $)
    text = re.sub(r'\$([^$\n]+)\$', r'\\(\1\\)', text)
    
    # Convert text formatting
    text = re.sub(r'\\textbf\{([^}]+)\}', r'<strong>\1</strong>', text)
    text = re.sub(r'\\textit\{([^}]+)\}', r'<em>\1</em>', text)
    text = re.sub(r'\\emph\{([^}]+)\}', r'<em>\1</em>', text)
    text = re.sub(r'\\texttt\{([^}]+)\}', r'<code>\1</code>', text)
    text = re.sub(r'\\textunderscore\{\}', r'_', text)
    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    
    # Remove empty braces {}
    text = re.sub(r'\\left\{\}', r'', text)
    text = re.sub(r'\{\}', r'', text)
    
    # Handle markdown images ![](url)
    text = re.sub(r'!\[\]\(([^)]+)\)', r'<img src="\1" style="max-width:100%; margin:20px 0;" alt="image"/>', text)
    
    # Convert line breaks
    text = re.sub(r'\\\\\s*\n', r'<br/>', text)
    text = re.sub(r'\\\\', r'<br/>', text)
    
    # Remove leftover LaTeX commands that don't render
    text = re.sub(r'\\(left|right|big|Big|bigg|Bigg)\{', '{', text)
    text = re.sub(r'\\(left|right|big|Big|bigg|Bigg)\}', '}', text)
    
    # Paragraph handling - preserve multiple newlines for spacing
    text = re.sub(r'\n\n+', r'</p><p>', text)
    text = re.sub(r'\n', r' ', text)
    
    # Wrap in paragraphs
    if text and not text.startswith('<p>') and not text.startswith('<h'):
        text = f'<p>{text}</p>'
    
    # Clean up empty paragraphs
    text = text.replace('</p><p></p><p>', '</p><p>')
    text = re.sub(r'<p>\s*</p>', '', text)
    
    # RESTORE MATH BLOCKS
    for i, block in enumerate(math_blocks):
        text = text.replace(f'__MATH_BLOCK_{i}__', block)
    
    return text
