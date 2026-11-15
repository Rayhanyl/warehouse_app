import type { ReactNode } from "react";

export function StockCardList({
  children,
  empty,
}: {
  children: ReactNode;
  empty: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      {empty ? <StockState text="Belum ada data untuk filter ini." /> : children}
    </section>
  );
}

export function StockTableFrame({
  caption,
  children,
  empty,
}: {
  caption: string;
  children: ReactNode;
  empty: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      {empty ? (
        <StockState text="Belum ada data untuk filter ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            {children}
          </table>
        </div>
      )}
    </section>
  );
}

export function StockTh({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`bg-canvas-50 px-4 py-3 text-xs font-semibold text-slate-700 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function StockState({
  text,
  error = false,
  onRetry,
}: {
  text: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border ${
        error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"
      } p-8 text-center`}
    >
      <p className="font-semibold text-ink-950">{text}</p>
      {!error && (
        <p className="mt-1 text-sm text-slate-700">
          Data akan muncul setelah transaksi stok tercatat.
        </p>
      )}
      {error && onRetry && (
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0 hover:bg-red-800"
          onClick={onRetry}
          type="button"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
