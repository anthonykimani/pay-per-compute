import { apiClient } from "@/shared/api.config";
import { Asset, AssetFilters, PaginatedResponse } from "@/types/common";

export const assetsApi = {
  getAll: (filters?: AssetFilters, page = 1) => {
    // Convert all filter values to strings for URLSearchParams
    const params = new URLSearchParams();
    params.append('page', page.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiClient.get<PaginatedResponse<Asset>>(`/api/v1/assets?${params.toString()}`);
  },

  getById: (id: string) =>
    apiClient.get<Asset>(`/api/v1/assets/${id}`),

  getStatus: (id: string) =>
    apiClient.get<{
      asset: Asset;
      activeSession?: { expiresAt: string; minutesLeft: number };
    }>(`/api/v1/assets/${id}/status`),

  create: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Asset>('/api/v1/assets', asset),

  update: (id: string, updates: Partial<Asset>) =>
    apiClient.patch<Asset>(`/api/v1/assets/${id}`, updates),

  updatePrice: (id: string, pricePerUnit: string) =>
    apiClient.patch<Asset>(`/api/v1/assets/${id}/price`, { pricePerUnit }),
};