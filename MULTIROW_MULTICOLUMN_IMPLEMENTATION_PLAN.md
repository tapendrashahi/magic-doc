# 📋 IMPLEMENTATION PLAN: Multirow & Multicolumn Support

**Date:** January 31, 2026  
**Current Status:** Basic tables working ✅ | Complex tables (multirow/multicolumn) ❌  
**Scope:** Add support for `\multirow` and `\multicolumn` LaTeX commands

---

## 📊 ANALYSIS

### Current Capability
✅ **Working:**
- Simple tables: `\begin{tabular}{|l|l|}\n...\n\end{tabular}`
- Regular cells: `content & content \\`
- Equations in cells
- Basic styling (borders, padding)
- Row/column detection

❌ **NOT Working:**
- `\multirow{n}{width}{content}` - Cells spanning multiple rows
- `\multicolumn{n}{alignment}{content}` - Cells spanning multiple columns
- Complex row structures (some cells have 1 row, others span 3 rows)
- Proper `colspan` and `rowspan` HTML attributes
- Cell alignment preservation in multicolumn

### Test Files Analysis

**File 1: `complextable.tex`**
```latex
\usepackage{multirow}  ← Dependency needed

\multicolumn{5}{|l|}{Total ATP formed...}  ← Spans 5 columns, 1 row
\multirow[t]{2}{*}{1. Glycolysis...}       ← Spans 1 column, 2 rows
\multirow[t]{2}{*}{O}                      ← Spans 1 column, 2 rows
```

**File 2: `complexoutput.html`**
```html
<th colspan="5" rowspan="1">...</th>    ← Multicolumn: colspan=5
<td colspan="1" rowspan="2">...</td>    ← Multirow: rowspan=2
```

**File 3: `multirow_multicolumn.html`**
```html
<th colspan="2" rowspan="1">Binomial</th>           ← Multicolumn
<td colspan="1" rowspan="3">Low Powers</td>         ← Multirow
<td colspan="1" rowspan="1">...</td>               ← Regular
```

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Parser Enhancement (2-3 hours)
**Goal:** Detect and extract multirow/multicolumn commands

**Tasks:**

1. **Create `multirow_parser.py`** (new module)
   - Parse `\multirow[position]{rows}{width}{content}`
   - Parse `\multicolumn{cols}{alignment}{content}`
   - Extract metadata: rows count, cols count, alignment, content
   - Handle edge cases:
     - `\multirow{*}{*}{content}` (auto width)
     - `\multirow[t/c/b]{n}{*}{content}` (vertical alignment: top/center/bottom)
     - `\multicolumn{2}{|c|}{content}` (alignment and borders in spec)

2. **Update `latex_table_parser.py`**
   - Modify `_split_cells()` method to detect multirow/multicolumn
   - Replace multirow/multicolumn markers with special tokens
   - Build a "cell map" showing which cells are merged
   - Store metadata: `{row: 1, col: 2, spans_rows: 2, spans_cols: 1}`

3. **Create cell tracking system**
   - Track which cells are already "covered" by multirow/multicolumn
   - Skip rendering cells that are part of a span
   - Example for `\multirow{2}{*}{A}`:
     ```
     Row 0: [A (rowspan=2), B, C]
     Row 1: [X,             D, E]  ← Cell A is empty here (covered by span)
     ```

**Output Format:**
```python
{
    'row': 0,
    'col': 0,
    'content': 'Total ATP formed...',
    'colspan': 5,      # NEW
    'rowspan': 1,      # NEW
    'type': 'multicolumn',  # NEW: multicolumn, multirow, or regular
    'alignment': 'left'  # NEW
}
```

---

### Phase 2: HTML Builder Enhancement (1-2 hours)
**Goal:** Generate correct HTML with colspan/rowspan

**Tasks:**

1. **Update `html_table_builder.py`**
   - Use `colspan` and `rowspan` from cell metadata
   - Track rendered cells to skip covered ones
   - Apply alignment class if multicolumn has special alignment

2. **Add cell skipping logic**
   ```python
   # Track which cells are "consumed" by spans
   rendered_cells = {}  # {(row, col): True/False}
   
   for cell in cells:
       if (cell['row'], cell['col']) in consumed_cells:
           continue  # Skip - this cell is part of a rowspan from above
       
       # Add cell
       html += f'<td colspan="{cell["colspan"]}" rowspan="{cell["rowspan"]}">'
       
       # Mark cells as consumed by this span
       for r in range(cell['row'], cell['row'] + cell['rowspan']):
           for c in range(cell['col'], cell['col'] + cell['colspan']):
               consumed_cells[(r, c)] = True
   ```

3. **Handle alignment preservation**
   - `\multicolumn{2}{|c|}{...}` → `text-center` class
   - `\multicolumn{2}{|r|}{...}` → `text-right` class
   - `\multicolumn{2}{|l|}{...}` → `text-left` class (default)

---

### Phase 3: Integration & Testing (2-3 hours)
**Goal:** Integrate into main pipeline and test

**Tasks:**

1. **Update `latex_table_converter.py`**
   - Import enhanced parser
   - Update flow: Parse → Detect multirow/multicolumn → Encode equations → Build HTML

2. **Create comprehensive tests**
   - Test `complextable.tex` → should produce valid HTML with colspan/rowspan
   - Test `multirow_multicolumn.html` → verify output matches
   - Edge cases:
     - Nested multirow/multicolumn
     - Multirow with equations
     - Mixed simple + complex cells in same row
     - Empty multirow cells

3. **Update `converter.py`** if needed
   - Ensure Phase 6 table detection still works
   - No changes to main pipeline needed (parser handles it)

---

## 🔧 TECHNICAL DETAILS

### Regex Patterns Needed

```python
# Multirow pattern
r'\\multirow\s*(?:\[([tcb])\])?\s*\{(\d+|\*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}'
# Groups: [1=alignment, 2=rows, 3=width, 4=content]

# Multicolumn pattern
r'\\multicolumn\s*\{(\d+)\}\s*\{([^}]*)\}\s*\{([^}]*)\}'
# Groups: [1=cols, 2=spec (alignment+borders), 3=content]

# Span detection (mark that next N cells are skipped)
# After multirow{2}, mark next 2 cells in same column as "consumed"
```

### Example Transformation

**Input LaTeX:**
```latex
\begin{tabular}{|l|l|l|}
\multicolumn{3}{|c|}{Header} \\
\multirow{2}{*}{A} & B & C \\
                   & D & E \\
\end{tabular}
```

**Parsed Cells:**
```python
[
    {'row': 0, 'col': 0, 'content': 'Header', 'colspan': 3, 'rowspan': 1, 'alignment': 'center'},
    {'row': 1, 'col': 0, 'content': 'A', 'colspan': 1, 'rowspan': 2},
    {'row': 1, 'col': 1, 'content': 'B', 'colspan': 1, 'rowspan': 1},
    {'row': 1, 'col': 2, 'content': 'C', 'colspan': 1, 'rowspan': 1},
    # Row 2, Col 0 is SKIPPED (consumed by multirow)
    {'row': 2, 'col': 1, 'content': 'D', 'colspan': 1, 'rowspan': 1},
    {'row': 2, 'col': 2, 'content': 'E', 'colspan': 1, 'rowspan': 1},
]
```

**Output HTML:**
```html
<table>
  <tbody>
    <tr>
      <th colspan="3" rowspan="1">Header</th>
    </tr>
    <tr>
      <td colspan="1" rowspan="2">A</td>
      <td>B</td>
      <td>C</td>
    </tr>
    <tr>
      <!-- Row 2, Col 0 is SKIPPED due to rowspan -->
      <td>D</td>
      <td>E</td>
    </tr>
  </tbody>
</table>
```

---

## 📁 FILES TO CREATE/MODIFY

### Create
1. `/backend/converter/multirow_parser.py` (150-200 lines)
   - `parse_multirow()` function
   - `parse_multicolumn()` function
   - `build_cell_map()` function to track spans

### Modify
1. `/backend/converter/latex_table_parser.py` (~50 lines)
   - Update `_split_cells()` to use new multirow parser
   - Update output format to include colspan/rowspan
   
2. `/backend/converter/html_table_builder.py` (~80 lines)
   - Update `_build_cell()` to handle colspan/rowspan attributes
   - Add cell skipping logic
   - Add alignment class application

3. `/backend/converter/latex_table_converter.py` (no changes needed)

### Test Files
1. `/backend/converter/tests/test_multirow_parser.py` (100+ lines)
   - Test each pattern
   - Test edge cases
   - Test with equations

---

## ✅ ACCEPTANCE CRITERIA

### Test Cases

**Test 1: Simple Multicolumn**
```latex
\multicolumn{3}{|c|}{Header}
```
✅ Must produce: `<th colspan="3" ...>Header</th>`

**Test 2: Simple Multirow**
```latex
\multirow{2}{*}{A}
```
✅ Must produce: `<td rowspan="2">A</td>`

**Test 3: Complex Table (ATP example)**
- Input: `complextable.tex`
- Expected: `complexoutput.html` format
- Verify: All colspan/rowspan values correct
- Verify: All equations preserved
- Verify: No HTML errors

**Test 4: Mixed Table**
- Input: `multirow_multicolumn.html` reference
- Verify: Both multirow and multicolumn work together
- Verify: Cell alignment correct

**Test 5: Edge Cases**
- Auto width: `\multirow{2}{*}{...}` → rowspan=2, width auto
- Alignment: `\multicolumn{2}{|c|}{...}` → center alignment detected
- Nested: Multiple multirow/multicolumn in same table

---

## 📊 COMPLEXITY & RISK ASSESSMENT

| Aspect | Rating | Notes |
|--------|--------|-------|
| Complexity | 7/10 | Cell tracking logic is tricky, span calculation needs care |
| Risk | 4/10 | Isolated change, doesn't affect existing simple tables |
| Time Est. | 6-8 hrs | 2-3 hrs parsing + 1-2 hrs builder + 2-3 hrs testing |
| Testing Effort | 5/10 | Good test cases available in files |
| Impact | High | Enables complex scientific/data tables |

---

## 🚀 ROLLOUT STRATEGY

### Step 1: Safe Implementation
- Write new `multirow_parser.py` without modifying existing code
- Keep old parser logic intact as fallback
- All tests green before touching existing files

### Step 2: Gradual Integration
- Update parser to call new multirow handler
- If multirow/multicolumn detected → use new logic
- Otherwise → use old logic (backward compatible)

### Step 3: Full Testing
- Run existing simple table tests (must pass 100%)
- Run new complex table tests (must pass 100%)
- Integration test with full pipeline

### Step 4: Deployment
- Merge to main
- No breaking changes
- Supports both simple and complex tables

---

## 📝 SUCCESS METRICS

✅ **Phase 1 Complete When:**
- Parser detects multirow/multicolumn correctly
- Cell map built accurately
- 100% of test patterns parse correctly

✅ **Phase 2 Complete When:**
- HTML builder uses colspan/rowspan
- Cell skipping works correctly
- Alignment classes applied

✅ **Phase 3 Complete When:**
- `complextable.tex` → valid HTML table
- `multirow_multicolumn.html` verified as correct
- All edge cases handled
- 100% backward compatibility

---

## 💡 IMPLEMENTATION TIPS

1. **Start with regex patterns**
   - Test patterns in isolation first
   - Verify they match all variations

2. **Use cell coordinate system**
   - (row, col) tracking prevents errors
   - Make it visual during debugging

3. **Test incrementally**
   - Test parser alone first
   - Test builder alone second
   - Test integration last

4. **Handle edge cases early**
   - Auto width (`*`)
   - Vertical alignment (`[t]`, `[c]`, `[b]`)
   - Complex alignment specs (`|c|`, `|r|`, etc.)

5. **Preserve equations**
   - Don't lose LaTeX in multirow/multicolumn content
   - URL-encode equations same as simple tables

---

## 📚 REFERENCE

### Resources
- LaTeX multirow docs: `\multirow[valign]{nrows}{width}{content}`
- LaTeX multicolumn docs: `\multicolumn{ncols}{pos}{content}`
- HTML colspan: `<td colspan="3">`
- HTML rowspan: `<td rowspan="2">`

### Example Test Files
- Input: `/ohno/complextable.tex`
- Output Ref: `/ohno/complexoutput.html`
- Validation Ref: `/ohno/multirow_multicolumn.html`

---

## ✨ SUMMARY

**Goal:** Make complex tables (multirow/multicolumn) work like simple tables

**Approach:** 
1. Parse multirow/multicolumn commands → Extract metadata
2. Build cell map → Track which cells are spanned
3. Generate HTML → Use colspan/rowspan attributes
4. Test thoroughly → Ensure no regression + full coverage

**Timeline:** 6-8 hours total work

**Risk:** Low (isolated, backward compatible)

**Impact:** High (enables scientific/data tables)

---

*Ready to start Phase 1 when you give approval!*
