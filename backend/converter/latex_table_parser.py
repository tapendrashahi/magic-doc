r"""
LaTeX Table Parser Module

Converts LaTeX tabular/array environments to structured table data.
Handles:
- Basic tabular environments: \begin{tabular}...\end{tabular}
- Array environments: \begin{array}...\end{array}
- Column specifications: {|l|c|r|}
- Row separators: \\
- Header detection: \hline or first row
- Cell content: text, equations, LaTeX commands
- Complex tables: \multirow and \multicolumn commands (Phase 3)

Phase 1 of Table Converter Implementation
Phase 3: Multirow/Multicolumn Integration
"""

import re
import logging
from typing import List, Dict, Tuple, Optional, Union
from urllib.parse import quote
from .multirow_parser import MultirowMulticolumnParser

logger = logging.getLogger(__name__)


class TableParseError(Exception):
    """Exception raised when table parsing fails"""
    pass


class LaTeXTableParser:
    """Parse LaTeX tabular/array environments to structured table data."""
    
    def __init__(self):
        """Initialize the parser."""
        self.column_spec = ""
        self.num_columns = 0
        self.rows = []
        self.is_header = None
        self.table_type = None  # 'tabular' or 'array'
    
    def parse(self, latex_content: str) -> Dict[str, any]:
        """
        Parse LaTeX table content and return structured data.
        
        Args:
            latex_content: LaTeX code containing table environment
            
        Returns:
            Dictionary with keys:
                - 'table_type': 'tabular' or 'array'
                - 'column_spec': Column specification string
                - 'num_columns': Number of columns
                - 'rows': List of rows, each row is list of cells (dicts with colspan/rowspan)
                - 'header_indices': List of row indices that are headers
                
        Raises:
            TableParseError: If parsing fails
        """
        try:
            # Extract table environment
            table_content = self._extract_table_environment(latex_content)
            if not table_content:
                raise TableParseError("No table environment found")
            
            # Get table type and column spec
            self.table_type, self.column_spec = self._parse_table_header(latex_content)
            self.num_columns = self._count_columns(self.column_spec)
            
            logger.info(f"Parsing {self.table_type} with {self.num_columns} columns")
            
            # Parse table content
            self.rows = self._parse_rows(table_content)
            
            # Phase 3: Detect and enhance with multirow/multicolumn metadata
            self.rows = self._enhance_rows_with_spans(self.rows, latex_content)
            
            header_indices = self._detect_header_rows()
            
            logger.info(f"Parsed {len(self.rows)} rows, headers at indices: {header_indices}")
            
            return {
                'table_type': self.table_type,
                'column_spec': self.column_spec,
                'num_columns': self.num_columns,
                'rows': self.rows,
                'header_indices': header_indices
            }
            
        except TableParseError as e:
            logger.error(f"Table parse error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error parsing table: {e}")
            raise TableParseError(f"Failed to parse table: {e}")
    
    # =========================================================================
    # EXTRACTION METHODS
    # =========================================================================
    
    def _extract_table_environment(self, latex_content: str) -> Optional[str]:
        r"""
        Extract content between \begin{tabular/array} and \end{tabular/array}.
        
        Args:
            latex_content: Full LaTeX content
            
        Returns:
            Table content without environment markers, or None if not found
        """
        # Try tabular first
        match = re.search(
            r'\\begin\{tabular\}\{[^}]*\}(.*?)\\end\{tabular\}',
            latex_content,
            re.DOTALL
        )
        if match:
            self.table_type = 'tabular'
            return match.group(1).strip()
        
        # Try array environment
        match = re.search(
            r'\\begin\{array\}\{[^}]*\}(.*?)\\end\{array\}',
            latex_content,
            re.DOTALL
        )
        if match:
            self.table_type = 'array'
            return match.group(1).strip()
        
        # Try generic table environment
        match = re.search(
            r'\\begin\{table\}(.*?)\\end\{table\}',
            latex_content,
            re.DOTALL
        )
        if match:
            self.table_type = 'table'
            return match.group(1).strip()
        
        return None
    
    def _parse_table_header(self, latex_content: str) -> Tuple[str, str]:
        r"""
        Extract table type and column specification.
        
        Args:
            latex_content: Full LaTeX content
            
        Returns:
            Tuple of (table_type, column_spec)
        """
        # Try tabular
        match = re.search(r'\\begin\{tabular\}\{([^}]*)\}', latex_content)
        if match:
            return 'tabular', match.group(1)
        
        # Try array
        match = re.search(r'\\begin\{array\}\{([^}]*)\}', latex_content)
        if match:
            return 'array', match.group(1)
        
        # Try table (column spec may be missing)
        if '\\begin{table}' in latex_content:
            return 'table', ''
        
        return 'unknown', ''
    
    # =========================================================================
    # COLUMN SPECIFICATION
    # =========================================================================
    
    def _count_columns(self, column_spec: str) -> int:
        """
        Count columns from column specification.
        
        Examples:
            {|l|l|} → 2
            {cc} → 2
            {|l|c|r|} → 3
            
        Args:
            column_spec: Column specification string
            
        Returns:
            Number of columns
        """
        if not column_spec:
            return 0
        
        # Remove pipes and special chars to count column letters
        # Valid column specifiers: l, c, r, p, m, b, w, W, Z
        columns = re.findall(r'[lcrpmbjwWZ]', column_spec)
        
        if columns:
            return len(columns)
        
        # Fallback: count by splitting on pipes
        return column_spec.count('|') - 1
    
    # =========================================================================
    # ROW AND CELL PARSING
    # =========================================================================
    
    def _parse_rows(self, table_content: str) -> List[List[str]]:
        """
        Split table content into rows and cells.
        
        Args:
            table_content: Content between \begin and \end
            
        Returns:
            List of rows, each row is a list of cells
        """
        rows = []
        
        # Split by row separator (\\)
        # But be careful with \hline, which shouldn't be a row separator
        parts = re.split(r'\\\\(?!line)', table_content)
        
        for part in parts:
            part = part.strip()
            if not part or part == r'\hline':
                continue
            
            # Remove \hline from within row
            part = part.replace(r'\hline', '').strip()
            if not part:
                continue
            
            # Split cells by &
            cells = self._split_cells(part)
            
            # Ensure correct number of columns
            while len(cells) < self.num_columns:
                cells.append('')
            cells = cells[:self.num_columns]
            
            # Clean cell content
            cells = [cell.strip() for cell in cells]
            rows.append(cells)
        
        logger.debug(f"Parsed {len(rows)} rows from table content")
        return rows
    
    def _split_cells(self, row_content: str) -> List[str]:
        r"""
        Split row content into cells by & separator.
        Handles escaped ampersands and ampersands in equations.
        
        Args:
            row_content: Row content string
            
        Returns:
            List of cell contents
        """
        cells = []
        current_cell = ""
        i = 0
        
        while i < len(row_content):
            char = row_content[i]
            
            # Check for escaped ampersand
            if char == '\\' and i + 1 < len(row_content) and row_content[i + 1] == '&':
                current_cell += '&'
                i += 2
                continue
            
            # Check for cell separator
            if char == '&':
                cells.append(current_cell.strip())
                current_cell = ""
                i += 1
                continue
            
            current_cell += char
            i += 1
        
        # Add final cell
        if current_cell or cells:
            cells.append(current_cell.strip())
        
        logger.debug(f"Split row into {len(cells)} cells")
        return cells
    
    # =========================================================================
    # HEADER DETECTION
    # =========================================================================
    
    def _detect_header_rows(self) -> List[int]:
        """
        Detect which rows are headers based on \hline or position.
        
        Returns:
            List of row indices that are headers
        """
        header_indices = []
        
        # Simple heuristic: first row is header if there's content
        if self.rows:
            header_indices.append(0)
        
        logger.debug(f"Detected header rows at indices: {header_indices}")
        return header_indices
    
    # =========================================================================
    # PHASE 3: MULTIROW/MULTICOLUMN ENHANCEMENT
    # =========================================================================
    
    def _enhance_rows_with_spans(self, rows: List[List[str]], latex_content: str) -> List[List[Union[str, Dict]]]:
        """
        Enhance rows with colspan/rowspan metadata from multirow/multicolumn commands.
        
        Converts cells from plain strings to dicts containing:
            - 'content': Cell content
            - 'colspan': Number of columns to span (default 1)
            - 'rowspan': Number of rows to span (default 1)
            - 'alignment': Cell alignment (left/center/right/justify)
        
        Args:
            rows: List of rows, each row is list of string cells
            latex_content: Original LaTeX content (for multirow/multicolumn detection)
            
        Returns:
            Enhanced rows with dict cells
        """
        try:
            parser = MultirowMulticolumnParser()
            
            # Check if table has complex spans
            has_multirow = parser.has_multirow(latex_content)
            has_multicolumn = parser.has_multicolumn(latex_content)
            
            if not (has_multirow or has_multicolumn):
                # No complex spans - convert strings to dicts with default spans
                logger.debug("No multirow/multicolumn detected - using default spans")
                return self._convert_to_dict_cells(rows)
            
            logger.info("Detecting multirow/multicolumn spans")
            
            # Parse multirow commands
            multirows = []
            if has_multirow:
                _, multirows = parser.parse_multirow(latex_content)
                logger.info(f"Found {len(multirows)} multirow commands")
            
            # Parse multicolumn commands
            multicolumns = []
            if has_multicolumn:
                _, multicolumns = parser.parse_multicolumn(latex_content)
                logger.info(f"Found {len(multicolumns)} multicolumn commands")
            
            # Convert rows to dict cells and apply span metadata
            enhanced_rows = self._convert_to_dict_cells(rows)
            
            # Apply multirow spans
            if multirows:
                enhanced_rows = self._apply_multirow_spans(enhanced_rows, multirows)
            
            # Apply multicolumn spans
            if multicolumns:
                enhanced_rows = self._apply_multicolumn_spans(enhanced_rows, multicolumns)
            
            logger.info(f"Enhanced {len(enhanced_rows)} rows with span metadata")
            return enhanced_rows
            
        except Exception as e:
            logger.warning(f"Failed to enhance rows with spans: {e}")
            # Fallback: convert to dict format with default spans
            return self._convert_to_dict_cells(rows)
    
    def _convert_to_dict_cells(self, rows: List[List[str]]) -> List[List[Dict]]:
        """
        Convert string cells to dict cells with default metadata.
        
        Args:
            rows: List of rows with string cells
            
        Returns:
            Rows with dict cells
        """
        dict_rows = []
        for row in rows:
            dict_cells = []
            for cell in row:
                dict_cell = {
                    'content': cell,
                    'colspan': 1,
                    'rowspan': 1,
                    'alignment': 'left'
                }
                dict_cells.append(dict_cell)
            dict_rows.append(dict_cells)
        return dict_rows
    
    def _apply_multirow_spans(self, rows: List[List[Dict]], multirows: List[Dict]) -> List[List[Dict]]:
        """
        Apply multirow span metadata to cells and extract content from LaTeX command.
        
        Args:
            rows: Enhanced rows with dict cells
            multirows: List of multirow command info
            
        Returns:
            Rows with rowspan applied and LaTeX command removed from content
        """
        # Process each multirow command in order of appearance (they come in order!)
        for multirow_info in multirows:
            content = multirow_info.get('content', '')
            rows_to_span = multirow_info.get('rows', 1)
            valign = multirow_info.get('valign', 't')
            full_match = multirow_info.get('full_match', '')
            
            # Find and process the FIRST cell containing this exact LaTeX command
            found = False
            for row_idx, row in enumerate(rows):
                if found:
                    break
                    
                for col_idx, cell in enumerate(row):
                    if found:
                        break
                        
                    cell_content = str(cell.get('content', ''))
                    
                    # Look for the full LaTeX command in this cell
                    if full_match and full_match in cell_content:
                        # Replace the full LaTeX command with just the content
                        cell['content'] = cell_content.replace(full_match, content).strip()
                        
                        # Apply rowspan to this cell
                        cell['rowspan'] = rows_to_span
                        
                        # Map vertical alignment
                        if valign == 't':
                            cell['alignment'] = 'left'  # top-left
                        elif valign == 'c':
                            cell['alignment'] = 'center'
                        elif valign == 'b':
                            cell['alignment'] = 'left'  # bottom-left
                        
                        logger.debug(f"Applied rowspan={rows_to_span} to cell [{row_idx}][{col_idx}], content: {cell['content'][:50]}")
                        found = True
                        break
        
        return rows
    
    def _apply_multicolumn_spans(self, rows: List[List[Dict]], multicolumns: List[Dict]) -> List[List[Dict]]:
        """
        Apply multicolumn span metadata to cells and extract content from LaTeX command.
        
        Args:
            rows: Enhanced rows with dict cells
            multicolumns: List of multicolumn command info
            
        Returns:
            Rows with colspan applied and LaTeX command removed from content
        """
        # Track which multicolumn commands have been applied (index tracking)
        multicolumn_count = {}  # content -> count of how many we've seen
        
        for multicolumn_info in multicolumns:
            content = multicolumn_info.get('content', '')
            cols_to_span = multicolumn_info.get('cols', 1)
            alignment = multicolumn_info.get('alignment', 'left')
            full_match = multicolumn_info.get('full_match', '')
            
            # Initialize counter for this content if needed
            if content not in multicolumn_count:
                multicolumn_count[content] = 0
            
            matches_found = 0
            target_match_index = multicolumn_count[content]
            
            # Find cell containing this multicolumn command
            for row_idx, row in enumerate(rows):
                for col_idx, cell in enumerate(row):
                    cell_content = str(cell.get('content', ''))
                    
                    # Match either the full LaTeX command or just the content
                    if full_match and full_match in cell_content:
                        # Only process if this is the target instance of this multicolumn
                        if matches_found == target_match_index:
                            # Replace the full LaTeX command with just the content
                            cell['content'] = cell_content.replace(full_match, content).strip()
                            
                            # Apply colspan to this cell
                            cell['colspan'] = cols_to_span
                            cell['alignment'] = alignment
                            
                            logger.debug(f"Applied colspan={cols_to_span} to cell [{row_idx}][{col_idx}], content: {cell['content'][:50]}")
                            multicolumn_count[content] += 1
                            break
                        else:
                            matches_found += 1
                    elif content in cell_content and full_match not in cell_content:
                        # Fallback: content is directly in cell (partial match, no LaTeX command)
                        if matches_found == target_match_index:
                            cell['colspan'] = cols_to_span
                            cell['alignment'] = alignment
                            
                            logger.debug(f"Applied colspan={cols_to_span} to cell [{row_idx}][{col_idx}] (partial match)")
                            multicolumn_count[content] += 1
                            break
                        else:
                            matches_found += 1
        
        return rows
    
    # =========================================================================
    # EQUATION DETECTION AND ENCODING
    # =========================================================================
    
    def find_equations_in_cell(self, cell_content: str) -> List[Dict[str, str]]:
        """
        Find all equations in cell content.
        
        Args:
            cell_content: Cell text content
            
        Returns:
            List of dicts with 'latex', 'start', 'end' keys
        """
        equations = []
        
        # Find inline math: $...$
        for match in re.finditer(r'\$([^$]+)\$', cell_content):
            equations.append({
                'type': 'inline',
                'latex': match.group(1),
                'start': match.start(),
                'end': match.end(),
                'full_match': match.group(0)
            })
        
        # Find display math: $$...$$
        for match in re.finditer(r'\$\$([^$]+)\$\$', cell_content):
            equations.append({
                'type': 'display',
                'latex': match.group(1),
                'start': match.start(),
                'end': match.end(),
                'full_match': match.group(0)
            })
        
        logger.debug(f"Found {len(equations)} equations in cell")
        return equations
    
    def encode_cell_for_tiptap(self, cell_content: Union[str, Dict]) -> Union[str, Dict]:
        """
        Convert cell content to Tiptap format with URL-encoded equations.
        
        Handles both string cells (legacy) and dict cells (Phase 3+) with span metadata.
        
        Args:
            cell_content: Cell content (string or dict with 'content', 'colspan', 'rowspan', 'alignment')
            
        Returns:
            Cell content with equations wrapped in tiptap-katex spans
        """
        # Handle dict cells (Phase 3+)
        if isinstance(cell_content, dict):
            content_str = cell_content.get('content', '')
            
            # Find and encode equations in content
            equations = self.find_equations_in_cell(content_str)
            
            if equations:
                # Sort by position (reverse order to process from end)
                equations.sort(key=lambda x: x['start'], reverse=True)
                
                result = content_str
                
                # Replace each equation
                for eq in equations:
                    latex = eq['latex'].strip()
                    encoded = quote(latex, safe='()')
                    span = f'<span class="tiptap-katex" data-latex="{encoded}"></span>'
                    result = result[:eq['start']] + span + result[eq['end']:]
                
                # Update dict with encoded content
                cell_content['content'] = result
            
            logger.debug(f"Encoded dict cell: colspan={cell_content.get('colspan', 1)}, rowspan={cell_content.get('rowspan', 1)}")
            return cell_content
        
        # Handle string cells (legacy)
        # Find all equations
        equations = self.find_equations_in_cell(cell_content)
        
        if not equations:
            return cell_content
        
        # Sort by position (reverse order to process from end)
        equations.sort(key=lambda x: x['start'], reverse=True)
        
        result = cell_content
        
        # Replace each equation
        for eq in equations:
            latex = eq['latex'].strip()
            
            # URL encode the LaTeX
            encoded = quote(latex, safe='()')
            
            # Create Tiptap span
            span = f'<span class="tiptap-katex" data-latex="{encoded}"></span>'
            
            # Replace in result
            result = result[:eq['start']] + span + result[eq['end']:]
        
        logger.debug(f"Encoded string cell content: {result[:100]}...")
        return result
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def get_summary(self) -> Dict[str, any]:
        """Get parsing summary for logging."""
        return {
            'table_type': self.table_type,
            'columns': self.num_columns,
            'rows': len(self.rows),
            'column_spec': self.column_spec,
        }


# ============================================================================
# STANDALONE FUNCTIONS
# ============================================================================

def parse_latex_table(latex_content: str) -> Dict[str, any]:
    """
    Convenience function to parse LaTeX table.
    
    Args:
        latex_content: LaTeX code with table environment
        
    Returns:
        Structured table data
    """
    parser = LaTeXTableParser()
    return parser.parse(latex_content)


def has_latex_table(text: str) -> bool:
    """
    Check if text contains LaTeX table environment.
    
    Args:
        text: Text to check
        
    Returns:
        True if table environment found
    """
    patterns = [
        r'\\begin\{tabular\}',
        r'\\begin\{array\}',
        r'\\begin\{table\}',
    ]
    return any(re.search(pattern, text) for pattern in patterns)
