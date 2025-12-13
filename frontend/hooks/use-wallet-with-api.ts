import { apiClient } from "@/shared/api.config";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

export function useWalletWithApi() {
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.publicKey) {
      apiClient.setUserWallet(wallet.publicKey.toString());
    } else {
      // Remove wallet header on disconnect
      delete apiClient['defaultHeaders']['x-user-wallet'];
    }
  }, [wallet.publicKey]);

  return wallet;
}
