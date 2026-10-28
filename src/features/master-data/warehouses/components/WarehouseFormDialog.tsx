import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import type { WarehouseFormPayload, WarehouseRecord } from "../types";

interface WarehouseFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialWarehouse: WarehouseRecord | null;
  onClose: () => void;
  onSubmit: (payload: WarehouseFormPayload) => void;
}

export function WarehouseFormDialog({
  isOpen,
  mode,
  initialWarehouse,
  onClose,
  onSubmit,
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
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      codeInputRef.current?.focus();
    }, 20);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const nextErrors: { code?: string; name?: string } = {};

    if (!trimmedCode) {
      nextErrors.code = "Kode gudang wajib diisi (1 sampai 50 karakter).";
    }
    if (!trimmedName) {
      nextErrors.name = "Nama gudang wajib diisi (1 sampai 150 karakter).";
    }

    if (nextErrors.code || nextErrors.name) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      code: trimmedCode,
      name: trimmedName,
      address: address.trim() || null,
      allow_negative_stock: allowNegativeStock,
      is_active: isActive,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="warehouse-form-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
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
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="warehouse-code-input"
              >
                Kode gudang <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(errors.code)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="warehouse-code-input"
                maxLength={50}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Contoh: WH-JKT-01"
                ref={codeInputRef}
                type="text"
                value={code}
              />
              {errors.code && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {errors.code}
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
                aria-invalid={Boolean(errors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="warehouse-name-input"
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Gudang Utama Jakarta"
                type="text"
                value={name}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {errors.name}
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
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              id="warehouse-address-input"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Contoh: Jl. Raya Cakung Cilincing KM 4, Jakarta Timur"
              rows={2}
              value={address}
            />
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
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              type="submit"
            >
              <Save aria-hidden="true" size={16} />
              {mode === "create" ? "Simpan gudang" : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
