# 🔍 Comprehensive Logging - Debug Guide

**Status:** ✅ DETAILED LOGGING ADDED  
**Date:** January 28, 2026

---

## 📊 What's Being Logged

### 1. **MathJax Service** (`frontend/src/services/mathjax.ts`)
```
[MathJax] init() called
[MathJax] Already initialized
[MathJax] Script exists in DOM
[MathJax] Creating new script element
[MathJax] Appending script to head
[MathJax] Script loaded
[MathJax] ✓ Fully initialized
[MathJax] typeset() called
[MathJax] typeset completed successfully
```

### 2. **HTMLPreview Component** (`frontend/src/components/HTMLPreview.tsx`)
```
[HTMLPreview] Component mounted
[HTMLPreview] Initializing MathJax
[HTMLPreview] MathJax init complete
[HTMLPreview] html changed { htmlLength, hasRef, loading, error }
[HTMLPreview] Calling MathJax.typeset
[HTMLPreview] MathJax typeset complete
[HTMLPreview] Copy to clipboard
```

### 3. **LaTeX Input Component** (`frontend/src/components/LaTeXInput.tsx`)
```
[LaTeXInput] Content changed, length: 1234
[LaTeXInput] Starting conversion
[LaTeXInput] Conversion successful, HTML length: 5678
[LaTeXInput] Empty LaTeX, clearing preview
```

### 4. **Editor Page** (`frontend/src/pages/Editor.tsx`)
```
[Editor] Loading note with id: 1
[Editor] ✓ Note loaded { title, latexLength, htmlLength }
[Editor] LaTeX changed, length: 1234
[Editor] HTML conversion result, length: 5678
```

### 5. **Converter Service** (`frontend/src/services/converter.ts`)
```
[ConverterService] convertLatex called with 1234 chars
[ConverterService] _convert executing
[ConverterService] ✓ Conversion done, HTML length: 5678
[ConverterService] convertInstant called
```

### 6. **API Client** (`frontend/src/api/client.ts`)
```
[API] Request: POST /api/notes/convert/
[API] Response: 200 /api/notes/convert/
[API] Converting LaTeX, length: 1234
[API] ✓ Conversion response received, HTML length: 5678
[API] Error: 401 /api/notes/convert/
```

### 7. **Note Store** (`frontend/src/store/noteStore.ts`)
```
[NoteStore] convertLatex called, LaTeX length: 1234
[NoteStore] Calling API convertLatex
[NoteStore] ✓ API response { hasHtmlContent, htmlLength }
[NoteStore] convertLatex error: ...
```

---

## 🎯 How to Use Logging

### Step 1: Open Browser DevTools
- **Chrome/Firefox/Edge:** Press `F12` or `Ctrl+Shift+I`
- **Safari:** Enable Developer Tools in Settings

### Step 2: Go to Console Tab
- Click the "Console" tab in DevTools
- This is where all `console.log()` messages appear

### Step 3: Open the App
- Open http://localhost:5173/
- Watch console as you interact

### Step 4: Try to Reproduce Issue
1. Create a new note or open existing
2. Paste some LaTeX in the editor
3. Watch console logs for the flow

---

## 🔄 Expected Log Flow When Preview Works

```
1. [HTMLPreview] Component mounted
2. [HTMLPreview] Initializing MathJax
3. [MathJax] init() called
4. [MathJax] Creating new script element
5. [MathJax] Appending script to head
6. [MathJax] Script loaded
7. [MathJax] ✓ Fully initialized
8. [HTMLPreview] ✓ MathJax init complete

[User types LaTeX...]

9. [LaTeXInput] Content changed, length: 234
10. [ConverterService] convertLatex called with 234 chars
11. [NoteStore] convertLatex called, LaTeX length: 234
12. [NoteStore] Calling API convertLatex
13. [API] Request: POST /api/notes/convert/
14. [API] Converting LaTeX, length: 234
15. [API] Response: 200 /api/notes/convert/
16. [API] ✓ Conversion response received, HTML length: 1234
17. [NoteStore] ✓ API response { hasHtmlContent: true, htmlLength: 1234 }
18. [ConverterService] ✓ Conversion done, HTML length: 1234
19. [LaTeXInput] ✓ Conversion successful
20. [HTMLPreview] html changed { htmlLength: 1234, hasRef: true }
21. [MathJax] typeset() called
22. [MathJax] Calling typesetPromise
23. [MathJax] ✓ typeset completed successfully
24. [HTMLPreview] ✓ MathJax typeset complete
```

---

## 🚨 Common Issues & What to Look For

### Issue: Preview Not Showing
**Look for:** 
- Do you see `[API] Response: 200`?
  - **YES:** API working, check next
  - **NO:** API error - check [API] Error messages

- Do you see `[HTMLPreview] html changed`?
  - **YES:** HTML received, check MathJax
  - **NO:** HTML not reaching component

- Do you see `[MathJax] ✓ Fully initialized`?
  - **YES:** MathJax ready
  - **NO:** MathJax failed to load

### Issue: API Returning Error
**Look for:**
```
[API] Error: 401 /api/notes/convert/
```
This means authorization failed. Check token.

```
[API] Error: 500 /api/notes/convert/
```
This means backend error. Check Django logs.

### Issue: MathJax Not Rendering
**Look for:**
```
[MathJax] typeset() called
[MathJax] ✓ typeset completed successfully
```

If you see these but no equations render, MathJax loaded but equations aren't in HTML. Check `[HTMLPreview] html changed` to see if HTML contains math.

---

## 📋 Clear Console

To make logs easier to read:
1. Click the **circle with slash** 🚫 in console (clears logs)
2. Or press `Ctrl+L`
3. Now interact with app - clean logs only

---

## 💾 Save Console Logs

To save logs for debugging:
1. Right-click in console
2. Select "Save as..." 
3. This saves all console output as a file

---

## 🔧 Backend Logging

Backend logs appear in the **terminal** where you ran `bash start.sh`:

```
[28/Jan/2026 11:00:24] "POST /api/notes/convert/ HTTP/1.1" 200
```

This shows:
- Request method: POST
- Endpoint: /api/notes/convert/
- Status: 200 (OK)

---

## 📊 Quick Troubleshooting Checklist

- [ ] Browser console shows no errors (red messages)
- [ ] See `[MathJax] ✓ Fully initialized`?
- [ ] See `[API] Response: 200` when typing?
- [ ] See `[HTMLPreview] html changed` with length > 0?
- [ ] See `[MathJax] ✓ typeset completed`?

If all checked, preview should be working!

---

## 🎯 What Each Log Category Tells You

| Log Prefix | Purpose | Critical? |
|-----------|---------|-----------|
| `[MathJax]` | Math rendering | ⚠️ Yes |
| `[HTMLPreview]` | Preview display | ⚠️ Yes |
| `[LaTeXInput]` | Editor input | ⚠️ Yes |
| `[API]` | Server communication | ⚠️ Yes |
| `[ConverterService]` | Conversion logic | ⚠️ Yes |
| `[Editor]` | Page state | ℹ️ Info |
| `[NoteStore]` | State management | ℹ️ Info |

---

## 🚀 Next Steps

1. **Open DevTools:** Press F12
2. **Go to Console:** Click "Console" tab
3. **Paste test LaTeX:**
   ```latex
   \section*{Test}
   
   This is a test: $E = mc^2$
   ```
4. **Watch the logs flow**
5. **Share screenshot of console** if preview not showing

---

*Comprehensive logging is now active. Use these logs to diagnose exactly where the preview rendering is failing.*
