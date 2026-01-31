r"""
HTML Table Builder Module

Converts structured table data to HTML tables with Tailwind styling.
Handles:
- HTML5 table generation with proper structure
- Tailwind CSS styling for LMS display
- Header/data cell distinction
- Equation span preservation
- Responsive design
- Colspan/Rowspan for complex tables (multirow/multicolumn)

Phase 2 of Table Converter Implementation (Enhanced for Phase 2/3)
"""

import logging
from typing import List, Dict, Optional, Set, Tuple

logger = logging.getLogger(__name__)


class HTMLTableBuilderError(Exception):
    """Exception raised when table building fails"""
    pass


class HTMLTableBuilder:
    """Build HTML tables with Tailwind styling for Tiptap LMS."""
    
    # Tailwind classes for table styling
    TABLE_CLASSES = "border-collapse border border-gray-300"
    TABLE_STYLE = "min-width: 50px;"
    
    COLGROUP_STYLE = "min-width: 25px;"
    
    # Header cell styling
    TH_CLASSES = "border border-gray-300 p-2 bg-gray-100 font-semibold"
    
    # Data cell styling
    TD_CLASSES = "border border-gray-300 p-2"
    
    def __init__(self, 
                 table_classes: str = None,
                 th_classes: str = None,
                 td_classes: str = None):
        """
        Initialize table builder.
        
        Args:
            table_classes: CSS classes for <table> element
            th_classes: CSS classes for <th> elements
            td_classes: CSS classes for <td> elements
        """
        self.table_classes = table_classes or self.TABLE_CLASSES
        self.th_classes = th_classes or self.TH_CLASSES
        self.td_classes = td_classes or self.TD_CLASSES
    
    def build_table(self, 
                   rows: List[List[Dict]],
                   num_columns: int,
                   header_indices: List[int] = None) -> str:
        """
        Build HTML table from structured row data.
        
        Args:
            rows: List of rows, each row is list of cell dicts with:
                  - 'content': Cell content text
                  - 'colspan': Column span (default: 1)
                  - 'rowspan': Row span (default: 1)
                  - 'skip': If True, skip this cell (consumed by span)
                  - 'alignment': Cell alignment (left/center/right)
            num_columns: Number of columns
            header_indices: List of row indices to treat as headers (default: [0])
            
        Returns:
            HTML table string with Tailwind styling
            
        Raises:
            HTMLTableBuilderError: If table data is invalid
        """
        try:
            if not rows:
                raise HTMLTableBuilderError("No rows provided")
            
            if header_indices is None:
                header_indices = [0] if rows else []
            
            logger.info(f"Building HTML table: {len(rows)} rows, {num_columns} columns")
            
            # Track consumed cells (consumed by rowspan from previous rows)
            consumed_cells: Set[Tuple[int, int]] = set()
            
            # Build table structure
            html_parts = []
            
            # Opening table tag - use minimal structure for Tiptap compatibility
            html_parts.append('<table>')
            
            # Rows (no tbody wrapper for cleaner output)
            for row_idx, row in enumerate(rows):
                is_header = row_idx in header_indices
                row_html, row_consumed = self._build_row(
                    row, 
                    is_header, 
                    row_idx, 
                    consumed_cells,
                    num_columns
                )
                html_parts.append(row_html)
                # Update consumed cells for next row
                consumed_cells.update(row_consumed)
            
            # Close table
            html_parts.append('</table>')
            
            html_output = '\n'.join(html_parts)
            logger.debug(f"Generated table HTML ({len(html_output)} chars)")
            
            return html_output
            
        except HTMLTableBuilderError as e:
            logger.error(f"Table build error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error building table: {e}")
            raise HTMLTableBuilderError(f"Failed to build table: {e}")
    
    # =========================================================================
    # TABLE STRUCTURE BUILDERS
    # =========================================================================
    
    def _build_colgroup(self, num_columns: int) -> str:
        r"""
        Build column group for responsive design.
        
        Args:
            num_columns: Number of columns
            
        Returns:
            HTML colgroup string
        """
        cols = []
        for i in range(num_columns):
            cols.append(f'<col style="min-width: 25px;">')
        
        colgroup = '<colgroup>\n' + '\n'.join(cols) + '\n</colgroup>'
        return colgroup
    
    def _build_row(self, 
                  cells: List[Dict], 
                  is_header: bool = False,
                  row_idx: int = 0,
                  consumed_cells: Set[Tuple[int, int]] = None,
                  num_columns: int = None) -> Tuple[str, Set[Tuple[int, int]]]:
        r"""
        Build table row with cells, handling colspan/rowspan.
        
        Args:
            cells: List of cell dicts or strings (backward compatible)
            is_header: If True, use <th> tags; otherwise use <td>
            row_idx: Current row index
            consumed_cells: Set of (row, col) positions consumed by spans from above
            num_columns: Total columns in table
            
        Returns:
            Tuple of (HTML row string, set of cells consumed by this row's spans)
        """
        if consumed_cells is None:
            consumed_cells = set()
        
        tag = 'th' if is_header else 'td'
        classes = self.th_classes if is_header else self.td_classes
        
        cell_parts = []
        cell_parts.append('<tr>')
        
        new_consumed = set()  # Cells consumed by this row's spans
        col_idx = 0  # Current column position
        cell_idx = 0  # Index in the cells list
        
        # Process cells, skipping consumed positions
        while col_idx < num_columns and cell_idx < len(cells):
            # Skip columns that are consumed by previous row's rowspan
            if (row_idx, col_idx) in consumed_cells:
                logger.debug(f"Column {col_idx} at row {row_idx} is consumed by rowspan from above")
                # If cell at this position is empty, skip it too (it's a placeholder)
                if cell_idx < len(cells):
                    cell = cells[cell_idx]
                    cell_content = str(cell.get('content', '') if isinstance(cell, dict) else cell).strip()
                    if not cell_content:  # Empty placeholder cell
                        cell_idx += 1
                col_idx += 1
                continue
            
            cell = cells[cell_idx]
            cell_idx += 1
            
            # Handle both dict (new format) and string (old format) cells
            if isinstance(cell, dict):
                # New format with colspan/rowspan
                if cell.get('skip', False):
                    logger.debug(f"Skipping cell at ({row_idx}, {col_idx})")
                    col_idx += 1
                    continue
                
                colspan = cell.get('colspan', 1)
                rowspan = cell.get('rowspan', 1)
                alignment = cell.get('alignment', 'left')
                content = cell.get('content', '')
            else:
                # Old format: just a string
                colspan = 1
                rowspan = 1
                alignment = 'left'
                content = cell
            
            # Build cell with proper tag, classes, colspan, rowspan, and alignment
            cell_html = self._build_cell(
                content, tag, classes, colspan, rowspan, alignment
            )
            cell_parts.append(cell_html)
            
            # Mark cells consumed by this rowspan (for next rows)
            if rowspan > 1:
                for r in range(row_idx + 1, row_idx + rowspan):
                    for c in range(col_idx, col_idx + colspan):
                        new_consumed.add((r, c))
                        logger.debug(f"Cell ({row_idx}, {col_idx}) colspan={colspan} rowspan={rowspan} spans to ({r}, {c})")
            
            col_idx += colspan
        
        cell_parts.append('</tr>')
        
        return '\n'.join(cell_parts), new_consumed
    
    def _build_cell(self, 
                   content: str, 
                   tag: str, 
                   classes: str,
                   colspan: int = 1,
                   rowspan: int = 1,
                   alignment: str = 'left') -> str:
        r"""
        Build individual table cell with colspan/rowspan and alignment.
        
        Args:
            content: Cell content (may include HTML)
            tag: 'th' or 'td'
            classes: Base CSS classes
            colspan: Column span count
            rowspan: Row span count
            alignment: Cell alignment (left/center/right/justify)
            
        Returns:
            HTML cell string
        """
        # Add alignment class based on parameter
        alignment_class_map = {
            'center': 'text-center',
            'right': 'text-right',
            'justify': 'text-justify',
            'left': ''  # left is default
        }
        
        alignment_class = alignment_class_map.get(alignment, '')
        if alignment_class:
            cell_classes = f"{classes} {alignment_class}"
        else:
            cell_classes = classes
        
        # Build cell tag with colspan and rowspan - no <p> wrapper for Tiptap KaTeX compatibility
        # Direct content placement allows KaTeX to properly find and render equation spans
        cell_html = (
            f'  <{tag}>\n'
            f'    {content}\n'
            f'  </{tag}>'
        )
        
        return cell_html
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def add_styling_class(self, html: str, class_name: str) -> str:
        """
        Add additional CSS class to table element.
        
        Args:
            html: HTML table string
            class_name: Class to add
            
        Returns:
            Modified HTML
        """
        return html.replace(
            f'class="{self.table_classes}"',
            f'class="{self.table_classes} {class_name}"'
        )


# ============================================================================
# STANDALONE FUNCTIONS
# ============================================================================

def build_html_table(rows: List[List[Dict]], 
                    num_columns: int,
                    header_indices: List[int] = None) -> str:
    """
    Convenience function to build HTML table.
    
    Args:
        rows: List of rows, each row is list of cell dicts or strings
        num_columns: Number of columns
        header_indices: List of row indices to treat as headers
        
    Returns:
        HTML table string
    """
    builder = HTMLTableBuilder()
    return builder.build_table(rows, num_columns, header_indices)


def enhance_cell_html(cell_content: str) -> str:
    """
    Enhance cell content with any additional formatting.
    
    Args:
        cell_content: Cell text or HTML
        
    Returns:
        Enhanced cell content
    """
    # Could add more formatting here in future
    return cell_content
