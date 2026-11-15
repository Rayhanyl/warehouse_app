import { useEffect } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Phone,
  PowerOff,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import type { Supplier } from "../types";

interface SupplierDetailDialogProps {
  supplier: Supplier | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
  onToggleStatus: (supplier: Supplier) => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SupplierDetailDialog({
  supplier,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: SupplierDetailDialogProps) {
  useEffect(() => {
    if (!supplier) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [supplier, onClose]);

  if (!supplier) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="supplier-detail-title"
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                ID #{supplier.id}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 tabular-nums">
                {supplier.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  supplier.is_active
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 aria-hidden="true" size={13} />
                {supplier.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <h2
              className="mt-2 text-lg font-bold text-ink-950"
              id="supplier-detail-title"
            >
              {supplier.name}
            </h2>
          </div>
          <button
            aria-label="Tutup detail pemasok"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <dl className="space-y-4 text-sm">
          <div className="grid gap-4 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <User
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Narahubung</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {supplier.contact_person || "Belum dicantumkan"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Telepon</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {supplier.phone || "Belum dicantumkan"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Mail
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-600">Email</dt>
                <dd className="mt-0.5 font-semibold break-all text-ink-950">
                  {supplier.email || "Belum dicantumkan"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Alamat</dt>
                <dd className="mt-0.5 leading-6 text-ink-950">
                  {supplier.address || "Belum ada alamat tercatat."}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Nomor fax</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {supplier.fax || "Belum dicantumkan"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">NPWP &amp; Termin</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {supplier.npwp || "-"}
                  {supplier.payment_terms ? ` · ${supplier.payment_terms}` : ""}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <CreditCard
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Rekening bank pemasok</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {supplier.bank_name || supplier.bank_account_number ? (
                    <>
                      {supplier.bank_name || "Bank"} ·{" "}
                      <span className="tabular-nums">{supplier.bank_account_number || "-"}</span>
                      {supplier.bank_account_holder
                        ? ` (a.n. ${supplier.bank_account_holder})`
                        : ""}
                    </>
                  ) : (
                    "Belum dicantumkan"
                  )}
                </dd>
              </div>
            </div>

            {supplier.notes && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Building2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-slate-600"
                  size={16}
                />
                <div>
                  <dt className="text-xs font-medium text-slate-600">Catatan pemasok</dt>
                  <dd className="mt-0.5 leading-6 text-ink-950">{supplier.notes}</dd>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar aria-hidden="true" size={14} />
              <span className="tabular-nums">
                Dibuat: {formatDateTime(supplier.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar aria-hidden="true" size={14} />
              <span className="tabular-nums">
                Diperbarui: {formatDateTime(supplier.updated_at)}
              </span>
            </div>
          </div>
        </dl>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6 sm:py-4">
          {canManage && (
            <>
              <button
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-semibold transition sm:w-auto ${
                  supplier.is_active
                    ? "border-red-600/40 bg-surface-0 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 bg-surface-0 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(supplier);
                }}
                type="button"
              >
                {supplier.is_active ? (
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
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 sm:w-auto"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
                type="button"
              >
                <Edit3 aria-hidden="true" size={16} />
                Ubah pemasok
              </button>
            </>
          )}
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 sm:w-auto"
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
