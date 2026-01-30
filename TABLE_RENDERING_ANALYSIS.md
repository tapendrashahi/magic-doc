# LaTeX Table Compilation Issue - Research & Analysis

**Date**: January 29, 2026  
**Status**: ANALYSIS PHASE (Awaiting Approval)

---

## Executive Summary

The LaTeX-to-KaTeX converter has a critical issue with **tables containing equations**. 

**Problem**: Equations inside tables (like `\begin{tabular}...$...$...\end{tabular}`) are being converted to HTML KaTeX spans BEFORE the table structure is preserved, resulting in malformed table HTML.

**Current Pipeline Flaw**: 
```
LaTeX Text → Extract Equations → Render to HTML Spans → Assemble
                ↑
            Issue here: Equations inside tables are treated as regular equations
            and replaced with <span> tags before table is processed
```

**Impact**: 
- Table cells lose their LaTeX delimiters (`&`, `\\`)
- HTML spans break the table structure
- Result: Non-functional or visually broken tables

---

## Root Cause Analysis

### Current Architecture (Simplified)

```
1. NORMALIZATION
   Input: Raw Mathpix LaTeX
   Output: Normalized LaTeX (Varangle→angle, overparen→widehat)

2. EXTRACTION ← PROBLEM HERE
   - Regex searches for ALL equations: $$...$$, $...$
   - Extracts position info for each equation
   - Does NOT distinguish between:
     * Equations outside tables
     * Equations inside tables ← These should be handled differently!

3. RENDERING
   - KaTeX renderer processes each extracted equation
   - Converts to HTML: <span class="__se__katex">...</span>
   
4. ASSEMBLY
   - Replaces original LaTeX with rendered HTML using position tracking
   - For table equations: REPLACES $..$ with HTML SPAN
   - Result: Table structure broken
```

### What Happens (Step-by-Step)

**Input LaTeX:**
```latex
\begin{tabular}{|l|l|}
\hline
$(a+b)^n$ & Coefficients \\
\hline
$(a+b)^1$ & 11 \\
\hline
\end{tabular}
```

**After Extraction (detected as 2 equations):**
- Equation 0: `(a+b)^n` at position [X, Y] (inside table)
- Equation 1: `(a+b)^1` at position [X2, Y2] (inside table)

**After Rendering:**
- Equation 0: `<span class="__se__katex">...</span>`
- Equation 1: `<span class="__se__katex">...</span>`

**After Assembly (BROKEN!):**
```latex
\begin{tabular}{|l|l|}
\hline
<span class="__se__katex">...</span> & Coefficients \\
\hline
<span class="__se__katex">...</span> & 11 \\
\hline
\end{tabular}
```

**Why it breaks:**
- `&` and `\\` are LaTeX table delimiters, but now mixed with HTML tags
- HTML parser gets confused (invalid XML/HTML)
- Table structure collapses
- Rendering fails or looks garbled

---

## Current Code Flow Analysis

### Phase 1: Extraction (`latex_extractor.py`)

**Behavior:**
```python
def extract_equations(self, text: str) -> List[Equation]:
    # Searches ENTIRE text for $...$ patterns
    # No awareness of table boundaries
    # Returns all equations regardless of context
    
    for match in self.display_pattern.finditer(text):
        latex_content = match.group(1).strip()
        equation = Equation(
            latex=latex_content,
            equation_type=EquationType.DISPLAY,
            start_pos=match.start(),
            end_pos=match.end(),
            original_text=match.group(0)
        )
        equations.append(equation)
```

**Problem**: No check for `if equation_is_inside_table()`

### Phase 3: Rendering (`katex_renderer.py`)

**Behavior:**
```python
def render_batch(self, equations: List[Equation]) -> List[RenderResult]:
    # Renders ALL equations regardless of where they came from
    # No context awareness
    
    for equation in equations:
        result = self.render_single(equation)
        results.append(result)
```

**Problem**: No special handling for table-contained equations

### Phase 4: Assembly (`html_assembler.py`)

**Behavior:**
```python
def assemble_fragment(self, original_text, equations, sections):
    # Position-based replacement
    # Replaces equation at position [start, end] with <span>
    
    for replacement in replacements:
        html_blocks.append(wrapped_equation)  # HTML span replaces LaTeX
```

**Problem**: Doesn't preserve table structure while replacing equations

---

## Proposed Solutions

### OPTION 1: Table-Aware Extraction (Recommended)

**Approach:**
1. **Pre-extract tables** (before equation extraction)
2. **Replace tables with placeholders** (`__TABLE_0__`, `__TABLE_1__`, etc.)
3. **Extract equations** from non-table content
4. **Render equations** normally
5. **For tables**: Keep raw LaTeX, render equations INSIDE table afterward
6. **Assemble** with restored tables

**Pseudocode:**
```python
def convert_mathpix_to_lms_html(mathpix_text):
    normalizer = LatexNormalizer()
    normalized_text = normalizer.normalize(mathpix_text)
    
    # NEW: Extract tables with placeholders
    tables_extractor = TableExtractor()
    text_with_placeholders, tables = tables_extractor.extract(normalized_text)
    
    # Extract equations from NON-TABLE content
    extractor = LatexExtractor()
    equations, sections = extractor.extract_all(text_with_placeholders)
    
    # Render equations
    renderer = KaTeXRenderer()
    results = renderer.render_batch(equations)
    
    # NEW: For each table, render equations inside it
    for i, table in enumerate(tables):
        tables[i] = render_equations_in_table(table)
    
    # Assemble
    assembler = HTMLAssembler()
    html_fragment = assembler.assemble_fragment(text_with_placeholders, equations, sections)
    
    # NEW: Restore tables with rendered equations
    html_fragment = restore_tables(html_fragment, tables)
    
    return html_fragment
```

**Advantages:**
- ✅ Preserves table structure completely
- ✅ Tables contain properly rendered equations inside
- ✅ No breaking changes to existing equation extraction
- ✅ Clear separation of concerns (tables vs regular equations)
- ✅ Scalable to complex nested structures

**Disadvantages:**
- ⚠️ Requires new `TableExtractor` class
- ⚠️ More complex pipeline
- ⚠️ Needs careful position tracking

**Backward Compatibility:** ✅ HIGH (only adds table handling, doesn't change existing logic)

---

### OPTION 2: Skip Equations Inside Tables

**Approach:**
1. Extract equations normally
2. **Filter out** equations that are inside tables
3. Render only non-table equations
4. Leave tables as-is (or convert to plain text)
5. Assemble

**Pseudocode:**
```python
def extract_equations(self, text):
    all_equations = self._find_all_equations(text)
    
    # NEW: Remove equations inside tables
    filtered_equations = [
        eq for eq in all_equations
        if not self.is_inside_table(eq, text)
    ]
    
    return filtered_equations

def is_inside_table(self, equation, text):
    # Check if equation position is between \begin{tabular} and \end{tabular}
    return table_start <= eq.start_pos < table_end
```

**Advantages:**
- ✅ Simpler implementation (less code)
- ✅ Faster (fewer equations to render)
- ✅ Tables stay in LaTeX format

**Disadvantages:**
- ❌ Equations inside tables are NOT rendered to KaTeX (stay as LaTeX)
- ❌ LMS may not render LaTeX inside HTML tables properly
- ❌ Inconsistent output (equations outside tables are KaTeX, inside are LaTeX)
- ❌ User experience is worse

**Backward Compatibility:** ✅ MEDIUM (equations in tables won't render)

---

### OPTION 3: Convert Tables to HTML

**Approach:**
1. Extract tables
2. Convert table structure from LaTeX `\begin{tabular}...` to HTML `<table>...</table>`
3. Render equations inside table cells to KaTeX
4. Assemble as HTML

**Pseudocode:**
```python
def convert_table_to_html(table_latex):
    # Parse \begin{tabular}{|l|l|} ... \end{tabular}
    # Extract rows (split by \\)
    # Extract cells (split by &)
    # Render equations in each cell
    # Rebuild as <table><tr><td>...</td></tr></table>
    
    html_table = "<table>"
    for row_content in rows:
        html_table += "<tr>"
        for cell_content in cells:
            rendered_cell = render_equations(cell_content)
            html_table += f"<td>{rendered_cell}</td>"
        html_table += "</tr>"
    html_table += "</table>"
    return html_table
```

**Advantages:**
- ✅ Best visual rendering (proper HTML tables)
- ✅ Equations fully rendered to KaTeX
- ✅ Most professional output

**Disadvantages:**
- ❌ Complex parsing (LaTeX tables have variable formats)
- ❌ Complex equation rendering inside cells (position tracking harder)
- ❌ May break on edge cases (nested tables, complex cells)
- ⚠️ LMS may not accept injected HTML `<table>` tags

**Backward Compatibility:** ⚠️ MEDIUM (changes LaTeX tables to HTML)

---

## Recommendation: OPTION 1

**Why Option 1 is Best:**

1. **Preserves Table Structure**
   - Tables remain valid LaTeX
   - No risk of breaking LMS table rendering

2. **Maintains Consistency**
   - All equations (inside or outside tables) are rendered to KaTeX
   - Uniform experience for users

3. **Technically Sound**
   - Follows principle of "extract → process → restore"
   - Already have similar pattern with normalizer module

4. **Low Risk**
   - Can be implemented without touching existing extraction logic
   - New table extraction is additive-only
   - Existing 95%+ compatibility maintained

5. **Scalable**
   - Works with nested structures (future enhancement)
   - Can be extended to arrays, matrices, etc.

---

## Implementation Plan for Option 1

### Files to Create:
1. **`backend/converter/table_extractor.py`** (NEW)
   - Extract `\begin{tabular}...\end{tabular}` blocks
   - Replace with placeholders
   - Restore after assembly

### Files to Modify:
1. **`backend/converter/converter.py`**
   - Add table extraction before equation extraction
   - Add table restoration after assembly

2. **`backend/converter/html_assembler.py`**
   - Add helper methods for table handling (if needed)

### Code Structure:

```python
# New module: table_extractor.py
class TableExtractor:
    def extract_tables(self, text: str) -> Tuple[str, List[Dict]]:
        """Extract tables, return text with placeholders and table list"""
        
    def restore_tables(self, text: str, tables: List[Dict]) -> str:
        """Restore tables from placeholders"""
        
    def render_table_equations(self, table_latex: str) -> str:
        """Render equations inside table"""

# Modified converter pipeline:
def convert_mathpix_to_lms_html(mathpix_text):
    # 1. Normalization
    normalized = normalizer.normalize(mathpix_text)
    
    # 2. TABLE EXTRACTION (NEW)
    text_with_placeholders, tables = table_extractor.extract_tables(normalized)
    
    # 3. Equation extraction
    equations, sections = extractor.extract_all(text_with_placeholders)
    
    # 4. Rendering
    results = renderer.render_batch(equations)
    
    # 5. TABLE EQUATION RENDERING (NEW)
    tables = [table_extractor.render_table_equations(t) for t in tables]
    
    # 6. Assembly
    html_fragment = assembler.assemble_fragment(text_with_placeholders, equations, sections)
    
    # 7. TABLE RESTORATION (NEW)
    html_fragment = table_extractor.restore_tables(html_fragment, tables)
    
    return html_fragment
```

### Testing Strategy:

1. **Unit Tests**
   - Test table extraction/restoration
   - Test placeholder generation
   - Test with nested tables (future)

2. **Integration Tests**
   - Test with tables containing equations
   - Test with multiple tables
   - Test with mixed content (text, tables, equations)

3. **Regression Tests**
   - Ensure existing functionality unchanged
   - All 4 phases still work
   - 95%+ compatibility maintained

### Estimated Complexity:
- **New Lines of Code**: ~150-200 (TableExtractor class)
- **Modified Lines**: ~20-30 (converter.py changes)
- **Time Estimate**: 2-3 hours development + testing
- **Risk Level**: LOW

---

## Edge Cases to Consider

### Handled:
- ✅ Single table in document
- ✅ Multiple tables in document
- ✅ Tables with equations in all cells
- ✅ Tables with mixed text and equations
- ✅ Tables with special characters

### Not Handled (Future):
- ⚠️ Nested tables (rare)
- ⚠️ Very complex table formats
- ⚠️ Tables in footnotes/margin notes

---

## Success Criteria

After implementation, system should:

- [x] Extract tables before equation extraction
- [x] Preserve table structure in output
- [x] Render equations inside tables
- [x] All existing functionality remains intact
- [x] No breaking changes to other modules
- [x] Pass all test cases (old + new)
- [x] Handle user's example correctly

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Breaks existing equations | HIGH | LOW | Add regression tests |
| Position tracking errors | MEDIUM | MEDIUM | Careful placeholder handling |
| Performance impact | LOW | LOW | Use efficient regex |
| Complex table formats fail | MEDIUM | LOW | Add edge case tests |

**Overall Risk**: 🟢 **LOW** (with proper testing)

---

## Next Steps (If Approved)

1. ✅ **This Document** - Analysis & Research Phase
2. ⏳ **User Review** - Get approval on proposed solution
3. 📝 **Detailed Design** - Write exact code specification
4. 💻 **Implementation** - Write and test code
5. ✔️ **Validation** - Verify against user's example
6. 📊 **Regression Testing** - Ensure 95% compatibility maintained

---

## Questions for User Clarification

Before implementation, please confirm:

1. ✅ **Approve Option 1** (Table-Aware Extraction)?
   - Or prefer Option 2 (skip tables) or Option 3 (convert to HTML)?

2. ✅ **Table Format** - Are all tables in format `\begin{tabular}...\end{tabular}`?
   - Or also need `\begin{array}...`, `\begin{matrix}...`, etc.?

3. ✅ **Performance** - Any performance concerns?
   - Can handle slight overhead for better correctness?

4. ✅ **Backwards Compatibility** - Any existing usage depends on current (broken) behavior?
   - Or OK to fix and improve?

---

## Conclusion

**Recommended Solution**: Option 1 - Table-Aware Extraction

This approach cleanly separates table handling from regular equation processing, preserves table structure, maintains backward compatibility, and adds robust support for equations inside tables.

**Status**: Ready for user approval. Implementation can begin upon confirmation.

---

**Document prepared for user review**  
**Awaiting approval to proceed with implementation**
