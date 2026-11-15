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
  const [fax, setFax] = useState(() => initialSupplier?.fax ?? "");
  const [email, setEmail] = useState(() => initialSupplier?.email ?? "");
  const [address, setAddress] = useState(() => initialSupplier?.address ?? "");
  const [bankName, setBankName] = useState(
    () => initialSupplier?.bank_name ?? "",
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    () => initialSupplier?.bank_account_number ?? "",
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    () => initialSupplier?.bank_account_holder ?? "",
  );
  const [npwp, setNpwp] = useState(() => initialSupplier?.npwp ?? "");
  const [paymentTerms, setPaymentTerms] = useState(
    () => initialSupplier?.payment_terms ?? "",
  );
  const [notes, setNotes] = useState(() => initialSupplier?.notes ?? "");
  const [isActive, setIsActive] = useState(
    () => initialSupplier?.is_active ?? true,
  );
  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    email?: string;
    contactPerson?: string;
    phone?: string;
    fax?: string;
    address?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    npwp?: string;
    paymentTerms?: string;
    notes?: string;
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
    fax: errors.fax ?? submitError?.fieldErrors?.fax,
    email: errors.email ?? submitError?.fieldErrors?.email,
    address: errors.address ?? submitError?.fieldErrors?.address,
    bankName: errors.bankName ?? submitError?.fieldErrors?.bank_name,
    bankAccountNumber:
      errors.bankAccountNumber ?? submitError?.fieldErrors?.bank_account_number,
    bankAccountHolder:
      errors.bankAccountHolder ?? submitError?.fieldErrors?.bank_account_holder,
    npwp: errors.npwp ?? submitError?.fieldErrors?.npwp,
    paymentTerms: errors.paymentTerms ?? submitError?.fieldErrors?.payment_terms,
    notes: errors.notes ?? submitError?.fieldErrors?.notes,
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
      fax,
      email,
      address,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_account_holder: bankAccountHolder,
      npwp,
      payment_terms: paymentTerms,
      notes,
      is_active: isActive,
    });
    const nextErrors: typeof errors = parsed.ok
      ? {}
      : {
          code: parsed.fieldErrors.code,
          name: parsed.fieldErrors.name,
          contactPerson: parsed.fieldErrors.contact_person,
          phone: parsed.fieldErrors.phone,
          fax: parsed.fieldErrors.fax,
          email: parsed.fieldErrors.email,
          address: parsed.fieldErrors.address,
          bankName: parsed.fieldErrors.bank_name,
          bankAccountNumber: parsed.fieldErrors.bank_account_number,
          bankAccountHolder: parsed.fieldErrors.bank_account_holder,
          npwp: parsed.fieldErrors.npwp,
          paymentTerms: parsed.fieldErrors.payment_terms,
          notes: parsed.fieldErrors.notes,
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
      fax: parsed.data.fax || null,
      email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
      address: parsed.data.address || null,
      bank_name: parsed.data.bank_name || null,
      bank_account_number: parsed.data.bank_account_number || null,
      bank_account_holder: parsed.data.bank_account_holder || null,
      npwp: parsed.data.npwp || null,
      payment_terms: parsed.data.payment_terms || null,
      notes: parsed.data.notes || null,
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

          <div className="rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Informasi Pembayaran, Rekening &amp; Administrasi PO
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-fax-input"
                >
                  Nomor fax
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-fax-input"
                  maxLength={50}
                  onChange={(event) => setFax(event.target.value)}
                  placeholder="Contoh: 021-5551299"
                  type="text"
                  value={fax}
                />
                {mergedErrors.fax && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.fax}</p>}
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-npwp-input"
                >
                  NPWP
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-npwp-input"
                  maxLength={40}
                  onChange={(event) => setNpwp(event.target.value)}
                  placeholder="Contoh: 01.234.567.8-901.000"
                  type="text"
                  value={npwp}
                />
                {mergedErrors.npwp && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.npwp}</p>}
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-terms-input"
                >
                  Termin pembayaran
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-terms-input"
                  maxLength={120}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  placeholder="Contoh: NET 30 / COD"
                  type="text"
                  value={paymentTerms}
                />
                {mergedErrors.paymentTerms && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.paymentTerms}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-bank-name-input"
                >
                  Nama bank
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-bank-name-input"
                  maxLength={120}
                  onChange={(event) => setBankName(event.target.value)}
                  placeholder="Contoh: BCA / Mandiri"
                  type="text"
                  value={bankName}
                />
                {mergedErrors.bankName && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.bankName}</p>}
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-bank-acc-input"
                >
                  Nomor rekening
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-bank-acc-input"
                  maxLength={60}
                  onChange={(event) => setBankAccountNumber(event.target.value)}
                  placeholder="Contoh: 1234567890"
                  type="text"
                  value={bankAccountNumber}
                />
                {mergedErrors.bankAccountNumber && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.bankAccountNumber}</p>}
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor="supplier-bank-holder-input"
                >
                  Atas nama rekening
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                  disabled={isSubmitting}
                  id="supplier-bank-holder-input"
                  maxLength={150}
                  onChange={(event) => setBankAccountHolder(event.target.value)}
                  placeholder="Contoh: PT Nusantara Elektronik"
                  type="text"
                  value={bankAccountHolder}
                />
                {mergedErrors.bankAccountHolder && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.bankAccountHolder}</p>}
              </div>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="supplier-notes-input"
              >
                Catatan tambahan pemasok
              </label>
              <textarea
                className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="supplier-notes-input"
                maxLength={500}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Catatan jadwal penerimaan, kontak darurat, atau instruksi faktur..."
                rows={2}
                value={notes}
              />
              {mergedErrors.notes && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.notes}</p>}
            </div>
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
