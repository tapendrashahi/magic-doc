# Plain HTML Conversion Plan
**Status**: 🟡 PLANNING PHASE  
**Date**: January 28, 2026  
**Objective**: Convert LaTeX to Plain HTML (LMS Compatible: Moodle, Google Sites, etc.)

---

## 1. Current Status Analysis

### Current System
- **Backend**: Converts LaTeX → HTML with KaTeX delimiters ($...$, $$...$$)
- **Frontend**: Renders math using KaTeX library
- **Issue**: LMS systems (Moodle, Google Sites) don't support KaTeX or LaTeX rendering

### Target System
- **Backend**: Converts LaTeX → Plain HTML (NO math delimiters)
- **Frontend**: Display plain HTML directly
- **Output Format**: Unicode symbols, HTML entities, text representations

---

## 2. Analysis of Working Format

From `plain_html.html`, the target format uses:

### Mathematical Representations
```
✓ Superscripts: i² (using Unicode ²)
✓ Subscripts: z₁ (using Unicode subscripts)
✓ Fractions: (a + c) / (b + d) or a/b (inline text)
✓ Symbols: ∈, ⊂, √, ±, −, ×, ÷, π, θ, φ
✓ Greek letters: Greek symbols for θ, φ, etc.
✓ Set notation: R ⊂ C, ∈, ∉
✓ Special chars: overline for conjugate (z̄)
```

### HTML Structure
```
✓ Use <h2> for main sections
✓ Use <h3> for subsections
✓ Use <p> for paragraphs
✓ Use <ul><li> for lists
✓ Use <br> for line breaks within paragraphs
✓ NO <div>, NO <span>, NO classes
✓ Plain semantic HTML only
```

### What's NOT Used
```
✗ No LaTeX delimiters: $...$, $$...$$
✗ No KaTeX rendering
✗ No \begin{...}\end{...} environments
✗ No inline $...$
✗ No complex math formatting
```

---

## 3. Implementation Plan

### Phase 1: Create LaTeX-to-Unicode Converter (Backend)
**Files to Create/Modify:**
- `backend/converter/unicode_converter.py` (NEW)
- `backend/converter/converter.py` (UPDATE)

**Tasks:**

#### 1.1 Unicode Symbol Mapping
```python
# Create comprehensive LaTeX → Unicode mapping
LATEX_TO_UNICODE = {
    # Superscripts
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\theta': 'θ',
    '\\phi': 'φ',
    '\\pi': 'π',
    
    # Subscripts/Superscripts (use Unicode combining)
    '_1': '₁', '_2': '₂', '_3': '₃', '_n': 'ₙ',
    '^2': '²', '^3': '³', '^4': '⁴', '^n': 'ⁿ',
    
    # Operators
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\minus': '−',
    '\\cdot': '·',
    
    # Relations
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\subseteq': '⊆',
    '\\supset': '⊃',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    
    # Special
    '\\sqrt': '√',
    '\\infty': '∞',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\bar': 'overline',  # z̄
    '\\overline': 'overline',
}
```

#### 1.2 Equation Conversion Logic
```python
def convert_math_blocks_to_text(latex):
    """
    Convert:
    $$\begin{aligned}
    a = b \\
    c = d
    \end{aligned}$$
    
    To:
    a = b
    c = d
    """
    # Extract from display/inline math
    # Convert symbols
    # Remove delimiters
    # Replace line breaks with <br>
```

#### 1.3 Remove Math Environments
- Remove `\begin{aligned}...\end{aligned}`
- Remove `\begin{array}...\end{array}`
- Remove `\begin{matrix}...\end{matrix}`
- Convert to plain text with line breaks

---

### Phase 2: Update HTML Generation
**Files to Modify:**
- `backend/converter/converter.py` (REPLACE KaTeX logic with Unicode logic)

**Tasks:**

#### 2.1 Replace Math Preservation with Symbol Conversion
```python
# OLD (KaTeX):
text = re.sub(r'\$\$[\s\S]*?\$\$', extract_display_math, text)

# NEW (Plain HTML):
text = convert_display_math_to_text(text)
text = convert_inline_math_to_text(text)
```

#### 2.2 Simplify HTML Output
```python
# Remove unnecessary wrappers
# Keep only: <h2>, <h3>, <p>, <ul>, <li>, <br>
# NO: <div>, empty divs, classes
```

#### 2.3 Format Equations as Text
```python
# Input:
# $$\begin{aligned}
# z + w &= (a+c, b+d)
# \end{aligned}$$

# Output (HTML):
# <p>z + w = (a + c, b + d)</p>
```

---

### Phase 3: Update API Response Format
**Files to Modify:**
- `backend/api/views.py` (converter endpoint)

**Tasks:**
- Test conversion output
- Add format parameter to converter endpoint (katex vs plain_html)
- Return plain HTML without any math delimiters

---

### Phase 4: Update Frontend
**Files to Modify:**
- `frontend/src/components/HTMLPreview.tsx`
- `frontend/src/services/katex.ts` (deprecate or conditionally disable)

**Tasks:**

#### 4.1 Remove KaTeX Initialization
```typescript
// Only load KaTeX if explicitly requested
// Default to direct HTML rendering
```

#### 4.2 Simplify HTML Preview
```typescript
// Just render HTML directly
// No math processing needed
// Simple dangerouslySetInnerHTML is fine
```

#### 4.3 Add Format Toggle (Optional)
```typescript
// Allow users to choose output format
// - Plain HTML (for LMS)
// - KaTeX format (for KaTeX-enabled systems)
```

---

### Phase 5: Testing & Validation
**Files to Create:**
- `backend/tests/test_plain_html_conversion.py`

**Test Cases:**
```
✓ Simple equations convert to plain text
✓ Greek letters convert to Unicode
✓ Subscripts/superscripts work
✓ Fractions display as text
✓ Matrices convert to formatted text
✓ Aligned environments become formatted paragraphs
✓ HTML structure is clean (no extra divs)
✓ Special symbols are preserved
✓ No LaTeX delimiters in output
✓ Output matches plain_html.html format
```

---

## 4. Technical Details

### Symbol Conversion Examples
```
Input:  $z = a + ib$
Output: z = a + ib

Input:  $|z| = \sqrt{a^2 + b^2}$
Output: |z| = √(a² + b²)

Input:  $\frac{z}{w} = \frac{a+ib}{c+id}$
Output: z / w = (a + ib) / (c + id)

Input:  $$\begin{aligned}
         z_1 &= (a, b) \\
         z_2 &= (c, d)
         \end{aligned}$$
Output: <p>z₁ = (a, b)<br>
        z₂ = (c, d)</p>

Input:  $z_1 \in \mathbb{C}$
Output: z₁ ∈ C
```

### Unicode Entities Reference
```
Superscripts: ², ³, ⁴, ⁿ, ⁺, ⁻, ⁽, ⁾
Subscripts: ₁, ₂, ₃, ₙ, ₊, ₋, ₍, ₎
Operators: ×, ÷, ±, −, ·, ∘
Relations: =, <, >, ≤, ≥, ≠, ≈
Set: ∈, ∉, ⊂, ⊆, ⊃, ⊇
Greek: α, β, γ, δ, ε, θ, λ, μ, π, σ, φ, ψ, ω
Special: √, ∛, ∜, ∞, ∂, ∇, ∑, ∫, ∏
```

---

## 5. File Structure After Implementation

```
backend/
  converter/
    converter.py          (REPLACE KaTeX logic)
    unicode_converter.py  (NEW - Symbol mapping)
    tests/
      test_unicode_*.py   (NEW - Symbol conversion tests)
  
frontend/
  src/
    components/
      HTMLPreview.tsx     (SIMPLIFY - remove KaTeX)
    services/
      converter.ts        (UPDATE - remove KaTeX init)
      katex.ts           (DEPRECATE or make conditional)

PLAIN_HTML_CONVERSION_PLAN.md (THIS FILE)
plain_html.html                (REFERENCE EXAMPLE)
```

---

## 6. Database Migration (If Needed)

**Option A: Automatic Re-conversion**
- When user loads a note, detect format and convert to plain HTML
- Store in database as HTML (no format field)

**Option B: Add Format Field**
- Add `math_format` field to Note model (katex / plain_html)
- Store both versions in database
- Allow user to choose export format

**Recommended**: Option A (simpler, cleaner)

---

## 7. Success Criteria

✅ **Backend**
- Converts LaTeX → Plain HTML with Unicode symbols
- No KaTeX delimiters in output
- HTML matches plain_html.html structure
- All tests pass

✅ **Frontend**
- Displays plain HTML correctly
- No KaTeX library loaded
- Preview shows formatted text with Unicode symbols
- Responsive and fast

✅ **LMS Integration**
- Content copies/pastes into Moodle correctly
- Content works in Google Sites
- All special symbols render properly
- Equations display as readable text

---

## 8. Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| 1: Unicode Converter | 2-3 hours | ⏳ Pending |
| 2: Update HTML Generation | 1-2 hours | ⏳ Pending |
| 3: API Updates | 30 min | ⏳ Pending |
| 4: Frontend Updates | 1 hour | ⏳ Pending |
| 5: Testing & QA | 1-2 hours | ⏳ Pending |
| **Total** | **6-8 hours** | **⏳ NOT STARTED** |

---

## 9. Next Steps

1. ✅ **Approved by User**: Confirm this plan addresses the LMS requirements
2. ⏳ **Start Phase 1**: Implement Unicode conversion logic
3. ⏳ **Test with plain_html.html**: Verify output format matches
4. ⏳ **Update database**: Convert all existing notes
5. ⏳ **Deploy & Test**: Verify LMS integration works

---

## 10. References

- **Reference Format**: `plain_html.html` (working example)
- **Current Converter**: `backend/converter/converter.py` (to be modified)
- **Frontend Component**: `frontend/src/components/HTMLPreview.tsx` (to be simplified)
- **KaTeX Service**: `frontend/src/services/katex.ts` (to be deprecated)

---

**Status**: 🟡 READY FOR APPROVAL  
**Next Action**: User approves plan → Begin Phase 1 implementation
