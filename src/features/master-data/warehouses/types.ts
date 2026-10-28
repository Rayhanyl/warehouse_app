export interface WarehouseRecord {
  id: number;
  code: string;
  name: string;
  address: string | null;
  allow_negative_stock: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type WarehouseStatusFilter = "all" | "active" | "inactive";

export interface WarehouseFormPayload {
  code: string;
  name: string;
  address: string | null;
  allow_negative_stock: boolean;
  is_active: boolean;
}
