// src/lib/types/common.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  };
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

// src/lib/types/merchant.ts
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

// src/lib/types/asset.ts
export type AssetStatus = 'available' | 'occupied' | 'maintenance';
export type AssetType = 'gpu' | 'printer' | 'iot' | 'api' | 'other';
export type UnitType = 'minute' | 'hour' | 'day' | 'session';

export interface Asset {
  id: string;
  name: string;
  pricePerUnit: string | number;
  unit: UnitType;
  type: AssetType;
  status: AssetStatus;
  merchantWallet: string;
  metadata: Record<string, unknown>;
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilters {
  status?: AssetStatus;
  type?: AssetType;
  merchantId?: string;
  maxPrice?: number;
  unit?: UnitType;
}

// src/lib/types/session.ts
export interface Session {
  token: string;
  assetId: string;
  payerWallet: string;
  amountPaid: string;
  expiresAt: string;
  isExtended: boolean;
  createdAt: string;
}

// src/lib/types/payment.ts
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
  assetId: string;
  sessionToken: string;
  success: boolean;
  facilitatorResponse: Record<string, unknown>;
  createdAt: string;
}

// src/lib/types/agent.ts
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