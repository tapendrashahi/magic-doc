# Mathpix Converter - Rendering Issues & Solutions

## Common Non-Rendering Issues

### 1. **LaTeX Commands KaTeX Doesn't Support**

| Command | Status | Alternative |
|---------|--------|-------------|
| `\Va
rangle` | ❌ Not supported | Use `\angle` ✅ |
| `\overparen` | ❌ Not supported | Use `\widehat` or `\overarc` ✅ |
| `\operatorname` | ⚠️ Limited | Use `\mathrm` or wrap in `$\text{...}$` ✅ |
| `\section*` | ❌ In math mode | Keep in LaTeX text, not in $ $ ✅ |
| `\includegraphics` | ❌ Not supported | Use `![](url)` markdown format ✅ |
| `\begin{tabular}` | ⚠️ Limited | KaTeX has limited table support |
| `\triangle` | ❌ Not standard | Use `\angle` for angles ✅ |

### 2. **Content Types Not Rendering**

#### Issue 1: **Tables in LaTeX**
```latex
PROBLEM:
\begin{tabular}{|l|l|}
\hline
Content...
\end{tabular}

KaTeX cannot render tabular environments in math mode!

SOLUTION: Keep tables in regular LaTeX (non-math) or use HTML tables
```

#### Issue 2: **Sections and Headers**
```latex
PROBLEM:
\section*{Title} is rendered as regular text, not formatted

SOLUTION: It will display but styling won't apply in KaTeX preview
Use plain text headers instead for better rendering
```

#### Issue 3: **Figure/Image Environment**
```latex
PROBLEM:
\begin{figure}
\includegraphics{url}
\end{figure}

KaTeX doesn't process \includegraphics

SOLUTION: Use markdown image syntax instead:
![caption](url)
```

#### Issue 4: **Special Symbols**
```latex
PROBLEM:
Some symbols don't render: \perp, \parallel, \cong, etc.

These ARE supported but need proper syntax:
- $\perp$ ✅ (perpendicular)
- $\parallel$ ✅ (parallel)
- $\cong$ ✅ (congruent)
```

---

## Browser Console Debugging

**To check what's failing:**

1. Open browser: **F12** (DevTools)
2. Go to **Console** tab
3. Look for errors like:
   - `Unknown symbol: \Varangle`
   - `Unknown command: \overparen`
   - `Parsing error at position X`

---

## Content Not Rendering - Top Causes

### Cause 1: **Missing Math Delimiters**
```latex
WRONG: \angle ABC (without delimiters)
RIGHT: $\angle ABC$ or $$\angle ABC$$

KaTeX needs $ or $$ around math expressions!
```

### Cause 2: **Unescaped Special Characters**
```latex
WRONG: Use { } [ ] directly in text
RIGHT: Escape them: \{ \} \[ \]

Or keep them outside math mode
```

### Cause 3: **Malformed Commands**
```latex
WRONG: \VarangleM×R (spaces/symbols in command)
RIGHT: $\angle MXR$ (proper spacing)

Commands should be: \command not \command with spaces
```

### Cause 4: **Mixed Environments**
```latex
WRONG: Table content mixed with math mode
RIGHT: Keep tables in non-math, math in $...$ delimiters
```

---

## Fix Priority for Your Content

### Priority 1 - Fix Immediately
- [ ] Wrap ALL math expressions in `$...$` or `$$...$$`
- [ ] Replace remaining `\Varangle` with `\angle`
- [ ] Replace `\overparen` with `\widehat`
- [ ] Check tables are outside math mode

### Priority 2 - Content-Specific
- [ ] Tables: Ensure proper `\begin{tabular}...\end{tabular}` structure
- [ ] Sections: Keep `\section*{Title}` as regular LaTeX text
- [ ] Images: Change `\includegraphics` to markdown format

### Priority 3 - Validation
- [ ] Test small snippets first
- [ ] Check console for specific errors
- [ ] Verify each element renders before combining

---

## Testing Strategy

### Test 1: Simple Angle
```latex
In triangle ABC, $\angle ABC = 90°$.
```

### Test 2: Arc Notation
```latex
If $\widehat{AB} = \widehat{CD}$, then arc AB equals arc CD.
```

### Test 3: Complex Expression
```latex
$$\angle MXR = \frac{1}{2}(\widehat{MR} - \widehat{NS})$$
```

### Test 4: Table
```latex
| Figure | Angle | Result |
|--------|-------|--------|
| (1) | $90°$ | Equal |
```

---

## Specific LaTeX Fixes Needed

### For Mathematical Expressions
- Always use `$...$` or `$$...$$` delimiters
- `\angle` works ✅
- `\widehat{...}` for arcs ✅
- `\cong` for congruence ✅
- `\parallel` for parallel ✅
- `\perp` for perpendicular ✅

### For Equations
- Use `$$...$$ (display mode)
- Use `\begin{aligned}...\end{aligned}` for multi-line
- Avoid `\begin{equation}...\end{equation}` in KaTeX

### For Tables
- Keep structure clean
- Use `|` delimiters properly
- Consider HTML `<table>` for complex tables

---

## What to Report If Still Not Rendering

When you test and find content not rendering, tell me:

1. **Exact text that's not rendering**
   - Example: `$\angle ABC = 90°$`
   
2. **What you see instead**
   - Shows as: text, blank, error, etc.
   
3. **Console error message** (if any)
   - Copy exact error from F12 Console
   
4. **Section it's in**
   - Which question/note/example?

This will help identify exactly which commands/patterns need fixing.

