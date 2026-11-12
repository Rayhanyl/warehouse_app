export interface DashboardStockSummary {
  total_active_items: number;
  total_qty_on_hand: string;
  total_qty_in_transit: string;
  low_stock_items_count: number;
}

export interface DashboardPendingActions {
  pending_po_receipt_count: number;
  draft_gr_count: number;
  pending_transfer_ship_count: number;
  pending_transfer_receive_count: number;
  active_opname_count: number;
}

export interface DashboardRecentActivity {
  id: number;
  movement_type: string;
  reference_type: string;
  reference_id: number;
  reference_number?: string | null;
  warehouse_id?: number | null;
  warehouse_code?: string | null;
  warehouse_name?: string | null;
  item_id: number;
  item_sku: string;
  item_name: string;
  qty_change: string;
  qty_after?: string | null;
  saldo_after?: string | null;
  created_at: string;
  actor_name?: string | null;
  creator_name?: string | null;
}

export interface DashboardAssignedWarehouse {
  id: number;
  code: string;
  name: string;
}

export interface DashboardSummaryOut {
  stock_summary: DashboardStockSummary;
  pending_actions: DashboardPendingActions;
  recent_activities: DashboardRecentActivity[];
  assigned_warehouses: DashboardAssignedWarehouse[];
}
