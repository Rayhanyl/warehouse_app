import type { ApprovalLog, Paginated } from "@/types/api";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "WAITING_L1_APPROVAL"
  | "WAITING_L2_APPROVAL"
  | "ISSUED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CLOSED"
  | "CANCELLED";

export type PurchaseOrderLineStatus =
  | "OPEN"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CLOSED";

export interface PurchaseOrderLine {
  id: number;
  po_id: number;
  item_id: number;
  item_sku: string;
  item_barcode?: string | null;
  item_name: string;
  uom_id: number;
  uom_code: string;
  allow_decimal: boolean;
  qty_ordered: string;
  unit_price?: string;
  line_subtotal?: string;
  qty_received: string;
  qty_closed?: string;
  qty_remaining?: string;
  line_status?: PurchaseOrderLineStatus;
  line_closed_reason?: string | null;
  line_closed_at?: string | null;
  line_closed_by?: number | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  supplier_phone?: string | null;
  supplier_fax?: string | null;
  supplier_email?: string | null;
  supplier_address?: string | null;
  supplier_npwp?: string | null;
  supplier_bank_name?: string | null;
  supplier_bank_account_number?: string | null;
  supplier_bank_account_holder?: string | null;
  supplier_payment_terms?: string | null;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string | null;
  is_overdue?: boolean;
  days_overdue?: number;
  revised_from_po_id?: number | null;
  revised_from_po_number?: string | null;
  notes: string | null;
  line_count: number;
  total_amount?: string;
  submitted_by?: number | null;
  submitted_at?: string | null;
  l1_approved_by?: number | null;
  l1_approved_at?: string | null;
  l2_approved_by?: number | null;
  l2_approved_at?: string | null;
  rejection_reason?: string | null;
  issued_at: string | null;
  issued_by: number | null;
  closed_reason: string | null;
  closed_at: string | null;
  closed_by: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  lines?: PurchaseOrderLine[];
  approval_logs?: ApprovalLog[];
}

export type PurchaseOrderPage = Paginated<PurchaseOrder>;
export type PurchaseOrderSortField =
  | "id"
  | "po_number"
  | "order_date"
  | "expected_delivery_date"
  | "status"
  | "created_at";
export type SortDirection = "asc" | "desc";

export interface PurchaseOrderListParams {
  limit: number;
  offset: number;
  search: string;
  status: PurchaseOrderStatus | "all";
  supplier_id: number | null;
  warehouse_id: number | null;
  date_from: string;
  date_to: string;
  overdue_only?: boolean;
  sort_by: PurchaseOrderSortField;
  sort_dir: SortDirection;
}

export interface PurchaseOrderLinePayload {
  item_id: number;
  qty_ordered: string;
  unit_price?: string | null;
  notes?: string | null;
}

export interface PurchaseOrderCreatePayload {
  supplier_id: number;
  warehouse_id: number;
  order_date: string;
  expected_delivery_date?: string | null;
  notes?: string | null;
  lines: PurchaseOrderLinePayload[];
}

export type PurchaseOrderUpdatePayload = Partial<PurchaseOrderCreatePayload>;

export interface ReferenceOption {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  sku?: string;
  uom_code?: string;
  allow_decimal?: boolean;
}
