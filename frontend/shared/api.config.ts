
import { env } from '@/config/env';
import { ApiError } from '../types';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // ✅ NEW: Auto-inject merchant API key from cookie for merchant endpoints
  private getAuthHeaders(endpoint: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Inject merchant API key for merchant endpoints
    if (endpoint.startsWith('/api/v1/merchant') || endpoint.startsWith('/api/v1/auth/regenerate-key')) {
      const apiKey = this.getMerchantApiKeyFromCookie();
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
    }
    
    return headers;
  }

  private getMerchantApiKeyFromCookie(): string | null {
    if (typeof document === 'undefined') return null; // Server-side
    const cookies = document.cookie.split('; ');
    const apiKeyCookie = cookies.find(row => row.startsWith('merchant_api_key='));
    return apiKeyCookie ? apiKeyCookie.split('=')[1] : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authHeaders = this.getAuthHeaders(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...authHeaders,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      const error: ApiError = {
        status: response.status,
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.message || 'An unknown error occurred',
        details: response.status === 402 ? {
          cost: response.headers.get('x-cost'),
          address: response.headers.get('x-address'),
          facilitator: response.headers.get('x-facilitator'),
          network: response.headers.get('x-network'),
          unit: response.headers.get('x-unit'),
          assetId: endpoint.split('/').pop(),
        } : undefined,
      };
      
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>, customHeaders?: Record<string, string>) {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { headers: customHeaders });
  }

  async post<T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: customHeaders,
    });
  }

  setApiKey(apiKey: string) {
    this.defaultHeaders['x-api-key'] = apiKey;
  }

  setUserWallet(wallet: string) {
    this.defaultHeaders['x-user-wallet'] = wallet;
  }
}

export const apiClient = new ApiClient(env.NEXT_PUBLIC_PAY_PER_COMPUTE_URL);