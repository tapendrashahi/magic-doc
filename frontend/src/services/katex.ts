/**
 * KaTeX Service - Load and render KaTeX math
 * Handles initialization and rendering of KaTeX formulas in HTML
 */

interface KaTeXOptions {
  delimiters?: Array<{
    left: string;
    right: string;
    display: boolean;
  }>;
  [key: string]: any;
}

class KaTeXService {
  private initialized = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initialize KaTeX - load from CDN
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.log('[KaTeX] Already initialized');
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      try {
        // Load KaTeX CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);

        // Load KaTeX JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.async = true;
        script.onload = () => {
          // Load auto-render extension for automatic math detection
          const autoRender = document.createElement('script');
          autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
          autoRender.async = true;
          autoRender.onload = () => {
            this.initialized = true;
            console.log('[KaTeX] ✓ Initialization complete');
            resolve();
          };
          autoRender.onerror = () => {
            const error = new Error('Failed to load KaTeX auto-render');
            console.error('[KaTeX]', error);
            reject(error);
          };
          document.head.appendChild(autoRender);
        };
        script.onerror = () => {
          const error = new Error('Failed to load KaTeX');
          console.error('[KaTeX]', error);
          reject(error);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('[KaTeX] Initialization error:', error);
        reject(error);
      }
    });

    return this.loadPromise;
  }

  /**
   * Render math in an HTML element
   * Auto-detects and renders all math expressions with $...$ and $$...$$
   * Also renders TipTap format equations with data-latex attributes
   */
  async render(element: HTMLElement = document.body): Promise<void> {
    if (!this.initialized) {
      console.warn('[KaTeX] Not initialized, skipping render');
      return;
    }

    try {
      // First, render standard math delimiters
      const renderMathInElement = (window as any).renderMathInElement;
      if (!renderMathInElement) {
        console.error('[KaTeX] renderMathInElement not found');
        return;
      }

      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },  // Display math
          { left: '$', right: '$', display: false },   // Inline math
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
        errorColor: '#cc0000',
      });

      // Then, render TipTap format equations
      this.renderTipTapEquations(element);

      console.log('[KaTeX] ✓ Render complete for element');
    } catch (error) {
      console.error('[KaTeX] Render error:', error);
      throw error;
    }
  }

  /**
   * Render TipTap format equations (span.tiptap-katex with data-latex attribute)
   */
  private renderTipTapEquations(element: HTMLElement): void {
    const katex = (window as any).katex;
    if (!katex) {
      console.warn('[KaTeX] KaTeX library not available for TipTap rendering');
      return;
    }

    const tiptapSpans = element.querySelectorAll('span.tiptap-katex[data-latex]');
    
    tiptapSpans.forEach((span: Element) => {
      const latexEncoded = span.getAttribute('data-latex');
      if (!latexEncoded) return;

      try {
        // Decode URL-encoded LaTeX
        const latex = decodeURIComponent(latexEncoded);

        // Render with KaTeX
        katex.render(latex, span as HTMLElement, {
          throwOnError: false,
          errorColor: '#cc0000',
        });
      } catch (error) {
        console.warn('[KaTeX] Failed to render TipTap equation:', error, 'LaTeX:', latexEncoded);
        // Add error class for visibility
        (span as HTMLElement).classList.add('katex-error');
      }
    });
  }

  /**
   * Check if KaTeX is loaded
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
const katexService = new KaTeXService();
export default katexService;
