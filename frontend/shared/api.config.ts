// src/lib/api/client.ts
import { ApiError } from '../types/common';

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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.message || 'An unknown error occurred',
        details: errorData.details,
      } as ApiError;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>) {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params)}` 
      : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  }

  async patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  setApiKey(apiKey: string) {
    this.defaultHeaders['x-api-key'] = apiKey;
  }

  setUserWallet(wallet: string) {
    this.defaultHeaders['x-user-wallet'] = wallet;
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_PAY_PER_COMPUTE_URL??""
);