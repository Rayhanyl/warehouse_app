import type { ReactNode } from "react";

import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataStateBanner } from "@/components/shared/DataStateBanner";

export interface ResponsiveColumn<T> {
  id: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface ResponsiveDataViewProps<T> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string | number;
  renderMobileCard: (item: T, index: number) => ReactNode;
  columns?: readonly ResponsiveColumn<T>[];
  renderDesktop?: (data: readonly T[]) => ReactNode;
  isLoading?: boolean;
  loadingTitle?: string;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  mobileListAriaLabel?: string;
  mobileListClassName?: string;
  tableContainerClassName?: string;
  className?: string;
}

/**
 * Wadah data adaptif yang otomatis beralih antara kartu mobile (`< 768px`) dan tabel desktop/tablet.
 */
export function ResponsiveDataView<T>({
  data,
  keyExtractor,
  renderMobileCard,
  columns = [],
  renderDesktop,
  isLoading = false,
  loadingTitle,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  mobileListAriaLabel,
  mobileListClassName,
  tableContainerClassName,
  className,
}: ResponsiveDataViewProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <DataStateBanner
        state="loading"
        title={loadingTitle}
        className={className}
      />
    );
  }

  if (error) {
    return (
      <DataStateBanner
        state="error"
        description={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (data.length === 0) {
    return (
      <DataStateBanner
        state="empty"
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  if (isMobile) {
    if (mobileListAriaLabel) {
      return (
        <ul
          aria-label={mobileListAriaLabel}
          data-slot="responsive-mobile-list"
          className={cn("space-y-3", mobileListClassName, className)}
        >
          {data.map((item, index) => (
            <li key={keyExtractor(item, index)}>
              {renderMobileCard(item, index)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div
        data-slot="responsive-mobile-list"
        className={cn("space-y-3", mobileListClassName, className)}
      >
        {data.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderMobileCard(item, index)}
          </div>
        ))}
      </div>
    );
  }

  if (renderDesktop) {
    return (
      <div data-slot="responsive-desktop-custom" className={className}>
        {renderDesktop(data)}
      </div>
    );
  }

  return (
    <div
      data-slot="responsive-desktop-table"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        tableContainerClassName,
        className,
      )}
    >
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={keyExtractor(item, index)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.cell(item, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
