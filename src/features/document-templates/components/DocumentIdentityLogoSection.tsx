import type { ChangeEvent, RefObject } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type {
  DocumentTemplate,
  LogoPosition,
  LogoSize,
} from "../types";

interface DocumentIdentityLogoSectionProps {
  draft: DocumentTemplate;
  fieldErrors: Record<string, string>;
  logoInputRef: RefObject<HTMLInputElement | null>;
  logoPreviewUrl: string | null;
  uploadingLogo: boolean;
  onLogoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpdateField: <K extends keyof DocumentTemplate>(
    key: K,
    value: DocumentTemplate[K],
  ) => void;
}

/** Bagian 1 form template dokumen: kop surat, kontak perusahaan, dan logo. */
export function DocumentIdentityLogoSection({
  draft,
  fieldErrors,
  logoInputRef,
  logoPreviewUrl,
  uploadingLogo,
  onLogoUpload,
  onUpdateField,
}: DocumentIdentityLogoSectionProps) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        1. Identitas Kop Surat & Logo
      </h3>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-document-title"
        >
          Judul Dokumen Cetak *
        </label>
        <input
          className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-3 text-sm"
          id="tpl-document-title"
          onChange={(e) => onUpdateField("document_title", e.target.value)}
          type="text"
          value={draft.document_title}
        />
        {fieldErrors.document_title && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.document_title}</p>
        )}
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-company-name"
        >
          Nama Perusahaan / Gudang *
        </label>
        <input
          className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-3 text-sm"
          id="tpl-company-name"
          onChange={(e) => onUpdateField("company_name", e.target.value)}
          type="text"
          value={draft.company_name}
        />
        {fieldErrors.company_name && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.company_name}</p>
        )}
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-company-address"
        >
          Alamat Perusahaan
        </label>
        <input
          className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-3 text-sm"
          id="tpl-company-address"
          onChange={(e) => onUpdateField("company_address", e.target.value)}
          type="text"
          value={draft.company_address ?? ""}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-company-contact"
        >
          Kontak (Telepon / Email)
        </label>
        <input
          className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-3 text-sm"
          id="tpl-company-contact"
          onChange={(e) => onUpdateField("company_contact", e.target.value)}
          type="text"
          value={draft.company_contact ?? ""}
        />
      </div>

      <div className="space-y-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800">
            Logo Kop Surat (PNG / JPG / WEBP, maks 2 MB)
          </span>
          <div className="flex items-center gap-2">
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label="Unggah file logo perusahaan"
              className="hidden"
              onChange={onLogoUpload}
              ref={logoInputRef}
              type="file"
            />
            <button
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-50"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              type="button"
            >
              <ImagePlus size={14} />
              {uploadingLogo ? "Mengunggah..." : "Unggah Logo"}
            </button>
            {draft.logo_url && (
              <button
                className="inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                onClick={() => onUpdateField("logo_url", null)}
                type="button"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            )}
          </div>
        </div>

        {logoPreviewUrl && (
          <div className="flex items-center gap-3 rounded border border-line-200 bg-surface-0 p-2">
            <img
              alt="Preview logo perusahaan"
              className="h-10 max-w-[120px] object-contain"
              src={logoPreviewUrl}
            />
            <span className="truncate font-mono text-[11px] text-slate-500">
              {draft.logo_url}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-700"
              htmlFor="tpl-logo-position"
            >
              Posisi Logo
            </label>
            <select
              className="min-h-9 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
              id="tpl-logo-position"
              onChange={(e) =>
                onUpdateField("logo_position", e.target.value as LogoPosition)
              }
              value={draft.logo_position}
            >
              <option value="LEFT">Kiri</option>
              <option value="CENTER">Tengah</option>
              <option value="RIGHT">Kanan</option>
            </select>
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-700"
              htmlFor="tpl-logo-size"
            >
              Ukuran Logo
            </label>
            <select
              className="min-h-9 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
              id="tpl-logo-size"
              onChange={(e) =>
                onUpdateField("logo_size", e.target.value as LogoSize)
              }
              value={draft.logo_size}
            >
              <option value="SMALL">Kecil (Small)</option>
              <option value="MEDIUM">Sedang (Medium)</option>
              <option value="LARGE">Besar (Large)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
