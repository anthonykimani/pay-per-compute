import { assetsApi } from "@/services/assets-service";
import { Asset, AssetFilters } from "@/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAssets(filters?: AssetFilters, page = 1) {
  return useQuery({
    queryKey: ['assets', filters, page],
    queryFn: () => assetsApi.getAll(filters, page),
    staleTime: 1000 * 30,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['merchant', 'assets'] });
    },
  });
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Asset>) => assetsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });
}