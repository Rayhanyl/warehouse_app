import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, Save, X } from "lucide-react";
import type { Category, CategoryCreatePayload, CategoryUpdatePayload } from "../types";

interface CategoryFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialCategory: Category | null;
  isSubmitting: boolean;
  submitError: {
    message: string;
    requestId?: string;
    fieldErrors?: { name?: string; description?: string };
  } | null;
  onClose: () => void;
  onSubmit: (payload: CategoryCreatePayload | CategoryUpdatePayload) => Promise<void>;
}

export function CategoryFormDialog({
  isOpen,
  mode,
  initialCategory,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(() => initialCategory?.name ?? "");
  const [description, setDescription] = useState(
    () => initialCategory?.description ?? "",
  );
  const [isActive, setIsActive] = useState(
    () => initialCategory?.is_active ?? true,
  );
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 20);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const nameError = validationErrors.name || submitError?.fieldErrors?.name;
  const descriptionError =
    validationErrors.description || submitError?.fieldErrors?.description;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const nextErrors: { name?: string; description?: string } = {};

    if (trimmedName.length === 0) {
      nextErrors.name = "Nama kategori wajib diisi (1 sampai 120 karakter).";
    } else if (trimmedName.length > 120) {
      nextErrors.name = "Nama kategori maksimal terdiri dari 120 karakter.";
    }

    if (trimmedDescription.length > 500) {
      nextErrors.description = "Deskripsi kategori maksimal terdiri dari 500 karakter.";
    }

    if (nextErrors.name || nextErrors.description) {
      setValidationErrors(nextErrors);
      return;
    }

    setValidationErrors({});
    await onSubmit({
      name: trimmedName,
      description: trimmedDescription.length > 0 ? trimmedDescription : null,
      is_active: isActive,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="category-form-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
          <div>
            <h2
              className="text-lg font-bold text-ink-950"
              id="category-form-title"
            >
              {mode === "create"
                ? "Tambah kategori barang"
                : "Ubah kategori barang"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              {mode === "create"
                ? "Buat kelompok referensi baru untuk pengelompokan barang (SKU)."
                : `Perbarui informasi untuk kategori ID #${initialCategory?.id ?? ""}.`}
            </p>
          </div>
          <button
            aria-label="Tutup formulir kategori"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
          {submitError && (
            <div
              className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3.5 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{submitError.message}</p>
                {submitError.requestId && (
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    ID Permintaan: {submitError.requestId}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="category-name-input"
              >
                Nama kategori <span className="text-red-700">*</span>
              </label>
              <span className="text-xs text-slate-600 tabular-nums">
                {name.length}/120
              </span>
            </div>
            <input
              aria-describedby={nameError ? "category-name-error" : "category-name-hint"}
              aria-invalid={Boolean(nameError)}
              className={`mt-2 h-12 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3.5 text-sm text-ink-950 placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                nameError
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              disabled={isSubmitting}
              id="category-name-input"
              maxLength={140}
              onChange={(event) => {
                setName(event.target.value);
                if (validationErrors.name) {
                  setValidationErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              placeholder="Contoh: Komponen Elektronik"
              ref={nameInputRef}
              required
              type="text"
              value={name}
            />
            {nameError ? (
              <p
                className="mt-1.5 text-xs font-medium text-red-700"
                id="category-name-error"
              >
                {nameError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-600" id="category-name-hint">
                Nama kategori wajib unik dan terdiri dari 1 sampai 120 karakter.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="category-description-input"
              >
                Deskripsi kategori
              </label>
              <span className="text-xs text-slate-600 tabular-nums">
                {description.length}/500
              </span>
            </div>
            <textarea
              aria-describedby={
                descriptionError ? "category-description-error" : "category-description-hint"
              }
              aria-invalid={Boolean(descriptionError)}
              className={`mt-2 w-full rounded-[var(--radius-md)] border bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                descriptionError
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              disabled={isSubmitting}
              id="category-description-input"
              onChange={(event) => {
                setDescription(event.target.value);
                if (validationErrors.description) {
                  setValidationErrors((current) => ({
                    ...current,
                    description: undefined,
                  }));
                }
              }}
              placeholder="Contoh: IC, Resistor, Kapasitor, dan modul mikrokontroler"
              rows={3}
              value={description}
            />
            {descriptionError ? (
              <p
                className="mt-1.5 text-xs font-medium text-red-700"
                id="category-description-error"
              >
                {descriptionError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-600" id="category-description-hint">
                Opsional. Jelaskan cakupan jenis barang yang masuk ke kategori ini.
              </p>
            )}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="category-status-select"
            >
              Status kategori
            </label>
            <select
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              disabled={isSubmitting}
              id="category-status-select"
              onChange={(event) => setIsActive(event.target.value === "active")}
              value={isActive ? "active" : "inactive"}
            >
              <option value="active">Aktif (Dapat dipilih pada barang baru)</option>
              <option value="inactive">
                Nonaktif (Disembunyikan dari pilihan barang baru)
              </option>
            </select>
            {mode === "edit" && initialCategory?.is_active && !isActive && (
              <p className="mt-1.5 text-xs text-amber-700">
                Perhatian: Kategori yang masih digunakan oleh barang (SKU) aktif akan ditolak oleh server saat dinonaktifkan.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              <Save aria-hidden="true" size={16} />
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan kategori"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

