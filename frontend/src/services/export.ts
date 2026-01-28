// Export functionality for notes
import type { Note } from '../types';

export class ExportService {
  /**
   * Export note as Markdown
   */
  static exportAsMarkdown(note: Note): string {
    const content = `# ${note.title}

**Created**: ${new Date(note.created_at).toLocaleString()}
**Updated**: ${new Date(note.updated_at).toLocaleString()}

## LaTeX Source

\`\`\`latex
${note.latex_content}
\`\`\`

## Rendered Output

${note.html_content}

---
*Exported from LaTeX Converter Web*
`;

    this.downloadFile(content, `${note.title}.md`, 'text/markdown');
  }

  /**
   * Export note as HTML
   */
  static exportAsHTML(note: Note): string {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        h1 { color: #222; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #444; margin-top: 1.5em; }
        h3 { color: #666; margin-top: 1.2em; }
        code { background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        pre { background-color: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .meta { font-size: 0.9em; color: #666; margin-bottom: 2em; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <div class="meta">
        <p><strong>Created:</strong> ${new Date(note.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(note.updated_at).toLocaleString()}</p>
    </div>
    <div class="content">
        ${note.html_content}
    </div>
</body>
</html>`;

    this.downloadFile(html, `${note.title}.html`, 'text/html');
  }

  /**
   * Copy HTML to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Download file helper
   */
  private static downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Print note
   */
  static print(note: Note) {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${note.title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { border-bottom: 2px solid black; }
        .meta { font-size: 0.9em; color: #666; margin-bottom: 2em; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <div class="meta">
        <p><strong>Created:</strong> ${new Date(note.created_at).toLocaleString()}</p>
    </div>
    ${note.html_content}
    <script>window.print();</script>
</body>
</html>`);
    printWindow.document.close();
  }
}
