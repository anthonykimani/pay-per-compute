import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { env } from './env';

export const solanaConfig = {
  network: env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork,
  get rpcUrl() {
    return clusterApiUrl(this.network);
  },
  commitment: 'confirmed' as const,
  wsEndpoint: undefined as string | undefined,
};
