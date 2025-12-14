export type AssetStatus = 'available' | 'occupied' | 'maintenance';
export type AssetType = 'gpu' | 'printer' | 'iot' | 'api' | 'other';
export type UnitType = 'minute' | 'hour' | 'day' | 'session';

export interface Asset {
  id: string;
  name: string;
  pricePerUnit: string;
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