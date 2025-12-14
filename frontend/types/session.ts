export interface Session {
  token: string;
  asset_id: string;
  payerWallet: string;
  amountPaid: string;
  expiresAt: string;
  isExtended: boolean;
  createdAt: string;
  websocketUrl?: string;
}