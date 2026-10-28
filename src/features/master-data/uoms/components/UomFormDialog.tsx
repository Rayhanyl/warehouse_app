import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, Save, X } from "lucide-react";
import type { Uom, UomCreatePayload, UomUpdatePayload } from "../types";

interface UomFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialUom: Uom | null;
  isSubmitting: boolean;
  submitError: {
    message: string;
    requestId?: string;
    fieldErrors?: { code?: string; name?: string };
  } | null;
  onClose: () => void;
  onSubmit: (payload: UomCreatePayload | UomUpdatePayload) => Promise<void>;
}

export function UomFormDialog({
  isOpen,
  mode,
  initialUom,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: UomFormDialogProps) {
  const [code, setCode] = useState(() => initialUom?.code ?? "");
  const [name, setName] = useState(() => initialUom?.name ?? "");
  const [allowDecimal, setAllowDecimal] = useState(
    () => initialUom?.allow_decimal ?? false,
  );
  const [isActive, setIsActive] = useState(() => initialUom?.is_active ?? true);
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    name?: string;
  }>({});
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      codeInputRef.current?.focus();
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

  const codeError = validationErrors.code || submitError?.fieldErrors?.code;
  const nameError = validationErrors.name || submitError?.fieldErrors?.name;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const nextErrors: { code?: string; name?: string } = {};

    if (trimmedCode.length === 0) {
      nextErrors.code = "Kode satuan ukur wajib diisi (1 sampai 20 karakter).";
    } else if (trimmedCode.length > 20) {
      nextErrors.code = "Kode satuan ukur maksimal terdiri dari 20 karakter.";
    }

    if (trimmedName.length === 0) {
      nextErrors.name = "Nama satuan ukur wajib diisi (1 sampai 60 karakter).";
    } else if (trimmedName.length > 60) {
      nextErrors.name = "Nama satuan ukur maksimal terdiri dari 60 karakter.";
    }

    if (nextErrors.code || nextErrors.name) {
      setValidationErrors(nextErrors);
      return;
    }

    setValidationErrors({});
    await onSubmit({
      code: trimmedCode,
      name: trimmedName,
      allow_decimal: allowDecimal,
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
        aria-labelledby="uom-form-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-ink-950" id="uom-form-title">
              {mode === "create"
                ? "Tambah satuan ukur (UoM)"
                : "Ubah satuan ukur (UoM)"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              {mode === "create"
                ? "Tentukan kode, nama satuan, dan aturan presisi kuantitas untuk barang (SKU)."
                : `Perbarui informasi untuk satuan ukur ID #${initialUom?.id ?? ""}.`}
            </p>
          </div>
          <button
            aria-label="Tutup formulir satuan ukur"
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
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={17}
              />
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
                htmlFor="uom-code-input"
              >
                Kode satuan ukur <span className="text-red-700">*</span>
              </label>
              <span className="text-xs text-slate-600 tabular-nums">
                {code.length}/20
              </span>
            </div>
            <input
              aria-describedby={codeError ? "uom-code-error" : "uom-code-hint"}
              aria-invalid={Boolean(codeError)}
              className={`mt-2 h-12 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 placeholder:font-normal placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                codeError
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              disabled={isSubmitting}
              id="uom-code-input"
              maxLength={30}
              onChange={(event) => {
                setCode(event.target.value);
                if (validationErrors.code) {
                  setValidationErrors((current) => ({
                    ...current,
                    code: undefined,
                  }));
                }
              }}
              placeholder="Contoh: PCS, KG, BOX"
              ref={codeInputRef}
              required
              type="text"
              value={code}
            />
            {codeError ? (
              <p
                className="mt-1.5 text-xs font-medium text-red-700"
                id="uom-code-error"
              >
                {codeError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-600" id="uom-code-hint">
                Kode singkat wajib unik dan terdiri dari 1 sampai 20 karakter.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="uom-name-input"
              >
                Nama satuan ukur <span className="text-red-700">*</span>
              </label>
              <span className="text-xs text-slate-600 tabular-nums">
                {name.length}/60
              </span>
            </div>
            <input
              aria-describedby={nameError ? "uom-name-error" : "uom-name-hint"}
              aria-invalid={Boolean(nameError)}
              className={`mt-2 h-12 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3.5 text-sm text-ink-950 placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                nameError
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              disabled={isSubmitting}
              id="uom-name-input"
              maxLength={80}
              onChange={(event) => {
                setName(event.target.value);
                if (validationErrors.name) {
                  setValidationErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                }
              }}
              placeholder="Contoh: Pieces, Kilogram, Box"
              required
              type="text"
              value={name}
            />
            {nameError ? (
              <p
                className="mt-1.5 text-xs font-medium text-red-700"
                id="uom-name-error"
              >
                {nameError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-600" id="uom-name-hint">
                Nama lengkap satuan ukur terdiri dari 1 sampai 60 karakter.
              </p>
            )}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="uom-decimal-select"
            >
              Aturan kuantitas desimal
            </label>
            <select
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              disabled={isSubmitting}
              id="uom-decimal-select"
              onChange={(event) =>
                setAllowDecimal(event.target.value === "decimal")
              }
              value={allowDecimal ? "decimal" : "integer"}
            >
              <option value="integer">
                Bilangan bulat saja (Contoh: PCS, BOX, UNIT)
              </option>
              <option value="decimal">
                Izinkan pecahan desimal hingga 4 digit (Contoh: KG, LITER, METER)
              </option>
            </select>
            <p className="mt-1.5 text-xs text-slate-600">
              Menentukan apakah transaksi barang dengan satuan ini menerima angka pecahan.
            </p>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="uom-status-select"
            >
              Status satuan ukur
            </label>
            <select
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              disabled={isSubmitting}
              id="uom-status-select"
              onChange={(event) => setIsActive(event.target.value === "active")}
              value={isActive ? "active" : "inactive"}
            >
              <option value="active">Aktif (Dapat dipilih pada barang baru)</option>
              <option value="inactive">
                Nonaktif (Disembunyikan dari pilihan barang baru)
              </option>
            </select>
            {mode === "edit" && initialUom?.is_active && !isActive && (
              <p className="mt-1.5 text-xs text-amber-700">
                Perhatian: Satuan ukur yang masih digunakan oleh barang (SKU) aktif akan ditolak oleh server saat dinonaktifkan.
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
                  ? "Simpan satuan ukur"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

