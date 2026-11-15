import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { MasterFormErrorBanner } from "../../components/MasterFormErrorBanner";
import type { MasterFormSubmitError } from "../../errors";
import type { WarehouseFormPayload, WarehouseRecord } from "../types";
import { validateZodSchema, warehouseFormSchema } from "../../validation";

interface WarehouseFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialWarehouse: WarehouseRecord | null;
  isSubmitting?: boolean;
  submitError?: MasterFormSubmitError | null;
  onClose: () => void;
  onSubmit: (payload: WarehouseFormPayload) => void | Promise<void>;
  existingWarehouses?: WarehouseRecord[];
}

export function WarehouseFormDialog({
  isOpen,
  mode,
  initialWarehouse,
  isSubmitting = false,
  submitError = null,
  onClose,
  onSubmit,
  existingWarehouses = [],
}: WarehouseFormDialogProps) {
  const [code, setCode] = useState(() => initialWarehouse?.code ?? "");
  const [name, setName] = useState(() => initialWarehouse?.name ?? "");
  const [address, setAddress] = useState(
    () => initialWarehouse?.address ?? "",
  );
  const [allowNegativeStock, setAllowNegativeStock] = useState(
    () => initialWarehouse?.allow_negative_stock ?? false,
  );
  const [isActive, setIsActive] = useState(
    () => initialWarehouse?.is_active ?? true,
  );
  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    address?: string;
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

  const mergedErrors = {
    code: errors.code ?? submitError?.fieldErrors?.code,
    name: errors.name ?? submitError?.fieldErrors?.name,
    address: errors.address ?? submitError?.fieldErrors?.address,
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    const parsed = validateZodSchema(warehouseFormSchema, {
      code,
      name,
      address,
      allow_negative_stock: allowNegativeStock,
      is_active: isActive,
    });
    const nextErrors: { code?: string; name?: string; address?: string } = parsed.ok
      ? {}
      : {
          code: parsed.fieldErrors.code,
          name: parsed.fieldErrors.name,
          address: parsed.fieldErrors.address,
        };

    const trimmedCode = code.trim();
    if (
      !nextErrors.code &&
      existingWarehouses.some(
        (warehouse) =>
          warehouse.code.toLowerCase() === trimmedCode.toLowerCase() &&
          (mode === "create" || warehouse.id !== initialWarehouse?.id),
      )
    ) {
      nextErrors.code = "Kode gudang sudah digunakan.";
    }

    if (!parsed.ok || nextErrors.code) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void onSubmit({
      code: parsed.data.code,
      name: parsed.data.name,
      address: parsed.data.address || null,
      allow_negative_stock: parsed.data.allow_negative_stock,
      is_active: parsed.data.is_active,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="warehouse-form-title"
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2
              className="text-lg font-bold text-ink-950"
              id="warehouse-form-title"
            >
              {mode === "create" ? "Tambah gudang" : "Ubah gudang"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              Konfigurasikan kode fasilitas gudang beserta kebijakan saldo stok negatif.
            </p>
          </div>
          <button
            aria-label="Tutup formulir gudang"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" noValidate onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <MasterFormErrorBanner error={submitError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="warehouse-code-input"
              >
                Kode gudang <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.code)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50"
                disabled={isSubmitting}
                id="warehouse-code-input"
                maxLength={50}
                onChange={(event) => {
                  setCode(event.target.value);
                  setErrors((current) => ({ ...current, code: undefined }));
                }}
                placeholder="Contoh: WH-JKT-01"
                ref={codeInputRef}
                type="text"
                value={code}
              />
              {mergedErrors.code && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {mergedErrors.code}
                </p>
              )}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="warehouse-name-input"
              >
                Nama gudang <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50"
                disabled={isSubmitting}
                id="warehouse-name-input"
                maxLength={150}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="Contoh: Gudang Utama Jakarta"
                type="text"
                value={name}
              />
              {mergedErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {mergedErrors.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="warehouse-address-input"
            >
              Alamat fasilitas gudang
            </label>
            <textarea
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50"
              disabled={isSubmitting}
              id="warehouse-address-input"
              maxLength={1000}
              onChange={(event) => {
                setAddress(event.target.value);
                setErrors((current) => ({ ...current, address: undefined }));
              }}
              placeholder="Contoh: Jl. Raya Cakung Cilincing KM 4, Jakarta Timur"
              rows={2}
              value={address}
            />
            {mergedErrors.address && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.address}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="warehouse-neg-select"
              >
                Kebijakan stok negatif
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50"
                disabled={isSubmitting}
                id="warehouse-neg-select"
                onChange={(event) =>
                  setAllowNegativeStock(event.target.value === "allowed")
                }
                value={allowNegativeStock ? "allowed" : "strict"}
              >
                <option value="strict">Ditolak ketat (Bawaan)</option>
                <option value="allowed">Izinkan stok negatif</option>
              </select>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="warehouse-status-select"
              >
                Status gudang
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50"
                disabled={isSubmitting}
                id="warehouse-status-select"
                onChange={(event) =>
                  setIsActive(event.target.value === "active")
                }
                value={isActive ? "active" : "inactive"}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              ) : (
                <Save aria-hidden="true" size={16} />
              )}
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan gudang"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
