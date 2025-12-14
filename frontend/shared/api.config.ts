import { ApiError } from '../types/common';
import { env } from '../config/env';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Extract payment requirement headers for 402 errors
      let details = errorData;
      if (response.status === 402) {
        details = {
          cost: response.headers.get('x-cost'),
          address: response.headers.get('x-address'),
          facilitator: response.headers.get('x-facilitator'),
          network: response.headers.get('x-network'),
          unit: response.headers.get('x-unit'),
          assetId: endpoint.split('/').pop(),
        };
      }

      const error: ApiError = {
        status: response.status,
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.message || 'An unknown error occurred',
        details,
      };
      
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>, customHeaders?: Record<string, string>) {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params)}` 
      : endpoint;
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