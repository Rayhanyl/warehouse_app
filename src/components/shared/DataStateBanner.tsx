import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type DataStateVariant = "loading" | "empty" | "error";

export interface DataStateBannerProps {
  state: DataStateVariant;
  title?: string;
  description?: string;
  skeletonRows?: number;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

const DEFAULT_TITLES: Record<DataStateVariant, string> = {
  loading: "Memuat data...",
  empty: "Belum ada data ditemukan",
  error: "Gagal memuat data",
};

/**
 * Penampil status seragam untuk kondisi loading (skeleton), kosong (empty), dan galat (error + retry).
 */
export function DataStateBanner({
  state,
  title,
  description,
  skeletonRows = 3,
  onRetry,
  retryLabel = "Muat ulang",
  action,
  className,
}: DataStateBannerProps) {
  const resolvedTitle = title ?? DEFAULT_TITLES[state];

  if (state === "loading") {
    const rows = Math.max(1, Math.min(8, skeletonRows));
    return (
      <div
        data-slot="data-state-loading"
        role="status"
        aria-live="polite"
        aria-label={resolvedTitle}
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-xs",
          className,
        )}
      >
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {resolvedTitle}
        </p>
        <div className="space-y-2.5">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-full animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        data-slot="data-state-error"
        role="alert"
        className={cn(
          "flex flex-col items-start justify-between gap-3 rounded-xl border border-red-600/30 bg-red-100/70 p-4 text-red-700 sm:flex-row sm:items-center",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{resolvedTitle}</p>
            {description ? (
              <p className="text-xs leading-relaxed text-red-700/90">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-600/30 bg-card text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="size-3.5" />
              <span>{retryLabel}</span>
            </Button>
          ) : null}
          {action}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="data-state-empty"
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/80 px-4 py-8 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        {description ? (
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
