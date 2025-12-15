import { UnitType } from "./asset";

export interface PaymentRequirement {
  cost: string;
  address: string;
  facilitator: string;
  network: string;
  unit: UnitType;
  assetId: string;
}

export interface PaymentAuthorization {
  signature: string;
  message?: string;
}

export interface PaymentLog {
  id: number;
  signature: string;
  amount: string;
  payerWallet: string;
  asset_id: string;
  sessionToken: string;
  success: boolean;
  facilitatorResponse: Record<string, unknown>;
  createdAt: string;
}