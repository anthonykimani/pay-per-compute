import { Asset } from "./asset";

export interface AgentIntent {
  id: string;
  status: 'scanning' | 'fulfilled';
  createdAt: string;
  selectedAsset?: Asset;
  requiresApproval?: boolean;
  totalCost?: string;
  durationMinutes?: number; // ✅ Add this
  userWallet?: string;
  assetType?: string;
}

export interface AgentLog {
  intentId: string;
  message: string;
  timestamp: Date;
  requiresApproval?: boolean;
  asset?: Asset;
  totalCost?: string;
  level: 'info' | 'success' | 'error' | 'warning';
}