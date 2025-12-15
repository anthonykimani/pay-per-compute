import { merchantApi } from '@/services/merchant-service';
import { useQuery, useMutation } from '@tanstack/react-query';


export function useMerchantAssets() {
  return useQuery({
    queryKey: ['merchant', 'assets'],
    queryFn: () => merchantApi.getAssets(),
  });
}

export function useMerchantEarnings(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['merchant', 'earnings', filters],
    queryFn: () => merchantApi.getEarnings(filters),
  });
}

export function useCreateAsset() {
  return useMutation({
    mutationFn: merchantApi.createAsset,
    onSuccess: () => {
      // Force reload to refresh data
      window.location.reload();
    },
  });
}

export function useRegenerateApiKey() {
  return useMutation({
    mutationFn: merchantApi.regenerateKey,
    onSuccess: (data) => {
      document.cookie = `merchant_api_key=${data.apiKey}; path=/; max-age=2592000`;
    },
  });
}