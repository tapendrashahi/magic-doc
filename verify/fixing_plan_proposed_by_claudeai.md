# LaTeX URL-Encoding Fix Plan

## Problem Statement
HTML files with LaTeX math expressions stored in `data-latex` attributes are URL-encoded, preventing proper rendering in LMS systems that expect plain LaTeX syntax.

## Root Cause
- **Issue**: LaTeX code in `data-latex` attributes is URL-encoded (e.g., `%5C` instead of `\`)
- **Expected**: Plain LaTeX syntax (e.g., `\frac{a}{b}`)
- **Actual**: URL-encoded syntax (e.g., `%5Cfrac%7Ba%7D%7Bb%7D`)

## Generic Solution Approach

### Step 1: Identify the Pattern
Look for HTML elements with:
```html
<span class="tiptap-katex" data-latex="ENCODED_LATEX_HERE"></span>
```

### Step 2: URL Decode the LaTeX
Convert URL-encoded characters to their plain text equivalents:
- `%5C` → `\` (backslash)
- `%7B` → `{` (left brace)
- `%7D` → `}` (right brace)
- `%2C` → `,` (comma)
- `%20` → ` ` (space)
- `%2B` → `+` (plus)
- `%3D` → `=` (equals)
- And all other URL-encoded characters

### Step 3: Replace in Original File
Replace the encoded `data-latex` values with decoded versions while preserving all other HTML structure.

## Implementation Options

### Option A: Python Script (Recommended)
**Pros**: Fast, reliable, works on any system with Python
**Use case**: Batch processing multiple files, automation

### Option B: Online Tool
**Pros**: No installation needed, quick for single files
**Use case**: One-time fixes, quick tests

### Option C: Text Editor with Regex
**Pros**: No additional tools needed
**Use case**: Manual fixes, small files

### Option D: Node.js Script
**Pros**: Good for web developers, integrates with build pipelines
**Use case**: Automated workflows, CI/CD integration

## Detailed Implementation Plans

---

## OPTION A: Python Script Solution

### Requirements
- Python 3.6 or higher
- Standard library only (no external dependencies)

### Script: `fix_latex_encoding.py`

```python
#!/usr/bin/env python3
"""
LaTeX URL-Encoding Fixer
Decodes URL-encoded LaTeX in HTML files with data-latex attributes.
"""

import re
import urllib.parse
import sys
from pathlib import Path


def decode_latex_in_html(html_content):
    """
    Find all data-latex attributes and decode their URL-encoded content.
    
    Args:
        html_content (str): HTML content with potentially encoded LaTeX
        
    Returns:
        str: HTML content with decoded LaTeX
    """
    # Pattern to match data-latex="..." attributes
    pattern = r'data-latex="([^"]*)"'
    
    def decode_match(match):
        encoded_latex = match.group(1)
        # URL decode the LaTeX content
        decoded_latex = urllib.parse.unquote(encoded_latex)
        return f'data-latex="{decoded_latex}"'
    
    # Replace all encoded data-latex attributes
    decoded_html = re.sub(pattern, decode_match, html_content)
    
    return decoded_html


def process_file(input_path, output_path=None):
    """
    Process a single HTML file to decode LaTeX.
    
    Args:
        input_path (str): Path to input HTML file
        output_path (str, optional): Path to output file. If None, overwrites input.
    """
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File '{input_path}' not found.")
        return False
    
    # Read the file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    # Decode LaTeX
    decoded_content = decode_latex_in_html(html_content)
    
    # Determine output path
    if output_path is None:
        output_file = input_file
        print(f"Overwriting: {input_file}")
    else:
        output_file = Path(output_path)
        print(f"Creating: {output_file}")
    
    # Write the result
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(decoded_content)
        print("✓ Successfully decoded LaTeX!")
        return True
    except Exception as e:
        print(f"Error writing file: {e}")
        return False


def process_directory(directory_path, recursive=False):
    """
    Process all HTML files in a directory.
    
    Args:
        directory_path (str): Path to directory
        recursive (bool): Whether to process subdirectories
    """
    dir_path = Path(directory_path)
    
    if not dir_path.is_dir():
        print(f"Error: '{directory_path}' is not a directory.")
        return
    
    # Find HTML files
    if recursive:
        html_files = list(dir_path.rglob("*.html"))
    else:
        html_files = list(dir_path.glob("*.html"))
    
    if not html_files:
        print("No HTML files found.")
        return
    
    print(f"Found {len(html_files)} HTML file(s)")
    
    success_count = 0
    for html_file in html_files:
        print(f"\nProcessing: {html_file}")
        if process_file(html_file):
            success_count += 1
    
    print(f"\n{'='*50}")
    print(f"Processed {success_count}/{len(html_files)} files successfully")


def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Single file:  python fix_latex_encoding.py <input.html> [output.html]")
        print("  Directory:    python fix_latex_encoding.py --dir <directory> [--recursive]")
        print("\nExamples:")
        print("  python fix_latex_encoding.py document.html")
        print("  python fix_latex_encoding.py document.html fixed_document.html")
        print("  python fix_latex_encoding.py --dir ./html_files")
        print("  python fix_latex_encoding.py --dir ./html_files --recursive")
        sys.exit(1)
    
    # Directory mode
    if sys.argv[1] == "--dir":
        if len(sys.argv) < 3:
            print("Error: Please specify a directory path")
            sys.exit(1)
        
        recursive = "--recursive" in sys.argv or "-r" in sys.argv
        process_directory(sys.argv[2], recursive)
    
    # Single file mode
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        process_file(input_file, output_file)


if __name__ == "__main__":
    main()
```

### Usage Instructions

1. **Save the script** as `fix_latex_encoding.py`

2. **Single file processing:**
   ```bash
   # Overwrite the original file
   python fix_latex_encoding.py document.html
   
   # Create a new file
   python fix_latex_encoding.py document.html fixed_document.html
   ```

3. **Batch process a directory:**
   ```bash
   # Process all HTML files in a directory
   python fix_latex_encoding.py --dir ./my_html_files
   
   # Process recursively (including subdirectories)
   python fix_latex_encoding.py --dir ./my_html_files --recursive
   ```

---

## OPTION B: Online Tool Method

### Steps:
1. Open your HTML file in a text editor
2. Copy all content
3. Go to an online URL decoder (e.g., https://www.urldecoder.org/)
4. Paste and decode
5. **Important**: Only decode the `data-latex` attribute values, not the entire HTML
6. Copy back to your file

### Limitations:
- Manual and time-consuming for multiple files
- Risk of decoding things that shouldn't be decoded
- Not practical for large files or batch processing

---

## OPTION C: Text Editor with Find & Replace

### Using VS Code, Sublime Text, or similar:

1. **Open Find & Replace** (Ctrl+H or Cmd+H)

2. **Enable Regular Expression mode**

3. **Use this pattern:**
   - Find: `data-latex="([^"]*)"`
   - This requires a script or multiple replacements for each encoding

4. **Manual replacements** (repeat for each):
   - Find: `%5C` → Replace: `\`
   - Find: `%7B` → Replace: `{`
   - Find: `%7D` → Replace: `}`
   - Find: `%2C` → Replace: `,`
   - Find: `%20` → Replace: ` `
   - Find: `%2B` → Replace: `+`
   - Find: `%3D` → Replace: `=`
   - (Continue for all encoded characters)

### Limitations:
- Tedious for many encoded characters
- Easy to miss some encodings
- Not automated

---

## OPTION D: Node.js Script Solution

### Requirements
- Node.js 12 or higher
- No external dependencies

### Script: `fix-latex-encoding.js`

```javascript
#!/usr/bin/env node
/**
 * LaTeX URL-Encoding Fixer (Node.js version)
 * Decodes URL-encoded LaTeX in HTML files with data-latex attributes.
 */

const fs = require('fs');
const path = require('path');

/**
 * Decode LaTeX in HTML content
 */
function decodeLatexInHtml(htmlContent) {
    const pattern = /data-latex="([^"]*)"/g;
    
    return htmlContent.replace(pattern, (match, encodedLatex) => {
        const decodedLatex = decodeURIComponent(encodedLatex);
        return `data-latex="${decodedLatex}"`;
    });
}

/**
 * Process a single file
 */
function processFile(inputPath, outputPath = null) {
    try {
        // Read file
        const htmlContent = fs.readFileSync(inputPath, 'utf-8');
        
        // Decode LaTeX
        const decodedContent = decodeLatexInHtml(htmlContent);
        
        // Determine output path
        const finalOutputPath = outputPath || inputPath;
        
        // Write result
        fs.writeFileSync(finalOutputPath, decodedContent, 'utf-8');
        
        console.log(`✓ Successfully processed: ${finalOutputPath}`);
        return true;
    } catch (error) {
        console.error(`✗ Error processing ${inputPath}:`, error.message);
        return false;
    }
}

/**
 * Process directory
 */
function processDirectory(dirPath, recursive = false) {
    let htmlFiles = [];
    
    function findHtmlFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && recursive) {
                findHtmlFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }
    
    findHtmlFiles(dirPath);
    
    if (htmlFiles.length === 0) {
        console.log('No HTML files found.');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML file(s)\n`);
    
    let successCount = 0;
    for (const file of htmlFiles) {
        if (processFile(file)) {
            successCount++;
        }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processed ${successCount}/${htmlFiles.length} files successfully`);
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage:');
        console.log('  Single file:  node fix-latex-encoding.js <input.html> [output.html]');
        console.log('  Directory:    node fix-latex-encoding.js --dir <directory> [--recursive]');
        console.log('\nExamples:');
        console.log('  node fix-latex-encoding.js document.html');
        console.log('  node fix-latex-encoding.js document.html fixed_document.html');
        console.log('  node fix-latex-encoding.js --dir ./html_files');
        console.log('  node fix-latex-encoding.js --dir ./html_files --recursive');
        process.exit(1);
    }
    
    // Directory mode
    if (args[0] === '--dir') {
        if (args.length < 2) {
            console.error('Error: Please specify a directory path');
            process.exit(1);
        }
        
        const recursive = args.includes('--recursive') || args.includes('-r');
        processDirectory(args[1], recursive);
    }
    // Single file mode
    else {
        const inputFile = args[0];
        const outputFile = args[1] || null;
        processFile(inputFile, outputFile);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { decodeLatexInHtml, processFile, processDirectory };
```

### Usage:
```bash
# Single file
node fix-latex-encoding.js document.html

# Batch processing
node fix-latex-encoding.js --dir ./html_files --recursive
```

---

## Testing Your Fix

After applying any solution, test with this sample:

### Before (Encoded):
```html
<span class="tiptap-katex" data-latex="%5Cfrac%7Ba%7D%7Bb%7D"></span>
```

### After (Decoded):
```html
<span class="tiptap-katex" data-latex="\frac{a}{b}"></span>
```

### Verification Checklist:
- [ ] No `%` characters in `data-latex` attributes
- [ ] LaTeX commands start with `\` (backslash)
- [ ] Braces `{` and `}` are visible
- [ ] Math renders correctly in your LMS preview

---

## Common URL Encodings Reference

| Encoded | Decoded | Description |
|---------|---------|-------------|
| `%5C`   | `\`     | Backslash (LaTeX commands) |
| `%7B`   | `{`     | Left brace |
| `%7D`   | `}`     | Right brace |
| `%2C`   | `,`     | Comma |
| `%20`   | ` `     | Space |
| `%2B`   | `+`     | Plus sign |
| `%3D`   | `=`     | Equals sign |
| `%5E`   | `^`     | Caret (exponent) |
| `%28`   | `(`     | Left parenthesis |
| `%29`   | `)`     | Right parenthesis |
| `%5B`   | `[`     | Left bracket |
| `%5D`   | `]`     | Right bracket |
| `%26`   | `&`     | Ampersand |
| `%3A`   | `:`     | Colon |

---

## Troubleshooting

### Issue: Script doesn't find files
**Solution**: Check file paths and make sure you're in the correct directory

### Issue: Permission denied
**Solution**: 
- Linux/Mac: `chmod +x fix_latex_encoding.py`
- Windows: Run as administrator

### Issue: Still not rendering in LMS
**Possible causes**:
1. LMS doesn't support KaTeX/MathJax
2. JavaScript is disabled
3. Missing required libraries
4. Check LMS documentation for math rendering requirements

### Issue: Some formulas still encoded
**Solution**: Run the script again or check for nested encoding

---

## Best Practices

1. **Always backup** your original files before processing
2. **Test with one file** before batch processing
3. **Verify rendering** in your LMS after fixing
4. **Use version control** (Git) to track changes
5. **Document your process** for future reference

---

## Integration with Workflows

### Git Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
python fix_latex_encoding.py --dir ./content --recursive
git add *.html
```

### Build Pipeline (package.json)
```json
{
  "scripts": {
    "fix-latex": "node fix-latex-encoding.js --dir ./dist --recursive"
  }
}
```

### Makefile
```makefile
fix-latex:
	python fix_latex_encoding.py --dir ./html --recursive
	
.PHONY: fix-latex
```

---

## Conclusion

**Recommended approach**: Use the Python script (Option A) for its simplicity, no dependencies, and cross-platform compatibility.

For quick one-off fixes, the text editor method works, but for any serious workflow, automate with a script.
