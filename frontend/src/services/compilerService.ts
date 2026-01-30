/**
 * API Service for Compiler endpoints
 * Handles all communication with the backend API
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  ConvertTexRequest,
  ConvertTexResponse,
  ConvertBatchRequest,
  ConvertBatchResponse,
  ExportRequest,
  ExportResponse,
  ConversionStats,
} from '../types/compiler';

// Configure base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const COMPILER_API_URL = `${API_BASE_URL}/compiler`;

class CompilerService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: COMPILER_API_URL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add CSRF token to requests (Django CSRF protection)
    this.client.interceptors.request.use((config) => {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
      return config;
    });

    // Handle responses and errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get CSRF token from Django
   */
  private getCsrfToken(): string | null {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + '=') {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  /**
   * Convert a single .tex file to TipTap HTML
   * POST /convert-tex/
   */
  async convertTex(request: ConvertTexRequest): Promise<ConvertTexResponse> {
    try {
      const response = await this.client.post<ConvertTexResponse>(
        '/convert-tex/',
        request
      );
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Convert multiple .tex files in a batch
   * POST /convert-batch/
   */
  async convertBatch(request: ConvertBatchRequest): Promise<ConvertBatchResponse> {
    try {
      const response = await this.client.post<ConvertBatchResponse>(
        '/convert-batch/',
        request
      );
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        results: [],
        total_files: 0,
        successful: 0,
        failed: 0,
      };
    }
  }

  /**
   * Export compiled HTML to various formats
   * POST /export/
   */
  async export(request: ExportRequest): Promise<ExportResponse> {
    try {
      const response = await this.client.post<ExportResponse>(
        '/export/',
        request
      );
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        error: error.response?.data?.error || 'Export failed',
      };
    }
  }

  /**
   * Download an exported file
   * GET /download/<file_id>/
   * Returns file bytes with proper headers
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await this.client.get(`/download/${fileId}/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Download failed'
      );
    }
  }

  /**
   * Get conversion statistics
   * GET /stats/<conversion_id>/
   */
  async getStats(conversionId: number): Promise<ConversionStats> {
    try {
      const response = await this.client.get<{ success: boolean; data: ConversionStats }>(
        `/stats/${conversionId}/`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch statistics'
      );
    }
  }

  /**
   * Trigger a file download in the browser
   */
  triggerDownload(blob: Blob, filename: string): void {
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
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/compiler/convert-tex/`);
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const compilerService = new CompilerService();

// Export class for testing
export default CompilerService;
