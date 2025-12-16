import { agentApi } from '@/services/agent-service';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AgentIntent } from '@/types';

export function useAgentIntent(intentId: string) {
  return useQuery({
    queryKey: ['intent', intentId],
    queryFn: () => agentApi.getIntent(intentId),
    enabled: !!intentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Keep polling while scanning or waiting for approval
      if (data?.status === 'scanning' || data?.requiresApproval) {
        return 2000;
      }
      return false;
    },
  });
}

export function useCreateIntent(wallet: WalletContextState) {
  return useMutation({
    mutationFn: (message: string) => agentApi.createIntent(message, wallet),
  });
}