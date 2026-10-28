export interface StorageLocationRecord {
  id: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  code: string;
  name: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type StorageLocationStatusFilter = "all" | "active" | "inactive";

export interface StorageLocationFormPayload {
  warehouse_id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface StorageLocationWarehouseOption {
  id: string;
  code: string;
  name: string;
}
