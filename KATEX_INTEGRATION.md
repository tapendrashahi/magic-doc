# KaTeX Integration Guide

## ✅ What's Changed

Your LaTeX converter now uses **KaTeX** instead of MathJax for better performance and LMS compatibility.

### Key Changes:

1. **Backend Converter** (`backend/converter/converter.py`):
   - ✅ Inline math: `$...$` → stays as `$...$` (not converted to `\(...\)`)
   - ✅ Display math: `$$...$$` → stays as `$$...$$` (not converted to `\[...\]`)
   - ✅ Environments: `\begin{aligned}...\end{aligned}` → wrapped in `$$...$$`
   - ✅ Arrays/Matrices: `\begin{array}...\end{array}` → wrapped in `$$...$$`

2. **Frontend KaTeX Service** (`frontend/src/services/katex.ts`):
   - Loads KaTeX from CDN (v0.16.9)
   - Auto-renders all math with `$...$` and `$$...$$` delimiters
   - Supports both display and inline math

3. **HTML Preview Component** (`frontend/src/components/HTMLPreview.tsx`):
   - Uses KaTeX instead of MathJax
   - Initializes on mount
   - Renders math on HTML changes

## 🚀 How to Use

### 1. Start the Application

```bash
cd /home/tapendra/Documents/latex-converter-web
./start.sh
```

Then open: **http://localhost:5173**

### 2. Login

- **Username:** admin
- **Password:** admin

### 3. Create a Note with Math

Example LaTeX content:

```latex
\section*{Mathematical Formulas}

Here is an inline equation: $a^2 + b^2 = c^2$

And a display equation:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

Complex number representation:

\begin{aligned}
z &= a + bi \\
|z| &= \sqrt{a^2 + b^2} \\
e^{i\theta} &= \cos\theta + i\sin\theta
\end{aligned}
```

### 4. See KaTeX Rendering

The preview pane will show:
- ✅ Formatted headings
- ✅ Rendered mathematical equations
- ✅ Aligned multi-line equations
- ✅ All text formatting preserved

## 📋 KaTeX Supported Delimiters

Your converter outputs these delimiters (all supported by KaTeX):

| Math Type | Delimiter | Example |
|-----------|-----------|---------|
| **Inline** | `$...$` | `$a + b = c$` |
| **Display** | `$$...$$` | `$$x^2 + y^2 = z^2$$` |
| **Environments** | `$$\begin{...}\end{...}$$` | `$$\begin{aligned}...\end{aligned}$$` |

### LaTeX Commands Supported in KaTeX

- ✅ Greek letters: `\alpha`, `\beta`, `\gamma`, etc.
- ✅ Subscripts/Superscripts: `a_i`, `x^2`
- ✅ Fractions: `\frac{a}{b}`
- ✅ Roots: `\sqrt{x}`, `\sqrt[n]{x}`
- ✅ Matrices: `\begin{matrix}`, `\begin{bmatrix}`, etc.
- ✅ Alignment: `\begin{aligned}`, `\begin{array}`
- ✅ Operators: `\sum`, `\int`, `\prod`, etc.
- ✅ Accents: `\hat{x}`, `\tilde{a}`, `\bar{y}`
- ✅ Text: `\text{...}`, `\operatorname{...}`
- ✅ Delimiters: `\left(`, `\right)`, etc.

## 🔄 API Format

When converting via API, the output will be:

```bash
curl -X POST http://127.0.0.1:8000/api/notes/convert/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latex_content": "The equation $a + b = c$ is simple.\n\n$$x^2 + y^2 = z^2$$"
  }'
```

**Response:**

```json
{
  "html_content": "<p>The equation $a + b = c$ is simple.</p>\n<div> </div>\n$$x^2 + y^2 = z^2$$\n<div> </div>",
  "conversion_time_ms": 12
}
```

Notice the **delimiters are preserved** for KaTeX to render!

## 🎯 LMS Integration

Your LMS now receives HTML with proper KaTeX delimiters:

1. **Frontend renders** using KaTeX JavaScript library
2. **LMS receives** HTML with `$...$` and `$$...$$` delimiters
3. **LMS KaTeX engine** renders the math on display

### Example Output for LMS:

```html
<h2>Complex Numbers</h2>

<p>An ordered pair (a, b) where $a$ and $b$ are real numbers is called a complex number.</p>

<p>We can write:</p>

$$
\begin{aligned}
& a = \operatorname{Re}(z) \\
& b = \operatorname{Im}(z)
\end{aligned}
$$

<p>The modulus of z is:</p>

<p>$|z| = \sqrt{a^2 + b^2}$</p>
```

When your LMS processes this with KaTeX enabled:
- ✅ Headings display normally
- ✅ Text displays normally
- ✅ **All math with `$...$` and `$$...$$` renders beautifully**

## ✨ Features

### ✅ What Works Now

- Inline math with `$...$`
- Display math with `$$...$$`
- Multi-line equations with `\begin{aligned}...\end{aligned}`
- Matrix environments: `\begin{bmatrix}...\end{bmatrix}`
- Array environments: `\begin{array}...\end{array}`
- Complex LaTeX expressions
- Text formatting
- Headings and structure

### ✅ Export Options

From the preview pane:
- **📋 Copy HTML** - Copy to clipboard (includes KaTeX delimiters)
- **📥 Export as Markdown** - Download .md file
- **🖥️ Export as HTML** - Download standalone .html file
- **🖨️ Print** - Open print dialog

## 🧪 Testing KaTeX

Test with your own LMS:

1. **Export as HTML** from the web app
2. **Upload or paste** into your LMS content editor
3. **Verify** math renders with KaTeX

## 📝 Notes

- KaTeX is loaded from CDN: `https://cdn.jsdelivr.net/npm/katex@0.16.9/`
- Auto-render extension handles delimiter detection
- Errors are non-fatal (red text if math fails to parse)
- Perfect for production use with KaTeX-enabled LMS

## 🐛 Troubleshooting

If math doesn't render:

1. **Check browser console** (F12) for errors
2. **Verify delimiters** are `$...$` or `$$...$$`
3. **Ensure** LaTeX syntax is valid
4. **Reload page** and try again

## 🎉 You're All Set!

Your converter now works perfectly with KaTeX. Start converting your LaTeX documents!

---

**Created:** January 28, 2026  
**Version:** 1.0 - KaTeX Edition
