// packages/dashboard/src/hooks/use-merchant.ts
import { merchantApi } from '@/services/merchant-service';
import { Asset, EnhancedAsset, PaymentLog } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMerchantAssets() {
  return useQuery<EnhancedAsset[]>({
    queryKey: ['merchant', 'assets'],
    queryFn: () => merchantApi.getAssets(),
    staleTime: 1000 * 30,
  });
}

export function useMerchantEarnings(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['merchant', 'earnings', filters],
    queryFn: () => merchantApi.getEarnings(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: merchantApi.createAsset,
    onSuccess: () => {
      // Invalidate both merchant and global asset queries
      queryClient.invalidateQueries({ queryKey: ['merchant', 'assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Asset>) => merchantApi.updateAsset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: merchantApi.regenerateKey,
    onSuccess: (data) => {
      document.cookie = `merchant_api_key=${data.apiKey}; path=/; max-age=2592000`;
      // Force re-auth by invalidating all queries
      queryClient.clear();
      window.location.reload();
    },
  });
}