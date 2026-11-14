import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Code2, X, XCircle } from "lucide-react";
import type { AuditLog } from "../types";

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatCellValue(value: unknown): string {
  if (value === undefined) {
    return "—";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function collectDiffRows(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
) {
  const keys = Array.from(
    new Set([
      ...Object.keys(oldValues ?? {}),
      ...Object.keys(newValues ?? {}),
    ]),
  ).sort();

  return keys.map((field) => {
    const hasOld = oldValues !== null && Object.prototype.hasOwnProperty.call(oldValues, field);
    const hasNew = newValues !== null && Object.prototype.hasOwnProperty.call(newValues, field);
    const oldVal = hasOld ? oldValues[field] : undefined;
    const newVal = hasNew ? newValues[field] : undefined;
    const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    return {
      field,
      hasOld,
      hasNew,
      oldVal,
      newVal,
      changed,
    };
  });
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [rawJsonLogId, setRawJsonLogId] = useState<number | null>(null);

  useEffect(() => {
    if (!log) {
      return;
    }
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [log, onClose]);

  if (!log) {
    return null;
  }

  const showRawJson = rawJsonLogId === log.id;
  const diffRows = collectDiffRows(log.old_values, log.new_values);
  const isFailed = log.status === "FAILED";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="audit-detail-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-200 px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isFailed
                    ? "bg-red-100 text-red-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {isFailed ? (
                  <XCircle aria-hidden="true" size={14} />
                ) : (
                  <CheckCircle2 aria-hidden="true" size={14} />
                )}
                {isFailed ? "Gagal" : "Berhasil"}
              </span>
              <span className="rounded-full bg-canvas-50 px-2.5 py-1 font-mono text-xs font-semibold text-ink-950">
                {log.action}
              </span>
            </div>
            <h2
              className="mt-2 text-lg font-bold text-ink-950"
              id="audit-detail-title"
            >
              Detail Audit Log #{log.id}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Tutup detail audit log"
            className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <dl className="grid gap-3 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/75 p-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                Waktu Kejadian
              </dt>
              <dd className="mt-1 font-medium text-ink-950 tabular-nums">
                {formatDateTime(log.created_at)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                Pelaku
              </dt>
              <dd className="mt-1 font-medium text-ink-950">
                {log.username || "Sistem"}
                {log.user_id !== null ? ` (ID #${log.user_id})` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                Entitas
              </dt>
              <dd className="mt-1 font-medium text-ink-950 tabular-nums">
                {log.entity_type}
                {log.entity_id ? ` #${log.entity_id}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                IP Address Klien
              </dt>
              <dd className="mt-1 font-mono font-medium text-ink-950 tabular-nums">
                {log.ip_address || "Tidak tersedia"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                Request ID
              </dt>
              <dd className="mt-1 break-all font-mono font-medium text-ink-950">
                {log.request_id || "Tidak tersedia"}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <dt className="font-semibold uppercase tracking-wider text-slate-600">
                Perangkat / User-Agent
              </dt>
              <dd className="mt-1 break-words font-medium text-ink-950">
                {log.user_agent || "Tidak tersedia"}
              </dd>
            </div>
          </dl>

          {log.details && Object.keys(log.details).length > 0 && (
            <section
              className={`rounded-[var(--radius-md)] border p-4 ${
                isFailed
                  ? "border-red-600/25 bg-red-50/70"
                  : "border-line-200 bg-canvas-50/60"
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-950">
                {isFailed ? "Informasi Kegagalan & Konteks" : "Konteks Tambahan"}
              </h3>
              <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                {Object.entries(log.details).map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="font-mono font-semibold text-slate-700">
                      {key}
                    </dt>
                    <dd className="mt-0.5 break-words font-mono text-ink-950">
                      {formatCellValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Perbandingan Perubahan Data (Sebelum vs Sesudah)
              </h3>
              {(log.old_values || log.new_values) && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-canvas-50"
                  onClick={() => setRawJsonLogId((prev) => (prev === log.id ? null : log.id))}
                  type="button"
                >
                  <Code2 aria-hidden="true" size={14} />
                  {showRawJson ? "Lihat Tabel Diff" : "Lihat JSON Mentah"}
                </button>
              )}
            </div>

            {diffRows.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-line-500 p-4 text-center text-xs text-slate-600">
                Tidak ada perubahan data field pada aktivitas ini.
              </div>
            ) : showRawJson ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700">
                    Sebelum (old_values)
                  </p>
                  <pre className="max-h-60 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
                    {log.old_values
                      ? JSON.stringify(log.old_values, null, 2)
                      : "Tidak ada"}
                  </pre>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700">
                    Sesudah (new_values)
                  </p>
                  <pre className="max-h-60 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
                    {log.new_values
                      ? JSON.stringify(log.new_values, null, 2)
                      : "Tidak ada"}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                <table className="w-full min-w-[540px] text-left text-xs">
                  <thead className="bg-canvas-50 font-bold uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">Field</th>
                      <th className="px-3 py-2.5">Nilai Lama</th>
                      <th className="px-3 py-2.5">Nilai Baru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => (
                      <tr
                        key={row.field}
                        className="border-t border-line-200 align-top"
                      >
                        <td className="px-3 py-2.5 font-mono font-semibold text-ink-950">
                          {row.field}
                        </td>
                        <td
                          className={`px-3 py-2.5 break-all font-mono ${
                            row.hasOld && row.changed
                              ? "bg-red-50/70 text-red-800"
                              : "text-slate-600"
                          }`}
                        >
                          {row.hasOld ? formatCellValue(row.oldVal) : "—"}
                        </td>
                        <td
                          className={`px-3 py-2.5 break-all font-mono ${
                            row.hasNew && row.changed
                              ? "bg-teal-50/80 text-teal-800"
                              : "text-slate-700"
                          }`}
                        >
                          {row.hasNew ? formatCellValue(row.newVal) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-line-200 px-6 py-3.5">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
