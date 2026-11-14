import type { StockOpnameStatus } from "./types";

export interface OpnameFilters {
  limit: number;
  offset: number;
  search: string;
  status: StockOpnameStatus | "all";
  warehouse_id: number | null;
  date_from: string;
  date_to: string;
}

export const OPNAME_INITIAL_FILTERS: OpnameFilters = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  warehouse_id: null,
  date_from: "",
  date_to: "",
};

export const OPNAME_STATUS_LABELS: Record<StockOpnameStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "Sedang dihitung",
  WAITING_APPROVAL: "Menunggu persetujuan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const OPNAME_STATUS_CLASSES: Record<StockOpnameStatus, string> = {
  DRAFT: "bg-canvas-50 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  WAITING_APPROVAL: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

export const OPNAME_FIELD_CLASS =
  "mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

export const OPNAME_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600";

export function formatOpnameDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
