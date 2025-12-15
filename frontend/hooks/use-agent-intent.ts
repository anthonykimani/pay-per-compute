import { agentApi } from '@/services/agent-service';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useAgentIntent(intentId: string) {
  return useQuery({
    queryKey: ['intent', intentId],
    queryFn: () => agentApi.getIntent(intentId),
    enabled: !!intentId,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });
}

export function useCreateIntent(wallet: WalletContextState) {
  const mutation = useMutation({
    mutationFn: (message: string) => agentApi.createIntent(message, wallet),
  });
  return mutation;
}
