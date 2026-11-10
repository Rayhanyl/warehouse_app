import type { Paginated } from "@/types/api";

export type StockTransferStatus = "DRAFT" | "APPROVED" | "SHIPPED" | "RECEIVED" | "CANCELLED";

export interface StockTransferLine {
  id: number;
  transfer_id: number;
  item_id: number;
  item_sku: string;
  item_name: string;
  uom_code: string;
  allow_decimal: boolean;
  qty: string;
  qty_received: string | null;
  qty_variance: string | null;
  variance_reason: string | null;
  notes: string | null;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  source_warehouse_id: number;
  source_warehouse_code: string;
  source_warehouse_name: string;
  source_location_id: number;
  source_location_code: string;
  source_location_name: string;
  destination_warehouse_id: number;
  destination_warehouse_code: string;
  destination_warehouse_name: string;
  destination_location_id: number;
  destination_location_code: string;
  destination_location_name: string;
  status: StockTransferStatus;
  notes: string | null;
  line_count: number;
  created_at: string;
  updated_at: string;
  lines?: StockTransferLine[];
}

export interface TransferLinePayload {
  item_id: number;
  qty: string;
  notes?: string | null;
}

export interface StockTransferCreatePayload {
  source_warehouse_id: number;
  source_location_id: number;
  destination_warehouse_id: number;
  destination_location_id: number;
  notes?: string | null;
  lines: TransferLinePayload[];
}

export type StockTransferUpdatePayload = Partial<
  Omit<StockTransferCreatePayload, "lines">
> & {
  lines?: TransferLinePayload[];
};

export interface TransferReceiveLinePayload {
  line_id: number;
  qty_received: string;
  variance_reason?: string | null;
}

export type StockTransferPage = Paginated<StockTransfer>;
export interface TransferReference {
  id: number;
  code: string;
  name: string;
  warehouse_id?: number;
  is_active: boolean;
  allow_decimal?: boolean;
}
