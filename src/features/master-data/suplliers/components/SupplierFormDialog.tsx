import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import type { Supplier, SupplierFormPayload } from "../types";

interface SupplierFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialSupplier: Supplier | null;
  onClose: () => void;
  onSubmit: (payload: SupplierFormPayload) => void;
}

export function SupplierFormDialog({
  isOpen,
  mode,
  initialSupplier,
  onClose,
  onSubmit,
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
    const trimmedEmail = email.trim();
    const nextErrors: { code?: string; name?: string; email?: string } = {};

    if (!trimmedCode) {
      nextErrors.code = "Kode pemasok wajib diisi (1 sampai 50 karakter).";
    }
    if (!trimmedName) {
      nextErrors.name = "Nama pemasok wajib diisi (1 sampai 150 karakter).";
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Format alamat email belum valid.";
    }

    if (nextErrors.code || nextErrors.name || nextErrors.email) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      code: trimmedCode,
      name: trimmedName,
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: trimmedEmail ? trimmedEmail.toLowerCase() : null,
      address: address.trim() || null,
      is_active: isActive,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="supplier-form-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
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
                htmlFor="supplier-code-input"
              >
                Kode pemasok <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(errors.code)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="supplier-code-input"
                maxLength={50}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Contoh: SUP-ELK-01"
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
                htmlFor="supplier-name-input"
              >
                Nama pemasok <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(errors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="supplier-name-input"
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: PT Nusantara Elektronik"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-contact-input"
              >
                Nama narahubung
              </label>
              <input
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="supplier-contact-input"
                maxLength={120}
                onChange={(event) => setContactPerson(event.target.value)}
                placeholder="Contoh: Hendra Wijaya"
                type="text"
                value={contactPerson}
              />
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-phone-input"
              >
                Nomor telepon
              </label>
              <input
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="supplier-phone-input"
                maxLength={30}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Contoh: 021-5551234"
                type="tel"
                value={phone}
              />
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
                aria-invalid={Boolean(errors.email)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="supplier-email-input"
                maxLength={255}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Contoh: sales@nusantara.co.id"
                type="email"
                value={email}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {errors.email}
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
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              id="supplier-address-input"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Contoh: Kawasan Industri Jababeka Blok C-12, Cikarang"
              rows={2}
              value={address}
            />
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
              {mode === "create" ? "Simpan pemasok" : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
