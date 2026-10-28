import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  StorageLocationFormPayload,
  StorageLocationRecord,
  StorageLocationWarehouseOption,
} from "../types";

interface StorageLocationFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialData: StorageLocationRecord | null;
  warehouseOptions: StorageLocationWarehouseOption[];
  existingLocations: StorageLocationRecord[];
  onClose: () => void;
  onSubmit: (payload: StorageLocationFormPayload) => void;
}

interface FieldErrors {
  warehouse_id?: string;
  code?: string;
  name?: string;
}

function StorageLocationFormInner({
  mode,
  initialData,
  warehouseOptions,
  existingLocations,
  onClose,
  onSubmit,
}: Omit<StorageLocationFormDialogProps, "open">) {
  const [warehouseId, setWarehouseId] = useState(
    () => initialData?.warehouse_id ?? warehouseOptions[0]?.id ?? "",
  );
  const [code, setCode] = useState(() => initialData?.code ?? "");
  const [name, setName] = useState(() => initialData?.name ?? "");
  const [isActive, setIsActive] = useState(() => initialData?.is_active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!warehouseId) {
      nextErrors.warehouse_id = "Pilih gudang induk terlebih dahulu.";
    }

    if (!trimmedCode) {
      nextErrors.code = "Kode lokasi wajib diisi.";
    } else if (trimmedCode.length > 50) {
      nextErrors.code = "Kode lokasi maksimal 50 karakter.";
    } else {
      const duplicate = existingLocations.some(
        (item) =>
          item.warehouse_id === warehouseId &&
          item.code.toUpperCase() === trimmedCode &&
          (mode === "create" || item.id !== initialData?.id),
      );
      if (duplicate) {
        nextErrors.code = "Kode lokasi sudah terdaftar pada gudang ini.";
      }
    }

    if (!trimmedName) {
      nextErrors.name = "Nama lokasi wajib diisi.";
    } else if (trimmedName.length > 120) {
      nextErrors.name = "Nama lokasi maksimal 120 karakter.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    onSubmit({
      warehouse_id: warehouseId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        <div>
          <label
            htmlFor="storage-location-warehouse-select"
            className="block text-sm font-semibold text-slate-900"
          >
            Gudang induk <span className="text-red-700">*</span>
          </label>
          <select
            id="storage-location-warehouse-select"
            value={warehouseId}
            onChange={(event) => {
              setWarehouseId(event.target.value);
              if (fieldErrors.warehouse_id) {
                setFieldErrors((prev) => ({ ...prev, warehouse_id: undefined }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.warehouse_id)}
            className={`mt-1.5 h-12 w-full rounded-md border bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
              fieldErrors.warehouse_id
                ? "border-red-600 focus:ring-red-600"
                : "border-slate-300 focus:border-emerald-700 focus:ring-emerald-700"
            }`}
          >
            {warehouseOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} ({item.name})
              </option>
            ))}
          </select>
          {fieldErrors.warehouse_id ? (
            <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
              {fieldErrors.warehouse_id}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="storage-location-code-input"
            className="block text-sm font-semibold text-slate-900"
          >
            Kode lokasi <span className="text-red-700">*</span>
          </label>
          <p className="mt-0.5 text-xs text-slate-600">
            Maksimal 50 karakter dan unik di dalam gudang yang sama (contoh: RACK-A01-01).
          </p>
          <input
            id="storage-location-code-input"
            type="text"
            maxLength={50}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (fieldErrors.code) {
                setFieldErrors((prev) => ({ ...prev, code: undefined }));
              }
            }}
            placeholder="Contoh: RACK-A01-01"
            aria-invalid={Boolean(fieldErrors.code)}
            className={`mt-1.5 h-12 w-full rounded-md border bg-white px-3.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.code
                ? "border-red-600 focus:ring-red-600"
                : "border-slate-300 focus:border-emerald-700 focus:ring-emerald-700"
            }`}
          />
          {fieldErrors.code ? (
            <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
              {fieldErrors.code}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="storage-location-name-input"
            className="block text-sm font-semibold text-slate-900"
          >
            Nama lokasi <span className="text-red-700">*</span>
          </label>
          <input
            id="storage-location-name-input"
            type="text"
            maxLength={120}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="Contoh: Rak A Lorong 1 Tingkat 1"
            aria-invalid={Boolean(fieldErrors.name)}
            className={`mt-1.5 h-12 w-full rounded-md border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.name
                ? "border-red-600 focus:ring-red-600"
                : "border-slate-300 focus:border-emerald-700 focus:ring-emerald-700"
            }`}
          />
          {fieldErrors.name ? (
            <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        {mode === "edit" ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <div>
                <span className="block text-sm font-semibold text-slate-900">
                  Status lokasi aktif
                </span>
                <span className="block text-xs text-slate-600">
                  Nonaktifkan jika rak atau zona tidak lagi menerima mutasi stok baru.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          Batal
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          {mode === "create" ? "Simpan lokasi" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}

export function StorageLocationFormDialog({
  open,
  mode,
  initialData,
  warehouseOptions,
  existingLocations,
  onClose,
  onSubmit,
}: StorageLocationFormDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-location-form-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {mode === "create" ? "Tambah data contoh" : "Perbarui data contoh"}
            </p>
            <h2
              id="storage-location-form-title"
              className="mt-0.5 text-lg font-bold text-slate-900"
            >
              {mode === "create" ? "Tambah lokasi penyimpanan" : "Edit lokasi penyimpanan"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog form lokasi penyimpanan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <StorageLocationFormInner
          key={`${mode}-${initialData?.id ?? "new"}`}
          mode={mode}
          initialData={initialData}
          warehouseOptions={warehouseOptions}
          existingLocations={existingLocations}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
