import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { MasterFormErrorBanner } from "../../components/MasterFormErrorBanner";
import type { MasterFormSubmitError } from "../../errors";
import type { Supplier, SupplierFormPayload } from "../types";
import { supplierFormSchema, validateZodSchema } from "../../validation";

interface SupplierFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialSupplier: Supplier | null;
  onClose: () => void;
  onSubmit: (payload: SupplierFormPayload) => Promise<void> | void;
  existingSuppliers?: Supplier[];
  isSubmitting?: boolean;
  submitError?: MasterFormSubmitError | null;
}

export function SupplierFormDialog({
  isOpen,
  mode,
  initialSupplier,
  onClose,
  onSubmit,
  existingSuppliers = [],
  isSubmitting = false,
  submitError = null,
}: SupplierFormDialogProps) {
  const [code, setCode] = useState(() => initialSupplier?.code ?? "");
  const [name, setName] = useState(() => initialSupplier?.name ?? "");
  const [contactPerson, setContactPerson] = useState(
    () => initialSupplier?.contact_person ?? "",
  );
  const [phone, setPhone] = useState(() => initialSupplier?.phone ?? "");
  const [email, setEmail] = useState(() => initialSupplier?.email ?? "");
  const [address, setAddress] = useState(() => initialSupplier?.address ?? "");
  const [isActive, setIsActive] = useState(
    () => initialSupplier?.is_active ?? true,
  );
  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    email?: string;
    contactPerson?: string;
    phone?: string;
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

  const mergedErrors = {
    code: errors.code ?? submitError?.fieldErrors?.code,
    name: errors.name ?? submitError?.fieldErrors?.name,
    contactPerson:
      errors.contactPerson ?? submitError?.fieldErrors?.contact_person,
    phone: errors.phone ?? submitError?.fieldErrors?.phone,
    email: errors.email ?? submitError?.fieldErrors?.email,
    address: errors.address ?? submitError?.fieldErrors?.address,
  };

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateZodSchema(supplierFormSchema, {
      code,
      name,
      contact_person: contactPerson,
      phone,
      email,
      address,
      is_active: isActive,
    });
    const nextErrors: typeof errors = parsed.ok
      ? {}
      : {
          code: parsed.fieldErrors.code,
          name: parsed.fieldErrors.name,
          contactPerson: parsed.fieldErrors.contact_person,
          phone: parsed.fieldErrors.phone,
          email: parsed.fieldErrors.email,
          address: parsed.fieldErrors.address,
        };

    const trimmedCode = code.trim();
    if (
      !nextErrors.code &&
      existingSuppliers.some(
        (supplier) =>
          supplier.code.toLowerCase() === trimmedCode.toLowerCase() &&
          (mode === "create" || supplier.id !== initialSupplier?.id),
      )
    ) {
      nextErrors.code = "Kode pemasok sudah digunakan.";
    }

    if (!parsed.ok || nextErrors.code) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void onSubmit({
      code: parsed.data.code,
      name: parsed.data.name,
      contact_person: parsed.data.contact_person || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
      address: parsed.data.address || null,
      is_active: parsed.data.is_active,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        aria-labelledby="supplier-form-title"
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2
              className="text-lg font-bold text-ink-950"
              id="supplier-form-title"
            >
              {mode === "create"
                ? "Tambah pemasok (supplier)"
                : "Ubah pemasok (supplier)"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              Kelola informasi rekanan pemasok untuk penerbitan dokumen Purchase Order.
            </p>
          </div>
          <button
            aria-label="Tutup formulir pemasok"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950 disabled:opacity-50"
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
                htmlFor="supplier-code-input"
              >
                Kode pemasok <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.code)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-code-input"
                maxLength={50}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Contoh: SUP-ELK-01"
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
                htmlFor="supplier-name-input"
              >
                Nama pemasok <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-name-input"
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: PT Nusantara Elektronik"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-contact-input"
              >
                Nama narahubung
              </label>
              <input
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-contact-input"
                maxLength={120}
                onChange={(event) => setContactPerson(event.target.value)}
                placeholder="Contoh: Hendra Wijaya"
                type="text"
                value={contactPerson}
              />
              {mergedErrors.contactPerson && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.contactPerson}</p>}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-phone-input"
              >
                Nomor telepon
              </label>
              <input
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-phone-input"
                maxLength={30}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Contoh: 021-5551234"
                type="tel"
                value={phone}
              />
              {mergedErrors.phone && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.phone}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-email-input"
              >
                Alamat email
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.email)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-email-input"
                maxLength={255}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Contoh: sales@nusantara.co.id"
                type="email"
                value={email}
              />
              {mergedErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {mergedErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-status-select"
              >
                Status pemasok
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-status-select"
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

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="supplier-address-input"
            >
              Alamat lengkap
            </label>
            <textarea
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
              disabled={isSubmitting}
              id="supplier-address-input"
              maxLength={1000}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Contoh: Kawasan Industri Jababeka Blok C-12, Cikarang"
              rows={2}
              value={address}
            />
            {mergedErrors.address && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.address}</p>}
          </div>

          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:opacity-50 sm:w-auto"
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
              <Save aria-hidden="true" size={16} />
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan pemasok"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
