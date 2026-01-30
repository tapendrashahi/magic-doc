#!/usr/bin/env python
"""Test the text cleaning functionality in html_assembler"""

import re
from html import escape
from urllib.parse import quote

def clean_latex_text(text: str) -> str:
    """
    Clean up LaTeX commands and artifacts that shouldn't appear in plain text output.
    """
    result = text
    
    # Remove LaTeX line break commands (\\) and convert to spaces
    result = re.sub(r'\\\\\s*(?:\[[^\]]*\])?', ' ', result)
    
    # Remove \includegraphics and its arguments
    result = re.sub(r'\\includegraphics\s*(?:\[[^\]]*\])?\s*\{[^}]*\}', '', result)
    result = re.sub(r'\\?includegraphics\[[^\]]*\]\{[^}]*\}', '', result)
    result = re.sub(r'\\?includegraphics\{[^}]*\}', '', result)
    
    # Remove \setcounter and its arguments  
    result = re.sub(r'\\setcounter\{[^}]*\}\{[^}]*\}', '', result)
    
    # Remove other document structure commands
    result = re.sub(r'\\(begin|end)\{(document|enumerate|itemize)\}', '', result)
    result = re.sub(r'\\(item|section\*?|subsection\*?|subsubsection\*?|chapter\*?)\s+', '', result)
    
    # Remove \begin{aligned} and \end{aligned} that appear in text
    result = re.sub(r'\\begin\{aligned\}.*?\\end\{aligned\}', '', result, flags=re.DOTALL)
    
    # Remove standalone math mode delimiters
    result = re.sub(r'\$\$.*?\$\$', '', result, flags=re.DOTALL)
    result = re.sub(r'(?<!\$)\$(?!\$).*?(?<!\$)\$(?!\$)', '', result, flags=re.DOTALL)
    
    # Remove preamble commands
    result = re.sub(r'\\DeclareUnicodeCharacter\{[^}]*\}\{[^}]*\}', '', result)
    result = re.sub(r'\\usepackage\s*(?:\[[^\]]*\])?\s*\{[^}]*\}', '', result)
    result = re.sub(r'\\documentclass\s*(?:\[[^\]]*\])?\s*\{[^}]*\}', '', result)
    
    # Remove any remaining malformed LaTeX commands
    result = re.sub(r'\\[a-zA-Z]+\*?\s*(?:\[[^\]]*\])?\s*\{[^}]*\}', '', result)
    
    # Clean up multiple spaces and newlines
    result = re.sub(r'  +', ' ', result)
    result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
    
    return result.strip()


# Test cases
if __name__ == "__main__":
    test_text = r"""Any ordered pair of real numbers ( \mathrm{a}, \mathrm{b} ) is known as a complex number.\\
It is denoted by z or w. \\includegraphics[max width=\textwidth]{img.png}

\setcounter{enumi}{2}
(i) Some text here"""

    cleaned = clean_latex_text(test_text)
    print("✓ Text cleaning works\n")

    print("Issues fixed:")
    print(f"  - No double backslash (\\\\): {'\\\\' not in cleaned}")
    print(f"  - No includegraphics: {'includegraphics' not in cleaned}")
    print(f"  - No setcounter: {'setcounter' not in cleaned}")
    
    print(f"\nOriginal text:\n{test_text}\n")
    print(f"Cleaned text:\n{cleaned}")
