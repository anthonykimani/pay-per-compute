
import { apiClient } from '@/shared/api.config';
import { Asset, PaymentLog } from '../types';

export const merchantApi = {
  getAssets: () =>
    apiClient.get<Asset[]>('/api/v1/merchant/assets'),

  getEarnings: (filters?: { startDate?: string; endDate?: string }) =>
    apiClient.get<PaymentLog[]>('/api/v1/merchant/earnings', filters),

  createAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Asset>('/api/v1/assets', asset),

  updateAsset: (id: string, updates: Partial<Asset>) =>
    apiClient.patch<Asset>(`/api/v1/merchant/assets/${id}`, updates),

  regenerateKey: () =>
    apiClient.post<{ apiKey: string }>('/api/v1/auth/regenerate-key'),

  deactivate: () =>
    apiClient.post('/api/v1/auth/deactivate'),
};