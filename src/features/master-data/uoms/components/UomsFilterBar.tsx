import type { FormEvent } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import type {
  SortDirection,
  UomSortField,
  UomStatusFilter,
} from "../types";

interface UomsFilterBarProps {
  activeCount: number;
  draftSearch: string;
  draftStatus: UomStatusFilter;
  draftSortBy: UomSortField;
  draftSortDir: SortDirection;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: UomStatusFilter) => void;
  onSortByChange: (value: UomSortField) => void;
  onSortDirChange: (value: SortDirection) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

/** Panel filter dan pengurutan daftar satuan ukur (UoM). */
export function UomsFilterBar({
  activeCount,
  draftSearch,
  draftStatus,
  draftSortBy,
  draftSortDir,
  onSearchChange,
  onStatusChange,
  onSortByChange,
  onSortDirChange,
  onSubmit,
  onReset,
}: UomsFilterBarProps) {
  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter daftar satuan ukur"
      title="Filter daftar satuan ukur"
    >
      <form
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={onSubmit}
      >
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
              placeholder="Cari kode atau nama satuan..."
              type="search"
              value={draftSearch}
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Status satuan
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onStatusChange(event.target.value as UomStatusFilter)
            }
            value={draftStatus}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Urutkan berdasarkan
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onSortByChange(event.target.value as UomSortField)
            }
            value={draftSortBy}
          >
            <option value="id">ID satuan</option>
            <option value="code">Kode satuan</option>
            <option value="name">Nama satuan</option>
            <option value="created_at">Waktu dibuat</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Arah urutan
          <select
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            onChange={(event) =>
              onSortDirChange(event.target.value as SortDirection)
            }
            value={draftSortDir}
          >
            <option value="asc">Naik (A ke Z / Terlama)</option>
            <option value="desc">Turun (Z ke A / Terbaru)</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
          <Button className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700" type="submit">
            <Filter aria-hidden="true" size={16} />
            Terapkan filter
          </Button>
          <Button className="min-h-11 gap-2" onClick={onReset} type="button" variant="outline">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang filter
          </Button>
        </div>
      </form>
    </CollapsibleFilterPanel>
  );
}
