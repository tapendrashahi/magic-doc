r"""
HTML Assembly Module

Assembles extracted and rendered equations/sections into LMS-compatible HTML fragments.
Handles position-based reconstruction, LMS attribute wrapping, and format validation.

Pipeline Stage 3 of 5: Wrap equations and assemble HTML fragment
"""

import re
from typing import List, Tuple, Optional, Dict, Any
from html import escape
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
    
    def __init__(self, wrap_text_in_divs: bool = True):
        """
        Initialize the assembler.
        
        Args:
            wrap_text_in_divs: If True, wrap text segments in <div> tags
        """
        self.wrap_text_in_divs = wrap_text_in_divs
    
    def wrap_equation(
        self,
        equation: Equation,
        add_newlines: bool = False
    ) -> str:
        """
        Wrap a rendered equation with LMS-specific attributes.
        
        Args:
            equation: Equation object with katex_html already set
            add_newlines: If True, add newlines before/after for readability
            
        Returns:
            LMS-wrapped equation HTML
            
        Raises:
            HTMLAssemblyError: If equation.katex_html is not set
        """
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
        
        if add_newlines:
            wrapper = f'\n{wrapper}\n'
        
        return wrapper
    
    def format_section(self, section: Section) -> str:
        """
        Format a section header to appropriate HTML tag.
        
        Args:
            section: Section object from extraction
            
        Returns:
            HTML tag (e.g., '<h2>Title</h2>')
        """
        tag = section.html_tag
        title = escape(section.title)
        return f'<{tag}>{title}</{tag}>'
    
    def format_text(self, text: str) -> str:
        """
        Format plain text with optional div wrapping and text formatting.
        
        Args:
            text: Plain text to format
            
        Returns:
            Formatted HTML
        """
        if not text or not text.strip():
            return ''
        
        # Apply text formatting (bold, italic, etc.)
        formatted = self.apply_text_formatting(text)
        
        # Escape any remaining HTML entities
        formatted = escape(formatted)
        
        # Wrap in div if requested
        if self.wrap_text_in_divs:
            # Split by newlines and wrap each line
            lines = formatted.split('\n')
            wrapped_lines = [
                f'<div>{line}</div>' if line.strip() else '<div></div>'
                for line in lines
            ]
            return '\n'.join(wrapped_lines)
        
        return formatted
    
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
        
        Uses position-based reconstruction:
        1. Identify all replaceable regions (equations and sections)
        2. Keep text between them
        3. Replace equations with LMS-wrapped versions
        4. Replace sections with formatted headers
        5. Format remaining text
        
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
            # Just format the text
            return self.format_text(original_text)
        
        # Create a list of all replaceable elements with their positions
        replacements = []
        
        for eq in equations:
            replacements.append({
                'type': 'equation',
                'start': eq.start_pos,
                'end': eq.end_pos,
                'object': eq,
                'original_text': eq.original_text
            })
        
        for sec in sections:
            replacements.append({
                'type': 'section',
                'start': sec.start_pos,
                'end': sec.end_pos,
                'object': sec,
                'original_text': sec.title
            })
        
        # Sort by position
        replacements.sort(key=lambda x: x['start'])
        
        # Build the output by walking through positions
        html_parts = []
        current_pos = 0
        
        for replacement in replacements:
            # Add text before this replacement
            if current_pos < replacement['start']:
                text_before = original_text[current_pos:replacement['start']]
                if text_before:
                    formatted = self.format_text(text_before)
                    if formatted:
                        html_parts.append(formatted)
            
            # Add the replacement
            if replacement['type'] == 'equation':
                wrapped = self.wrap_equation(replacement['object'])
                html_parts.append(wrapped)
            elif replacement['type'] == 'section':
                formatted = self.format_section(replacement['object'])
                html_parts.append(formatted)
            
            current_pos = replacement['end']
        
        # Add any remaining text after last replacement
        if current_pos < len(original_text):
            text_after = original_text[current_pos:]
            if text_after:
                formatted = self.format_text(text_after)
                if formatted:
                    html_parts.append(formatted)
        
        # Join all parts
        html_fragment = '\n'.join(html_parts)
        
        # Validate
        is_valid, error_msg = self.validate_html(html_fragment)
        if not is_valid:
            raise HTMLAssemblyError(f"HTML validation failed: {error_msg}")
        
        return html_fragment
    
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
