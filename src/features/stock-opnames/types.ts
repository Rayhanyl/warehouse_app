import type { Paginated } from "@/types/api";

export type StockOpnameStatus = "DRAFT" | "IN_PROGRESS" | "WAITING_APPROVAL" | "COMPLETED" | "CANCELLED";

export interface StockOpnameLine {
  id: number;
  location_id: number;
  location_code: string;
  location_name: string;
  item_id: number;
  item_sku: string;
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
  created_at: string;
  updated_at: string;
  lines?: StockOpnameLine[];
}

export type StockOpnamePage = Paginated<StockOpname>;
export interface OpnameReference {
  id: number;
  code: string;
  name: string;
  warehouse_id?: number;
  is_active: boolean;
}
