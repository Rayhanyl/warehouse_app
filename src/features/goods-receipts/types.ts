import type { Paginated } from "@/types/api";

export type GoodsReceiptStatus = "DRAFT" | "POSTED" | "CANCELLED";

export interface GoodsReceiptLine {
  id: number;
  gr_id: number;
  po_id: number;
  warehouse_id: number;
  po_line_id: number;
  item_id: number;
  item_sku: string;
  item_barcode?: string | null;
  item_name: string;
  uom_id: number;
  uom_code: string;
  allow_decimal: boolean;
  location_id: number;
  location_code: string;
  location_name: string;
  qty_received: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceipt {
  id: number;
  gr_number: string;
  po_id: number;
  po_number: string;
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  status: GoodsReceiptStatus;
  received_date: string;
  notes: string | null;
  line_count: number;
  posted_at: string | null;
  posted_by: number | null;
  created_at: string;
  updated_at: string;
  lines?: GoodsReceiptLine[];
}

export interface GoodsReceiptLinePayload {
  po_line_id: number;
  location_id: number;
  qty_received: string;
  notes?: string | null;
}

export interface GoodsReceiptCreatePayload {
  po_id: number;
  received_date: string;
  notes?: string | null;
  lines: GoodsReceiptLinePayload[];
}

export type GoodsReceiptUpdatePayload = Partial<GoodsReceiptCreatePayload>;
export type GoodsReceiptPage = Paginated<GoodsReceipt>;

export interface GoodsReceiptListParams {
  limit: number;
  offset: number;
  search: string;
  status: GoodsReceiptStatus | "all";
  warehouse_id: number | null;
  po_id: number | null;
  date_from: string;
  date_to: string;
}

export interface GoodsReceiptLocation {
  id: number;
  code: string;
  name: string;
  warehouse_id: number;
  is_active: boolean;
}
