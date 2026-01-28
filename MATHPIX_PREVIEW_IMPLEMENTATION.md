# Mathpix Converter Preview Implementation Plan

## Overview
Implement a proper preview rendering system for the Mathpix converter tab, similar to the LaTeX editor's HTML preview functionality.

## Current State Analysis

### What Works ✅
- MathpixPreview component exists with two tabs: "Preview" and "HTML Code"
- HTML Code tab shows raw HTML with scrolling support
- KaTeX service is available and initialized
- Basic UI structure with tab navigation

### What's Missing ❌
- Preview tab doesn't render the HTML content
- No KaTeX rendering in the preview
- HTML is not being set in the preview div
- Missing styling for rendered content

## Implementation Plan

### Phase 1: Update MathpixPreview Component
**File**: `frontend/src/components/MathpixPreview.tsx`

#### Key Changes:
1. **Add HTML content injection to preview div**
   - Set `innerHTML` or use `dangerouslySetInnerHTML` to render HTML
   - Ensure HTML is properly injected before KaTeX rendering

2. **Fix KaTeX rendering flow**
   - Initialize KaTeX on component mount
   - Render KaTeX on HTML changes
   - Handle format changes (katex vs plain_html)

3. **Improve styling**
   - Add prose/typography classes for better readability
   - Add padding and margins for content
   - Ensure scrolling works properly

4. **Error handling**
   - Catch rendering errors
   - Display meaningful error messages
   - Fallback to plain text if rendering fails

### Phase 2: Reference Implementation (HTMLPreview Component)
The working HTMLPreview component provides the reference implementation:

```
HTMLPreview Pattern:
- useEffect with format dependency → Initialize KaTeX once
- useEffect with html dependency → Re-render KaTeX when HTML changes
- Memoized display HTML for fallback
- Uses dangerouslySetInnerHTML to inject HTML
```

### Phase 3: Technical Implementation

#### Step 1: Fix HTML Content Display
- Replace the empty `<div>` in preview tab with actual HTML content
- Use `dangerouslySetInnerHTML` to safely render converted HTML
- Add proper className for styling

#### Step 2: Sync KaTeX Rendering Logic
- Copy the two-useEffect pattern from HTMLPreview
- First useEffect: Initialize KaTeX on mount (format dependency)
- Second useEffect: Render on HTML changes (html & format dependency)
- Use `katexService.render()` with previewRef

#### Step 3: Add Proper Styling
- Apply prose classes for typography
- Add background color for better contrast
- Ensure proper padding and spacing
- Match the LaTeX preview styling

#### Step 4: Handle Edge Cases
- Plain HTML format (skip KaTeX rendering)
- Empty HTML (show placeholder message)
- Loading state (show spinner)
- Error state (show error message)
- Long content (ensure scrolling works)

## Expected Output (Preview Tab)

```
┌─────────────────────────────────────┐
│ Preview          [👁️]  [</>]        │
├─────────────────────────────────────┤
│                                     │
│ The general equation of 2nd degree  │
│ in x and y i.e                      │
│ ax² + 2hxy + by² + 2gx + 2fy + c=0  │
│ represents an ellipse if:           │
│ Δ = abc + 2fgh - af² - bg² - ch² ≠ 0│
│ and h² < ab                         │
│                                     │
│ When eccentricity becomes zero the  │
│ ellipse is a circle.                │
│                                     │
│ Standard equation of an ellipse:    │
│ (x²/a²) + (y²/b²) = 1 (a > b)      │
│                                     │
│ ... [scrollable content] ...        │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Checklist

### MathpixPreview.tsx Updates
- [ ] Add `displayHtml` memoized value for fallback
- [ ] Update preview div to use `dangerouslySetInnerHTML`
- [ ] Add first useEffect for KaTeX initialization
- [ ] Add second useEffect for HTML rendering
- [ ] Update preview className with prose and styling classes
- [ ] Ensure proper scrolling in preview area
- [ ] Test with different HTML content
- [ ] Test with plain_html format
- [ ] Test with empty/loading states

### Testing Points
- [ ] Preview renders correctly with KaTeX
- [ ] Math equations display properly
- [ ] Content scrolls when needed
- [ ] Plain HTML mode works
- [ ] Loading spinner shows
- [ ] Error messages display
- [ ] HTML Code tab still works
- [ ] Tab switching is smooth
- [ ] No console errors

## Benefits After Implementation

✅ Users can see rendered output in real-time
✅ Mathematical equations display beautifully with KaTeX
✅ Better user experience matching LaTeX editor
✅ Proper HTML formatting and typography
✅ Seamless integration with conversion results
✅ Easy switching between preview and code views

## Files to Modify
1. `frontend/src/components/MathpixPreview.tsx` - Main implementation

## Related Files (Reference)
- `frontend/src/components/HTMLPreview.tsx` - Reference implementation
- `frontend/src/services/katex.ts` - KaTeX service
- `frontend/src/pages/Editor.tsx` - Editor integration

## Risk Mitigation
- Use `dangerouslySetInnerHTML` carefully (content comes from our converter)
- Add proper error boundaries
- Test with large HTML outputs
- Ensure no performance issues with frequent renders
