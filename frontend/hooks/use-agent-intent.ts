import { useMutation, useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { agentApi } from '@/services/agent-service';

export function useCreateIntent() {
  const wallet = useWallet();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!wallet.publicKey || !wallet.signMessage) {
        throw new Error('Wallet not connected or does not support signing');
      }
      return agentApi.createIntent(message, wallet.publicKey.toString(), wallet.signMessage);
    },
  });
}

export function useIntent(intentId: string) {
  return useQuery({
    queryKey: ['intent', intentId],
    queryFn: () => agentApi.getIntent(intentId),
    enabled: !!intentId,
    refetchInterval: 5000, // Poll every 5s while processing
  });
}