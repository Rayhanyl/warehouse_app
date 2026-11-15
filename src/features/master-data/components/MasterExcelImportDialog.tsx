import { FormEvent, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import { extractApiErrorInfo } from "@/lib/errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface MasterExcelImportErrorRow {
  row: number;
  field: string;
  code: string;
  message: string;
}

export interface MasterExcelImportResult {
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: MasterExcelImportErrorRow[];
}

export interface MasterExcelImportDialogProps {
  title: string;
  description: string;
  templateHint: string;
  fileConstraintHint: string;
  titleId: string;
  fileInputId: string;
  closeAriaLabel: string;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImportFile: (file: File) => Promise<MasterExcelImportResult>;
  onImported: () => Promise<void>;
}

export function MasterExcelImportDialog({
  title,
  description,
  templateHint,
  fileConstraintHint,
  titleId,
  fileInputId,
  closeAriaLabel,
  onClose,
  onDownloadTemplate,
  onImportFile,
  onImported,
}: MasterExcelImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MasterExcelImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function selectFile(selected: File | null) {
    setResult(null);
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLocaleLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Pilih berkas Excel dengan format .xlsx.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setError("Ukuran berkas melebihi batas 5 MiB.");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const importResult = await onImportFile(file);
      setResult(importResult);
      if (importResult.imported_count > 0) {
        await onImported();
      }
    } catch (requestError) {
      const info = extractApiErrorInfo(requestError);
      setError(
        info.message ?? "Import belum berhasil. Periksa berkas lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line-200 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-ink-950" id={titleId}>
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">{description}</p>
          </div>
          <button
            aria-label={closeAriaLabel}
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid gap-4 rounded-[var(--radius-md)] bg-canvas-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
                  <FileSpreadsheet aria-hidden="true" size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink-950">
                    Mulai dari template
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    {templateHint}
                  </p>
                </div>
              </div>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 md:w-auto"
                onClick={onDownloadTemplate}
                type="button"
              >
                <Download aria-hidden="true" size={16} /> Unduh template
              </button>
            </div>

            <div className="space-y-4">
          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor={fileInputId}
            >
              Berkas Excel (.xlsx)
            </label>
            <input
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="mt-2 block min-h-12 w-full cursor-pointer rounded-[var(--radius-md)] border border-line-500 bg-surface-0 text-sm text-ink-950 file:mr-4 file:min-h-12 file:border-0 file:border-r file:border-line-200 file:bg-canvas-50 file:px-4 file:text-sm file:font-semibold file:text-ink-950 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              disabled={isSubmitting}
              id={fileInputId}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              ref={inputRef}
              type="file"
            />
            <p className="mt-2 text-xs leading-5 text-slate-700">
              {fileConstraintHint}
            </p>
          </div>

          {file && (
            <p className="text-sm text-slate-700">
              Dipilih:{" "}
              <span className="font-semibold text-ink-950">{file.name}</span> ·{" "}
              {(file.size / 1024).toFixed(0)} KiB
            </p>
          )}

          {error && (
            <div
              className="flex gap-2 rounded-[var(--radius-md)] border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <section
              aria-live="polite"
              className="rounded-[var(--radius-md)] border border-line-200"
            >
              <div className="flex items-start gap-3 bg-canvas-50 p-4">
                {result.failed_count === 0 ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-teal-700"
                    size={20}
                  />
                ) : (
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-amber-700"
                    size={20}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-ink-950">Import selesai</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    {result.failed_count > 0
                      ? "Baris yang valid sudah ditambahkan. Periksa rincian baris yang perlu diperbaiki."
                      : "Semua baris berhasil ditambahkan."}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-surface-0 p-2">
                      <dt className="text-xs text-slate-700">Baris dibaca</dt>
                      <dd className="mt-1 font-bold tabular-nums text-ink-950">
                        {result.total_rows}
                      </dd>
                    </div>
                    <div className="rounded bg-surface-0 p-2">
                      <dt className="text-xs text-slate-700">Berhasil</dt>
                      <dd className="mt-1 font-bold tabular-nums text-teal-700">
                        {result.imported_count}
                      </dd>
                    </div>
                    <div className="rounded bg-surface-0 p-2">
                      <dt className="text-xs text-slate-700">Baris gagal</dt>
                      <dd className="mt-1 font-bold tabular-nums text-red-700">
                        {result.failed_count}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <caption className="sr-only">
                      Rincian kesalahan import per baris
                    </caption>
                    <thead className="sticky top-0 bg-surface-0 text-xs font-bold uppercase tracking-wide text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Baris Excel</th>
                        <th className="px-3 py-2">Kolom</th>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Pesan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((item, index) => (
                        <tr
                          className="border-t border-line-200 align-top"
                          key={`${item.row}-${item.field}-${item.code}-${index}`}
                        >
                          <td className="px-3 py-2 tabular-nums">{item.row}</td>
                          <td className="px-3 py-2">{item.field}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {item.code}
                          </td>
                          <td className="px-3 py-2">{item.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

            </div>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 disabled:opacity-50 sm:w-auto"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Tutup
            </button>
            {!result && (
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={!file || isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
                ) : (
                  <Upload aria-hidden="true" size={16} />
                )}
                {isSubmitting ? "Mengimpor..." : "Mulai import"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
