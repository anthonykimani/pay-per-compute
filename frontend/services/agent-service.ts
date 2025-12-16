import { apiClient } from '@/shared/api.config';
import { AgentIntent } from '../types';
import { WalletContextState } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

export const agentApi = {
  createIntent: async (message: string, wallet: WalletContextState): Promise<{ intentId: string; status: string; parsed: any }> => {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error('Wallet not connected or does not support signing');
    }

    const messageBytes = new TextEncoder().encode(message);
    const signature = await wallet.signMessage(messageBytes);

    return apiClient.post(
      '/api/v1/agent/intents',
      {
        message,
        signature: bs58.encode(signature),
      },
      {
        'x-user-wallet': wallet.publicKey.toString(),
      }
    );
  },

  getIntent: (intentId: string): Promise<AgentIntent> =>
    apiClient.get(`/api/v1/agent/intents/${intentId}`),
};