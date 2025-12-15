export interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  apiKey: string;
  platformFeePercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}