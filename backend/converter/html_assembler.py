r"""
HTML Assembly Module

Assembles extracted and rendered equations/sections into LMS-compatible HTML fragments.
Handles position-based reconstruction, LMS attribute wrapping, and format validation.

Pipeline Stage 3 of 5: Wrap equations and assemble HTML fragment
"""

import re
from typing import List, Tuple, Optional, Dict, Any
from html import escape
from urllib.parse import quote
import logging

from .latex_extractor import Equation, Section, EquationType

logger = logging.getLogger(__name__)


class HTMLAssemblyError(Exception):
    """Exception raised when HTML assembly fails"""
    pass


class HTMLAssembler:
    r"""
    Assembles LaTeX extraction results into LMS-compatible HTML fragments.
    
    The LMS expects HTML fragments (not full documents) with equations wrapped in:
        <span class="__se__katex katex" contenteditable="false" 
              data-exp="ORIGINAL_LATEX" data-font-size="1em" style="font-size: 16px">
            <!-- KaTeX-rendered HTML -->
        </span>
    
    Key Features:
    - Position-based assembly (replaces equations at original positions)
    - No DOCTYPE, html, head, or body tags
    - Proper escaping of non-equation text
    - Text formatting support (\textbf, \textit, etc.)
    - HTML validation
    
    Usage:
        assembler = HTMLAssembler()
        html = assembler.assemble_fragment(text, equations, sections)
    """
    
    # LMS equation wrapper attributes
    LMS_EQUATION_CLASS = "__se__katex katex"
    LMS_EQUATION_FONTSIZE = "1em"
    LMS_EQUATION_CSS_FONTSIZE = "16px"
    
    # Text formatting patterns
    TEXT_FORMATTING = [
        (r'\\textbf\{([^}]*)\}', r'<strong>\1</strong>'),
        (r'\\textit\{([^}]*)\}', r'<em>\1</em>'),
        (r'\\underline\{([^}]*)\}', r'<u>\1</u>'),
        (r'\\texttt\{([^}]*)\}', r'<code>\1</code>'),
    ]
    
    def __init__(self, wrap_text_in_divs: bool = True, equation_format: str = "tiptap"):
        """
        Initialize the assembler.
        
        Args:
            wrap_text_in_divs: If True, wrap text segments in <div> tags
            equation_format: Format for equations - "tiptap" or "lms" (default: "tiptap")
                - "tiptap": TipTap editor format with URL-encoded LaTeX in data-latex
                - "lms": Full pre-rendered KaTeX HTML with LMS wrapper
        """
        self.wrap_text_in_divs = wrap_text_in_divs
        self.equation_format = equation_format
    
    def wrap_equation(
        self,
        equation: Equation,
        add_newlines: bool = False
    ) -> str:
        """
        Wrap a rendered equation based on configured format.
        Preserves inline spacing - inline equations stay inline without extra newlines.
        
        Args:
            equation: Equation object with katex_html already set
            add_newlines: If True, add newlines before/after only for DISPLAY equations
            
        Returns:
            Wrapped equation HTML in configured format
            
        Raises:
            HTMLAssemblyError: If equation.katex_html is not set (for LMS format)
        """
        # Use format-specific wrapping
        if self.equation_format == "tiptap":
            return self.wrap_equation_tiptap(equation)
        
        # Default: LMS format with full KaTeX HTML
        if not hasattr(equation, 'katex_html') or not equation.katex_html:
            raise HTMLAssemblyError(
                f"Equation has no katex_html: {equation.latex[:50]}"
            )
        
        # Escape the original LaTeX for use in data-exp attribute
        escaped_latex = escape(equation.latex, quote=True)
        
        # Build the wrapper span
        wrapper = (
            f'<span class="{self.LMS_EQUATION_CLASS}" '
            f'contenteditable="false" '
            f'data-exp="{escaped_latex}" '
            f'data-font-size="{self.LMS_EQUATION_FONTSIZE}" '
            f'style="font-size: {self.LMS_EQUATION_CSS_FONTSIZE}">'
            f'{equation.katex_html}'
            f'</span>'
        )
        
        # Only add newlines for DISPLAY equations (block level)
        # Inline equations should NOT have newlines to preserve spacing
        if add_newlines and equation.equation_type == EquationType.DISPLAY:
            wrapper = f'\n{wrapper}\n'
        
        return wrapper
    
    def wrap_equation_tiptap(self, equation: Equation) -> str:
        """
        Wrap a rendered equation in TipTap editor format.
        Uses URL-encoded LaTeX in data-latex attribute for Tiptap compatibility.
        
        Args:
            equation: Equation object with latex code
            
        Returns:
            TipTap-formatted equation span
        """
        # Use URL-encoded LaTeX for Tiptap compatibility
        # Tiptap expects URL-encoded content in data-latex attribute
        from urllib.parse import quote
        # Keep parentheses unencoded as per working examples
        encoded_latex = quote(equation.latex, safe='()')
        
        # Build the TipTap wrapper span
        wrapper = (
            f'<span class="tiptap-katex" data-latex="{encoded_latex}"></span>'
        )
        
        return wrapper
    
    def format_section(self, section: Section) -> str:
        """
        Format a section header to appropriate HTML tag.
        Use <p><strong> format instead of <h2> to match expected output.
        
        Args:
            section: Section object from extraction
            
        Returns:
            HTML tag (e.g., '<p><strong>Title</strong></p>')
        """
        title = escape(section.title)
        return f'<p><strong>{title}</strong></p>'
    
    def format_text(self, text: str, inline_mode: bool = False) -> str:
        """
        Format plain text with optional <p> wrapping and text formatting.
        Uses <p> tags instead of <div> to match expected output format.
        
        Args:
            text: Plain text to format
            inline_mode: If True, don't wrap in <p> tags (for inline content with equations)
            
        Returns:
            Formatted HTML
        """
        if not text or not text.strip():
            return ''
        
        # Clean up LaTeX commands and artifacts that should not appear in text
        formatted = self._clean_latex_text(text)
        
        # Note: List conversion now happens in LatexNormalizer.convert_lists()
        # before equation extraction, so lists are already HTML at this point
        
        # Apply text formatting (bold, italic, etc.)
        formatted = self.apply_text_formatting(formatted)
        
        # Only escape if we don't have HTML lists/elements already
        if '<ul>' not in formatted and '<ol>' not in formatted and '<li>' not in formatted:
            formatted = escape(formatted)
        
        # Normalize whitespace but preserve single spaces
        formatted = re.sub(r'  +', ' ', formatted)
        
        if inline_mode or not self.wrap_text_in_divs:
            # Don't wrap in <p> for inline content
            return formatted.strip()
        
        # Split by paragraph breaks and wrap each paragraph in <p> tags
        paragraphs = re.split(r'\n\s*\n+', formatted.strip())
        wrapped = [f'<p>{p.strip()}</p>' for p in paragraphs if p.strip()]
        return ''.join(wrapped)
    
    def apply_text_formatting(self, text: str) -> str:
        """
        Apply LaTeX text formatting commands (\textbf, \textit, etc.).
        
        Args:
            text: Text that may contain formatting commands
            
        Returns:
            Text with formatting converted to HTML tags
        """
        result = text
        
        for pattern, replacement in self.TEXT_FORMATTING:
            result = re.sub(pattern, replacement, result)
        
        return result
    
    def _clean_latex_text(self, text: str) -> str:
        """
        Clean up LaTeX commands and artifacts that shouldn't appear in plain text output.
        This removes commands like \includegraphics, \setcounter, etc.
        
        Args:
            text: Text that may contain LaTeX artifacts
            
        Returns:
            Cleaned text suitable for display
        """
        result = text
        
        # Remove LaTeX commands but preserve their text content
        # For \command{text}, we want to keep "text" but remove "\command"
        
        # Handle \includegraphics - remove entirely (no content to preserve)
        result = re.sub(r'\\includegraphics\s*(?:\[[^\]]*\])?\s*\{[^}]*\}', '', result)
        
        # Handle \setcounter - remove entirely (structural command)
        result = re.sub(r'\\setcounter\{[^}]*\}\{[^}]*\}', '', result)
        
        # Handle \begin{...} and \end{...} - remove entirely
        result = re.sub(r'\\(begin|end)\{[^}]*\}', '', result)
        
        # For text formatting commands, we want to remove the command but keep the content
        # Replace \textbf{content} with just content, etc.
        result = re.sub(r'\\textbf\{([^}]*)\}', r'\1', result)  # \textbf{x} -> x
        result = re.sub(r'\\textit\{([^}]*)\}', r'\1', result)  # \textit{x} -> x
        result = re.sub(r'\\emph\{([^}]*)\}', r'\1', result)    # \emph{x} -> x
        result = re.sub(r'\\texttt\{([^}]*)\}', r'\1', result)  # \texttt{x} -> x
        result = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', result)  # \mathrm{x} -> x
        result = re.sub(r'\\mathbf\{([^}]*)\}', r'\1', result)  # \mathbf{x} -> x
        result = re.sub(r'\\mathit\{([^}]*)\}', r'\1', result)  # \mathit{x} -> x
        result = re.sub(r'\\mathcal\{([^}]*)\}', r'\1', result) # \mathcal{x} -> x
        result = re.sub(r'\\sqrt\{([^}]*)\}', r'\1', result)    # \sqrt{x} -> x
        result = re.sub(r'\\sqrt\[([^\]]*)\]\{([^}]*)\}', r'\2', result)  # \sqrt[n]{x} -> x
        
        # Remove remaining LaTeX commands that don't have braces or brackets
        # These include bare commands like \It, \note, \item, \section, etc.
        result = re.sub(r'\\[a-zA-Z]+\*?(?:\s+|(?=[\s.,;:!?\)])|$)', ' ', result)
        
        # Remove any remaining backslashes (safety for edge cases)
        result = result.replace('\\', '')
        
        # Clean up multiple spaces
        result = re.sub(r'  +', ' ', result)
        result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
        
        return result.strip()
    
    def validate_html(self, html: str) -> Tuple[bool, Optional[str]]:
        """
        Validate that HTML fragment doesn't contain disallowed elements.
        
        Args:
            html: HTML fragment to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        disallowed = ['<!DOCTYPE', '<html', '<head', '<body', '</html>', '</body>']
        
        for tag in disallowed:
            if tag.lower() in html.lower():
                return False, f"Found disallowed tag: {tag}"
        
        return True, None
    
    def assemble_fragment(
        self,
        original_text: str,
        equations: List[Equation],
        sections: List[Section]
    ) -> str:
        """
        Assemble HTML fragment from original text, equations, and sections.
        
        Strategy:
        - Inline equations stay inline with surrounding text (no wrapping divs)
        - Display equations are block-level
        - Sections are block-level headers
        - Text before/after inline equations stays in same container
        - Paragraph breaks (double newlines) create new divs
        
        Args:
            original_text: The original Mathpix text
            equations: List of extracted and rendered equations
            sections: List of extracted sections
            
        Returns:
            HTML fragment ready for LMS injection
            
        Raises:
            HTMLAssemblyError: If assembly fails
        """
        if not equations and not sections:
            return self.format_text(original_text)
        
        # Build list of all replaceable elements
        replacements = []
        for eq in equations:
            replacements.append({
                'type': 'equation',
                'start': eq.start_pos,
                'end': eq.end_pos,
                'object': eq,
            })
        for sec in sections:
            replacements.append({
                'type': 'section',
                'start': sec.start_pos,
                'end': sec.end_pos,
                'object': sec,
            })
        
        replacements.sort(key=lambda x: x['start'])
        
        # Strategy: collect content into logical "blocks" (paragraphs or sections)
        # Inline equations within a paragraph stay in the same block
        html_blocks = []
        current_pos = 0
        current_block = []  # Accumulate HTML parts for current block
        
        for replacement in replacements:
            # Get text before this element
            if current_pos < replacement['start']:
                text_before = original_text[current_pos:replacement['start']]
                
                if text_before:
                    # Check for paragraph breaks
                    if '\n\n' in text_before or text_before.count('\n') > 2:
                        # Has significant breaks - split block
                        lines = text_before.split('\n\n')
                        
                        # Add first part to current block
                        if lines[0].strip():
                            formatted = self.format_text(lines[0], inline_mode=True)
                            current_block.append(formatted)
                        
                        # Flush current block if has content
                        if current_block:
                            html_blocks.append(self._wrap_block(current_block))
                            current_block = []
                        
                        # Process middle paragraphs
                        for line in lines[1:-1]:
                            if line.strip():
                                formatted = self.format_text(line, inline_mode=False)
                                html_blocks.append(formatted)
                        
                        # Start new block with last part
                        if lines[-1].strip():
                            formatted = self.format_text(lines[-1], inline_mode=True)
                            current_block = [formatted]
                    else:
                        # No significant break - keep in current block
                        formatted = self.format_text(text_before, inline_mode=True)
                        current_block.append(formatted)
            
            # Add the replacement element
            if replacement['type'] == 'equation':
                eq = replacement['object']
                # Check if this is a display equation (block-level) or inline
                if eq.is_display_mode:
                    # Display equation breaks the current block
                    # Flush current text block
                    if current_block:
                        html_blocks.append(self._wrap_block(current_block))
                        current_block = []
                    # Display equation gets its own <p> block
                    wrapped = self.wrap_equation(eq)
                    html_blocks.append(f'<p>{wrapped}</p>')
                else:
                    # Inline equation stays in current block with surrounding text
                    wrapped = self.wrap_equation(eq)
                    current_block.append(wrapped)
            elif replacement['type'] == 'section':
                # Section breaks the block
                if current_block:
                    html_blocks.append(self._wrap_block(current_block))
                    current_block = []
                formatted = self.format_section(replacement['object'])
                html_blocks.append(formatted)
            
            current_pos = replacement['end']
        
        # Handle remaining text
        if current_pos < len(original_text):
            text_remaining = original_text[current_pos:]
            if text_remaining.strip():
                formatted = self.format_text(text_remaining, inline_mode=True)
                current_block.append(formatted)
        
        # Flush final block
        if current_block:
            html_blocks.append(self._wrap_block(current_block))
        
        # Join blocks - NO newlines, output should be single line
        html_fragment = ''.join(html_blocks)
        
        # IMPORTANT: Remove ALL newlines from the final output to ensure single-line format
        # This includes newlines that may have been embedded from TeX source (e.g., \\ in equations)
        html_fragment = html_fragment.replace('\n', '').replace('\r', '')
        
        # Validate
        is_valid, error_msg = self.validate_html(html_fragment)
        if not is_valid:
            raise HTMLAssemblyError(f"HTML validation failed: {error_msg}")
        
        return html_fragment
    
    def _wrap_block(self, parts: List[str]) -> str:
        """
        Wrap a block of content (text + inline equations) in a paragraph.
        Preserves single space gap between text and equations.
        Uses <p> tags instead of <div> to match expected output format.
        
        Args:
            parts: List of HTML parts (text, inline equation spans, etc.)
            
        Returns:
            Wrapped block
        """
        # Join parts - preserve single space before/after equations
        content = ''
        for i, part in enumerate(parts):
            if i == 0:
                content = part
            else:
                # Check if part is an equation span
                if part.strip().startswith('<span') and 'tiptap-katex' in part:
                    # Add single space if content doesn't already end with space
                    if content and not content.endswith(' '):
                        content += ' '
                    content += part
                    # Add space after equation if next content exists (handled in next iteration)
                else:
                    # Text content - add space separator
                    if content and not content.endswith(' ') and part.strip():
                        content += ' '
                    content += part
        
        if content.strip():
            return f'<p>{content.strip()}</p>'
        return ''
    
    def get_statistics(
        self,
        original_text: str,
        equations: List[Equation],
        sections: List[Section],
        html_fragment: str
    ) -> Dict[str, Any]:
        """
        Get statistics about the assembly result.
        
        Args:
            original_text: Original input text
            equations: List of equations
            sections: List of sections
            html_fragment: Assembled HTML fragment
            
        Returns:
            Dictionary with statistics
        """
        return {
            'original_text_length': len(original_text),
            'total_equations': len(equations),
            'display_equations': sum(1 for eq in equations if eq.is_display_mode),
            'inline_equations': sum(1 for eq in equations if not eq.is_display_mode),
            'total_sections': len(sections),
            'html_fragment_length': len(html_fragment),
            'size_increase_percent': round(
                ((len(html_fragment) - len(original_text)) / len(original_text) * 100)
                if original_text else 0,
                2
            ),
            'has_katex_equations': '__se__katex' in html_fragment,
            'has_sections': '<h2>' in html_fragment or '<h3>' in html_fragment,
        }


# Utility functions

def assemble_and_validate(
    text: str,
    equations: List[Equation],
    sections: List[Section]
) -> Tuple[str, Dict[str, Any]]:
    """
    Assemble HTML fragment and return with statistics.
    
    Args:
        text: Original text
        equations: List of equations
        sections: List of sections
        
    Returns:
        Tuple of (html_fragment, statistics)
    """
    assembler = HTMLAssembler()
    html = assembler.assemble_fragment(text, equations, sections)
    stats = assembler.get_statistics(text, equations, sections, html)
    
    return html, stats


# Example usage / testing
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    # Test data
    from .latex_extractor import Equation, Section, EquationType
    
    # Create test equations with mock katex_html
    test_equations = [
        Equation(
            latex="x+2",
            equation_type=EquationType.INLINE,
            start_pos=12,
            end_pos=19,
            original_text="$(x+2)$"
        ),
        Equation(
            latex=r"\frac{a}{b}",
            equation_type=EquationType.DISPLAY,
            start_pos=65,
            end_pos=125,
            original_text=r"$$\frac{a}{b}$$"
        ),
    ]
    
    # Add mock KaTeX HTML
    test_equations[0].katex_html = '<span class="katex"><span class="base">x+2</span></span>'
    test_equations[1].katex_html = '<span class="katex-display"><span class="base">a/b</span></span>'
    
    # Create test section
    test_sections = [
        Section(title="Test Section", level=1, start_pos=25, end_pos=45)
    ]
    
    test_text = """A binomial is $(x+2)$

\\section*{Test Section}

More text and
$$\frac{a}{b}$$

Done."""
    
    print("=" * 70)
    print("HTML ASSEMBLY TEST")
    print("=" * 70)
    
    try:
        assembler = HTMLAssembler()
        print(f"\n✓ Assembler initialized")
        
        # Test wrapping
        print(f"\n--- Testing Equation Wrapping ---")
        wrapped = assembler.wrap_equation(test_equations[0])
        print(f"Wrapped length: {len(wrapped)} chars")
        print(f"Preview: {wrapped[:100]}...")
        
        # Test section formatting
        print(f"\n--- Testing Section Formatting ---")
        formatted_sec = assembler.format_section(test_sections[0])
        print(f"Formatted: {formatted_sec}")
        
        # Test text formatting
        print(f"\n--- Testing Text Formatting ---")
        text_with_fmt = r"This is \textbf{bold} and \textit{italic} text"
        formatted_text = assembler.apply_text_formatting(text_with_fmt)
        print(f"Input: {text_with_fmt}")
        print(f"Output: {formatted_text}")
        
        # Test assembly
        print(f"\n--- Testing Assembly ---")
        html_fragment = assembler.assemble_fragment(test_text, test_equations, test_sections)
        print(f"Fragment length: {len(html_fragment)} chars")
        print(f"Preview:\n{html_fragment[:300]}...")
        
        # Get statistics
        stats = assembler.get_statistics(test_text, test_equations, test_sections, html_fragment)
        print(f"\n--- Statistics ---")
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        # Validation
        is_valid, error = assembler.validate_html(html_fragment)
        print(f"\n--- Validation ---")
        print(f"  Valid: {is_valid}")
        if error:
            print(f"  Error: {error}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 70)
    print("✓ Phase 4: HTML Assembly Module Ready")
    print("=" * 70)
