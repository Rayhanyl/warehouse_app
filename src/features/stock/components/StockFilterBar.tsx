import type { FormEvent } from "react";
import { RotateCcw, ScanBarcode, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import type { StockListParams } from "../types";

interface StockFilterBarProps {
  activeCount: number;
  draft: StockListParams;
  effectiveWarehouseId: string;
  isLedgerView: boolean;
  isWarehouseView: boolean;
  isSummaryView: boolean;
  canAccessAllWarehouses: boolean;
  showWarehouseFilter?: boolean;
  isTopbarWarehouseLocked?: boolean;
  scopedWarehouseOptions: [string, string][];
  onDraftChange: (next: StockListParams) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onOpenLookup: () => void;
}

export function StockFilterBar({
  activeCount,
  draft,
  effectiveWarehouseId,
  isLedgerView,
  isWarehouseView,
  isSummaryView,
  canAccessAllWarehouses,
  showWarehouseFilter = true,
  isTopbarWarehouseLocked = false,
  scopedWarehouseOptions,
  onDraftChange,
  onSubmit,
  onReset,
  onOpenLookup,
}: StockFilterBarProps) {
  const warehouseFilterElement = !showWarehouseFilter ? null : canAccessAllWarehouses ? (
    <StockFilterField
      disabled={isTopbarWarehouseLocked}
      helperText={isTopbarWarehouseLocked ? "Mengikuti filter gudang Top Bar" : undefined}
      label="Gudang ID"
      onChange={(value) => onDraftChange({ ...draft, warehouse_id: value })}
      type="number"
      value={isTopbarWarehouseLocked ? effectiveWarehouseId : draft.warehouse_id}
    />
  ) : (
    <StockFilterSelect
      disabled={isTopbarWarehouseLocked}
      helperText={isTopbarWarehouseLocked ? "Mengikuti filter gudang Top Bar" : undefined}
      label="Gudang"
      onChange={(value) => onDraftChange({ ...draft, warehouse_id: value })}
      options={scopedWarehouseOptions}
      value={isTopbarWarehouseLocked ? effectiveWarehouseId : draft.warehouse_id}
    />
  );

  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter pemantauan stok"
      className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)]"
    >
      <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
        {!isLedgerView && (
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Cari barang atau SKU
            </span>
            <span className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3">
              <Search aria-hidden="true" className="text-slate-600" size={16} />
              <input
                aria-label="Cari barang atau SKU"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                onChange={(event) => onDraftChange({ ...draft, search: event.target.value })}
                placeholder="Contoh: MCU atau kardus"
                value={draft.search}
              />
            </span>
          </label>
        )}

        {isLedgerView ? (
          <>
            {warehouseFilterElement}
            <StockFilterField
              label="Lokasi ID"
              onChange={(value) => onDraftChange({ ...draft, location_id: value })}
              type="number"
              value={draft.location_id}
            />
            <StockFilterField
              label="Barang ID"
              onChange={(value) => onDraftChange({ ...draft, item_id: value })}
              type="number"
              value={draft.item_id}
            />
            <StockFilterSelect
              label="Jenis mutasi"
              onChange={(value) => onDraftChange({ ...draft, movement_type: value })}
              options={[
                ["", "Semua jenis"],
                ["IN_PURCHASE", "Penerimaan pembelian"],
                ["OUT_TRANSFER", "Pengeluaran transfer"],
                ["IN_TRANSFER", "Penerimaan transfer"],
                ["ADJUSTMENT_PLUS", "Penyesuaian tambah"],
                ["ADJUSTMENT_MINUS", "Penyesuaian kurang"],
              ]}
              value={draft.movement_type}
            />
            <StockFilterSelect
              label="Jenis referensi"
              onChange={(value) => onDraftChange({ ...draft, reference_type: value })}
              options={[
                ["", "Semua referensi"],
                ["GOODS_RECEIPT", "Goods receipt"],
                ["STOCK_TRANSFER", "Stock transfer"],
                ["STOCK_OPNAME", "Stock opname"],
              ]}
              value={draft.reference_type}
            />
            <StockFilterField
              label="Reference ID"
              onChange={(value) => onDraftChange({ ...draft, reference_id: value })}
              type="number"
              value={draft.reference_id}
            />
            <StockFilterField
              label="Mulai tanggal"
              onChange={(value) => onDraftChange({ ...draft, date_from: value })}
              type="date"
              value={draft.date_from}
            />
            <StockFilterField
              label="Sampai tanggal"
              onChange={(value) => onDraftChange({ ...draft, date_to: value })}
              type="date"
              value={draft.date_to}
            />
          </>
        ) : (
          <>
            {warehouseFilterElement}
            {!isWarehouseView && !isSummaryView && (
              <StockFilterField
                label="Lokasi ID"
                onChange={(value) => onDraftChange({ ...draft, location_id: value })}
                type="number"
                value={draft.location_id}
              />
            )}
            <StockFilterField
              label="Barang ID"
              onChange={(value) => onDraftChange({ ...draft, item_id: value })}
              type="number"
              value={draft.item_id}
            />
            <StockFilterField
              label="Kategori ID"
              onChange={(value) => onDraftChange({ ...draft, category_id: value })}
              type="number"
              value={draft.category_id}
            />
            {(isWarehouseView || isSummaryView) && (
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-ink-950 sm:col-span-2">
                <input
                  checked={draft.critical_only}
                  className="h-4 w-4 accent-rose-600"
                  onChange={(event) =>
                    onDraftChange({ ...draft, critical_only: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>Hanya stok kritis (&lt;= Min. Stok)</span>
              </label>
            )}
          </>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-800"
            type="submit"
          >
            Terapkan
          </button>
          <button
            aria-label="Atur ulang filter"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 text-ink-950 hover:bg-canvas-50"
            onClick={onReset}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
          </button>
          <button
            aria-label="Pindai barcode untuk cek stok dan posisi rak"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/40 bg-teal-50 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 hover:text-teal-950"
            onClick={onOpenLookup}
            type="button"
          >
            <ScanBarcode aria-hidden="true" size={16} />
            <span>Cek Rak</span>
          </button>
        </div>
      </form>
    </CollapsibleFilterPanel>
  );
}

function StockFilterField({
  label,
  value,
  onChange,
  type = "number",
  disabled = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "date";
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input
        className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950 disabled:cursor-not-allowed disabled:bg-canvas-50 disabled:text-slate-500"
        disabled={disabled}
        min={type === "number" ? 1 : undefined}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {helperText && (
        <span className="mt-1 block text-[11px] font-medium text-teal-700">{helperText}</span>
      )}
    </label>
  );
}

function StockFilterSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <select
        className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950 disabled:cursor-not-allowed disabled:bg-canvas-50 disabled:text-slate-500"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      {helperText && (
        <span className="mt-1 block text-[11px] font-medium text-teal-700">{helperText}</span>
      )}
    </label>
  );
}
