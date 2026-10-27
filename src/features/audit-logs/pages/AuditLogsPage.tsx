import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import axios from "axios";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <tr className="border-t border-[#e7ebe5] align-top">
        <td className="px-4 py-4 text-xs text-[#667876]">{formatDate(log.created_at)}</td>
        <td className="px-4 py-4">
          <p className="font-semibold">{log.username || "Sistem"}</p>
          <p className="mt-1 text-xs text-[#667876]">{log.ip_address || "IP tidak tersedia"}</p>
        </td>
        <td className="px-4 py-4">
          <span className="rounded-full bg-[#e3ebe3] px-2.5 py-1 text-xs font-semibold text-[#2f7a68]">{log.action}</span>
        </td>
        <td className="px-4 py-4 text-sm">
          <p className="font-semibold">{log.entity_type}</p>
          <p className="mt-1 text-xs text-[#667876]">ID: {log.entity_id || "-"}</p>
        </td>
        <td className="px-4 py-4 text-right">
          <button
            aria-expanded={isExpanded}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#2f7a68] hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68]"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            Detail
            <ChevronDown className={`transition ${isExpanded ? "rotate-180" : ""}`} size={15} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-[#faf8f3]">
          <td className="px-4 pb-5" colSpan={5}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#667876]">Sebelum</h3>
                <pre className="max-h-48 overflow-auto rounded-lg bg-[#17252a] p-3 text-xs leading-5 text-[#e3ebe3]">{formatValues(log.old_values)}</pre>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#667876]">Sesudah</h3>
                <pre className="max-h-48 overflow-auto rounded-lg bg-[#17252a] p-3 text-xs leading-5 text-[#e3ebe3]">{formatValues(log.new_values)}</pre>
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
  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs(filters, offset);
  const pageSize = data?.limit ?? 20;
  const total = data?.total ?? 0;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + pageSize, total);
  const isPermissionError = axios.isAxiosError(error) && error.response?.status === 403;

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
        description="Telusuri aktivitas dan perubahan data yang tercatat secara baca-saja."
        title="Audit log"
      />
      <section className="mb-6 rounded-2xl border border-[#d9dfd8] bg-white p-4 shadow-sm sm:p-5">
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={applyFilters}>
          <label className="text-sm font-semibold">Aksi
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" onChange={(event) => setDraftFilters({ ...draftFilters, action: event.target.value })} placeholder="Contoh: USER_UPDATED" value={draftFilters.action} />
          </label>
          <label className="text-sm font-semibold">Jenis entitas
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" onChange={(event) => setDraftFilters({ ...draftFilters, entity_type: event.target.value })} placeholder="Contoh: users" value={draftFilters.entity_type} />
          </label>
          <label className="text-sm font-semibold">ID entitas
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" onChange={(event) => setDraftFilters({ ...draftFilters, entity_id: event.target.value })} placeholder="Contoh: 123" value={draftFilters.entity_id} />
          </label>
          <label className="text-sm font-semibold">ID pengguna
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" inputMode="numeric" onChange={(event) => setDraftFilters({ ...draftFilters, user_id: event.target.value })} placeholder="Contoh: 1" value={draftFilters.user_id} />
          </label>
          <label className="text-sm font-semibold">Dari tanggal
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" onChange={(event) => setDraftFilters({ ...draftFilters, date_from: event.target.value })} type="datetime-local" value={draftFilters.date_from} />
          </label>
          <label className="text-sm font-semibold">Sampai tanggal
            <input className="mt-2 h-11 w-full rounded-lg border border-[#c7c1b6] px-3 text-sm font-normal outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" onChange={(event) => setDraftFilters({ ...draftFilters, date_to: event.target.value })} type="datetime-local" value={draftFilters.date_to} />
          </label>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-3">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2f7a68] px-4 text-sm font-semibold text-white hover:bg-[#256354] focus-visible:ring-2 focus-visible:ring-[#2f7a68]" type="submit"><Filter size={17} /> Terapkan filter</button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c7c1b6] px-4 text-sm font-semibold text-[#17252a] hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68]" onClick={resetFilters} type="button"><RotateCcw size={17} /> Reset</button>
          </div>
        </form>
      </section>
      {isLoading ? (
        <div className="rounded-2xl border border-[#d9dfd8] bg-white p-8 text-sm text-[#667876]" role="status">Memuat audit log...</div>
      ) : isError ? (
        <div className="rounded-2xl border border-[#efc5c0] bg-[#fbe6e4] p-6 text-sm text-[#8f2f2f]" role="alert">
          <p className="font-semibold">{isPermissionError ? "Anda tidak memiliki izin melihat audit log." : "Audit log belum dapat dimuat."}</p>
          {!isPermissionError && <button className="mt-4 rounded-lg bg-[#b83232] px-4 py-2 font-semibold text-white" onClick={() => void refetch()} type="button">Coba lagi</button>}
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#b8c5c1] bg-white p-8 text-center text-sm text-[#667876]">Belum ada audit log yang sesuai dengan filter.</div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#d9dfd8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Daftar audit log</caption>
              <thead className="bg-[#faf8f3] text-xs font-bold uppercase tracking-wide text-[#667876]">
                <tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pelaku</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Entitas</th><th className="px-4 py-3 text-right">Tindakan</th></tr>
              </thead>
              <tbody>{data?.items.map((log) => <AuditLogRow key={log.id} log={log} />)}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ebe5] px-4 py-3 text-xs text-[#667876]">
            <span>{isFetching ? "Memperbarui..." : `${pageStart}–${pageEnd} dari ${total} catatan`}</span>
            <div className="flex gap-2">
              <button aria-label="Halaman sebelumnya" className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-[#d9dfd8] disabled:opacity-40" disabled={offset === 0 || isFetching} onClick={() => setOffset(Math.max(0, offset - pageSize))} type="button"><ChevronLeft size={17} /></button>
              <button aria-label="Halaman berikutnya" className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-[#d9dfd8] disabled:opacity-40" disabled={offset + pageSize >= total || isFetching} onClick={() => setOffset(offset + pageSize)} type="button"><ChevronRight size={17} /></button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
