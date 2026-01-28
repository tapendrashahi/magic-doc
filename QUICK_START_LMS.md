# Plain HTML Conversion - Quick Start Guide

## 🎯 What Changed?

Your LaTeX converter now supports **two output formats**:

1. **KaTeX Format** (Original) - Web rendering with full math support
2. **Plain HTML Format** (New) - For LMS systems like Moodle, Google Sites

---

## 🚀 Quick Start

### Step 1: Start Servers
```bash
cd /home/tapendra/Documents/latex-converter-web
./start.sh
```

The application runs on:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### Step 2: Open Editor
Visit: http://localhost:5173/

### Step 3: Choose Your Format

In the editor toolbar, you'll see two buttons:

```
┌─────────────────┐
│ KaTeX │ LMS     │  ← Click one to choose format
└─────────────────┘
```

- **KaTeX** (default): Original format, uses KaTeX rendering
- **LMS**: Plain HTML format for Moodle, Google Sites, etc.

### Step 4: Write LaTeX

Paste or type your LaTeX content. It will automatically convert.

### Step 5: Copy & Use

Click the copy button to copy HTML, then paste into your LMS.

---

## 📊 Output Examples

### Input (LaTeX)
```
\section*{Complex Numbers}

The modulus: $|z| = \sqrt{a^2 + b^2}$

For $z_1 = (a, b)$ and $z_2 = (c, d)$:
$$z_1 + z_2 = (a+c, b+d)$$
```

### KaTeX Format Output
Shows: `|z| = √(a² + b²)` with full math rendering

### LMS Format Output  
Shows: `|z| = √(a² + b²)` as plain text with Unicode symbols

Both look good, but LMS format works anywhere without KaTeX!

---

## 🎨 Format Comparison

| Feature | KaTeX | LMS |
|---------|-------|-----|
| Math Rendering | ✅ Full support | ✅ Unicode symbols |
| Moodle | ✅ (if KaTeX enabled) | ✅ Works everywhere |
| Google Sites | ✅ (if KaTeX enabled) | ✅ Works everywhere |
| Complex equations | ✅ Perfect | ✅ Good (as text) |
| Matrices/Arrays | ✅ Perfect | ✅ Text format |
| Greek letters | ✅ Rendered | ✅ Unicode (α, β, etc.) |
| Subscripts/Superscripts | ✅ Perfect | ✅ Unicode (₁, ²) |
| Web display | ✅ Beautiful | ✅ Clean text |

---

## 🔧 API Usage (For Developers)

### Request
```json
POST /api/notes/convert/

{
    "latex_content": "\\section*{Hello}\n$z_1 = \\sqrt{x^2}$",
    "format": "plain_html"
}
```

### Response
```json
{
    "html_content": "<h2>Hello</h2>\n<p>z₁ = √(x²)</p>",
    "format": "plain_html",
    "conversion_time_ms": 12,
    "error": null
}
```

### Format Options
- `"katex"` - KaTeX format (default, backward compatible)
- `"plain_html"` - Plain HTML for LMS (NEW)

---

## 🔄 How It Works

### Behind the Scenes

1. **LaTeX Input** 
   ```
   $\sqrt{a^2 + b^2}$
   ```

2. **Format Selection** (KaTeX vs LMS)

3. **For KaTeX**: Preserves as-is with `$...$` delimiters
   ```
   $\sqrt{a^2 + b^2}$
   ```

4. **For LMS**: Converts symbols to Unicode
   ```
   √(a² + b²)
   ```

5. **HTML Output**: Clean semantic HTML
   - Uses: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`, `<br>`
   - NO complex divs or CSS classes needed

---

## ✨ Supported Unicode Symbols

### Greek Letters
α β γ δ ε θ λ μ π σ φ ω (30+ total)

### Math Operators
× ÷ ± · ∘ ⊕ ⊗ ∩ ∪ ∧ ∨

### Relations
≤ ≥ ≠ ≡ ≈ ∈ ⊂ ⊆ ⊃ ⊇

### Special
√ ∛ ∞ ∂ ∇ ∑ ∫ ∏ ∠ ⊥

### Subscripts/Superscripts
₀₁₂₃₄₅₆₇₈₉ₙ  and  ⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ

---

## 🎓 LMS Integration

### Moodle
1. Select **LMS** format
2. Copy HTML output
3. Paste into Moodle content editor
4. No plugin needed!

### Google Sites
1. Select **LMS** format
2. Copy HTML output  
3. Insert → Text box
4. Paste HTML
5. Done!

### Other LMS
If your LMS supports plain HTML, use **LMS** format.

---

## 🐛 Troubleshooting

### Q: Format toggle button not appearing
A: Refresh browser (Ctrl+F5)

### Q: LMS format missing subscripts
A: Check browser Unicode support (all modern browsers work)

### Q: KaTeX not rendering
A: Ensure **KaTeX** button is selected in toolbar

### Q: Weird symbols in output
A: Your LMS might not support Unicode. Try KaTeX format instead.

### Q: Conversion slow
A: Large documents may take a few seconds. This is normal.

---

## 📝 Example: Full Complex Numbers Note

### Input LaTeX
```latex
\section*{Complex Numbers}

Any ordered pair $(a, b)$ is a complex number.

$$z = a + ib$$

where:
- $a = \mathrm{Re}(z)$ (real part)
- $b = \mathrm{Im}(z)$ (imaginary part)

The modulus: $|z| = \sqrt{a^2 + b^2}$

For $z_1 = (a, b)$ and $z_2 = (c, d)$:
$$z_1 + z_2 = (a+c, b+d)$$
$$z_1 \cdot z_2 = (ac - bd, ad + bc)$$
```

### LMS Format Output
```html
<h2>Complex Numbers</h2>

<p>Any ordered pair (a, b) is a complex number.</p>

<p>z = a + ib</p>

<p>where:</p>
<ul>
  <li>a = Re(z) (real part)</li>
  <li>b = Im(z) (imaginary part)</li>
</ul>

<p>The modulus: |z| = √(a² + b²)</p>

<p>For z₁ = (a, b) and z₂ = (c, d):</p>

<p>z₁ + z₂ = (a+c, b+d)</p>

<p>z₁ · z₂ = (ac - bd, ad + bc)</p>
```

✅ Perfect for pasting into Moodle or Google Sites!

---

## 🎯 Next Steps

1. Try both formats with your content
2. See which works best for your LMS
3. Copy & paste into your LMS
4. Test rendering
5. Use your preferred format going forward

---

## 📞 Need Help?

- Check implementation details: `IMPLEMENTATION_COMPLETE.md`
- View full plan: `PLAIN_HTML_CONVERSION_PLAN.md`
- Check server logs: `./stop.sh` then `./start.sh`

---

**All set!** 🚀 

Your converter now works with any LMS system. Enjoy!
