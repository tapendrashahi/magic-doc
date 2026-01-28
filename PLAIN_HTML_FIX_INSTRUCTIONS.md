# Plain HTML Format Fix - User Instructions

## Problem
Plain HTML preview is still showing LaTeX formatting ($ signs, \mathrm, \begin{aligned}, etc.)

## Root Cause
The backend converter IS working correctly. The issue is browser cache and/or the frontend not properly refreshing the code.

## Solution - STEP BY STEP

### Step 1: Hard Refresh Browser
The browser has cached the old frontend code. You MUST do a hard refresh:

**Windows/Linux**: `Ctrl+Shift+Delete` OR `Ctrl+F5`
**Mac**: `Cmd+Shift+Delete` OR `Cmd+Shift+R`

OR clear browser cache completely and refresh.

### Step 2: Verify Servers Are Running
```bash
ps aux | grep -E "(manage|vite)" | grep -v grep
```
You should see both:
- `python manage.py runserver` (backend)
- `node ... vite` (frontend)

### Step 3: Test in Browser
1. Go to http://localhost:5175
2. Load a note with LaTeX content
3. In the top-right, you should see two buttons: "KaTeX" and "LMS"
4. Click the "LMS" button (this sets format to 'plain_html')
5. The preview should update and show:
   - NO $ signs
   - NO $$ signs
   - NO \mathrm, \begin, \hline, etc.
   - Unicode symbols instead (π, ±, √, ², ³, etc.)

### Step 4: Verify Backend is Correctly Converting
Run this test:
```bash
python3 -c "
import sys
sys.path.insert(0, '/home/tapendra/Documents/latex-converter-web/backend')
from converter.converter import convert_latex_to_html

test = r'For example: $$\\\begin{aligned} a &= b \\\\ c &= d \\\end{aligned}$$'
result = convert_latex_to_html(test, mode='plain_html')
print('Result:', result)
print('Has dollar signs:', '$' in result)
print('Has begin/aligned:', 'begin' in result.lower())
"
```

Expected output:
```
Has dollar signs: False
Has begin/aligned: False
```

### Step 5: If Still Not Working
1. **Clear ALL browser cache**: Settings > Clear browsing data > ALL TIME
2. **Close and reopen browser**
3. **Hard refresh** with `Ctrl+Shift+Delete`
4. **Reload page**

## What Should Happen

### KaTeX Mode (default):
```html
<p>For all $\alpha \in \mathbb{R}$, we have $\sin^2\alpha + \cos^2\alpha = 1$</p>
```
✓ Contains $ signs
✓ Shows in preview with math formatting

### LMS / Plain HTML Mode:
```html
<p>For all α ∈ R, we have sin²α + cos²α = 1</p>
```
✓ NO $ signs
✓ NO backslashes
✓ Uses Unicode symbols
✓ Shows in preview as plain text (no math formatting)

## Frontend Code Verification

The Editor component has:
- `conversionFormat` state (set to 'katex' or 'plain_html')
- Format toggle buttons: "KaTeX" and "LMS"
- Passes format to LaTeXInput: `<LaTeXInput conversionFormat={conversionFormat} />`
- Passes format to HTMLPreview: `<HTMLPreview format={conversionFormat} ... />`

The LaTeXInput component:
- Receives `conversionFormat` prop
- Passes it to converter service: `converterService.convertLatex(latex, conversionFormat)`

The converter service sends format to API:
- `apiClient.convertLatex(latex_content, format)`

The backend API receives format parameter and uses it:
- `convert_latex_to_html(latex_content, mode=format)`

## Debugging

Open browser console (`F12 > Console`) and check for messages like:
```
[Editor] Format state changed to: plain_html
[LaTeXInput] Converting with format: plain_html
[HTMLPreview] Format is plain_html, skipping KaTeX initialization
```

If you don't see these, the frontend code wasn't properly reloaded (need browser cache clear).

## Summary

✅ **Backend converter**: WORKING (tested and verified)
✅ **Frontend components**: UPDATED (format state, props, logging)
✅ **API**: UPDATED (format parameter support)

**YOU NEED TO**: Hard refresh browser with `Ctrl+Shift+Delete` and clear all cache

After that, clicking "LMS" button should show plain HTML with no LaTeX formatting.
