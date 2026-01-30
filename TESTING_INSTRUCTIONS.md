# Testing the KaTeX Rendering Fix

## Quick Start

### Step 1: Start Development Servers
The servers should already be running. If not:

```bash
cd /home/tapendra/Documents/latex-converter-web

# Terminal 1: Start backend
cd backend
python manage.py runserver

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 2: Open the Compiler Application
Navigate to: **http://localhost:5173**

You should see the Compiler interface with:
- Left sidebar: File list
- Center: LaTeX code editor
- Right: Preview panel

### Step 3: Create or Upload a Test File

#### Option A: Create a Simple Test (Quick)
1. Click the upload area or use drag-drop
2. Create a file named `test.tex` with this content:

```latex
\documentclass{article}
\begin{document}

\section{Basic Test}

Inline equation: $x^2 + y^2 = z^2$

Display equation:
$$E = mc^2$$

\section{Fractions}

One half: $\frac{1}{2}$

\end{document}
```

#### Option B: Use Existing Test File
If you already created `test_katex_rendering.tex`, you can use that.

### Step 4: Compile the File
1. Select the file in the left sidebar
2. Click the **"Compile"** button in the menu bar
3. Watch the compilation status in the preview panel

### Step 5: Verify Results

#### Expected Behavior (After Fix)
✅ Preview panel shows:
- Section headers formatted
- Text content properly displayed
- **ALL EQUATIONS RENDERED WITH PROPER FORMATTING**
  - Inline equations: `x^2 + y^2 = z^2` (inline with text)
  - Display equations: `E = mc^2` (centered, on separate line)
  - Fractions: `1/2` (properly formatted)

#### Troubleshooting

**Issue: Equations not showing at all**
- Check browser console (F12 → Console tab) for errors
- Look for "[KaTeX]" prefixed messages
- Verify KaTeX loaded: `window.katex` should be defined

**Issue: Empty spans visible**
```html
<span class="tiptap-katex" data-latex="x%5E2"></span>
```
- This means KaTeX didn't render - check console for errors
- Possible causes: KaTeX library failed to load, invalid LaTeX syntax

**Issue: Only some equations render**
- Means the fix is partially working
- Some use standard delimiters, others are TipTap format
- Both methods should now work

### Step 6: Test Different LaTeX Scenarios

#### Test 1: Inline Math
```latex
The equation $a + b = c$ is simple.
```
**Expected:** Equation inline with text ✓

#### Test 2: Display Math
```latex
$$\int_0^{2\pi} \sin(x) \, dx = 0$$
```
**Expected:** Equation on separate line, centered ✓

#### Test 3: Fractions
```latex
$\frac{1}{2}$ and $$\frac{a+b}{c+d}$$
```
**Expected:** Both fractions display properly ✓

#### Test 4: Complex Equations
```latex
$$\begin{aligned}
x &= 1 \\
y &= 2 \\
z &= 3
\end{aligned}$$
```
**Expected:** Multi-line equation with alignment ✓

#### Test 5: Symbols and Greek Letters
```latex
Greek letters: $\alpha, \beta, \gamma$
Symbols: $\leq, \geq, \sum$
```
**Expected:** All symbols display correctly ✓

## Debugging Tips

### Browser Console Inspection
Press **F12** to open Developer Tools, then check Console tab for:

**Good Signs:**
```
[KaTeX] ✓ Initialization complete
[KaTeX] ✓ Render complete for element
```

**Problem Signs:**
```
[KaTeX] Failed to initialize...
[KaTeX] renderMathInElement not found
[KaTeX] Failed to load KaTeX...
```

### Check What's Being Rendered
In browser console:
```javascript
// Check if KaTeX is loaded
console.log(window.katex ? '✓ KaTeX loaded' : '✗ KaTeX not loaded')

// Check for TipTap equations
console.log(document.querySelectorAll('.tiptap-katex').length + ' TipTap equations found')

// Check for standard math delimiters
console.log(document.querySelectorAll('[aria-label*="math"]').length + ' rendered equations')
```

### Network Tab (If equations still not showing)
1. Open DevTools → Network tab
2. Recompile a file
3. Look for requests to:
   - `katex.min.js` (should be 200 OK)
   - `auto-render.min.js` (should be 200 OK)
   - `katex.min.css` (should be 200 OK)

If these fail (404 or network error), KaTeX CDN is unreachable.

## Performance Metrics

### Before Fix
- Compilation: ✓ Works
- Backend output: ✓ Correct (TipTap format)
- Frontend rendering: ✗ Broken
- User experience: ✗ Most equations invisible

### After Fix
- Compilation: ✓ Works
- Backend output: ✓ Correct (TipTap format)
- Frontend rendering: ✓ **FIXED**
- User experience: ✓ **ALL EQUATIONS VISIBLE**

## Expected Behavior Summary

| Scenario | Before Fix | After Fix |
|----------|-----------|----------|
| Simple equation `$x^2$` | ❌ Invisible | ✅ Renders |
| Complex fraction `$\frac{a}{b}$` | ❌ Invisible | ✅ Renders |
| Display mode `$$E=mc^2$$` | ❌ Invisible | ✅ Renders |
| Multi-line equations | ❌ Invisible | ✅ Renders |
| Mixed LaTeX/text | ⚠️ Partial | ✅ All renders |
| Error handling | ❌ No feedback | ✅ Error class added |

## Next Steps After Testing

### If Everything Works ✓
Great! The fix is working. You can now:
- Use the compiler normally for LaTeX conversion
- All equations will render properly in the preview
- Export HTML with equations intact

### If Issues Persist ✗
1. Check the "Debugging Tips" section above
2. Verify both files are modified:
   - `/frontend/src/pages/Compiler.tsx` (render effect added)
   - `/frontend/src/services/katex.ts` (TipTap rendering added)
3. Restart development servers:
   ```bash
   # Kill existing servers
   pkill -f "npm run dev"
   pkill -f "python manage.py runserver"
   
   # Start fresh
   npm run dev  # in frontend directory
   python manage.py runserver  # in backend directory
   ```
4. Clear browser cache (Ctrl+Shift+Delete) and reload

## Test File Reference

### File: `test_katex_rendering.tex`
Location: `/home/tapendra/Documents/latex-converter-web/test_katex_rendering.tex`

Contains:
- Basic equations
- Inline and display math
- Fractions
- Multi-line equations

### HTML Test File
Location: `/home/tapendra/Documents/latex-converter-web/KATEX_TIPTAP_TEST.html`

Standalone HTML file that demonstrates:
- 5 different equation types
- URL-decoding in action
- Expected rendering output

Can be opened directly in browser to verify KaTeX + TipTap rendering works locally.

## Summary

✅ **The fix is ready for testing**
- Both files modified
- Dev servers running
- Test files available
- Expected behavior documented
- Debugging tips provided

Start with the Quick Start section and verify all equations render in the preview panel!

---
**Testing Date:** 2026-01-30
**Fix Status:** ✅ Ready for verification
