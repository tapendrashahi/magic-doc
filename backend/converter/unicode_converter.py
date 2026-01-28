"""
Unicode Converter - Convert LaTeX math to Unicode text representation
For LMS systems that don't support KaTeX (Moodle, Google Sites, etc.)
"""
import re


# Comprehensive LaTeX to Unicode symbol mapping
LATEX_TO_UNICODE = {
    # Greek Lowercase
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\iota': 'ι',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\omicron': 'ο',
    '\\pi': 'π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    
    # Greek Uppercase
    '\\Gamma': 'Γ',
    '\\Delta': 'Δ',
    '\\Theta': 'Θ',
    '\\Lambda': 'Λ',
    '\\Xi': 'Ξ',
    '\\Pi': 'Π',
    '\\Sigma': 'Σ',
    '\\Upsilon': 'Υ',
    '\\Phi': 'Φ',
    '\\Psi': 'Ψ',
    '\\Omega': 'Ω',
    
    # Operators
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\cdot': '·',
    '\\ast': '*',
    '\\star': '★',
    '\\dagger': '†',
    '\\ddagger': '‡',
    '\\cap': '∩',
    '\\cup': '∪',
    '\\wedge': '∧',
    '\\vee': '∨',
    '\\oplus': '⊕',
    '\\otimes': '⊗',
    '\\ominus': '⊖',
    '\\odot': '⊙',
    
    # Relations
    '\\leq': '≤',
    '\\le': '≤',
    '\\geq': '≥',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\ne': '≠',
    '\\equiv': '≡',
    '\\approx': '≈',
    '\\sim': '∼',
    '\\cong': '≅',
    '\\propto': '∝',
    '\\in': '∈',
    '\\notin': '∉',
    '\\ni': '∋',
    '\\subset': '⊂',
    '\\subseteq': '⊆',
    '\\supset': '⊃',
    '\\supseteq': '⊇',
    '\\nsubset': '⊄',
    '\\nsubseteq': '⊈',
    
    # Arrows
    '\\to': '→',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔',
    '\\mapsto': '↦',
    '\\uparrow': '↑',
    '\\downarrow': '↓',
    '\\updownarrow': '↕',
    
    # Quantifiers & Logic
    '\\forall': '∀',
    '\\exists': '∃',
    '\\neg': '¬',
    '\\top': '⊤',
    '\\bot': '⊥',
    '\\therefore': '∴',
    '\\because': '∵',
    
    # Special Math
    '\\sqrt': '√',
    '\\cbrt': '∛',
    '\\infty': '∞',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\iint': '∬',
    '\\iiint': '∭',
    '\\oint': '∮',
    '\\angle': '∠',
    '\\triangle': '△',
    '\\parallel': '∥',
    '\\perp': '⊥',
    '\\parallel': '‖',
    
    # Bracket-like
    '\\emptyset': '∅',
    '\\varnothing': '∅',
    '\\infty': '∞',
    '\\aleph': 'ℵ',
    '\\hbar': 'ℏ',
    '\\ell': 'ℓ',
    '\\wp': '℘',
    '\\Re': 'ℜ',
    '\\Im': 'ℑ',
    
    # Miscellaneous
    '\\dag': '†',
    '\\ddag': '‡',
    '\\pounds': '£',
    '\\yen': '¥',
    '\\euro': '€',
    '\\copyright': '©',
    '\\registered': '®',
    '\\trademark': '™',
    '\\degree': '°',
    '\\prime': '′',
    '\\Prime': '″',
    '\\infty': '∞',
    '\\flat': '♭',
    '\\sharp': '♯',
    '\\natural': '♮',
}


def convert_latex_to_unicode(text):
    """
    Convert LaTeX symbols to Unicode equivalents.
    
    Examples:
        '\\alpha' -> 'α'
        '\\times' -> '×'
        '\\sqrt' -> '√'
    """
    result = text
    
    # Sort by length (longest first) to avoid partial replacements
    for latex_sym in sorted(LATEX_TO_UNICODE.keys(), key=len, reverse=True):
        unicode_sym = LATEX_TO_UNICODE[latex_sym]
        result = result.replace(latex_sym, unicode_sym)
    
    return result


def handle_superscripts(text):
    """
    Convert LaTeX superscripts to Unicode superscripts.
    
    Examples:
        'x^2' -> 'x²'
        'a^{n+1}' -> 'aⁿ⁺¹'
    """
    # Superscript Unicode characters
    superscript_map = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ', 'a': 'ᵃ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    }
    
    def replace_superscript(match):
        content = match.group(1)
        # Remove braces if present
        content = content.strip('{}')
        result = ''
        for char in content:
            result += superscript_map.get(char, char)
        return result
    
    # Handle ^{...} patterns
    text = re.sub(r'\^\{([^}]+)\}', replace_superscript, text)
    
    # Handle ^x patterns (single character)
    def single_superscript(match):
        char = match.group(1)
        return superscript_map.get(char, '^' + char)
    
    text = re.sub(r'\^([0-9nia])', single_superscript, text)
    
    return text


def handle_subscripts(text):
    """
    Convert LaTeX subscripts to Unicode subscripts.
    
    Examples:
        'x_1' -> 'x₁'
        'z_{n+1}' -> 'zₙ₊₁'
    """
    # Subscript Unicode characters
    subscript_map = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'n': 'ₙ', 'i': 'ᵢ', 'a': 'ₐ', 'x': 'ₓ', 'y': 'ᵧ', 'z': 'ᵤ'
    }
    
    def replace_subscript(match):
        content = match.group(1)
        # Remove braces if present
        content = content.strip('{}')
        result = ''
        for char in content:
            result += subscript_map.get(char, char)
        return result
    
    # Handle _{...} patterns
    text = re.sub(r'_\{([^}]+)\}', replace_subscript, text)
    
    # Handle _x patterns (single character)
    def single_subscript(match):
        char = match.group(1)
        return subscript_map.get(char, '_' + char)
    
    text = re.sub(r'_([0-9nia])', single_subscript, text)
    
    return text


def handle_fractions(text):
    """
    Convert LaTeX fractions to text representation.
    
    Examples:
        '\\frac{a}{b}' -> 'a / b'
        '\\frac{1}{2}' -> '1 / 2'
    """
    def replace_frac(match):
        numerator = match.group(1)
        denominator = match.group(2)
        # Clean up braces
        numerator = numerator.strip('{}')
        denominator = denominator.strip('{}')
        return f'({numerator}) / ({denominator})'
    
    # Match \frac{...}{...}
    text = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', replace_frac, text)
    
    return text


def handle_sqrt(text):
    """
    Convert LaTeX square root to Unicode.
    
    Examples:
        '\\sqrt{a}' -> '√a'
        '\\sqrt{a^2 + b^2}' -> '√(a² + b²)'
    """
    def replace_sqrt(match):
        content = match.group(1)
        # Clean up braces
        content = content.strip('{}')
        if ' ' in content or '+' in content or '-' in content or '*' in content:
            return f'√({content})'
        return f'√{content}'
    
    # Match \sqrt{...}
    text = re.sub(r'\\sqrt\{([^}]+)\}', replace_sqrt, text)
    
    return text


def handle_overline(text):
    """
    Convert LaTeX overline to Unicode combining overline or text representation.
    
    Examples:
        '\\overline{z}' -> 'z̄'
        '\\bar{z}' -> 'z̄'
    """
    # Use combining overline U+0305
    combining_overline = '\u0305'
    
    def replace_overline(match):
        content = match.group(1)
        # Remove braces
        content = content.strip('{}')
        # Add combining overline to first character (or all if single)
        if len(content) == 1:
            return content + combining_overline
        # For multiple chars, put overline on the last char visible
        return content + combining_overline
    
    # Match \overline{...}
    text = re.sub(r'\\overline\{([^}]+)\}', replace_overline, text)
    # Match \bar{...}
    text = re.sub(r'\\bar\{([^}]+)\}', replace_overline, text)
    
    return text


def handle_text_formatting(text):
    """
    Remove or simplify LaTeX text formatting.
    
    Examples:
        '\\textbf{bold}' -> 'bold'
        '\\textit{italic}' -> 'italic'
        '\\mathrm{text}' -> 'text'
        '\\mathbf{A}' -> 'A'
    """
    # Remove text formatting commands (keep only content)
    text = re.sub(r'\\text(bf|it|rm|sf|tt|md|up|sl)\{([^}]+)\}', r'\2', text)
    text = re.sub(r'\\math(bf|it|rm|sf|tt|cal|bb|frak|scr)\{([^}]+)\}', r'\2', text)
    text = re.sub(r'\\(textbf|textit|texttt|textrm|textsf)\{([^}]+)\}', r'\2', text)
    text = re.sub(r'\\(mathbf|mathit|mathtt|mathrm|mathsf)\{([^}]+)\}', r'\2', text)
    
    return text


def clean_latex_commands(text):
    """
    Remove remaining LaTeX commands that couldn't be converted.
    """
    # Remove \left and \right
    text = text.replace('\\left', '')
    text = text.replace('\\right', '')
    
    # Remove \, spaces (thin space, etc.)
    text = text.replace('\\,', ' ')
    text = text.replace('\\:', ' ')
    text = text.replace('\\;', ' ')
    text = text.replace('\\!', '')
    
    # Remove \quad, \qquad
    text = text.replace('\\quad', '  ')
    text = text.replace('\\qquad', '    ')
    
    # Remove remaining backslashes from unknown commands
    text = re.sub(r'\\([a-zA-Z]+)\s*', '', text)
    
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    return text


def convert_aligned_to_text(latex_content):
    """
    Convert \begin{aligned}...\end{aligned} to plain text lines.
    
    Input:
        a &= b \\
        c &= d
    
    Output:
        a = b
        c = d
    """
    lines = latex_content.split('\\\\')
    result_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Remove alignment markers
        line = line.replace('&', '')
        # Convert symbols
        line = convert_latex_to_unicode(line)
        # Handle superscripts/subscripts
        line = handle_superscripts(line)
        line = handle_subscripts(line)
        # Clean up extra spaces
        line = ' '.join(line.split())
        
        result_lines.append(line)
    
    return result_lines


def convert_array_to_text(latex_content):
    """
    Convert \begin{array}...\end{array} to plain text.
    
    Simple text representation - not perfect but readable.
    """
    lines = latex_content.split('\\\\')
    result_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Remove alignment markers (&)
        line = line.replace('&', '  ')
        # Convert symbols
        line = convert_latex_to_unicode(line)
        # Handle super/subscripts
        line = handle_superscripts(line)
        line = handle_subscripts(line)
        # Clean up
        line = ' '.join(line.split())
        
        result_lines.append(line)
    
    return result_lines


def convert_math_block(latex_math):
    """
    Convert a LaTeX math block to plain Unicode text.
    
    Handles:
    - \begin{aligned}...\end{aligned}
    - \begin{array}...\end{array}
    - Simple math expressions
    """
    # Remove outer $$ or $ if present
    content = latex_math.strip()
    content = content.strip('$').strip()
    
    # Handle aligned environment
    if '\\begin{aligned}' in content:
        match = re.search(r'\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}', content)
        if match:
            aligned_content = match.group(1)
            lines = convert_aligned_to_text(aligned_content)
            return lines
    
    # Handle array environment
    if '\\begin{array}' in content:
        match = re.search(r'\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}', content)
        if match:
            array_content = match.group(1)
            lines = convert_array_to_text(array_content)
            return lines
    
    # Simple math expression
    content = convert_latex_to_unicode(content)
    content = handle_fractions(content)
    content = handle_sqrt(content)
    content = handle_superscripts(content)
    content = handle_subscripts(content)
    content = handle_overline(content)
    content = handle_text_formatting(content)
    content = clean_latex_commands(content)
    
    return [content]


def convert_latex_to_plain_html(latex_text):
    """
    Main function: Convert LaTeX with math to plain HTML for LMS systems.
    
    Process:
    1. Remove ALL $ delimiters (both inline and display)
    2. Convert all LaTeX commands to Unicode
    3. Handle all special formatting
    4. Return clean text without any math delimiters
    """
    if not latex_text:
        return ""
    
    text = latex_text.strip()
    
    # Step 1: Remove ALL $ delimiters while preserving content
    # Replace $$ with nothing (display math delimiter)
    text = text.replace('$$', '')
    # Replace $ with nothing (inline math delimiter)
    text = text.replace('$', '')
    
    # Step 2: Remove \mathrm, \mathbf, \mathit, \mathcal, \mathbb commands
    # These are just formatting - we don't need them in plain text
    text = re.sub(r'\\mathrm\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathbf\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathit\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathcal\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\mathbb\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    
    # Step 3: Convert LaTeX symbols to Unicode
    text = convert_latex_to_unicode(text)
    
    # Step 4: Handle special constructs
    text = handle_fractions(text)
    text = handle_sqrt(text)
    text = handle_superscripts(text)
    text = handle_subscripts(text)
    text = handle_overline(text)
    text = handle_text_formatting(text)
    
    # Step 5: Clean up remaining LaTeX commands
    text = clean_latex_commands(text)
    
    # Step 6: Clean up extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    return text
