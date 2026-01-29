r"""
LaTeX Normalizer Module

Normalizes Mathpix-specific LaTeX commands and handles unsupported constructs.
Converts invalid/unsupported commands to KaTeX-compatible equivalents.

This module handles:
1. Command replacements (\Varangle -> \angle, \overparen -> \widehat)
2. Table/Array environment preservation and normalization
3. Stray symbol cleanup
4. Spacing normalization
"""

import re
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class LatexNormalizer:
    r"""
    Normalizes LaTeX code for KaTeX rendering.
    
    Key normalizations:
    - \Varangle -> \angle (Mathpix angle command to KaTeX angle)
    - \overparen{...} -> \widehat{...} (arc notation)
    - Remove stray degree symbols before math commands
    - Clean spacing in complex expressions
    - Preserve table/array environments with proper formatting
    
    Usage:
        normalizer = LatexNormalizer()
        normalized = normalizer.normalize(latex_string)
    """
    
    # Normalization rules - ordered for safe replacement
    NORMALIZATION_RULES = [
        # Rule 1: Replace \Varangle with \angle
        # Pattern: \Varangle followed by spaces and content
        {
            'name': 'Varangle to angle',
            'pattern': r'\\Varangle\s+',
            'replacement': r'\\angle ',
            'flags': re.IGNORECASE
        },
        
        # Rule 2: Replace \overparen with \widehat (with or without space after)
        {
            'name': 'overparen to widehat',
            'pattern': r'\\overparen\s*\{',
            'replacement': r'\\widehat{',
            'flags': 0
        },
        
        # Rule 3: Replace \overarc (alias for \widehat)
        {
            'name': 'overarc to widehat',
            'pattern': r'\\overarc\s*\{',
            'replacement': r'\\widehat{',
            'flags': 0
        },
        
        # Rule 4: Remove stray degree symbols (∘) before math commands
        # Pattern: ∘ or degree symbol followed by \command
        {
            'name': 'Remove stray degree symbols',
            'pattern': r'[°∘]\s*\\',
            'replacement': r'\\',
            'flags': 0
        },
        
        # Rule 5: Fix spacing in angle expressions with × (multiply)
        # Pattern: \angle M × R becomes \angle MXR
        # First normalize the space issue
        {
            'name': 'Normalize angle with multiply',
            'pattern': r'\\angle\s+(\w)\s*×\s*(\w)',
            'replacement': r'\\angle \1\2',  # Remove × symbol between letters
            'flags': 0
        },
        
        # Rule 6: Fix missing spaces after angle commands in expressions
        # This handles: \angleACB becoming \angle ACB
        {
            'name': 'Fix angle spacing',
            'pattern': r'\\angle([A-Z]{2,})',
            'replacement': r'\\angle \1',
            'flags': 0
        },
        
        # Rule 7: Clean up multiple spaces (but preserve table structure)
        # Don't apply inside environments like array/tabular
        {
            'name': 'Clean multiple spaces',
            'pattern': r'(?<!\\)\s{2,}(?!\\)',
            'replacement': r' ',
            'flags': 0,
            'skip_in_env': ['array', 'tabular', 'aligned']
        }
    ]
    
    def __init__(self):
        """Initialize the normalizer with compiled patterns"""
        self.compiled_rules = []
        for rule in self.NORMALIZATION_RULES:
            try:
                compiled = re.compile(rule['pattern'], rule.get('flags', 0))
                self.compiled_rules.append({
                    **rule,
                    'compiled': compiled
                })
            except re.error as e:
                logger.error(f"Failed to compile pattern for {rule['name']}: {e}")
    
    def normalize(self, latex: str, skip_tables: bool = False) -> str:
        """
        Normalize LaTeX string for KaTeX rendering.
        
        Args:
            latex: Input LaTeX string
            skip_tables: If True, skip table normalization to preserve structure
            
        Returns:
            Normalized LaTeX string
        """
        if not latex or not isinstance(latex, str):
            return latex
        
        result = latex
        
        # Apply all normalization rules
        for rule in self.compiled_rules:
            # Skip rules marked as environment-specific if needed
            if skip_tables and 'skip_in_env' in rule:
                continue
            
            try:
                result = rule['compiled'].sub(
                    rule['replacement'],
                    result
                )
            except Exception as e:
                logger.warning(
                    f"Error applying rule '{rule['name']}': {e}"
                )
                # Continue with other rules even if one fails
                continue
        
        return result
    
    def normalize_equation(self, latex: str) -> str:
        """
        Normalize a single equation LaTeX string.
        
        This is a more conservative version that doesn't alter spacing
        much since equations should be self-contained.
        
        Args:
            latex: Equation LaTeX string (without $ delimiters)
            
        Returns:
            Normalized equation LaTeX
        """
        # Replace problematic commands
        result = latex
        
        # Replace Mathpix-specific commands
        result = re.sub(r'\\Varangle\s+', r'\\angle ', result, flags=re.IGNORECASE)
        
        # Handle \overparen in all forms:
        # 1. \overparen{...} -> \widehat{...}
        result = re.sub(r'\\overparen\s*\{', r'\\widehat{', result)
        
        # 2. \overparen... (without braces) -> treat as \widehat but keep what follows
        #    e.g., \overparenAB -> \widehat{AB}
        result = re.sub(r'\\overparen([A-Z]+)', r'\\widehat{\1}', result)
        
        # Handle \overarc similarly
        result = re.sub(r'\\overarc\s*\{', r'\\widehat{', result)
        result = re.sub(r'\\overarc([A-Z]+)', r'\\widehat{\1}', result)
        
        # Remove stray degree symbols before commands
        result = re.sub(r'[°∘]\s*\\', r'\\', result)
        
        # Clean up obvious spacing issues but preserve math structure
        # Fix angle expressions: \angle ACB
        result = re.sub(r'\\angle([A-Z]{2,})', r'\\angle \1', result)
        
        return result
    
    def extract_tables(self, text: str) -> Tuple[str, list]:
        """
        Extract table/array environments to preserve them during processing.
        
        Args:
            text: LaTeX text potentially containing tables
            
        Returns:
            Tuple of (text_with_placeholders, table_list)
            where text_with_placeholders has __TABLE_N__ placeholders
            and table_list contains the extracted table environments
        """
        tables = []
        result = text
        
        # Match \begin{tabular}...\end{tabular}
        tabular_pattern = r'\\begin\{tabular\}[^}]*\}(.+?)\\end\{tabular\}'
        for match in re.finditer(tabular_pattern, result, re.DOTALL):
            table_content = match.group(0)
            tables.append({
                'type': 'tabular',
                'content': table_content
            })
            placeholder = f'__TABLE_{len(tables)-1}__'
            result = result.replace(table_content, placeholder, 1)
        
        # Match \begin{array}...\end{array}
        array_pattern = r'\\begin\{array\}[^}]*\}(.+?)\\end\{array\}'
        for match in re.finditer(array_pattern, result, re.DOTALL):
            table_content = match.group(0)
            tables.append({
                'type': 'array',
                'content': table_content
            })
            placeholder = f'__TABLE_{len(tables)-1}__'
            result = result.replace(table_content, placeholder, 1)
        
        logger.info(f"Extracted {len(tables)} tables")
        return result, tables
    
    def restore_tables(self, text: str, tables: list) -> str:
        """
        Restore extracted table environments back into text.
        
        Args:
            text: Text with table placeholders
            tables: List of tables from extract_tables
            
        Returns:
            Text with tables restored
        """
        result = text
        
        for i, table_info in enumerate(tables):
            placeholder = f'__TABLE_{i}__'
            result = result.replace(placeholder, table_info['content'])
        
        return result
    
    def normalize_table_content(self, table_latex: str) -> str:
        """
        Normalize content inside a table environment.
        
        Applies command replacements but preserves table structure.
        
        Args:
            table_latex: Complete table environment including \begin and \end
            
        Returns:
            Normalized table with commands replaced
        """
        # Apply normalizations while preserving structure
        result = table_latex
        
        # Replace Mathpix commands inside tables
        result = re.sub(r'\\Varangle\s+', r'\\angle ', result)
        result = re.sub(r'\\overparen\s*\{', r'\\widehat{', result)
        result = re.sub(r'\\overparen([A-Z]+)', r'\\widehat{\1}', result)
        result = re.sub(r'\\overarc\s*\{', r'\\widehat{', result)
        result = re.sub(r'\\overarc([A-Z]+)', r'\\widehat{\1}', result)
        
        # Remove stray symbols
        result = re.sub(r'[°∘]\s*\\', r'\\', result)
        
        return result
    
    @staticmethod
    def fix_spacing_after_commands(latex: str) -> str:
        """
        Ensure proper spacing after LaTeX commands.
        
        Fixes cases like \angleACB -> \angle ACB
        
        Args:
            latex: LaTeX string
            
        Returns:
            LaTeX with fixed spacing
        """
        # After \angle, \arc, \overline, etc., ensure space before uppercase letter
        result = latex
        
        # Commands that should have space after them
        commands_needing_space = [
            'angle', 'arc', 'overline', 'underline', 'widehat'
        ]
        
        for cmd in commands_needing_space:
            # Pattern: \command followed directly by uppercase letters
            pattern = fr'\\{cmd}([A-Z])'
            replacement = fr'\\{cmd} \1'
            result = re.sub(pattern, replacement, result)
        
        return result
    
    @staticmethod
    def validate_balanced_braces(latex: str) -> bool:
        """
        Check if braces are balanced in LaTeX string.
        
        Args:
            latex: LaTeX string to validate
            
        Returns:
            True if braces are balanced, False otherwise
        """
        count = 0
        for char in latex:
            if char == '{':
                count += 1
            elif char == '}':
                count -= 1
                if count < 0:
                    return False
        return count == 0


# Convenience function for single use
def normalize_latex(latex: str, normalize_tables: bool = False) -> str:
    """
    Quick normalization function (no class instantiation needed).
    
    Args:
        latex: LaTeX string to normalize
        normalize_tables: If True, also normalize table content
        
    Returns:
        Normalized LaTeX string
    """
    normalizer = LatexNormalizer()
    return normalizer.normalize(latex, skip_tables=not normalize_tables)


# Testing
if __name__ == "__main__":
    print("Testing LatexNormalizer...")
    print("=" * 60)
    
    normalizer = LatexNormalizer()
    
    # Test 1: \Varangle replacement
    test1 = r"In triangle $ABC$, $\Varangle ABC = 70°$"
    result1 = normalizer.normalize(test1)
    print(f"Test 1 - Varangle:")
    print(f"  Input:  {test1}")
    print(f"  Output: {result1}")
    print()
    
    # Test 2: \overparen replacement
    test2 = r"Arc notation: $\overparen{AB} = \overparen{CD}$"
    result2 = normalizer.normalize(test2)
    print(f"Test 2 - overparen:")
    print(f"  Input:  {test2}")
    print(f"  Output: {result2}")
    print()
    
    # Test 3: Complex expression
    test3 = r"$\Varangle MXR = \frac{1}{2}(\overparenMR - \overparenNS)$"
    result3 = normalizer.normalize_equation(test3)
    print(f"Test 3 - Complex equation:")
    print(f"  Input:  {test3}")
    print(f"  Output: {result3}")
    print()
    
    # Test 4: Table extraction
    test4 = r"""
    Text before.
    
    \begin{tabular}{|c|c|}
    \hline
    $\Varangle A$ & Result \\
    \hline
    \end{tabular}
    
    Text after.
    """
    result4, tables = normalizer.extract_tables(test4)
    print(f"Test 4 - Table extraction:")
    print(f"  Found {len(tables)} table(s)")
    print(f"  Text with placeholder: {result4[:50]}...")
    if tables:
        normalized_table = normalizer.normalize_table_content(tables[0]['content'])
        print(f"  Normalized table: {normalized_table[:60]}...")
    print()
    
    print("=" * 60)
    print("✓ LatexNormalizer ready")
