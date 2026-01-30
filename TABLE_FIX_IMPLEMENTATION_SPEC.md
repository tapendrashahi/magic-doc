# Implementation Specification - Table-Aware LaTeX Compiler

## Overview

This document provides the exact implementation plan for Option 1: Table-Aware Extraction

---

## File Structure Changes

### New File
```
backend/converter/table_extractor.py          (NEW - ~180 lines)
```

### Modified Files
```
backend/converter/converter.py                (MODIFY - ~30 lines added)
```

---

## 1. New Module: `table_extractor.py`

### Purpose
Extract tables before equation extraction, process them separately, and restore them after assembly.

### Class Definition

```python
class TableExtractor:
    """
    Extracts LaTeX table environments to preserve structure during processing.
    
    Tables are temporarily replaced with placeholders (__TABLE_0__, __TABLE_1__, etc.)
    so that equations inside tables are processed in their original context.
    """
    
    # Regex patterns for different table types
    TABULAR_PATTERN = r'\\begin\{tabular\}[^}]*\}(.*?)\\end\{tabular\}'
    ARRAY_PATTERN = r'\\begin\{array\}[^}]*\}(.*?)\\end\{array\}'
    
    def extract_tables(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extract all table environments from text.
        
        Args:
            text: LaTeX text potentially containing tables
            
        Returns:
            Tuple of (text_with_placeholders, table_list)
            - text_with_placeholders: Original text with __TABLE_N__ placeholders
            - table_list: List of dicts with:
              {
                'index': 0,
                'type': 'tabular' or 'array',
                'original': r'\begin{tabular}...\end{tabular}',
                'content': '...',
                'rendered': None  # Will be filled in later
              }
        """
        
    def restore_tables(self, text: str, tables: List[Dict[str, Any]]) -> str:
        """
        Restore tables from placeholders.
        
        Args:
            text: Text with __TABLE_N__ placeholders
            tables: Table list from extract_tables()
            
        Returns:
            Text with tables restored
        """
        
    def render_equations_in_table(self, table_latex: str) -> str:
        """
        Find and render equations inside a table.
        
        Args:
            table_latex: LaTeX table including \begin{tabular}...\end{tabular}
            
        Returns:
            Table with equations rendered to KaTeX HTML
            
        Note:
            This is a placeholder - actual rendering happens in renderer
        """
```

### Implementation Details

```python
def extract_tables(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Extract tables with placeholders"""
    tables = []
    result = text
    
    # Find all tabular environments
    pattern = re.compile(self.TABULAR_PATTERN, re.DOTALL)
    offset = 0
    
    for i, match in enumerate(pattern.finditer(text)):
        table_text = match.group(0)
        placeholder = f'__TABLE_{i}__'
        
        # Store table info
        tables.append({
            'index': i,
            'type': 'tabular',
            'original': table_text,
            'content': match.group(1),
            'rendered': None
        })
        
        # Replace in result
        result = result.replace(table_text, placeholder, 1)
    
    # Find all array environments (similar)
    pattern = re.compile(self.ARRAY_PATTERN, re.DOTALL)
    for i, match in enumerate(pattern.finditer(text)):
        # Similar processing...
        
    return result, tables

def restore_tables(self, text: str, tables: List[Dict[str, Any]]) -> str:
    """Restore tables from placeholders"""
    result = text
    
    for table in tables:
        placeholder = f'__TABLE_{table["index"]}__'
        # Use rendered version if available, otherwise original
        table_content = table.get('rendered') or table['original']
        result = result.replace(placeholder, table_content)
    
    return result
```

---

## 2. Modified File: `converter.py`

### Import Addition

```python
from .table_extractor import TableExtractor
```

### Modified Function: `convert_mathpix_to_lms_html()`

```python
def convert_mathpix_to_lms_html(mathpix_text):
    r"""
    Convert Mathpix LaTeX output to LMS-compatible HTML fragment.
    
    Pipeline:
    1. Normalization - Fix Mathpix commands
    2. Table Extraction - Extract tables with placeholders
    3. Equation Extraction - Find equations (outside tables)
    4. KaTeX Rendering - Render equations
    5. Table Equation Rendering - Render equations inside tables
    6. HTML Assembly - Wrap with LMS attributes
    7. Table Restoration - Restore tables
    """
    logger.info("Starting Mathpix to LMS conversion")
    
    if not mathpix_text or not mathpix_text.strip():
        logger.warning("Empty input text")
        return ""
    
    try:
        # ===== PHASE 1.5: NORMALIZATION =====
        logger.info("Phase 1.5: Normalizing LaTeX commands...")
        normalizer = LatexNormalizer()
        normalized_text = normalizer.normalize(mathpix_text)
        logger.info("  LaTeX normalization complete")
        
        # ===== PHASE 1.75: TABLE EXTRACTION ===== (NEW)
        logger.info("Phase 1.75: Extracting tables...")
        table_extractor = TableExtractor()
        text_with_placeholders, tables = table_extractor.extract_tables(normalized_text)
        logger.info(f"  Extracted {len(tables)} table(s)")
        
        # ===== PHASE 2: EXTRACTION =====
        logger.info("Phase 2: Extracting equations and sections...")
        extractor = LatexExtractor()
        # Use text_with_placeholders instead of normalized_text
        equations, sections = extractor.extract_all(text_with_placeholders)
        logger.info(f"  Extracted {len(equations)} equations, {len(sections)} sections")
        
        # ===== PHASE 3: RENDERING =====
        logger.info("Phase 3: Rendering equations to KaTeX...")
        renderer = KaTeXRenderer()
        results = renderer.render_batch(equations, stop_on_error=False)
        
        success_count = sum(1 for r in results if r.success)
        failed_count = len(results) - success_count
        logger.info(f"  Rendered {success_count}/{len(equations)} equations successfully")
        
        if failed_count > 0:
            logger.warning(f"  {failed_count} equations failed to render")
        
        # ===== PHASE 3.5: TABLE EQUATION RENDERING ===== (NEW)
        logger.info("Phase 3.5: Rendering equations inside tables...")
        for i, table in enumerate(tables):
            try:
                # Extract equations from table
                table_equations, _ = extractor.extract_all(table['original'])
                
                # Render them
                table_results = renderer.render_batch(table_equations)
                
                # Replace in table
                table_html = table['original']
                for eq, result in zip(table_equations, table_results):
                    if result.success:
                        wrapped = assembler.wrap_equation(eq)
                        table_html = table_html.replace(eq.original_text, wrapped)
                
                tables[i]['rendered'] = table_html
                logger.debug(f"  Table {i}: {len(table_equations)} equations rendered")
            except Exception as e:
                logger.warning(f"  Failed to render equations in table {i}: {e}")
                tables[i]['rendered'] = table['original']  # Use original if rendering fails
        
        # ===== PHASE 4: ASSEMBLY =====
        logger.info("Phase 4: Assembling HTML fragment...")
        assembler = HTMLAssembler()
        html_fragment = assembler.assemble_fragment(text_with_placeholders, equations, sections)
        logger.info(f"  Assembled HTML fragment ({len(html_fragment)} chars)")
        
        # ===== PHASE 4.5: TABLE RESTORATION ===== (NEW)
        logger.info("Phase 4.5: Restoring tables...")
        html_fragment = table_extractor.restore_tables(html_fragment, tables)
        logger.info(f"  Tables restored ({len(tables)} table(s))")
        
        # ===== VALIDATION =====
        is_valid, error_msg = assembler.validate_html(html_fragment)
        if not is_valid:
            logger.error(f"HTML validation failed: {error_msg}")
            raise ValueError(f"HTML validation failed: {error_msg}")
        
        logger.info("✓ Conversion complete - HTML fragment ready for LMS")
        return html_fragment
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}", exc_info=True)
        raise
```

### Modified Function: `convert_mathpix_to_lms_html_with_stats()`

```python
def convert_mathpix_to_lms_html_with_stats(mathpix_text):
    r"""Convert Mathpix to LMS HTML and return with detailed statistics."""
    logger.info("Starting conversion with statistics...")
    
    try:
        # Normalize
        normalizer = LatexNormalizer()
        normalized_text = normalizer.normalize(mathpix_text)
        
        # Extract tables (NEW)
        table_extractor = TableExtractor()
        text_with_placeholders, tables = table_extractor.extract_tables(normalized_text)
        
        # Extract equations
        extractor = LatexExtractor()
        equations, sections = extractor.extract_all(text_with_placeholders)
        
        # Render equations
        renderer = KaTeXRenderer()
        renderer.render_batch(equations)
        
        # Render equations in tables (NEW)
        for i, table in enumerate(tables):
            try:
                table_equations, _ = extractor.extract_all(table['original'])
                renderer.render_batch(table_equations)
                # ... render logic
            except Exception as e:
                logger.warning(f"Failed to render table {i}: {e}")
        
        # Assemble
        assembler = HTMLAssembler()
        html_fragment = assembler.assemble_fragment(text_with_placeholders, equations, sections)
        
        # Restore tables (NEW)
        html_fragment = table_extractor.restore_tables(html_fragment, tables)
        
        # Get statistics
        stats = assembler.get_statistics(text_with_placeholders, equations, sections, html_fragment)
        stats['tables'] = len(tables)  # Add table count to stats
        
        logger.info(f"Conversion complete: {stats['total_equations']} equations, {len(tables)} tables")
        
        return {
            'html_fragment': html_fragment,
            'stats': stats,
            'success': True,
            'tables_processed': len(tables)
        }
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}", exc_info=True)
        return {
            'html_fragment': '',
            'stats': {},
            'success': False,
            'error': str(e)
        }
```

---

## 3. Code Flow Diagram

```
convert_mathpix_to_lms_html(mathpix_text)
    ↓
1. normalizer.normalize()
    ↓
2. table_extractor.extract_tables()
    ├─ Input:  "...text...\begin{tabular}...\end{tabular}...text..."
    └─ Output: "...text...__TABLE_0__...text...", [table_dict, ...]
    ↓
3. extractor.extract_all(text_with_placeholders)
    ├─ Finds: equations outside tables (2 equations)
    └─ Skips:  equations inside tables (they're in __TABLE_0__)
    ↓
4. renderer.render_batch(equations)
    └─ Converts: $...$ to <span class="__se__katex">...</span>
    ↓
5. NEW: Render equations inside each table
    ├─ For each table:
    │  ├─ Extract equations from table['original']
    │  ├─ Render them
    │  └─ Replace in table['original'] → table['rendered']
    ↓
6. assembler.assemble_fragment(text_with_placeholders, equations, sections)
    └─ Replaces equations with HTML spans in text
    ↓
7. NEW: table_extractor.restore_tables()
    ├─ Replace __TABLE_0__ with table['rendered']
    └─ Result: Table with rendered equations
    ↓
8. Return html_fragment ✓
```

---

## 4. Test Cases

### Test 1: Simple Table
```latex
\begin{tabular}{|c|c|}
$(a+b)^1$ & 11 \\
\end{tabular}
```
**Expected**: Table preserved, equation rendered

### Test 2: Multiple Tables
```latex
First table:
\begin{tabular}{|l|}\hline $(x+y)^2$ \\ \hline \end{tabular}

Second table:
\begin{tabular}{|l|}\hline $(a-b)^2$ \\ \hline \end{tabular}
```
**Expected**: Both tables preserved and rendered

### Test 3: Mixed Content
```latex
Before table: $(a+b)^n$

\begin{tabular}{|c|c|}
In table: $(a+b)^1$ \\
\end{tabular}

After table: $(x+y)^n$
```
**Expected**: 3 equations, 1 table, all rendered correctly

### Test 4: Backward Compatibility
```latex
Just regular equations and text (no tables)
$(a+b)^n$ and $(x+y)^n$
```
**Expected**: Exactly same output as before this change

---

## 5. Validation Checklist

- [ ] New `table_extractor.py` created (~180 lines)
- [ ] Imports added to `converter.py`
- [ ] Phase 1.75 extraction added
- [ ] Phase 3.5 table rendering added
- [ ] Phase 4.5 table restoration added
- [ ] All logging statements added
- [ ] Error handling for failed table rendering
- [ ] Backward compatibility maintained (no breaking changes)
- [ ] All 4 test cases pass
- [ ] User's example works correctly

---

## 6. Rollback Plan

If issues occur:
1. Remove table extraction phase (temporarily)
2. Remove table rendering phase
3. Remove table restoration phase
4. Revert `converter.py` to previous version
5. Delete `table_extractor.py`

**Result**: System returns to previous state (no tables, but no crashes)

---

## 7. Performance Impact

| Operation | Time |
|-----------|------|
| Table extraction | ~1-2 ms |
| Table rendering | ~5-10 ms per table |
| Table restoration | ~1-2 ms |
| **Total overhead** | ~10-15 ms per document |

**Impact**: Negligible (0.1-0.2% of total processing time for typical documents)

---

## Ready for Implementation?

This specification provides:
✅ Exact code structure  
✅ Function signatures  
✅ Integration points  
✅ Test cases  
✅ Error handling  
✅ Performance expectations  

**Next step**: Implement TableExtractor class and integrate into converter

---

**Document Type**: Implementation Specification  
**Status**: Ready for coding  
**Estimated Time**: 2-3 hours (code + test)
