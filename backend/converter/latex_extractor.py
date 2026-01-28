r"""
LaTeX Extraction Module

Extracts equations ($...$ and $$...$$), sections (\section*, \subsection*)
and normalizes Mathpix artifacts from LaTeX text.

Pipeline Stage 1 of 5: Extract LaTeX content with position tracking
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from enum import Enum


class EquationType(Enum):
    """Enum for equation types"""
    INLINE = "inline"      # $...$
    DISPLAY = "display"    # $$...$$


class SectionLevel(Enum):
    """Enum for section levels"""
    SECTION = 1
    SUBSECTION = 2
    SUBSUBSECTION = 3


@dataclass
class Equation:
    r"""
    Represents a single equation extracted from LaTeX text
    
    Attributes:
        latex: The LaTeX code (without delimiters)
        equation_type: Type of equation (inline or display)
        start_pos: Starting position in original text (exclusive of delimiters)
        end_pos: Ending position in original text (exclusive of delimiters)
        original_text: The complete original text including delimiters
        is_display_mode: Boolean for KaTeX rendering (True for display, False for inline)
    """
    latex: str
    equation_type: EquationType
    start_pos: int
    end_pos: int
    original_text: str
    is_display_mode: bool = field(init=False)
    
    def __post_init__(self):
        """Set is_display_mode based on equation_type"""
        self.is_display_mode = self.equation_type == EquationType.DISPLAY


@dataclass
class Section:
    r"""
    Represents a section/subsection header
    
    Attributes:
        title: The section title text
        level: Section level (1=\section, 2=\subsection, etc.)
        start_pos: Starting position in original text
        end_pos: Ending position in original text
        html_tag: The HTML tag to use (<h1>, <h2>, etc.)
    """
    title: str
    level: int
    start_pos: int
    end_pos: int
    html_tag: str = field(init=False)
    
    def __post_init__(self):
        """Set html_tag based on level"""
        # level 1 -> h2 (h1 usually reserved for page title)
        # level 2 -> h3
        # level 3 -> h4
        level_mapping = {1: "h2", 2: "h3", 3: "h4"}
        self.html_tag = level_mapping.get(self.level, "h2")


class LatexExtractor:
    r"""
    Extracts equations, sections, and normalizes LaTeX text from Mathpix output.
    
    Usage:
        extractor = LatexExtractor()
        equations = extractor.extract_equations(text)
        sections = extractor.extract_sections(text)
        clean_text = extractor.normalize_latex(text)
    """
    
    # Regex patterns
    # Matches $$...$$  (display mode, may span multiple lines)
    DISPLAY_EQUATION_PATTERN = r'\$\$(.+?)\$\$'
    
    # Matches $...$ (inline, but NOT part of $$...$$)
    # Uses negative lookbehind/lookahead to avoid matching parts of $$...$$
    INLINE_EQUATION_PATTERN = r'(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)'
    
    # Matches \section*{...}, \section{...}, etc.
    SECTION_PATTERN = r'\\(section|subsection|subsubsection)\*?\{([^}]*)\}'
    
    # Mathpix-specific artifacts to clean
    MATHPIX_ARTIFACTS = [
        (r'\\\(', '('),           # \( -> (
        (r'\\\)', ')'),           # \) -> )
        (r'\\\[', '['),           # \[ -> [
        (r'\\\]', ']'),           # \] -> ]
        (r'\\b\s+', ''),          # \b followed by space -> remove
        (r'\\begin\{aligned\}', ''),  # Remove \begin{aligned}
        (r'\\end\{aligned\}', ''),    # Remove \end{aligned}
        (r'\\text\{([^}]*)\}', r'\1'), # Convert \text{...} to plain text
    ]
    
    # Regex compile flags
    REGEX_FLAGS = re.DOTALL | re.MULTILINE
    
    def __init__(self):
        """Initialize extractor with compiled regex patterns"""
        self.display_pattern = re.compile(self.DISPLAY_EQUATION_PATTERN, self.REGEX_FLAGS)
        self.inline_pattern = re.compile(self.INLINE_EQUATION_PATTERN, self.REGEX_FLAGS)
        self.section_pattern = re.compile(self.SECTION_PATTERN, self.REGEX_FLAGS)
    
    def extract_equations(self, text: str) -> List[Equation]:
        """
        Extract all equations from text in order of appearance.
        
        Args:
            text: The LaTeX text to extract from
            
        Returns:
            List of Equation objects sorted by position
            
        Note:
            - Extracts display equations first ($$...$$)
            - Then extracts inline equations ($...$)
            - Returns combined list sorted by position
        """
        equations = []
        
        # Extract display equations first
        for match in self.display_pattern.finditer(text):
            latex_content = match.group(1).strip()
            # Skip empty matches
            if not latex_content:
                continue
            
            # Calculate positions (excluding delimiters)
            start_pos = match.start()
            end_pos = match.end()
            
            equation = Equation(
                latex=latex_content,
                equation_type=EquationType.DISPLAY,
                start_pos=start_pos,
                end_pos=end_pos,
                original_text=match.group(0)
            )
            equations.append(equation)
        
        # Extract inline equations
        for match in self.inline_pattern.finditer(text):
            latex_content = match.group(1).strip()
            # Skip empty matches
            if not latex_content:
                continue
            
            # Skip if this is part of a display equation we already extracted
            # Check if position is inside any display equation
            is_inside_display = False
            for eq in equations:
                if eq.equation_type == EquationType.DISPLAY:
                    if eq.start_pos < match.start() < eq.end_pos:
                        is_inside_display = True
                        break
            
            if is_inside_display:
                continue
            
            start_pos = match.start()
            end_pos = match.end()
            
            equation = Equation(
                latex=latex_content,
                equation_type=EquationType.INLINE,
                start_pos=start_pos,
                end_pos=end_pos,
                original_text=match.group(0)
            )
            equations.append(equation)
        
        # Sort by position
        equations.sort(key=lambda eq: eq.start_pos)
        
        return equations
    
    def extract_sections(self, text: str) -> List[Section]:
        r"""
        Extract all section headers from text in order of appearance.
        
        Args:
            text: The LaTeX text to extract from
            
        Returns:
            List of Section objects sorted by position
            
        Note:
            Supports \section*, \section, \subsection*, \subsection, etc.
        """
        sections = []
        
        for match in self.section_pattern.finditer(text):
            section_type = match.group(1)  # 'section', 'subsection', etc.
            title = match.group(2).strip()
            
            # Skip empty titles
            if not title:
                continue
            
            # Determine level
            level_map = {
                'section': 1,
                'subsection': 2,
                'subsubsection': 3
            }
            level = level_map.get(section_type, 1)
            
            start_pos = match.start()
            end_pos = match.end()
            
            section = Section(
                title=title,
                level=level,
                start_pos=start_pos,
                end_pos=end_pos
            )
            sections.append(section)
        
        # Sort by position (should already be in order, but be safe)
        sections.sort(key=lambda sec: sec.start_pos)
        
        return sections
    
    def normalize_latex(self, latex: str) -> str:
        """
        Clean Mathpix-specific artifacts and normalize LaTeX.
        
        Args:
            latex: The LaTeX string to normalize
            
        Returns:
            Cleaned LaTeX string
            
        Note:
            Removes/replaces:
            - Mathpix escape sequences
            - Text mode wrappers
            - Alignment environment markers
            - Extra whitespace
        """
        result = latex
        
        # Apply all Mathpix artifact cleanups
        for pattern, replacement in self.MATHPIX_ARTIFACTS:
            result = re.sub(pattern, replacement, result, flags=re.MULTILINE)
        
        # Clean up multiple spaces
        result = re.sub(r'\s+', ' ', result)
        
        # Clean up spaces around operators and braces
        result = re.sub(r'\s*([{}=+\-*/])\s*', r'\1', result)
        
        # Ensure single spaces in proper places
        result = result.strip()
        
        return result
    
    def extract_all(self, text: str) -> Tuple[List[Equation], List[Section]]:
        """
        Extract both equations and sections in a single call.
        
        Args:
            text: The LaTeX text to extract from
            
        Returns:
            Tuple of (equations, sections)
        """
        equations = self.extract_equations(text)
        sections = self.extract_sections(text)
        return equations, sections


# Utility functions for batch operations

def extract_equations_from_file(filepath: str) -> List[Equation]:
    """
    Extract equations from a file.
    
    Args:
        filepath: Path to the LaTeX text file
        
    Returns:
        List of extracted equations
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    extractor = LatexExtractor()
    return extractor.extract_equations(text)


def extract_sections_from_file(filepath: str) -> List[Section]:
    """
    Extract sections from a file.
    
    Args:
        filepath: Path to the LaTeX text file
        
    Returns:
        List of extracted sections
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    extractor = LatexExtractor()
    return extractor.extract_sections(text)


# Example usage / testing
if __name__ == "__main__":
    # Test text
    test_text = r"""
    Introduction to $(x+2)$.
    
    \section*{Binomial Theorem}
    
    The formula is:
    $$
    (a+x)^{n} = \sum_{r=0}^{n} C(n,r) a^{n-r} x^{r}
    $$
    
    More text with inline $\frac{a}{b}$ equations.
    
    \subsection{Special Cases}
    
    When $x = 0$: $(a+0)^n = a^n$.
    """
    
    extractor = LatexExtractor()
    
    print("=" * 60)
    print("EXTRACTION TEST")
    print("=" * 60)
    
    # Test equation extraction
    equations = extractor.extract_equations(test_text)
    print(f"\nFound {len(equations)} equations:")
    for i, eq in enumerate(equations):
        print(f"\n  [{i}] Type: {eq.equation_type.value}")
        print(f"      LaTeX: {eq.latex}")
        print(f"      Display Mode: {eq.is_display_mode}")
        print(f"      Position: {eq.start_pos}-{eq.end_pos}")
    
    # Test section extraction
    sections = extractor.extract_sections(test_text)
    print(f"\n\nFound {len(sections)} sections:")
    for i, sec in enumerate(sections):
        print(f"\n  [{i}] Level: {sec.level}")
        print(f"      Title: {sec.title}")
        print(f"      HTML Tag: {sec.html_tag}")
        print(f"      Position: {sec.start_pos}-{sec.end_pos}")
    
    # Test normalization
    messy_latex = r"\begin{aligned} \b x^2 + y^2 \end{aligned}"
    clean_latex = extractor.normalize_latex(messy_latex)
    print(f"\n\nNormalization test:")
    print(f"  Input:  {messy_latex}")
    print(f"  Output: {clean_latex}")
    
    print("\n" + "=" * 60)
    print("✓ Extraction module ready")
    print("=" * 60)
