import type { FormEvent } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import type { StockStatusFilter } from "../types";

interface StocksFilterBarProps {
  activeCount: number;
  draftSearch: string;
  draftStatus: StockStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StockStatusFilter) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

/** Panel filter daftar barang (SKU) berdasarkan pencarian dan status. */
export function StocksFilterBar({
  activeCount,
  draftSearch,
  draftStatus,
  onSearchChange,
  onStatusChange,
  onSubmit,
  onReset,
}: StocksFilterBarProps) {
  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter daftar barang"
      title="Filter daftar barang"
    >
      <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
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
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari SKU, nama barang, atau kategori..."
              type="search"
              value={draftSearch}
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Status barang
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onStatusChange(event.target.value as StockStatusFilter)
            }
            value={draftStatus}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <Button className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700" type="submit">
            <Filter aria-hidden="true" size={16} />
            Terapkan filter
          </Button>
          <Button className="min-h-11 gap-2" onClick={onReset} type="button" variant="outline">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang
          </Button>
        </div>
      </form>
    </CollapsibleFilterPanel>
  );
}
