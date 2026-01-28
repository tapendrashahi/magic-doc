/**
 * Mathpix to LMS converter service
 * PHASE 7: Frontend service for converting Mathpix LaTeX to LMS-compatible HTML
 * 
 * This service calls the backend /api/convert/ endpoint which:
 * - Takes Mathpix LaTeX text
 * - Extracts equations and sections
 * - Renders with KaTeX
 * - Returns LMS-compatible HTML fragment with __se__katex styling
 */

import apiClient from '../api/client';
import clipboardService from './clipboard';

export interface ConversionStats {
  total_equations: number;
  display_equations: number;
  inline_equations: number;
  sections: number;
  words: number;
  characters: number;
}

export interface MathpixConversionResult {
  success: boolean;
  html_fragment: string;
  stats?: ConversionStats;
  conversion_time_ms: number;
  error?: string;
}

class MathpixConverterService {
  private lastConversion: MathpixConversionResult | null = null;
  private isConverting: boolean = false;

  /**
   * Convert Mathpix LaTeX text to LMS-compatible HTML fragment
   * @param mathpix_text The raw Mathpix LaTeX text
   * @param include_stats Whether to include conversion statistics
   * @returns Conversion result with HTML fragment
   */
  async convertMathpix(
    mathpix_text: string,
    include_stats: boolean = false
  ): Promise<MathpixConversionResult> {
    if (!mathpix_text || !mathpix_text.trim()) {
      return {
        success: false,
        html_fragment: '',
        conversion_time_ms: 0,
        error: 'Input text is empty',
      };
    }

    // Prevent concurrent conversions
    if (this.isConverting) {
      console.warn('[MathpixConverterService] Conversion already in progress, ignoring');
      return {
        success: false,
        html_fragment: '',
        conversion_time_ms: 0,
        error: 'Conversion already in progress',
      };
    }

    this.isConverting = true;
    const startTime = Date.now();

    try {
      console.log(
        `[MathpixConverterService] Starting conversion: ${mathpix_text.length} chars, stats=${include_stats}`
      );

      const response = await apiClient.convertMathpixToLMS(mathpix_text, include_stats);
      const conversionTime = Date.now() - startTime;

      if (response.data.success) {
        // Cache the conversion
        this.lastConversion = {
          success: true,
          html_fragment: response.data.html_fragment || '',
          stats: response.data.stats,
          conversion_time_ms: response.data.conversion_time_ms || conversionTime,
        };

        console.log(
          `[MathpixConverterService] ✓ Conversion successful in ${this.lastConversion.conversion_time_ms}ms`
        );
        if (this.lastConversion.stats) {
          console.log('[MathpixConverterService] Stats:', this.lastConversion.stats);
        }

        return this.lastConversion;
      } else {
        const errorMsg = response.data.error || 'Unknown error during conversion';
        console.error('[MathpixConverterService] Conversion failed:', errorMsg);
        return {
          success: false,
          html_fragment: '',
          conversion_time_ms: conversionTime,
          error: errorMsg,
        };
      }
    } catch (error) {
      const conversionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[MathpixConverterService] Exception during conversion:', error);

      return {
        success: false,
        html_fragment: '',
        conversion_time_ms: conversionTime,
        error: `Conversion failed: ${errorMessage}`,
      };
    } finally {
      this.isConverting = false;
    }
  }

  /**
   * Get the last conversion result
   * @returns Last conversion result or null
   */
  getLastConversion(): MathpixConversionResult | null {
    return this.lastConversion;
  }

  /**
   * Clear the last conversion result
   */
  clearCache(): void {
    this.lastConversion = null;
    console.log('[MathpixConverterService] Cache cleared');
  }

  /**
   * Copy the HTML fragment to clipboard
   * @returns Copy result
   */
  async copyHTMLFragment(): Promise<{ success: boolean; message: string }> {
    if (!this.lastConversion?.html_fragment) {
      return {
        success: false,
        message: 'No HTML fragment to copy. Convert first.',
      };
    }

    try {
      const result = await clipboardService.copyHTML(
        this.lastConversion.html_fragment,
        this.lastConversion.html_fragment,
        'HTML Fragment'
      );
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error('[MathpixConverterService] Failed to copy HTML:', error);
      return {
        success: false,
        message: 'Failed to copy HTML to clipboard',
      };
    }
  }

  /**
   * Format statistics for display
   * @returns Formatted statistics string
   */
  getFormattedStats(): string {
    if (!this.lastConversion?.stats) {
      return 'No statistics available';
    }

    const stats = this.lastConversion.stats;
    return `📊 Equations: ${stats.total_equations} (${stats.display_equations} display, ${stats.inline_equations} inline) | Sections: ${stats.sections} | Words: ${stats.words} | Chars: ${stats.characters}`;
  }

  /**
   * Check if conversion is currently in progress
   * @returns true if conversion is in progress
   */
  getIsConverting(): boolean {
    return this.isConverting;
  }

  /**
   * Validate Mathpix text (check for LaTeX patterns)
   * @param text Text to validate
   * @returns true if text contains LaTeX patterns
   */
  validateMathpixText(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }

    // Check for common LaTeX patterns
    const patterns = [
      /\$.*?\$/,        // Inline math
      /\$\$.*?\$\$/,    // Display math
      /\\section/,      // Sections
      /\\textbf/,       // Text formatting
      /\\frac/,         // Fractions
      /\\[a-zA-Z]+/,    // Commands
    ];

    return patterns.some(pattern => pattern.test(text));
  }
}

export default new MathpixConverterService();
