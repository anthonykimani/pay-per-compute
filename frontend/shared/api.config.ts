import { env } from '@/config/env';
import { ApiError, PaymentRequirement } from '../types';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(endpoint: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (endpoint.startsWith('/api/v1/merchant') || endpoint.startsWith('/api/v1/auth/regenerate-key')) {
      const apiKey = this.getMerchantApiKeyFromCookie();
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
    }
    return headers;
  }

  private getMerchantApiKeyFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
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

    // ✅ CLONE RESPONSE TO READ HEADERS BEFORE JSON
    const responseClone = response.clone();
    let errorData: any = {};
    try {
      errorData = await responseClone.json();
    } catch {
      // Ignore parse errors
    }

    // ✅ 402 IS PAYMENT REQUIREMENT - RETURN AS SUCCESS CASE
    if (response.status === 402) {
      const paymentRequirement: PaymentRequirement = {
        cost: response.headers.get('x-cost') || '0',
        address: response.headers.get('x-address') || '',
        facilitator: response.headers.get('x-facilitator') || '',
        network: response.headers.get('x-network') || '',
        unit: (response.headers.get('x-unit') || 'minute') as any,
        assetId: endpoint.split('/').pop() || '',
      };

      // ✅ REJECT WITH STRUCTURED DATA (NOT AN ERROR)
      return Promise.reject({
        status: 402,
        code: 'PAYMENT_REQUIRED',
        message: errorData.error || 'Payment required',
        details: paymentRequirement,
      });
    }

    // ❌ ONLY THROW FOR REAL ERRORS
    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.message || 'An unknown error occurred',
        // Don't include 402 details here
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