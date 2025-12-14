import { Asset } from "./asset";

export interface AgentIntent {
  intentId: string;
  message: string;
  userWallet: string;
  signature: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    matchedAssets: Asset[];
    recommendedAsset?: Asset;
    totalCost?: string;
  };
  createdAt: string;
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