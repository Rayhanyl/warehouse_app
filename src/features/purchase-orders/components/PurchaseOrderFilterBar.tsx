import type { FormEvent } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { PO_STATUS_LABELS } from "../constants";
import type {
  PurchaseOrderListParams,
  PurchaseOrderSortField,
  PurchaseOrderStatus,
  ReferenceOption,
  SortDirection,
} from "../types";

interface PurchaseOrderFilterBarProps {
  activeCount: number;
  draftParams: PurchaseOrderListParams;
  suppliers: ReferenceOption[];
  warehouses: ReferenceOption[];
  showWarehouseFilter?: boolean;
  isTopbarWarehouseLocked?: boolean;
  effectiveWarehouseId?: number | null;
  onDraftChange: (
    updater: (current: PurchaseOrderListParams) => PurchaseOrderListParams,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function PurchaseOrderFilterBar({
  activeCount,
  draftParams,
  suppliers,
  warehouses,
  showWarehouseFilter = true,
  isTopbarWarehouseLocked = false,
  effectiveWarehouseId = null,
  onDraftChange,
  onSubmit,
  onReset,
}: PurchaseOrderFilterBarProps) {
  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter daftar purchase order"
      className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
    >
      <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
        <label className="text-sm font-semibold text-ink-950">
          Pencarian
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              size={16}
            />
            <input
              className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pr-3 pl-9 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Cari nomor, pemasok, atau catatan..."
              type="search"
              value={draftParams.search}
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Status purchase order
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                status: event.target.value as PurchaseOrderStatus | "all",
              }))
            }
            value={draftParams.status}
          >
            <option value="all">Semua status</option>
            {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <ReferenceSelect
          label="Pemasok"
          onChange={(value) =>
            onDraftChange((current) => ({ ...current, supplier_id: value }))
          }
          options={suppliers}
          value={draftParams.supplier_id}
        />
        {showWarehouseFilter && (
          <ReferenceSelect
            disabled={isTopbarWarehouseLocked}
            helperText={isTopbarWarehouseLocked ? "Mengikuti filter gudang Top Bar" : undefined}
            label="Gudang tujuan"
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, warehouse_id: value }))
            }
            options={warehouses}
            value={isTopbarWarehouseLocked ? effectiveWarehouseId : draftParams.warehouse_id}
          />
        )}

        <label className="text-sm font-semibold text-ink-950">
          Tanggal mulai
          <input
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, date_from: event.target.value }))
            }
            type="date"
            value={draftParams.date_from}
          />
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Tanggal akhir
          <input
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, date_to: event.target.value }))
            }
            type="date"
            value={draftParams.date_to}
          />
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Urutkan berdasarkan
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                sort_by: event.target.value as PurchaseOrderSortField,
              }))
            }
            value={draftParams.sort_by}
          >
            <option value="id">ID purchase order</option>
            <option value="po_number">Nomor dokumen</option>
            <option value="order_date">Tanggal pesanan</option>
            <option value="expected_delivery_date">Estimasi kirim</option>
            <option value="status">Status</option>
            <option value="created_at">Waktu dibuat</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Arah urutan
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                sort_dir: event.target.value as SortDirection,
              }))
            }
            value={draftParams.sort_dir}
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </label>

        <div className="flex items-end md:col-span-2 lg:col-span-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-line-300 bg-canvas-50/70 px-3.5 py-2 text-sm font-semibold text-ink-950">
            <input
              checked={Boolean(draftParams.overdue_only)}
              className="h-4 w-4 rounded border-line-500 text-teal-600 focus:ring-teal-600"
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  overdue_only: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Hanya PO terlambat dikirim (overdue)
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-4">
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 sm:flex-initial"
            type="submit"
          >
            <Filter aria-hidden="true" size={16} />
            Terapkan filter
          </button>
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 sm:flex-initial"
            onClick={onReset}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang filter
          </button>
        </div>
      </form>
    </CollapsibleFilterPanel>
  );
}

function ReferenceSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  helperText,
}: {
  label: string;
  value: number | null;
  options: ReferenceOption[];
  onChange: (value: number | null) => void;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label className="text-sm font-semibold text-ink-950">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50 disabled:text-slate-500"
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
        value={value ?? ""}
      >
        <option value="">Semua {label.toLocaleLowerCase()}</option>
        {options
          .filter((option) => option.is_active)
          .map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} · {option.name}
            </option>
          ))}
      </select>
      {helperText && (
        <span className="mt-1 block text-[11px] font-medium text-teal-700">{helperText}</span>
      )}
    </label>
  );
}
