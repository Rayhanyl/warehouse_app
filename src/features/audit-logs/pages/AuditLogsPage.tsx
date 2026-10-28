import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import axios from "axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { extractApiErrorInfo } from "@/lib/errors";
import { useAuditLogs } from "../api";
import type { AuditLog, AuditLogFilters } from "../types";

const initialFilters: AuditLogFilters = {
  action: "",
  entity_type: "",
  entity_id: "",
  user_id: "",
  date_from: "",
  date_to: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatValues(values: Record<string, unknown> | null) {
  return values ? JSON.stringify(values, null, 2) : "Tidak ada perubahan";
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className="border-t border-line-200 align-top">
        <td className="px-4 py-4 text-xs text-slate-600 tabular-nums">
          {formatDate(log.created_at)}
        </td>
        <td className="px-4 py-4">
          <p className="font-semibold text-ink-950">{log.username || "Sistem"}</p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            {log.ip_address || "IP tidak tersedia"}
          </p>
        </td>
        <td className="px-4 py-4">
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
            {log.action}
          </span>
        </td>
        <td className="px-4 py-4 text-sm">
          <p className="font-semibold text-ink-950">{log.entity_type}</p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            ID: {log.entity_id || "Tidak tersedia"}
          </p>
        </td>
        <td className="px-4 py-4 text-right">
          <button
            aria-expanded={isExpanded}
            className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            Detail
            <ChevronDown
              aria-hidden="true"
              className={`transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
              size={15}
            />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-canvas-50/75">
          <td className="px-4 pb-5" colSpan={5}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sebelum
                </h3>
                <pre className="max-h-48 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
                  {formatValues(log.old_values)}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sesudah
                </h3>
                <pre className="max-h-48 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
                  {formatValues(log.new_values)}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs(
    filters,
    offset,
  );
  const pageSize = data?.limit ?? 20;
  const total = data?.total ?? 0;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + pageSize, total);
  const isPermissionError =
    axios.isAxiosError(error) && error.response?.status === 403;
  const errorInfo = isError ? extractApiErrorInfo(error) : null;

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setFilters(draftFilters);
  }

  function resetFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setOffset(0);
  }

  return (
    <>
      <PageHeader
        description="Telusuri aktivitas dan perubahan data sistem yang tercatat secara baca-saja."
        title="Audit log"
      />
      <section className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5">
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={applyFilters}>
          <label className="text-sm font-semibold text-ink-950">
            Aksi
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, action: event.target.value })
              }
              placeholder="Contoh: USER_UPDATED"
              value={draftFilters.action}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Jenis entitas
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, entity_type: event.target.value })
              }
              placeholder="Contoh: users"
              value={draftFilters.entity_type}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            ID entitas
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, entity_id: event.target.value })
              }
              placeholder="Contoh: 123"
              value={draftFilters.entity_id}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            ID pengguna
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              inputMode="numeric"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, user_id: event.target.value })
              }
              placeholder="Contoh: 1"
              value={draftFilters.user_id}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Dari tanggal
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, date_from: event.target.value })
              }
              type="datetime-local"
              value={draftFilters.date_from}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Sampai tanggal
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, date_to: event.target.value })
              }
              type="datetime-local"
              value={draftFilters.date_to}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-3">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              type="submit"
            >
              <Filter aria-hidden="true" size={17} /> Terapkan filter
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={17} /> Atur ulang filter
            </button>
          </div>
        </form>
      </section>
      {isLoading ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-sm text-slate-700"
          role="status"
        >
          Memuat audit log...
        </div>
      ) : isError ? (
        <div
          className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-100 p-6 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">
            {isPermissionError
              ? "Anda tidak memiliki izin melihat audit log."
              : "Data audit log belum dapat dimuat."}
          </p>
          {errorInfo?.requestId && (
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              ID Permintaan: {errorInfo.requestId}
            </p>
          )}
          {!isPermissionError && (
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-red-700"
              onClick={() => void refetch()}
              type="button"
            >
              Muat ulang data
            </button>
          )}
        </div>
      ) : total === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center text-sm text-slate-700">
          Belum ada catatan audit log yang sesuai dengan filter.
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Daftar audit log</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pelaku</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Entitas</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums">
            <span>
              {isFetching
                ? "Memperbarui..."
                : `Menampilkan ${pageStart} sampai ${pageEnd} dari ${total} catatan`}
            </span>
            <div className="flex gap-2">
              <button
                aria-label="Halaman sebelumnya"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={offset === 0 || isFetching}
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={17} />
              </button>
              <button
                aria-label="Halaman berikutnya"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={offset + pageSize >= total || isFetching}
                onClick={() => setOffset(offset + pageSize)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={17} />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
