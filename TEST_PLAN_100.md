# 100-Test Comprehensive Conversion Plan

**Date Started:** January 31, 2026  
**Objective:** Test LaTeX-to-HTML converter from 100 different perspectives  
**Total Tests Planned:** 100

---

## Test Categories (by perspective)

### CATEGORY A: Inline Equations (Tests 1-10)
**Perspective:** Single-line, paragraph-embedded equations

- [ ] Test 1: Simple inline: `$z$`
- [ ] Test 2: Inline with subscript: `$x_i$`
- [ ] Test 3: Inline with superscript: `$x^2$`
- [ ] Test 4: Inline fraction: `$\frac{a}{b}$`
- [ ] Test 5: Inline with Greek letter: `$\alpha + \beta$`
- [ ] Test 6: Inline with mathrm: `$\mathrm{Re}(z)$`
- [ ] Test 7: Inline with operatorname: `$\operatorname{Re}(z)$`
- [ ] Test 8: Inline complex: `$(a, b)$`
- [ ] Test 9: Inline with square root: `$\sqrt{x}$`
- [ ] Test 10: Inline with absolute value: `$|z|$`

### CATEGORY B: Display Equations - Simple (Tests 11-20)
**Perspective:** Multi-line equations, basic structure

- [ ] Test 11: Display single line: `$$ z = a + bi $$`
- [ ] Test 12: Display aligned pair: `$$ a = b \\ c = d $$`
- [ ] Test 13: Display with fraction: `$$ \frac{z}{w} = ... $$`
- [ ] Test 14: Display with sqrt: `$$ r = \sqrt{a^2 + b^2} $$`
- [ ] Test 15: Display with sum: `$$ \sum_{i=1}^{n} ... $$`
- [ ] Test 16: Display with product: `$$ \prod_{i=1}^{n} ... $$`
- [ ] Test 17: Display with integral: `$$ \int_0^\infty ... $$`
- [ ] Test 18: Display matrix 2x2: `$$ \begin{matrix} a & b \\ c & d \end{matrix} $$`
- [ ] Test 19: Display with cases: `$$ \begin{cases} ... \end{cases} $$`
- [ ] Test 20: Display with aligned environment: `$$ \begin{aligned} ... \end{aligned} $$`

### CATEGORY C: Display Equations - Complex (Tests 21-30)
**Perspective:** Multi-line with advanced features

- [ ] Test 21: Multi-line with alignment operators (&)
- [ ] Test 22: Multi-line with line breaks (\\)
- [ ] Test 23: Nested fractions: `\frac{\frac{a}{b}}{c}`
- [ ] Test 24: Multiple equals signs on different lines
- [ ] Test 25: Mixed operators: `+`, `-`, `*`, `/`, `=`
- [ ] Test 26: Parentheses nesting: `(((...)))`
- [ ] Test 27: Braces nesting: `{{{...}}}`
- [ ] Test 28: Combining superscripts & subscripts: `x^2_i`
- [ ] Test 29: Text within equation: `\text { and }`
- [ ] Test 30: Greek letters collection: `\alpha, \beta, \gamma, \delta`

### CATEGORY D: Special Characters & Encoding (Tests 31-40)
**Perspective:** URL encoding, special symbols, character preservation

- [ ] Test 31: Verify `\` → `%5C`
- [ ] Test 32: Verify `{` → `%7B`
- [ ] Test 33: Verify `}` → `%7D`
- [ ] Test 34: Verify `&` → `%26`
- [ ] Test 35: Verify `=` → `%3D`
- [ ] Test 36: Verify `+` → `%2B`
- [ ] Test 37: Verify `^` → `%5E`
- [ ] Test 38: Verify `_` → `_` (unencoded)
- [ ] Test 39: Verify `(` → `(` (unencoded)
- [ ] Test 40: Verify `)` → `)` (unencoded)

### CATEGORY E: Whitespace & Formatting (Tests 41-50)
**Perspective:** Spaces, newlines, indentation preservation

- [ ] Test 41: Single space in equation
- [ ] Test 42: Multiple spaces in equation
- [ ] Test 43: Space before equals sign
- [ ] Test 44: Space after equals sign
- [ ] Test 45: Newlines as `%0A`
- [ ] Test 46: Multiple newlines
- [ ] Test 47: Indentation preservation
- [ ] Test 48: Tab characters (if present)
- [ ] Test 49: Space in `\text { }`
- [ ] Test 50: Trailing/leading spaces

### CATEGORY F: LaTeX Commands - Text (Tests 51-60)
**Perspective:** Text formatting commands

- [ ] Test 51: `\text{...}`
- [ ] Test 52: `\textbf{...}` → content extracted
- [ ] Test 53: `\textit{...}` → content extracted
- [ ] Test 54: `\mathrm{...}` → content extracted
- [ ] Test 55: `\mathbf{...}` → content extracted
- [ ] Test 56: `\operatorname{Re}`
- [ ] Test 57: `\operatorname{Im}`
- [ ] Test 58: `\operatorname{sin}`
- [ ] Test 59: Text with spaces: `\text { where }`
- [ ] Test 60: Nested text: `\text{a \textbf{b}}`

### CATEGORY G: LaTeX Commands - Math (Tests 61-70)
**Perspective:** Mathematical operators and functions

- [ ] Test 61: `\frac{a}{b}`
- [ ] Test 62: `\sqrt{x}`
- [ ] Test 63: `\sqrt[3]{x}` (cube root)
- [ ] Test 64: `\sum`
- [ ] Test 65: `\prod`
- [ ] Test 66: `\int`
- [ ] Test 67: `\partial`
- [ ] Test 68: `\times` (multiplication)
- [ ] Test 69: `\div` (division)
- [ ] Test 70: `\pm` (plus-minus)

### CATEGORY H: Environments (Tests 71-80)
**Perspective:** LaTeX environment handling

- [ ] Test 71: `\begin{aligned}...\end{aligned}`
- [ ] Test 72: `\begin{matrix}...\end{matrix}`
- [ ] Test 73: `\begin{pmatrix}...\end{pmatrix}`
- [ ] Test 74: `\begin{bmatrix}...\end{bmatrix}`
- [ ] Test 75: `\begin{cases}...\end{cases}`
- [ ] Test 76: `\begin{array}...\end{array}`
- [ ] Test 77: `\begin{equation}...\end{equation}`
- [ ] Test 78: Multiple environment nesting
- [ ] Test 79: Environment with alignment (&)
- [ ] Test 80: Environment with line breaks (\\)

### CATEGORY I: HTML Structure & Output Format (Tests 81-90)
**Perspective:** HTML correctness, Tiptap compatibility

- [ ] Test 81: Wrapped in `<span class="tiptap-katex">`
- [ ] Test 82: `data-latex` attribute present
- [ ] Test 83: Inline in `<p>` flow (not separate block)
- [ ] Test 84: Display in own `<p>` block
- [ ] Test 85: Multiple equations in same paragraph
- [ ] Test 86: Equation after period: proper spacing
- [ ] Test 87: Equation at start of sentence
- [ ] Test 88: Equation at end of sentence
- [ ] Test 89: No extra divs/spans around equation
- [ ] Test 90: `data-latex` properly quoted

### CATEGORY J: Real Document Content (Tests 91-100)
**Perspective:** Actual complex documents, edge cases

- [ ] Test 91: Complex numbers definition
- [ ] Test 92: Algebraic operations (addition)
- [ ] Test 93: Algebraic operations (multiplication)
- [ ] Test 94: Algebraic operations (division)
- [ ] Test 95: Multi-line derivation (4+ lines)
- [ ] Test 96: Equation with `\text` and alignment
- [ ] Test 97: Fraction with complex numerator/denominator
- [ ] Test 98: Multiple Greek letters in one equation
- [ ] Test 99: Document with mixed inline/display
- [ ] Test 100: Full document conversion quality check

---

## Test Execution Process

For each test:

1. **Input:** LaTeX code snippet
2. **Expected Output:** Correctly formatted HTML/URL-encoded form
3. **Actual Output:** What converter produces
4. **Match Status:** PASS ✅ / FAIL ❌
5. **Notes:** Observations, differences, issues

---

## Test Tracking Template

```
TEST #N: [Test Name]
Category: [A-J]
Input LaTeX:
[code here]

Expected Output:
[html/encoding here]

Actual Output:
[result here]

Status: [ ] PASS  [ ] FAIL

Notes:
[observations]

---
```

---

## Quality Metrics

After all 100 tests:

- **Pass Rate:** `___/100` (target: 100%)
- **Critical Issues:** ___
- **Minor Issues:** ___
- **Edge Cases Found:** ___
- **Encoding Accuracy:** ___% (target: 100%)
- **HTML Structure Compliance:** ___% (target: 100%)

---

## Known Test Sources

**Available .tex files for real document testing:**

1. `/roadmap/82f1d41c-1d57-41c6-91fc-4a86d4328095.tex` - Complex numbers (MAIN)
2. `/roadmap/0fbcdbe4-dc06-4ec7-84b4-7fd9bb1c209c.tex` - Document 2
3. `/roadmap/0dceb9d8-79bc-428f-9508-085f9796c1fc.tex` - Document 3
4. `/roadmap/9a7497cf-18c5-4912-9540-617fe18da6ff.tex` - Document 4
5. `/roadmap/caf33e77-0377-4244-bca8-5652b8a19772.tex` - Document 5
6. `/roadmap/7b1fa7b3-37bb-4bd0-8f84-912eddc79d19.tex` - Document 6
7. `/roadmap/f7d2db45-cc13-4216-b677-fb89fa25e94e.tex` - Document 7
8. `/verify/5e478170-4062-4ecd-90a5-ec54dd746407.tex` - Verification doc
9. `/test_katex_rendering.tex` - KaTeX testing

---

## Next Steps

1. ✅ Create 100 test cases (this file)
2. ⏳ Execute tests 1-10 (Category A: Inline)
3. ⏳ Execute tests 11-20 (Category B: Simple Display)
4. ⏳ Execute tests 21-30 (Category C: Complex Display)
5. ⏳ Continue through Category J
6. ⏳ Compile results in `test_results.md`
7. ⏳ Generate summary report
8. ⏳ Document all failures
9. ⏳ Fix issues found
10. ⏳ Re-run failed tests

---

**Status:** 🔵 PLAN CREATED - Ready for test execution
