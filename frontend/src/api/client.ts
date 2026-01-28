import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = localStorage.getItem('authToken');

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      if (this.token) {
        config.headers.Authorization = `Token ${this.token}`;
      }
      return config;
    });

    // Log responses
    this.client.interceptors.response.use(
      (response) => {
        console.log('[API] Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('[API] Error:', error.response?.status, error.config?.url, error.message);
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken() {
    return this.token;
  }

  // Auth endpoints
  login(username: string, password: string) {
    return this.client.post('/auth/login/', { username, password });
  }

  logout() {
    this.clearToken();
    return Promise.resolve();
  }

  getMe() {
    return this.client.get('/users/me/');
  }

  // Notes endpoints
  getNotes() {
    return this.client.get('/notes/');
  }

  createNote(data: { title: string; latex_content: string }) {
    return this.client.post('/notes/', data);
  }

  getNote(id: number) {
    return this.client.get(`/notes/${id}/`);
  }

  updateNote(id: number, data: Partial<{ title: string; latex_content: string; html_content: string }>) {
    return this.client.patch(`/notes/${id}/`, data);
  }

  deleteNote(id: number) {
    return this.client.delete(`/notes/${id}/`);
  }

  toggleFavorite(id: number) {
    return this.client.post(`/notes/${id}/toggle_favorite/`);
  }

  // Converter endpoint
  convertLatex(latex_content: string, format: 'katex' | 'plain_html' = 'katex') {
    console.log('[API] Converting LaTeX, length:', latex_content.length, 'format:', format);
    return this.client.post('/notes/convert/', { 
      latex_content,
      format
    })
      .then(response => {
        console.log('[API] ✓ Conversion response received, HTML length:', response.data.html_content?.length, 'format:', response.data.format);
        return response;
      })
      .catch(error => {
        console.error('[API] Conversion failed:', error.message);
        throw error;
      });
  }

  // Mathpix to LMS conversion endpoint (PHASE 7)
  convertMathpixToLMS(mathpix_text: string, include_stats: boolean = false) {
    console.log('[API] Converting Mathpix to LMS, length:', mathpix_text.length, 'stats:', include_stats);
    return this.client.post('/convert/', { 
      mathpix_text,
      include_stats
    })
      .then(response => {
        console.log('[API] ✓ Mathpix conversion response received, HTML length:', response.data.html_fragment?.length, 'time:', response.data.conversion_time_ms + 'ms');
        return response;
      })
      .catch(error => {
        console.error('[API] Mathpix conversion failed:', error.message);
        throw error;
      });
  }

  // History endpoints
  getHistory() {
    return this.client.get('/history/');
  }

  // Additional endpoints
  getFavorites() {
    return this.client.get('/notes/favorites/');
  }

  getRecent(limit: number = 10) {
    return this.client.get(`/notes/recent/?limit=${limit}`);
  }

  search(query: string) {
    return this.client.get(`/notes/?search=${query}`);
  }
}

export default new ApiClient();
