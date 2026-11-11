import type { Paginated } from "@/types/api";

export type StockOpnameStatus = "DRAFT" | "IN_PROGRESS" | "WAITING_APPROVAL" | "COMPLETED" | "CANCELLED";

export interface StockOpnameLine {
  id: number;
  location_id: number;
  location_code: string;
  location_name: string;
  item_id: number;
  item_sku: string;
  item_barcode?: string | null;
  item_name: string;
  uom_code: string;
  allow_decimal: boolean;
  qty_system: string;
  qty_physical: string | null;
  qty_variance: string | null;
  notes: string | null;
}

export interface StockOpname {
  id: number;
  opname_number: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  location_id: number | null;
  location_code: string | null;
  location_name: string | null;
  status: StockOpnameStatus;
  notes: string | null;
  line_count: number;
  rejection_reason: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  lines?: StockOpnameLine[];
}

export interface StockOpnameCreatePayload {
  warehouse_id: number;
  location_id?: number | null;
  notes?: string | null;
}

export interface StockOpnameUpdatePayload {
  location_id?: number | null;
  clear_location?: boolean;
  notes?: string | null;
}

export type StockOpnamePage = Paginated<StockOpname>;
export interface OpnameReference {
  id: number;
  code: string;
  name: string;
  warehouse_id?: number;
  is_active: boolean;
  allow_decimal?: boolean;
}

export interface OpnameItemReference {
  id: number;
  sku: string;
  barcode?: string | null;
  name: string;
  allow_decimal: boolean;
  is_active: boolean;
}

export interface StockOpnameCountLinePayload {
  line_id?: number;
  location_id?: number;
  item_id?: number;
  qty_physical: string;
  notes?: string | null;
}

export interface StockOpnameCountPayload {
  lines: StockOpnameCountLinePayload[];
}

export interface StockOpnameRejectPayload {
  rejection_reason: string;
}
