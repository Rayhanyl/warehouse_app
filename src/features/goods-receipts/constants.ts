import type { GoodsReceiptListParams, GoodsReceiptStatus } from "./types";

export const GR_INITIAL_PARAMS: GoodsReceiptListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  warehouse_id: null,
  po_id: null,
  date_from: "",
  date_to: "",
};

export const GR_STATUS_LABELS: Record<GoodsReceiptStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Diposting",
  CANCELLED: "Dibatalkan",
};

export const GR_STATUS_CLASSES: Record<GoodsReceiptStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  POSTED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

export function formatGrDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function formatGrDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
