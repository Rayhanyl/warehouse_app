import type { FormEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";

export function AdminFilterBar({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="grid gap-3 md:flex md:flex-wrap md:items-end" onSubmit={onSubmit}>
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 md:flex md:flex-wrap md:items-end">
        {children}
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
        type="submit"
      >
        <Search size={16} />
        Terapkan
      </button>
    </form>
  );
}

export function AdminSelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-40 text-sm font-semibold">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminPagination({
  offset,
  limit,
  total,
  isFetching,
  onPageChange,
  onLimitChange,
}: {
  offset: number;
  limit: number;
  total: number;
  isFetching: boolean;
  onPageChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="flex flex-col gap-3 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Menampilkan {pageStart} sampai {pageEnd} dari {total}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2">
          Per halaman
          <select
            className="h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2"
            disabled={isFetching}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            value={limit}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button
          aria-label="Halaman sebelumnya"
          className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasPrevious || isFetching}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          type="button"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          aria-label="Halaman berikutnya"
          className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(offset + limit)}
          type="button"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

export function AdminInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        aria-invalid={Boolean(error)}
        className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm font-normal disabled:bg-canvas-50 ${
          error ? "border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20" : "border-line-500"
        }`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={label !== "Kata sandi baru (opsional)"}
        type={type}
        value={value}
      />
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function AdminDataFrame({
  children,
  empty,
  text,
}: {
  children: ReactNode;
  empty: boolean;
  text: string;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      {empty ? <AdminState text={text} /> : <div className="overflow-x-auto">{children}</div>}
    </section>
  );
}

export function AdminTh({ children }: { children: ReactNode }) {
  return (
    <th className="bg-canvas-50 px-4 py-3 text-left text-xs font-semibold text-slate-700">
      {children}
    </th>
  );
}

export function AdminState({
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
      <ShieldCheck className="mx-auto mb-3 text-slate-600" size={24} />
      <p className="font-semibold">{text}</p>
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
