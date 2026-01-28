import apiClient from '../api/client';

export type ConversionFormat = 'katex' | 'plain_html';

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  let callCount = 0;
  return function executedFunction(...args: Parameters<T>) {
    callCount++;
    console.log('[Debounce] Call #' + callCount + ', waiting ' + wait + 'ms');
    const later = () => {
      console.log('[Debounce] Executing after ' + wait + 'ms wait');
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Converter service with real-time conversion
class ConverterService {
  private debouncedConvert = debounce(this._convert.bind(this), 800); // Increased from 500ms to reduce lag
  private lastConvertedLatex = '';
  private lastHtml = '';
  private format: ConversionFormat = 'katex';

  setFormat(format: ConversionFormat) {
    console.log('[ConverterService] Setting format to:', format);
    this.format = format;
    // Clear cache when format changes
    this.lastConvertedLatex = '';
    this.lastHtml = '';
  }

  getFormat(): ConversionFormat {
    return this.format;
  }

  async convertLatex(latex: string, format?: ConversionFormat): Promise<string> {
    const convertFormat = format || this.format;
    console.log('[ConverterService] convertLatex called with', latex.length, 'chars, format:', convertFormat);
    
    // Return cached result if content hasn't changed and format is same
    if (latex === this.lastConvertedLatex && this.lastHtml && convertFormat === this.format) {
      console.log('[ConverterService] Using cached result');
      return this.lastHtml;
    }
    
    return new Promise((resolve, reject) => {
      try {
        console.log('[ConverterService] Debounced convert queued');
        this.debouncedConvert(latex, convertFormat, resolve, reject);
      } catch (error) {
        console.error('[ConverterService] Exception:', error);
        reject(error);
      }
    });
  }

  private async _convert(
    latex: string,
    format: ConversionFormat,
    resolve: (value: string) => void,
    reject: (error: any) => void
  ) {
    try {
      console.log('[ConverterService] _convert executing for', latex.length, 'chars, format:', format);
      // Call API with format parameter
      const response = await apiClient.convertLatex(latex, format);
      const html = response.data.html_content;
      
      // Cache the result
      this.lastConvertedLatex = latex;
      this.lastHtml = html;
      this.format = format;
      
      console.log('[ConverterService] ✓ Conversion done, HTML length:', html.length, 'format:', format);
      resolve(html);
    } catch (error) {
      console.error('[ConverterService] _convert failed:', error);
      reject(error);
    }
  }

  // Instant conversion (no debounce)
  async convertInstant(latex: string, format?: ConversionFormat): Promise<string> {
    const convertFormat = format || this.format;
    console.log('[ConverterService] convertInstant called with', latex.length, 'chars, format:', convertFormat);
    try {
      const response = await apiClient.convertLatex(latex, convertFormat);
      return response.data.html_content;
    } catch (error) {
      throw error;
    }
  }
}

export default new ConverterService();
