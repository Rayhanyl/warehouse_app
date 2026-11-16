import { Search } from "lucide-react";
import type {
  StorageLocationStatusFilter,
  StorageLocationWarehouseOption,
} from "../types";

interface StorageLocationsFilterBarProps {
  searchQuery: string;
  warehouseFilter: string;
  statusFilter: StorageLocationStatusFilter;
  warehouseOptions: StorageLocationWarehouseOption[];
  showWarehouseFilter?: boolean;
  isTopbarWarehouseLocked?: boolean;
  effectiveWarehouseFilter?: string;
  onSearchChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onStatusChange: (value: StorageLocationStatusFilter) => void;
}

const STATUS_TABS: ReadonlyArray<{
  key: StorageLocationStatusFilter;
  label: string;
}> = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "inactive", label: "Nonaktif" },
];

/** Bar filter pencarian, gudang induk, dan status lokasi penyimpanan. */
export function StorageLocationsFilterBar({
  searchQuery,
  warehouseFilter,
  statusFilter,
  warehouseOptions,
  showWarehouseFilter = true,
  isTopbarWarehouseLocked = false,
  effectiveWarehouseFilter,
  onSearchChange,
  onWarehouseChange,
  onStatusChange,
}: StorageLocationsFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="storage-location-search-input" className="sr-only">
            Cari kode, nama lokasi, atau gudang
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="storage-location-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari kode atau nama lokasi..."
            className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {showWarehouseFilter && (
          <div className="w-full sm:w-64">
            <label htmlFor="storage-location-warehouse-filter" className="sr-only">
              Filter berdasarkan gudang
            </label>
            <select
              id="storage-location-warehouse-filter"
              value={isTopbarWarehouseLocked ? (effectiveWarehouseFilter ?? warehouseFilter) : warehouseFilter}
              disabled={isTopbarWarehouseLocked}
              onChange={(event) => onWarehouseChange(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="all">Semua gudang ({warehouseOptions.length})</option>
              {warehouseOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} ({item.name})
                </option>
              ))}
            </select>
            {isTopbarWarehouseLocked && (
              <span className="mt-1 block text-[11px] font-medium text-teal-700">
                Mengikuti filter gudang Top Bar
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter status lokasi penyimpanan"
          className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5"
        >
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusChange(tab.key)}
                className={`min-h-10 rounded-xs px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700 ${
                  active
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
