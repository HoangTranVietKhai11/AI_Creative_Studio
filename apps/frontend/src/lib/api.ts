// ============================================
// ContentPilot AI — API Client
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const request = () => fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });
    let response = await request();

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        response = await request();
      }
      if (!refreshed || response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login') window.location.assign('/login');
        }
        throw new Error('Your session has expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText || 'Request failed' }));
      const message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
      throw new Error(message || `Request failed (${response.status})`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const upload = () => {
      const headers: HeadersInit = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      return fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: formData });
    };
    let response = await upload();
    if (response.status === 401 && await this.refreshToken()) response = await upload();

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText || 'Upload failed' }));
      throw new Error(error.message || `Upload failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  }

  async getValidToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('accessToken');
    if (!token && !(await this.refreshToken())) return null;
    return localStorage.getItem('accessToken');
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    return this.refreshToken();
  }

  private async refreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;

        const payload = await response.json();
        const tokens = payload.data ?? payload;
        if (!tokens.accessToken || !tokens.refreshToken) return false;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }
}

export const api = new ApiClient(API_URL);
