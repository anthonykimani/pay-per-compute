import { apiClient } from '@/shared/api.config';
import { Asset, CreateAssetPayload, EnhancedAsset, MerchantEarningsData, PaymentLog } from '@/types';

const getAuthHeaders = (): Record<string, string> => {
  if (typeof document === 'undefined') return {}; // SSR

  const cookies = document.cookie.split('; ');
  const apiKeyCookie = cookies.find(row => row.startsWith('merchant_api_key='));
  const apiKey = apiKeyCookie?.split('=')[1];

  if (!apiKey) {
    throw new Error('Not authenticated. Please login.');
  }

  return { 'x-api-key': apiKey };
};

export const merchantApi = {
  getAssets: () =>
    apiClient
      .get<{ status: string; data: Asset[] }>('/api/v1/merchant/assets', undefined, getAuthHeaders())
      .then(response => response.data as EnhancedAsset[]),

  getEarnings: (filters?: { startDate?: string; endDate?: string }) =>
    apiClient
      .get<{ status: string; data: MerchantEarningsData }>('/api/v1/merchant/earnings', filters, getAuthHeaders())
      .then(response => response.data),

  createAsset: (asset: CreateAssetPayload) =>
    apiClient.post<Asset>(
      '/api/v1/merchant/assets',
      { ...asset, metadata: asset.metadata || {} },
      getAuthHeaders()
    ),

  updateAsset: (id: string, updates: Partial<Asset>) =>
    apiClient.patch<Asset>(
      `/api/v1/merchant/assets/${id}`,
      updates,
      getAuthHeaders()
    ),

  regenerateKey: () =>
    apiClient.post<{ apiKey: string }>(
      '/api/v1/auth/regenerate-key',
      {},
      getAuthHeaders()
    ),

  deactivate: () =>
    apiClient.post(
      '/api/v1/auth/deactivate',
      {},
      getAuthHeaders()
    ),
} as const;