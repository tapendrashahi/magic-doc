// MathJax integration service
export class MathJaxService {
  private static initialized = false;
  private static loading = false;

  static async init() {
    console.log('[MathJax] init() called - initialized:', this.initialized, 'loading:', this.loading);
    
    // Already initialized - return immediately
    if (this.initialized) {
      console.log('[MathJax] Already initialized, returning');
      return Promise.resolve();
    }
    
    // Already loading - return existing promise
    if (this.loading) {
      console.log('[MathJax] Already loading, waiting...');
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            console.log('[MathJax] Load complete, resolving');
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.loading = true;
    console.log('[MathJax] Starting initialization');

    return new Promise<void>((resolve) => {
      // Check if MathJax already loaded in global
      if ((window as any).MathJax) {
        this.initialized = true;
        this.loading = false;
        console.log('[MathJax] ✓ Already loaded globally');
        resolve();
        return;
      }

      // Check if script already exists in DOM
      let existingScript = document.getElementById('MathJax-script');
      if (existingScript) {
        console.log('[MathJax] Script exists in DOM, waiting for it to load');
        // Wait for it to load
        const checkExisting = () => {
          if ((window as any).MathJax) {
            this.initialized = true;
            this.loading = false;
            console.log('[MathJax] ✓ Loaded from existing script');
            resolve();
          } else {
            console.log('[MathJax] Still waiting for existing script...');
            setTimeout(checkExisting, 100);
          }
        };
        checkExisting();
        return;
      }

      // Load MathJax directly (skip polyfill for modern browsers)
      console.log('[MathJax] Creating new script element');
      const mathJaxScript = document.createElement('script');
      mathJaxScript.id = 'MathJax-script';
      mathJaxScript.src =
        'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      mathJaxScript.async = true;
      
      mathJaxScript.onload = () => {
        console.log('[MathJax] Script loaded, waiting for initialization...');
        // Wait a moment for MathJax to fully initialize
        setTimeout(() => {
          this.initialized = true;
          this.loading = false;
          console.log('[MathJax] ✓ Fully initialized and ready');
          console.log('[MathJax] window.MathJax:', !!(window as any).MathJax);
          resolve();
        }, 500);
      };
      
      mathJaxScript.onerror = (error) => {
        console.error('[MathJax] ❌ Failed to load:', error);
        this.initialized = true;
        this.loading = false;
        resolve();
      };

      console.log('[MathJax] Appending script to head');
      document.head.appendChild(mathJaxScript);
    });
  }

  static typeset(element?: HTMLElement) {
    console.log('[MathJax] typeset() called - initialized:', this.initialized, 'element:', !!element);
    
    if (!this.initialized) {
      console.warn('[MathJax] typeset called but not initialized');
      return Promise.resolve();
    }
    
    if (!(window as any).MathJax) {
      console.warn('[MathJax] ⚠️  MathJax not available in window');
      return Promise.resolve();
    }

    try {
      console.log('[MathJax] Calling typesetPromise...');
      return (window as any).MathJax.typesetPromise(element ? [element] : undefined)
        .then(() => {
          console.log('[MathJax] ✓ typeset completed successfully');
        })
        .catch((error: any) => {
          console.error('[MathJax] typeset error:', error);
          return Promise.resolve();
        });
    } catch (error) {
      console.error('[MathJax] Exception during typeset:', error);
      return Promise.resolve();
    }
  }

  static typesetAll() {
    console.log('[MathJax] typesetAll() called');
    return this.typeset();
  }
}

export default MathJaxService;
