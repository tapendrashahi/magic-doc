import apiClient from '../api/client';

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
  private debouncedConvert = debounce(this._convert.bind(this), 500);

  async convertLatex(latex: string): Promise<string> {
    console.log('[ConverterService] convertLatex called with', latex.length, 'chars');
    return new Promise((resolve, reject) => {
      try {
        console.log('[ConverterService] Debounced convert queued');
        this.debouncedConvert(latex, resolve, reject);
      } catch (error) {
        console.error('[ConverterService] Exception:', error);
        reject(error);
      }
    });
  }

  private async _convert(
    latex: string,
    resolve: (value: string) => void,
    reject: (error: any) => void
  ) {
    try {
      console.log('[ConverterService] _convert executing for', latex.length, 'chars');
      // Call API directly to avoid hook violations
      const response = await apiClient.convertLatex(latex);
      const html = response.data.html_content;
      console.log('[ConverterService] ✓ Conversion done, HTML length:', html.length);
      resolve(html);
    } catch (error) {
      console.error('[ConverterService] _convert failed:', error);
      reject(error);
    }
  }

  // Instant conversion (no debounce)
  async convertInstant(latex: string): Promise<string> {
    console.log('[ConverterService] convertInstant called with', latex.length, 'chars');
    try {
      const response = await apiClient.convertLatex(latex);
      return response.data.html_content;
    } catch (error) {
      throw error;
    }
  }
}

export default new ConverterService();
