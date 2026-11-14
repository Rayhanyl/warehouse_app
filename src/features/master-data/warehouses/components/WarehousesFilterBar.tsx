import type { FormEvent } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import type { WarehouseStatusFilter } from "../types";

interface WarehousesFilterBarProps {
  activeCount: number;
  draftSearch: string;
  draftStatus: WarehouseStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: WarehouseStatusFilter) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

/** Panel filter daftar gudang berdasarkan pencarian teks dan status aktif. */
export function WarehousesFilterBar({
  activeCount,
  draftSearch,
  draftStatus,
  onSearchChange,
  onStatusChange,
  onSubmit,
  onReset,
}: WarehousesFilterBarProps) {
  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter daftar gudang"
      title="Filter daftar gudang"
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
              placeholder="Cari kode, nama, atau alamat gudang..."
              type="search"
              value={draftSearch}
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Status gudang
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onStatusChange(event.target.value as WarehouseStatusFilter)
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
