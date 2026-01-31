r"""
LaTeX Table Converter - Orchestrator

Main entry point for converting LaTeX tables to Tiptap-compatible HTML.
Combines parser, equation handler, and HTML builder into unified interface.

Phase 3: Integration Module
"""

import logging
from typing import Optional

from .latex_table_parser import LaTeXTableParser, has_latex_table
from .html_table_builder import HTMLTableBuilder

logger = logging.getLogger(__name__)


class LaTeXTableConverterError(Exception):
    """Exception raised when table conversion fails"""
    pass


class LaTeXTableConverter:
    """
    Main orchestrator for converting LaTeX tables to HTML.
    
    Pipeline:
    1. Parse LaTeX table → Structured data
    2. Encode equations in cells → Tiptap format
    3. Build HTML table → Final output
    """
    
    def __init__(self):
        """Initialize converter with parser and builder."""
        self.parser = LaTeXTableParser()
        self.builder = HTMLTableBuilder()
    
    def convert(self, latex_content: str) -> Optional[str]:
        """
        Convert LaTeX table to Tiptap-compatible HTML.
        
        Args:
            latex_content: LaTeX code containing table environment
            
        Returns:
            HTML table string, or None if no table found
            
        Raises:
            LaTeXTableConverterError: If conversion fails
        """
        try:
            # Check if content has table
            if not has_latex_table(latex_content):
                logger.debug("No LaTeX table found in content")
                return None
            
            logger.info("Converting LaTeX table to HTML")
            
            # Step 1: Parse table
            logger.debug("Step 1: Parsing LaTeX table")
            parse_result = self.parser.parse(latex_content)
            rows = parse_result['rows']
            num_columns = parse_result['num_columns']
            header_indices = parse_result['header_indices']
            
            logger.info(f"Parsed table: {len(rows)} rows × {num_columns} columns")
            
            # Step 2: Encode equations in cells
            logger.debug("Step 2: Encoding equations")
            encoded_rows = self._encode_rows(rows)
            logger.debug(f"Encoded {len(encoded_rows)} rows")
            
            # Step 3: Build HTML table
            logger.debug("Step 3: Building HTML table")
            html_table = self.builder.build_table(
                encoded_rows,
                num_columns,
                header_indices
            )
            
            logger.info(f"Generated HTML table ({len(html_table)} chars)")
            return html_table
            
        except Exception as e:
            logger.error(f"Table conversion failed: {e}")
            raise LaTeXTableConverterError(f"Failed to convert table: {e}")
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _encode_rows(self, rows) -> list:
        """
        Encode equations in all cells of all rows.
        
        Args:
            rows: List of rows, each row is list of cells
            
        Returns:
            Encoded rows with Tiptap-formatted equations
        """
        encoded_rows = []
        
        for row_idx, row in enumerate(rows):
            encoded_cells = []
            for cell_idx, cell in enumerate(row):
                try:
                    encoded_cell = self.parser.encode_cell_for_tiptap(cell)
                    encoded_cells.append(encoded_cell)
                except Exception as e:
                    logger.warning(
                        f"Failed to encode cell [{row_idx}][{cell_idx}]: {e}"
                    )
                    # Fallback: use original cell
                    encoded_cells.append(cell)
            
            encoded_rows.append(encoded_cells)
        
        return encoded_rows


# ============================================================================
# STANDALONE FUNCTIONS
# ============================================================================

def convert_latex_table(latex_content: str) -> Optional[str]:
    """
    Convenience function to convert LaTeX table.
    
    Args:
        latex_content: LaTeX code with table environment
        
    Returns:
        HTML table string, or None if no table found
    """
    converter = LaTeXTableConverter()
    return converter.convert(latex_content)


def has_table(text: str) -> bool:
    """
    Check if text contains LaTeX table.
    
    Args:
        text: Text to check
        
    Returns:
        True if table found
    """
    return has_latex_table(text)
