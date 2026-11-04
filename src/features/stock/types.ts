import type { DecimalString, Paginated } from "@/types/api";

export interface StockBalance {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  location_id: number;
  location_code: string;
  location_name: string;
  item_id: number;
  item_sku: string;
  item_name: string;
  uom_code: string;
  qty_on_hand: DecimalString;
  qty_in_transit: DecimalString;
}

export interface WarehouseStockBalance {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  item_id: number;
  item_sku: string;
  item_name: string;
  uom_code: string;
  qty_on_hand: DecimalString;
  qty_in_transit: DecimalString;
}

export interface StockSummary {
  item_id: number;
  item_sku: string;
  item_name: string;
  uom_code: string;
  qty_on_hand: DecimalString;
  qty_in_transit: DecimalString;
}

export interface StockMovement {
  id: number;
  item_id: number;
  item_sku: string;
  item_name: string;
  uom_code: string;
  warehouse_code: string;
  warehouse_name: string;
  location_code: string | null;
  location_name: string | null;
  movement_type: string;
  qty_before: DecimalString;
  qty_change: DecimalString;
  qty_after: DecimalString;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

export interface StockListParams {
  limit: number;
  offset: number;
  search: string;
  warehouse_id: string;
  location_id: string;
  item_id: string;
  date_from: string;
  date_to: string;
}

export type StockBalancePage = Paginated<StockBalance>;
export type WarehouseStockBalancePage = Paginated<WarehouseStockBalance>;
export type StockSummaryPage = Paginated<StockSummary>;
export type StockMovementPage = Paginated<StockMovement>;
