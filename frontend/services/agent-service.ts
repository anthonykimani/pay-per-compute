import { apiClient } from "@/shared/api.config";
import { AgentIntent } from "@/types/common";
import bs58 from 'bs58';

export const agentApi = {
  createIntent: async (
    message: string,
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ) => {
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);

    return apiClient.post<AgentIntent>('/api/v1/agent/intents', {
      message,
      signature: bs58.encode(signature),
    });
  },

  getIntent: (intentId: string) =>
    apiClient.get<AgentIntent>(`/api/v1/agent/intents/${intentId}`),
};