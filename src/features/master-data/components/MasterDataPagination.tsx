import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MasterDataPaginationProps {
  offset: number;
  limit: number;
  pageSize: number;
  total: number;
  isFetching?: boolean;
  itemLabel: string;
  pageSizeOptions?: number[];
  onLimitChange: (nextLimit: number) => void;
  onOffsetChange: (nextOffset: number) => void;
}

/** Kontrol paginasi offset-limit seragam untuk tabel master data dengan target sentuh >= 44px. */
export function MasterDataPagination({
  offset,
  limit,
  pageSize,
  total,
  isFetching = false,
  itemLabel,
  pageSizeOptions = [20, 50, 100],
  onLimitChange,
  onOffsetChange,
}: MasterDataPaginationProps) {
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + pageSize, total);

  return (
    <div className="flex flex-col items-start justify-between gap-3 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums sm:flex-row sm:items-center">
      <span>
        {isFetching
          ? "Memperbarui..."
          : `Menampilkan ${pageStart} sampai ${pageEnd} dari ${total} ${itemLabel}`}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span>Baris per halaman</span>
          <select
            aria-label="Baris per halaman"
            className="min-h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2.5 text-xs font-semibold text-ink-950"
            onChange={(event) => onLimitChange(Number(event.target.value))}
            value={limit}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            aria-label="Halaman sebelumnya"
            className="min-h-11 min-w-11"
            disabled={offset === 0 || isFetching}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </Button>
          <Button
            aria-label="Halaman berikutnya"
            className="min-h-11 min-w-11"
            disabled={offset + pageSize >= total || isFetching}
            onClick={() => onOffsetChange(offset + limit)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight aria-hidden="true" size={17} />
          </Button>
        </div>
      </div>
    </div>
  );
}
