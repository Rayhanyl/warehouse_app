import { useEffect } from "react";
import { Calendar, CheckCircle2, Edit3, FileText, Hash, PowerOff, RotateCcw, User, X } from "lucide-react";
import { useCategoryDetail } from "../api";
import type { Category } from "../types";

interface CategoryDetailDialogProps {
  category: Category | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CategoryDetailDialog({
  category,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: CategoryDetailDialogProps) {
  const { data: detail, isFetching } = useCategoryDetail(
    category?.id ?? null,
    category ?? undefined,
  );

  useEffect(() => {
    if (!category) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [category, onClose]);

  if (!category) {
    return null;
  }

  const activeCategory = detail ?? category;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="category-detail-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                ID #{activeCategory.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  activeCategory.is_active
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 aria-hidden="true" size={13} />
                {activeCategory.is_active ? "Aktif" : "Nonaktif"}
              </span>
              {isFetching && (
                <span className="text-xs text-slate-600">Memperbarui...</span>
              )}
            </div>
            <h2
              className="mt-2 text-lg font-bold text-ink-950"
              id="category-detail-title"
            >
              {activeCategory.name}
            </h2>
          </div>
          <button
            aria-label="Tutup detail kategori"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <FileText
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-teal-700"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <dt className="text-xs font-medium text-slate-600">Deskripsi kategori</dt>
              <dd className="mt-1 leading-6 text-ink-950">
                {activeCategory.description || "Belum ada deskripsi untuk kategori ini."}
              </dd>
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Hash
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">ID Kategori</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {activeCategory.id}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">ID Pembuat</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {activeCategory.created_by ? `Pengguna #${activeCategory.created_by}` : "Sistem"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Dibuat pada</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {formatDateTime(activeCategory.created_at)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Terakhir diperbarui</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {formatDateTime(activeCategory.updated_at)}
                </dd>
              </div>
            </div>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
          {canManage && (
            <>
              <button
                className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-semibold transition ${
                  activeCategory.is_active
                    ? "border-red-600/40 bg-surface-0 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 bg-surface-0 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(activeCategory);
                }}
                type="button"
              >
                {activeCategory.is_active ? (
                  <>
                    <PowerOff aria-hidden="true" size={16} />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <RotateCcw aria-hidden="true" size={16} />
                    Aktifkan kembali
                  </>
                )}
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                onClick={() => {
                  onClose();
                  onEdit(activeCategory);
                }}
                type="button"
              >
                <Edit3 aria-hidden="true" size={16} />
                Ubah kategori
              </button>
            </>
          )}
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
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

