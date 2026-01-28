r"""
Converter module - Convert LaTeX to HTML
Supports multiple modes:
- 'lms_fragment': New LMS-compatible KaTeX HTML fragments (Phase 5+)
- 'katex': Preserve KaTeX-compatible delimiters (legacy)
- 'plain_html': Convert to plain HTML with Unicode symbols (legacy)
"""
import re
import time
import logging
from .unicode_converter import convert_latex_to_plain_html as unicode_convert
from .latex_extractor import LatexExtractor
from .katex_renderer import KaTeXRenderer
from .html_assembler import HTMLAssembler

logger = logging.getLogger(__name__)


# ============================================================================
# PHASE 5: NEW ORCHESTRATOR - Convert Mathpix to LMS-compatible HTML fragment
# ============================================================================

def convert_mathpix_to_lms_html(mathpix_text):
    r"""
    Convert Mathpix LaTeX output to LMS-compatible HTML fragment.
    
    This is the main orchestrator that combines:
    1. LaTeX Extraction (Phase 2) - Find equations and sections
    2. KaTeX Rendering (Phase 3) - Render to HTML via Node.js
    3. HTML Assembly (Phase 4) - Wrap with LMS attributes and assemble
    
    Args:
        mathpix_text: Raw Mathpix LaTeX output text
        
    Returns:
        LMS-compatible HTML fragment (no DOCTYPE, html, head, body tags)
        
    Raises:
        Exception: If any pipeline stage fails
    """
    logger.info("Starting Mathpix to LMS conversion")
    
    if not mathpix_text or not mathpix_text.strip():
        logger.warning("Empty input text")
        return ""
    
    try:
        # ===== PHASE 2: EXTRACTION =====
        logger.info("Phase 2: Extracting equations and sections...")
        extractor = LatexExtractor()
        equations, sections = extractor.extract_all(mathpix_text)
        logger.info(f"  Extracted {len(equations)} equations, {len(sections)} sections")
        
        # ===== PHASE 3: RENDERING =====
        logger.info("Phase 3: Rendering equations to KaTeX...")
        renderer = KaTeXRenderer()
        results = renderer.render_batch(equations, stop_on_error=False)
        
        # Count successes
        success_count = sum(1 for r in results if r.success)
        failed_count = len(results) - success_count
        logger.info(f"  Rendered {success_count}/{len(equations)} equations successfully")
        
        if failed_count > 0:
            logger.warning(f"  {failed_count} equations failed to render, using empty fallback")
        
        # ===== PHASE 4: ASSEMBLY =====
        logger.info("Phase 4: Assembling HTML fragment...")
        assembler = HTMLAssembler()
        html_fragment = assembler.assemble_fragment(mathpix_text, equations, sections)
        logger.info(f"  Assembled HTML fragment ({len(html_fragment)} chars)")
        
        # ===== VALIDATION =====
        is_valid, error_msg = assembler.validate_html(html_fragment)
        if not is_valid:
            logger.error(f"HTML validation failed: {error_msg}")
            raise ValueError(f"HTML validation failed: {error_msg}")
        
        logger.info("✓ Conversion complete - HTML fragment ready for LMS")
        return html_fragment
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}", exc_info=True)
        raise


def convert_mathpix_to_lms_html_with_stats(mathpix_text):
    r"""
    Convert Mathpix to LMS HTML and return with detailed statistics.
    
    Args:
        mathpix_text: Raw Mathpix LaTeX output text
        
    Returns:
        Dictionary with:
            - 'html_fragment': The LMS HTML fragment
            - 'stats': Dictionary of statistics
    """
    logger.info("Starting conversion with statistics...")
    
    try:
        # Extract
        extractor = LatexExtractor()
        equations, sections = extractor.extract_all(mathpix_text)
        
        # Render
        renderer = KaTeXRenderer()
        renderer.render_batch(equations)
        
        # Assemble
        assembler = HTMLAssembler()
        html_fragment = assembler.assemble_fragment(mathpix_text, equations, sections)
        
        # Get statistics
        stats = assembler.get_statistics(mathpix_text, equations, sections, html_fragment)
        
        logger.info(f"Conversion complete: {stats['total_equations']} equations, {stats['total_sections']} sections")
        
        return {
            'html_fragment': html_fragment,
            'stats': stats,
            'success': True
        }
        
    except Exception as e:
        logger.error(f"Conversion with stats failed: {str(e)}", exc_info=True)
        return {
            'html_fragment': '',
            'stats': {},
            'success': False,
            'error': str(e)
        }



def convert_latex_to_html(latex_text, mode='katex'):
    r"""
    Convert LaTeX text to HTML with multiple output modes
    
    Modes:
    - 'lms_fragment': New LMS-compatible KaTeX HTML fragments
    - 'katex': Preserve KaTeX-compatible delimiters (legacy)
    - 'plain_html': Convert to plain HTML with Unicode symbols (legacy)
    
    Handles:
    - LaTeX sections (\section*{}) -> <h2>
    - Inline math ($...$) -> preserved for KaTeX
    - Display math ($$...$$) -> preserved for KaTeX
    - Alignment environments (\begin{aligned}...\end{aligned}) -> $$...$$
    - Array environments (\begin{array}...\end{array}) -> $$...$$
    - Matrix environments (\begin{bmatrix}...\end{bmatrix}) -> $$...$$
    - Text formatting (\textbf{}, \textit{}, etc)
    - Markdown images ![](url)
    - All content wrapped in HTML tags for display
    
    Output is KaTeX-ready with proper delimiters or LMS-compatible HTML fragment
    """
    if not latex_text or not latex_text.strip():
        return ""
    
    # For new LMS fragment mode, use the Phase 5 orchestrator
    if mode == 'lms_fragment':
        return convert_mathpix_to_lms_html(latex_text)
    
    # For plain HTML mode, use the Unicode converter
    if mode == 'plain_html':
        return _convert_to_plain_html(latex_text)
    
    # Otherwise use KaTeX mode (default)
    return _convert_to_katex_html(latex_text)


def _convert_to_plain_html(latex_text):
    """
    Convert LaTeX to plain HTML for LMS systems.
    Aggressively removes ALL LaTeX formatting, math delimiters, and commands.
    """
    if not latex_text or not latex_text.strip():
        return ""
    
    text = latex_text.strip()
    
    # ========== STEP 1: Handle sections/headings first ==========
    text = re.sub(r'\\section\*?\{([^}]+)\}', r'<h2>\1</h2>', text)
    text = re.sub(r'\\subsection\*?\{([^}]+)\}', r'<h3>\1</h3>', text)
    text = re.sub(r'\\subsubsection\*?\{([^}]+)\}', r'<h4>\1</h4>', text)
    
    # ========== STEP 2: Convert math content BEFORE removing delimiters ==========
    # Extract and convert display math blocks: $$ ... $$
    def convert_display_math(match):
        content = match.group(1)
        # Remove common LaTeX constructs
        content = re.sub(r'\\begin\{aligned\}', '', content)
        content = re.sub(r'\\end\{aligned\}', '', content)
        content = re.sub(r'\\begin\{array\}[^}]*', '', content)
        content = re.sub(r'\\end\{array\}', '', content)
        content = re.sub(r'\\\\', ' ', content)
        content = content.replace('&', '')
        # Use Unicode converter on the content
        content = unicode_convert(content)
        return content
    
    text = re.sub(r'\$\$([\s\S]*?)\$\$', convert_display_math, text)
    
    # Extract and convert inline math: $ ... $
    def convert_inline_math(match):
        content = match.group(1)
        content = unicode_convert(content)
        return content
    
    text = re.sub(r'\$([^$]+)\$', convert_inline_math, text)
    
    # Remove any remaining $ signs
    text = text.replace('$', '')
    
    # ========== STEP 3: Remove alignment and environment markers ==========
    # Remove \begin{aligned}...\end{aligned}
    text = re.sub(r'\\begin\{aligned\}[\s\S]*?\\end\{aligned\}', '', text)
    # Remove \begin{array}...\end{array}
    text = re.sub(r'\\begin\{array\}[^}]*[\s\S]*?\\end\{array\}', '', text)
    # Remove \begin{bmatrix}...\end{bmatrix}
    text = re.sub(r'\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}', '', text)
    # Remove \begin{*}...\end{*} (generic)
    text = re.sub(r'\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}', '', text)
    
    # ========== STEP 4: Remove math operators and functions ==========
    # Remove \sin, \cos, \tan, \sec, \csc, \cot
    text = re.sub(r'\\(sin|cos|tan|sec|csc|cot)\s*', '', text)
    # Remove \operatorname{...}
    text = re.sub(r'\\operatorname\{([^}]+)\}', r'\1', text)
    # Remove \mathrm, \mathbf, \mathit, etc.
    text = re.sub(r'\\mathrm\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathbf\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathit\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathcal\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathbb\{([^}]+)\}', r'\1', text)
    
    # ========== STEP 5: Remove table/alignment formatting ==========
    # Remove \hline, \hline patterns
    text = text.replace('\\hline', '')
    # Remove \tabular and table markers
    text = re.sub(r'\\end\{tabular\}', '', text)
    # Remove & (alignment marker)
    text = text.replace('&', '')
    # Remove \\\\ (line breaks in tables)
    text = text.replace('\\\\', ' ')
    
    # ========== STEP 6: Remove text formatting commands ==========
    text = re.sub(r'\\textbf\{([^}]+)\}', r'<strong>\1</strong>', text)
    text = re.sub(r'\\textit\{([^}]+)\}', r'<em>\1</em>', text)
    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]+)\}', r'<em>\1</em>', text)
    text = re.sub(r'\\underline\{([^}]+)\}', r'<u>\1</u>', text)
    text = re.sub(r'\\overline\{([^}]+)\}', r'<u>\1</u>', text)
    
    # ========== STEP 7: Remove image formatting ==========
    text = re.sub(r'!\[\]\(([^)]+)\)', r'<img src="\1" style="max-width:100%; margin:20px 0;" alt="image"/>', text)
    
    # ========== STEP 8: Convert LaTeX symbols to Unicode ==========
    text = unicode_convert(text)
    
    # ========== STEP 9: Clean up remaining LaTeX commands ==========
    # Remove \left and \right
    text = text.replace('\\left', '')
    text = text.replace('\\right', '')
    # Remove spacing commands
    text = text.replace('\\,', ' ')
    text = text.replace('\\:', ' ')
    text = text.replace('\\;', ' ')
    text = text.replace('\\!', '')
    text = text.replace('\\quad', '  ')
    text = text.replace('\\qquad', '    ')
    # Remove any remaining backslash commands (match \command)
    text = re.sub(r'\\[a-zA-Z]+\s*', '', text)
    # Remove curly braces that held LaTeX
    text = re.sub(r'[{}]', '', text)
    
    # ========== STEP 10: Clean up extra spaces and newlines ==========
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # ========== STEP 11: Format as HTML paragraphs ==========
    # Split by headings to preserve their placement
    heading_pattern = r'(<h[1-6][^>]*>.*?</h[1-6]>)'
    blocks = re.split(heading_pattern, text, flags=re.DOTALL)
    
    result = []
    for block in blocks:
        if not block.strip():
            continue
        
        # If it's a heading, add it with spacers
        if block.startswith('<h'):
            result.append('<div> </div>')
            result.append(block)
            result.append('<div> </div>')
        else:
            # For non-heading content, split into paragraphs
            block = block.strip()
            
            # Split by multiple newlines or by common sentence endings + spaces
            paragraphs = re.split(r'\n\n+', block)
            
            for para in paragraphs:
                para = para.strip()
                if para:
                    # Check if it's an HTML element
                    if para.startswith('<'):
                        result.append(para)
                    else:
                        # Wrap regular text in paragraph
                        result.append(f'<p>{para}</p>')
    
    final_html = '\n'.join(result)
    
    # ========== STEP 12: Final cleanup ==========
    # Remove consecutive div spacers
    final_html = re.sub(r'(<div> </div>)+', r'<div> </div>', final_html)
    # Remove empty paragraphs
    final_html = re.sub(r'<p>\s*</p>', '', final_html)
    # Remove any remaining $ signs (fail-safe)
    final_html = final_html.replace('$', '')
    
    return final_html


def _convert_to_katex_html(latex_text):
    """Convert LaTeX to HTML preserving KaTeX delimiters"""
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
        math_blocks.append(f'$$\n\\begin{{aligned}}\n{content}\n\\end{{aligned}}\n$$')
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}', extract_aligned, text)
    
    # AGGRESSIVE CLEANUP: Remove malformed LaTeX patterns BEFORE array extraction
    
    # Remove: \left. \begin{array}{array} ... \end{array} \right]  (any whitespace variation)
    text = re.sub(r'\\left\.\s*\\begin\{array\}\{array\}\s*([^\]]*?)\s*\\end\{array\}\s*\\right\]', '', text)
    
    # Remove: \left. ... \begin{array}{array} ... (without closing - incomplete)
    text = re.sub(r'\\left\.\s*\\begin\{array\}\{array\}[^}]*?\}(?!\w)', '', text)
    
    # Remove bare: \left. ... \right] (unmatched delimiters)
    text = re.sub(r'\\left\.\s*[^\[].*?\\right\]', '', text)
    
    # Remove: \begin{array}{array} with invalid spec (no column spec in braces)
    text = re.sub(r'\\begin\{array\}\{\s*array\s*\}[\s\S]*?\\end\{array\}', '', text)
    
    # Remove ALL incomplete \left. patterns
    text = re.sub(r'\\left\.\s*\\begin\{[^}]+\}\{[^}]*array[^}]*\}[\s\S]*?(?=\(|\)|$|\s(ii|iii|iv))', '', text)
    
    # Fix: \left.\[ ... \]\right] -> remove (mismatched delimiters)
    text = re.sub(r'\\left\.\\\[[\s\S]*?\\\]\s*\\right\]', '', text)
    
    # Remove tabular environments (not supported in KaTeX)
    text = re.sub(r'\\begin\{tabular\}[\s\S]*?\\end\{tabular\}', '', text)
    
    # Clean up leftover spacing from removals
    text = re.sub(r'\s+\\right\]', '', text)
    text = re.sub(r'\\left\.\s+', '', text)
    
    # Extract valid array environments  
    def extract_array(match):
        try:
            col_spec = match.group(1)
            # Validate column spec - should be combinations of l, c, r, |, etc.
            if col_spec and not any(invalid in col_spec for invalid in ['array', 'begin', 'end']):
                content = match.group(2)
                math_blocks.append(f'$$\n\\begin{{array}}{{{col_spec}}}\n{content}\n\\end{{array}}\n$$')
                return f"__MATH_BLOCK_{len(math_blocks)-1}__"
            else:
                # Invalid column spec, skip it
                return ''
        except Exception as e:
            # Silently ignore malformed arrays
            return ''
    
    text = re.sub(r'\\begin\{array\}\{([^}]+)\}([\s\S]*?)\\end\{array\}', extract_array, text)
    
    # Extract bmatrix environments
    def extract_bmatrix(match):
        content = match.group(1)
        math_blocks.append(f'$$\n\\begin{{bmatrix}}\n{content}\n\\end{{bmatrix}}\n$$')
        return f"__MATH_BLOCK_{len(math_blocks)-1}__"
    
    text = re.sub(r'\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}', extract_bmatrix, text)
    
    # Convert sections
    text = re.sub(r'\\section\*\{([^}]+)\}', r'<h2>\1</h2>', text)
    text = re.sub(r'\\section\{([^}]+)\}', r'<h2>\1</h2>', text)
    text = re.sub(r'\\subsection\*\{([^}]+)\}', r'<h3>\1</h3>', text)
    text = re.sub(r'\\subsection\{([^}]+)\}', r'<h3>\1</h3>', text)
    text = re.sub(r'\\subsubsection\*\{([^}]+)\}', r'<h4>\1</h4>', text)
    text = re.sub(r'\\subsubsection\{([^}]+)\}', r'<h4>\1</h4>', text)
    
    # KEEP inline math as $...$ for KaTeX (do NOT convert to \(...\))
    # KaTeX natively supports $ delimiters
    
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
    
    # Split by headings to preserve their placement
    # Split text into blocks separated by headings
    heading_pattern = r'(<h[1-6][^>]*>.*?</h[1-6]>)'
    blocks = re.split(heading_pattern, text, flags=re.DOTALL)
    
    result = []
    for block in blocks:
        if not block.strip():
            continue
        
        # If it's a heading, add it with spacers
        if block.startswith('<h'):
            result.append('<div> </div>')
            result.append(block)
            result.append('<div> </div>')
        else:
            # For non-heading content, preserve multiple newlines and wrap in paragraphs
            block = block.strip()
            
            # Split by multiple newlines to create separate paragraphs
            paragraphs = re.split(r'\n\n+', block)
            
            for para in paragraphs:
                # Clean up single newlines
                para = para.replace('\n', ' ').strip()
                
                if para:
                    # Check if this paragraph contains a math block placeholder
                    if '__MATH_BLOCK_' in para:
                        # This contains extracted math - don't wrap it in <p>
                        # Add spacers around math blocks
                        result.append('<div> </div>')
                        result.append(para)
                        result.append('<div> </div>')
                    elif para.startswith('<'):
                        # Already wrapped or is an HTML element
                        result.append(para)
                    else:
                        # Regular text - wrap in paragraph
                        result.append(f'<p>{para}</p>')
    
    text = ''.join(result)
    
    # Clean up multiple consecutive div spacers
    text = re.sub(r'(<div> </div>)+', r'<div> </div>', text)
    
    # Remove empty paragraphs
    text = re.sub(r'<p>\s*</p>', '', text)
    
    # RESTORE MATH BLOCKS
    for i, block in enumerate(math_blocks):
        text = text.replace(f'__MATH_BLOCK_{i}__', block)
    
    return text
