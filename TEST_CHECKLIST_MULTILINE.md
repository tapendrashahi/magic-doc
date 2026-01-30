# Strategic Test Checklist: Multi-line Display Equation

**Input LaTeX:**
```latex
\text { where } \begin{aligned}
& a=\operatorname{Re}(z) \\
& b=\operatorname{Im}(z)
\end{aligned}
```

**Expected Working Output:**
```html
<p><span class="tiptap-katex" data-latex="%5Ctext%20%7B%20where%20%7D%20%5Cbegin%7Baligned%7D%0A%26%20a%3D%5Coperatorname%7BRe%7D(z)%20%5C%5C%0A%26%20b%3D%5Coperatorname%7BIm%7D(z)%0A%5Cend%7Baligned%7D"></span> </p>
```

---

## Testing Checklist

### 1. **URL Encoding Verification**
- [ ] `data-latex` contains `%` characters (URL-encoded)
- [ ] `%5C` present (represents `\`)
- [ ] `%7B` present (represents `{`)
- [ ] `%7D` present (represents `}`)
- [ ] `%0A` present (represents newline `\n`)
- [ ] `%26` present (represents `&`)
- [ ] NO plain backslashes in `data-latex`

### 2. **LaTeX Content Preservation**
- [ ] `\text` command preserved
- [ ] `{ where }` text preserved with spaces
- [ ] `\begin{aligned}` preserved
- [ ] `&` alignment markers preserved
- [ ] `\operatorname{Re}` preserved
- [ ] `\operatorname{Im}` preserved
- [ ] `\\` line breaks preserved as `%5C%5C`
- [ ] `\end{aligned}` preserved
- [ ] NO missing LaTeX commands

### 3. **Newline Handling**
- [ ] Newlines preserved in encoded form (`%0A`)
- [ ] Exact count: Should have 3 newlines (between text, between lines, after last line)
- [ ] Multi-line structure intact

### 4. **HTML Structure**
- [ ] Wrapped in `<p>` tag
- [ ] Has `class="tiptap-katex"`
- [ ] Has `data-latex` attribute
- [ ] Single `<span>` element
- [ ] NO extra divs or spans
- [ ] Proper closing tag

### 5. **Display Equation Detection**
- [ ] Should be recognized as DISPLAY equation (multi-line)
- [ ] Gets own `<p>` block (not inline)
- [ ] NOT merged with surrounding text

### 6. **No Artifacts**
- [ ] NO `\\` visible in plain text
- [ ] NO `\setcounter` commands
- [ ] NO `\includegraphics` commands
- [ ] NO `\begin{` or `\end{` visible outside equation
- [ ] NO backslashes outside `data-latex`

### 7. **Spacing**
- [ ] Space after `{` in `{ where }` preserved
- [ ] Space between commands preserved
- [ ] NO extra spaces added
- [ ] NO missing spaces removed

---

## Quick Decode Verification

Expected `data-latex` when decoded should be:
```
\text { where } \begin{aligned}
& a=\operatorname{Re}(z) \\
& b=\operatorname{Im}(z)
\end{aligned}
```

---

## Step-by-Step Test Execution

### Test 1: Run Converter on Input
```bash
# Input LaTeX with newlines preserved
INPUT='\text { where } \begin{aligned}
& a=\operatorname{Re}(z) \\
& b=\operatorname{Im}(z)
\end{aligned}'
```

### Test 2: Check Output Format
```bash
# Verify output HTML structure
# Should find exactly 1 <p> tag
# Should find exactly 1 data-latex attribute
# Should have % characters (URL encoding)
```

### Test 3: Verify URL Encoding
```bash
# Decode data-latex value
# Should match input LaTeX exactly
```

### Test 4: Validate Against Working Example
Compare your output with the working output line by line:
- data-latex value
- HTML tag structure
- Attribute names and values

---

## Success Criteria (All Must Pass ✅)

| Criteria | Status |
|----------|--------|
| URL encoding present | ✅ |
| All LaTeX preserved | ✅ |
| Newlines as %0A | ✅ |
| Single `<p>` wrapper | ✅ |
| Wrapped in `<span class="tiptap-katex">` | ✅ |
| NO artifacts/backslashes | ✅ |
| Matches working example | ✅ |

---

## Common Failure Points (Watch Out For ❌)

1. **Plain LaTeX instead of URL-encoded**
   - Wrong: `data-latex="\text { where }..."`
   - Right: `data-latex="%5Ctext%20%7B%20where%20%7D..."`

2. **Lost newlines**
   - Wrong: `\text { where } \begin{aligned}& a=...`
   - Right: `\text { where } \begin{aligned}\n& a=...` (with %0A)

3. **Mixed structure**
   - Wrong: Multiple `<p>` tags for one equation
   - Right: Single `<p>` containing one `<span>`

4. **Artifacts visible**
   - Wrong: `<p>\\ It is denoted...` (backslashes in text)
   - Right: `<p>It is denoted...` (no backslashes)

5. **Missing URL encoding**
   - Wrong: `data-latex="...&..."`
   - Right: `data-latex="...%26..."`

---

## Pass/Fail Decision Tree

```
Does output have <p><span class="tiptap-katex">?
├─ NO → ❌ FAIL: Wrong HTML structure
└─ YES → Continue

Is data-latex URL-encoded (has %)?
├─ NO → ❌ FAIL: Not URL-encoded
└─ YES → Continue

Does data-latex contain %5C%text?
├─ NO → ❌ FAIL: LaTeX not preserved
└─ YES → Continue

Does data-latex contain %0A (newlines)?
├─ NO → ❌ FAIL: Newlines lost
└─ YES → Continue

Are there NO backslashes outside <span>?
├─ YES → ❌ FAIL: Artifacts present
└─ NO → Continue

Does output match working example exactly?
├─ YES → ✅ PASS
└─ NO → ⚠️ PARTIAL: Check differences
```

---

## When All Checks Pass ✅

Your converter is ready to:
1. Handle multi-line display equations
2. Preserve complex LaTeX commands
3. Keep newlines and formatting
4. Generate valid Tiptap output
5. Work with the LMS system

**Ready for:** Full end-to-end testing with complete documents!
