/**
 * Clipboard utility service for copying text/HTML to clipboard
 * PHASE 7: Frontend integration with copy-to-clipboard functionality
 */

export interface CopyResult {
  success: boolean;
  message: string;
  error?: string;
}

class ClipboardService {
  /**
   * Copy text to clipboard
   * @param text Text to copy
   * @param label Description for logging
   * @returns Copy result
   */
  async copyText(text: string, label: string = 'text'): Promise<CopyResult> {
    if (!text) {
      return {
        success: false,
        message: 'No text provided',
        error: 'Empty content',
      };
    }

    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        console.log(`[ClipboardService] ✓ Copied ${label} (${text.length} chars)`);
        return {
          success: true,
          message: `${label} copied to clipboard (${text.length} characters)`,
        };
      } else {
        // Fallback for older browsers
        return this.copyTextFallback(text, label);
      }
    } catch (error) {
      console.error(`[ClipboardService] Failed to copy ${label}:`, error);
      return this.copyTextFallback(text, label);
    }
  }

  /**
   * Fallback method for copying to clipboard (older browsers)
   * @param text Text to copy
   * @param label Description for logging
   * @returns Copy result
   */
  private copyTextFallback(text: string, label: string): CopyResult {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        console.log(`[ClipboardService] ✓ Fallback: Copied ${label} (${text.length} chars)`);
        return {
          success: true,
          message: `${label} copied to clipboard (${text.length} characters)`,
        };
      } else {
        return {
          success: false,
          message: 'Failed to copy to clipboard',
          error: 'execCommand copy failed',
        };
      }
    } catch (error) {
      console.error(`[ClipboardService] Fallback method failed:`, error);
      return {
        success: false,
        message: 'Failed to copy to clipboard',
        error: String(error),
      };
    }
  }

  /**
   * Copy HTML content to clipboard
   * @param html HTML string to copy
   * @param plainText Plain text fallback
   * @param label Description for logging
   * @returns Copy result
   */
  async copyHTML(
    html: string,
    plainText: string = html,
    label: string = 'HTML'
  ): Promise<CopyResult> {
    if (!html && !plainText) {
      return {
        success: false,
        message: 'No content provided',
        error: 'Empty content',
      };
    }

    try {
      // Try to use ClipboardItem API for HTML with fallback to text
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          const blob = new Blob([html], { type: 'text/html' });
          const item = new ClipboardItem({ 'text/html': blob });
          await navigator.clipboard.write([item]);
          console.log(`[ClipboardService] ✓ Copied ${label} as HTML (${html.length} chars)`);
          return {
            success: true,
            message: `${label} copied to clipboard as HTML (${html.length} characters)`,
          };
        } catch (clipboardError) {
          // Fall back to plain text copy
          console.warn(`[ClipboardService] HTML copy failed, falling back to text:`, clipboardError);
          return this.copyText(plainText, label);
        }
      } else {
        // Fallback to plain text
        return this.copyText(plainText, label);
      }
    } catch (error) {
      console.error(`[ClipboardService] Failed to copy HTML ${label}:`, error);
      return this.copyText(plainText, label);
    }
  }

  /**
   * Get current clipboard content (with permission check)
   * @returns Clipboard content or null
   */
  async getClipboardContent(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        console.log(`[ClipboardService] ✓ Read clipboard (${text.length} chars)`);
        return text;
      }
    } catch (error) {
      console.warn(`[ClipboardService] Failed to read clipboard:`, error);
    }
    return null;
  }

  /**
   * Paste content from clipboard (alias for getClipboardContent)
   * @returns Clipboard content or null if empty/failed
   */
  async paste(): Promise<string | null> {
    return this.getClipboardContent();
  }
}

export default new ClipboardService();