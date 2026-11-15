import type {
  PurchaseOrderLineStatus,
  PurchaseOrderListParams,
  PurchaseOrderStatus,
} from "./types";

export const PO_INITIAL_PARAMS: PurchaseOrderListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  supplier_id: null,
  warehouse_id: null,
  date_from: "",
  date_to: "",
  overdue_only: false,
  sort_by: "id",
  sort_dir: "desc",
};

export const PO_LINE_STATUS_LABELS: Record<PurchaseOrderLineStatus, string> = {
  OPEN: "Menunggu",
  PARTIALLY_RECEIVED: "Sebagian",
  RECEIVED: "Penuh",
  CLOSED: "Ditutup (Short-Close)",
};

export const PO_CLOSE_REASON_PRESETS = [
  "Stok pemasok habis / tidak diproduksi lagi (discontinued)",
  "Pengiriman terlambat melewati batas tenggat (overdue)",
  "Kesepakatan pembatalan sisa pesanan dengan pemasok",
] as const;

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Diterbitkan",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima",
  CLOSED: "Ditutup",
  CANCELLED: "Dibatalkan",
};

export const PO_STATUS_CLASSES: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-canvas-50 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function formatPoDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function formatPoDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
