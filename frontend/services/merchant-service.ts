import { apiClient } from '@/shared/api.config';
import { Asset, PaymentLog } from '../types';


// ✅ Pure function to get auth headers
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

// ✅ Functional API object (no class, no this)
export const merchantApi = {
  getAssets: () =>
    apiClient.get<Asset[]>('/api/v1/merchant/assets', undefined, getAuthHeaders()),

  getEarnings: (filters?: { startDate?: string; endDate?: string }) =>
    apiClient.get<PaymentLog[]>('/api/v1/merchant/earnings', filters, getAuthHeaders()),

  createAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Asset>('/api/v1/assets', asset, getAuthHeaders()),

  updateAsset: (id: string, updates: Partial<Asset>) =>
    apiClient.patch<Asset>(`/api/v1/merchant/assets/${id}`, updates, getAuthHeaders()),

  regenerateKey: () =>
    apiClient.post<{ apiKey: string }>('/api/v1/auth/regenerate-key', {}, getAuthHeaders()),

  deactivate: () =>
    apiClient.post('/api/v1/auth/deactivate', {}, getAuthHeaders()),
} as const;