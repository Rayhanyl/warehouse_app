import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface DataPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Kontrol paginasi responsif standar berbasis shadcn Button dengan target sentuh mobile-friendly.
 */
export function DataPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = "data",
  isLoading = false,
  className,
}: DataPaginationProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startItem = total === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(total, currentPage * safePageSize);

  return (
    <div
      data-slot="data-pagination"
      className={cn(
        "flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="tabular-nums">
          {total === 0
            ? `0 ${itemLabel}`
            : `Menampilkan ${startItem}-${endItem} dari ${total} ${itemLabel}`}
        </span>
        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span>Per halaman</span>
            <select
              aria-label="Jumlah data per halaman"
              value={safePageSize}
              disabled={isLoading}
              onChange={(event) =>
                onPageSizeChange(Number(event.target.value) || safePageSize)
              }
              className="min-h-10 rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:min-h-9"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 px-3 md:min-h-9"
          disabled={isLoading || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
          <span>Sebelumnya</span>
        </Button>

        <span className="min-w-[84px] text-center text-xs font-medium text-foreground tabular-nums">
          Hal {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="min-h-11 px-3 md:min-h-9"
          disabled={isLoading || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span>Berikutnya</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
