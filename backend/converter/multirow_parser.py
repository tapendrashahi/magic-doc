"""
Multirow & Multicolumn Parser Module

Parses LaTeX multirow and multicolumn commands from table cells.
Handles:
- \\multirow[valign]{nrows}{width}{content}
- \\multicolumn{ncols}{pos}{content}

Builds cell maps for tracking spans and generating correct HTML.
"""

import re
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class MultirowMulticolumnParser:
    """
    Parser for LaTeX multirow and multicolumn commands.
    
    Extracts span information and builds cell maps for HTML generation.
    """
    
    # Pattern for \multirow command
    # \multirow[valign]{nrows}{width}{content}
    # valign: t (top), c (center), b (bottom) - optional
    # nrows: number of rows to span, or * for auto
    # width: width specification, or * for auto
    # content: cell content
    MULTIROW_PATTERN = re.compile(
        r'\\multirow\s*(?:\[([tcb])\])?\s*\{(\d+|\*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}',
        re.IGNORECASE
    )
    
    # Pattern for \multicolumn command
    # \multicolumn{ncols}{pos}{content}
    # ncols: number of columns to span
    # pos: position spec (alignment + borders), e.g., |c|, l, r, etc.
    # content: cell content
    MULTICOLUMN_PATTERN = re.compile(
        r'\\multicolumn\s*\{(\d+)\}\s*\{([^}]*)\}\s*\{([^}]*)\}',
        re.IGNORECASE
    )
    
    def __init__(self):
        """Initialize the parser"""
        self.multirow_commands = []
        self.multicolumn_commands = []
        self.cell_map = {}
    
    def parse_multirow(self, text: str) -> Tuple[str, List[Dict]]:
        """
        Parse multirow commands from text.
        
        Args:
            text: LaTeX text containing multirow commands
            
        Returns:
            Tuple of (modified_text, multirow_list)
            where multirow_list contains dicts with:
            - 'content': The cell content
            - 'rows': Number of rows to span
            - 'valign': Vertical alignment (t/c/b)
            - 'width': Width spec (* for auto)
        """
        multirows = []
        result = text
        
        for match in re.finditer(self.MULTIROW_PATTERN, text):
            valign = match.group(1) or 'c'  # Default to center
            nrows = match.group(2)
            width = match.group(3)
            content = match.group(4)
            
            multirow_info = {
                'content': content.strip(),
                'rows': int(nrows) if nrows != '*' else 1,
                'valign': valign,
                'width': width,
                'full_match': match.group(0),
                'position': match.start()
            }
            multirows.append(multirow_info)
            
            logger.debug(f"Found multirow: rows={multirow_info['rows']}, content={content[:30]}")
        
        self.multirow_commands = multirows
        return result, multirows
    
    def parse_multicolumn(self, text: str) -> Tuple[str, List[Dict]]:
        """
        Parse multicolumn commands from text.
        
        Args:
            text: LaTeX text containing multicolumn commands
            
        Returns:
            Tuple of (modified_text, multicolumn_list)
            where multicolumn_list contains dicts with:
            - 'content': The cell content
            - 'cols': Number of columns to span
            - 'alignment': Text alignment (l/c/r/p)
            - 'pos': Full position specification
        """
        multicolumns = []
        result = text
        
        for match in re.finditer(self.MULTICOLUMN_PATTERN, text):
            ncols = match.group(1)
            pos = match.group(2)
            content = match.group(3)
            
            # Extract alignment from position spec
            # Position can be: "c", "|c|", "l", "|r|", "p{2cm}", etc.
            alignment = self._extract_alignment(pos)
            
            multicolumn_info = {
                'content': content.strip(),
                'cols': int(ncols),
                'alignment': alignment,
                'pos': pos,
                'full_match': match.group(0),
                'position': match.start()
            }
            multicolumns.append(multicolumn_info)
            
            logger.debug(f"Found multicolumn: cols={multicolumn_info['cols']}, align={alignment}")
        
        self.multicolumn_commands = multicolumns
        return result, multicolumns
    
    def _extract_alignment(self, pos: str) -> str:
        """
        Extract alignment from position specification.
        
        Args:
            pos: Position spec like "|c|", "l", "r", "p{2cm}", etc.
            
        Returns:
            Alignment: 'left', 'center', 'right', or 'justify'
        """
        # Remove pipes and whitespace
        spec = pos.replace('|', '').strip()
        
        if not spec:
            return 'left'
        
        # First character is usually the alignment
        first_char = spec[0].lower()
        
        alignment_map = {
            'c': 'center',
            'r': 'right',
            'l': 'left',
            'j': 'justify',
            'p': 'left',  # p{...} (paragraph) defaults to left
        }
        
        return alignment_map.get(first_char, 'left')
    
    def build_cell_map(self, cells: List[Dict], num_rows: int, num_cols: int) -> Dict:
        """
        Build a cell map showing which cells are spanned by multirow/multicolumn.
        
        This tracks which (row, col) positions are "consumed" by spans.
        
        Args:
            cells: List of cell dicts with row, col, content, etc.
            num_rows: Total number of rows in table
            num_cols: Total number of columns in table
            
        Returns:
            Cell map dict: {(row, col): {metadata}}
        """
        cell_map = {}
        consumed_cells = set()  # Track which (row, col) are part of spans
        
        for cell in cells:
            row = cell.get('row', 0)
            col = cell.get('col', 0)
            
            # Skip if this cell is consumed by a previous span
            if (row, col) in consumed_cells:
                cell['skip'] = True
                logger.debug(f"Skipping cell ({row}, {col}) - consumed by span")
                continue
            
            # Determine colspan/rowspan
            colspan = cell.get('colspan', 1)
            rowspan = cell.get('rowspan', 1)
            
            # Mark all cells that this span consumes
            for r in range(row, min(row + rowspan, num_rows)):
                for c in range(col, min(col + colspan, num_cols)):
                    if (r, c) != (row, col):  # Don't skip the main cell
                        consumed_cells.add((r, c))
            
            # Store cell in map
            cell_map[(row, col)] = {
                'content': cell.get('content', ''),
                'colspan': colspan,
                'rowspan': rowspan,
                'type': cell.get('type', 'regular'),
                'alignment': cell.get('alignment', 'left'),
                'skip': False
            }
        
        self.cell_map = cell_map
        logger.info(f"Built cell map with {len(cell_map)} cells, {len(consumed_cells)} consumed")
        
        return cell_map
    
    def detect_multirow_in_cell(self, cell_content: str) -> Optional[Dict]:
        """
        Detect if a cell contains multirow command.
        
        Args:
            cell_content: Cell content text
            
        Returns:
            Multirow info dict if found, None otherwise
        """
        match = re.search(self.MULTIROW_PATTERN, cell_content)
        if match:
            valign = match.group(1) or 'c'
            nrows = match.group(2)
            width = match.group(3)
            content = match.group(4)
            
            return {
                'content': content.strip(),
                'rows': int(nrows) if nrows != '*' else 1,
                'valign': valign,
                'width': width,
                'matched': True
            }
        return None
    
    def detect_multicolumn_in_cell(self, cell_content: str) -> Optional[Dict]:
        """
        Detect if a cell contains multicolumn command.
        
        Args:
            cell_content: Cell content text
            
        Returns:
            Multicolumn info dict if found, None otherwise
        """
        match = re.search(self.MULTICOLUMN_PATTERN, cell_content)
        if match:
            ncols = match.group(1)
            pos = match.group(2)
            content = match.group(3)
            alignment = self._extract_alignment(pos)
            
            return {
                'content': content.strip(),
                'cols': int(ncols),
                'alignment': alignment,
                'pos': pos,
                'matched': True
            }
        return None
    
    def remove_multirow_command(self, text: str) -> str:
        """
        Remove multirow command but keep content.
        
        Converts: \\multirow[t]{2}{*}{content}
        To: content
        
        Args:
            text: Text containing multirow commands
            
        Returns:
            Text with multirow commands removed, content preserved
        """
        # Replace multirow commands with just their content
        result = re.sub(
            self.MULTIROW_PATTERN,
            r'\4',  # Group 4 is the content
            text
        )
        return result
    
    def remove_multicolumn_command(self, text: str) -> str:
        """
        Remove multicolumn command but keep content.
        
        Converts: \\multicolumn{2}{|c|}{content}
        To: content
        
        Args:
            text: Text containing multicolumn commands
            
        Returns:
            Text with multicolumn commands removed, content preserved
        """
        # Replace multicolumn commands with just their content
        result = re.sub(
            self.MULTICOLUMN_PATTERN,
            r'\3',  # Group 3 is the content
            text
        )
        return result
    
    def has_multirow(self, text: str) -> bool:
        """Check if text contains multirow command"""
        return bool(re.search(self.MULTIROW_PATTERN, text))
    
    def has_multicolumn(self, text: str) -> bool:
        """Check if text contains multicolumn command"""
        return bool(re.search(self.MULTICOLUMN_PATTERN, text))
    
    def has_complex_spans(self, text: str) -> bool:
        """Check if text contains any multirow or multicolumn"""
        return self.has_multirow(text) or self.has_multicolumn(text)


# Convenience functions for single use
def parse_multirow(text: str) -> Tuple[str, List[Dict]]:
    """Quick multirow parsing without class instantiation"""
    parser = MultirowMulticolumnParser()
    return parser.parse_multirow(text)


def parse_multicolumn(text: str) -> Tuple[str, List[Dict]]:
    """Quick multicolumn parsing without class instantiation"""
    parser = MultirowMulticolumnParser()
    return parser.parse_multicolumn(text)


def has_complex_spans(text: str) -> bool:
    """Check if text has multirow or multicolumn"""
    parser = MultirowMulticolumnParser()
    return parser.has_complex_spans(text)


def extract_span_info(text: str) -> Dict:
    """Extract all span information from text"""
    parser = MultirowMulticolumnParser()
    _, multirows = parser.parse_multirow(text)
    _, multicolumns = parser.parse_multicolumn(text)
    
    return {
        'has_spans': bool(multirows or multicolumns),
        'multirows': multirows,
        'multicolumns': multicolumns,
        'multirow_count': len(multirows),
        'multicolumn_count': len(multicolumns)
    }


# Testing
if __name__ == "__main__":
    print("Testing MultirowMulticolumnParser...")
    print("=" * 70)
    
    parser = MultirowMulticolumnParser()
    
    # Test 1: Multirow parsing
    test1 = r"\multirow[t]{2}{*}{Content A}"
    result1, multirows1 = parser.parse_multirow(test1)
    print(f"Test 1 - Multirow parsing:")
    print(f"  Input:  {test1}")
    print(f"  Found:  {len(multirows1)} multirow(s)")
    if multirows1:
        print(f"  Rows:   {multirows1[0]['rows']}")
        print(f"  VAlign: {multirows1[0]['valign']}")
        print(f"  Content: {multirows1[0]['content']}")
    print()
    
    # Test 2: Multicolumn parsing
    test2 = r"\multicolumn{3}{|c|}{Header}"
    result2, multicols2 = parser.parse_multicolumn(test2)
    print(f"Test 2 - Multicolumn parsing:")
    print(f"  Input:  {test2}")
    print(f"  Found:  {len(multicols2)} multicolumn(s)")
    if multicols2:
        print(f"  Cols:   {multicols2[0]['cols']}")
        print(f"  Align:  {multicols2[0]['alignment']}")
        print(f"  Content: {multicols2[0]['content']}")
    print()
    
    # Test 3: Detection
    test3 = r"Text with \multirow{2}{*}{A} inside"
    print(f"Test 3 - Detection:")
    print(f"  Input: {test3}")
    print(f"  Has multirow: {parser.has_multirow(test3)}")
    print(f"  Has multicolumn: {parser.has_multicolumn(test3)}")
    print()
    
    # Test 4: Complex extraction
    test4 = r"""
    \multirow[c]{2}{*}{A} & \multicolumn{2}{|c|}{Header} \\
    & B & C \\
    """
    result4 = extract_span_info(test4)
    print(f"Test 4 - Complex extraction:")
    print(f"  Has spans: {result4['has_spans']}")
    print(f"  Multirow count: {result4['multirow_count']}")
    print(f"  Multicolumn count: {result4['multicolumn_count']}")
    print()
    
    print("=" * 70)
    print("✓ MultirowMulticolumnParser ready")
