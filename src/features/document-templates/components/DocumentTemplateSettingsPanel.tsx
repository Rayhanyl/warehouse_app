import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ModularDocumentPrintSheet,
  type ModularPrintMetadataItem,
  type ModularPrintRow,
} from "@/components/print/ModularDocumentPrintSheet";
import { mapApiFormError } from "@/lib/errors";
import { validateZodSchema } from "@/lib/validation";
import {
  resolveLogoAssetUrl,
  useDocumentTemplates,
  useUpdateDocumentTemplate,
  useUploadDocumentLogo,
} from "../api";
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  DOCUMENT_TYPE_LABELS,
  SECTION_LABELS,
  type DocumentTemplate,
  type DocumentTemplateUpdatePayload,
  type DocumentType,
  type LogoPosition,
  type LogoSize,
  type PaperOrientation,
  type PaperSize,
  type SignatureBlockConfig,
} from "../types";

const DOCUMENT_TYPES: DocumentType[] = [
  "GOODS_RECEIPT",
  "STOCK_TRANSFER",
  "PURCHASE_ORDER",
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const templateSchema = z.object({
  document_title: z
    .string()
    .trim()
    .min(1, "Judul dokumen wajib diisi (1 sampai 200 karakter).")
    .max(200, "Judul dokumen maksimal 200 karakter."),
  company_name: z
    .string()
    .trim()
    .min(1, "Nama perusahaan / instansi wajib diisi.")
    .max(200, "Nama perusahaan maksimal 200 karakter."),
  company_address: z.string().max(400, "Alamat perusahaan maksimal 400 karakter."),
  company_contact: z.string().max(300, "Kontak perusahaan maksimal 300 karakter."),
  header_notes: z.string().max(500, "Catatan header maksimal 500 karakter."),
  footer_notes: z.string().max(500, "Catatan footer maksimal 500 karakter."),
  margin_mm: z
    .number()
    .int("Margin halaman harus bilangan bulat.")
    .min(4, "Margin minimal 4 mm.")
    .max(40, "Margin maksimal 40 mm."),
});

const SIGNATURE_PRESETS: Record<"TWO" | "THREE", SignatureBlockConfig[]> = {
  TWO: [
    {
      title: "Disiapkan Oleh",
      subtitle: "Petugas Operasional Gudang",
      placeholder: "( Nama Terang & Tanda Tangan )",
    },
    {
      title: "Disetujui Oleh",
      subtitle: "Kepala Gudang / Supervisor",
      placeholder: "( Nama Terang & Stempel )",
    },
  ],
  THREE: [
    {
      title: "Dibuat / Diserahkan Oleh",
      subtitle: "Staf Pengirim / Admin",
      placeholder: "( Nama Terang & Tanda Tangan )",
    },
    {
      title: "Diperiksa Oleh",
      subtitle: "Kurir / Tim QC",
      placeholder: "( Nama Terang & Tanda Tangan )",
    },
    {
      title: "Diterima / Disetujui Oleh",
      subtitle: "Kepala Gudang / Penerima",
      placeholder: "( Nama Terang & Stempel )",
    },
  ],
};

function moveArrayItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function buildSamplePreviewData(documentType: DocumentType): {
  documentNumberLabel: string;
  documentBarcodeValue: string;
  statusLabel: string;
  metadata: ModularPrintMetadataItem[];
  rows: ModularPrintRow[];
  tableSummary: string;
  documentNotes: string;
} {
  if (documentType === "STOCK_TRANSFER") {
    return {
      documentNumberLabel: "Nomor Transfer: TRF-2026-0042",
      documentBarcodeValue: "TRF-2026-0042",
      statusLabel: "Status: IN_TRANSIT",
      metadata: [
        { label: "Gudang Asal", value: "WH-JKT-01 (Gudang Utama)" },
        { label: "Gudang Tujuan", value: "WH-BDG-02 (Cabang Bandung)" },
        { label: "Tanggal Dibuat", value: "14 Nov 2026, 09:30" },
        { label: "Tanggal Dikirim", value: "14 Nov 2026, 11:00" },
      ],
      rows: [
        {
          id: 1,
          cells: {
            no: 1,
            sku_barcode: "SKU-BLT-001",
            item_name: "Baut Baja M10",
            uom: "PCS",
            qty_shipped: "250",
            qty_received: "250",
            variance: "Lengkap / Segel Utuh",
          },
        },
        {
          id: 2,
          cells: {
            no: 2,
            sku_barcode: "SKU-KBL-014",
            item_name: "Kabel NYM 2x1.5mm",
            uom: "ROLL",
            qty_shipped: "15",
            qty_received: "-",
            variance: "Menunggu konfirmasi tiba",
          },
        },
      ],
      tableSummary: "Total baris: 2 | Total Qty Kirim: 265 | Total Qty Diterima: 250",
      documentNotes: "Pengiriman armada box B-9012-WHS, harap cek segel pintu.",
    };
  }

  if (documentType === "PURCHASE_ORDER") {
    return {
      documentNumberLabel: "Nomor PO: PO-2026-0118",
      documentBarcodeValue: "PO-2026-0118",
      statusLabel: "Status: SENT",
      metadata: [
        { label: "Pemasok (Supplier)", value: "PT Nusantara Industri Sejahtera" },
        { label: "Gudang Tujuan", value: "WH-JKT-01 (Gudang Utama)" },
        { label: "Tanggal Order", value: "14 Nov 2026" },
        { label: "Target Tiba (ETA)", value: "18 Nov 2026" },
      ],
      rows: [
        {
          id: 1,
          cells: {
            no: 1,
            sku_barcode: "SKU-PLT-009",
            item_name: "Pallet Plastik Heavy Duty",
            uom: "UNIT",
            qty_ordered: "40",
            qty_received: "0",
            notes: "Warna biru standar gudang",
          },
        },
        {
          id: 2,
          cells: {
            no: 2,
            sku_barcode: "SKU-WRP-003",
            item_name: "Stretch Film 50cm",
            uom: "ROLL",
            qty_ordered: "120",
            qty_received: "0",
            notes: "Ketebalan 17 micron",
          },
        },
      ],
      tableSummary: "Total baris: 2 | Total Qty Pesanan: 160 | Total Diterima: 0",
      documentNotes: "Kirim bertahap hanya jika disertai konfirmasi tertulis.",
    };
  }

  return {
    documentNumberLabel: "Nomor GRN: GRN-2026-0089",
    documentBarcodeValue: "GRN-2026-0089",
    statusLabel: "Status: POSTED",
    metadata: [
      { label: "Referensi PO", value: "PO-2026-0102" },
      { label: "Gudang Tujuan", value: "WH-JKT-01 (Gudang Utama)" },
      { label: "Pemasok / Vendor", value: "CV Mitra Logistik Prima" },
      { label: "Diterima Oleh", value: "Andi Pratama (Staf Receiving)" },
    ],
    rows: [
      {
        id: 1,
        cells: {
          no: 1,
          sku_barcode: "SKU-HLM-004",
          item_name: "Helm Proyek Safety Kuning",
          location: "RACK-A1-02",
          qty_received: "60",
          uom: "PCS",
          notes: "Kemasan dus utuh",
        },
      },
      {
        id: 2,
        cells: {
          no: 2,
          sku_barcode: "SKU-SRP-008",
          item_name: "Sarung Tangan Kerja Katun",
          location: "BIN-B2-05",
          qty_received: "150",
          uom: "PASANG",
          notes: "Batch November 2026",
        },
      },
    ],
    tableSummary: "Total baris: 2 | Total Qty Diterima: 210",
    documentNotes: "Pemeriksaan fisik dan label barcode selesai tanpa selisih.",
  };
}

/** Panel administrasi untuk menyusun template dokumen cetak modular per jenis dokumen. */
export function DocumentTemplateSettingsPanel() {
  const [activeType, setActiveType] = useState<DocumentType>("GOODS_RECEIPT");
  const templatesQuery = useDocumentTemplates(true);

  const serverTemplate = useMemo(() => {
    const found = templatesQuery.data?.find(
      (item) => item.document_type === activeType,
    );
    return found ?? DEFAULT_DOCUMENT_TEMPLATES[activeType];
  }, [activeType, templatesQuery.data]);

  const editorKey = `${activeType}-${serverTemplate.updated_at ?? "default"}`;

  return (
    <section className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Pilih jenis dokumen cetak
            </h2>
            <p className="text-xs text-slate-500">
              Setiap jenis dokumen memiliki kop surat, kolom tabel, ukuran kertas, dan blok tanda tangan tersendiri.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jenis dokumen cetak">
            {DOCUMENT_TYPES.map((docType) => {
              const selected = activeType === docType;
              return (
                <button
                  aria-selected={selected}
                  className={`min-h-10 rounded-[var(--radius-md)] border px-3.5 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
                  }`}
                  key={docType}
                  onClick={() => setActiveType(docType)}
                  role="tab"
                  type="button"
                >
                  {DOCUMENT_TYPE_LABELS[docType]}
                </button>
              );
            })}
          </div>
        </div>
        {templatesQuery.isError && (
          <p className="mt-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Menampilkan konfigurasi bawaan sementara karena daftar template server gagal dimuat.
          </p>
        )}
      </div>

      <DocumentTemplateEditorForm
        initialTemplate={serverTemplate}
        key={editorKey}
      />
    </section>
  );
}

function DocumentTemplateEditorForm({
  initialTemplate,
}: {
  initialTemplate: DocumentTemplate;
}) {
  const updateTemplate = useUpdateDocumentTemplate();
  const uploadLogo = useUploadDocumentLogo();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<DocumentTemplate>(() => ({
    ...initialTemplate,
    section_order: [...initialTemplate.section_order],
    table_columns: initialTemplate.table_columns.map((col) => ({ ...col })),
    signature_layout: initialTemplate.signature_layout.map((sig) => ({ ...sig })),
  }));
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const samplePreview = useMemo(
    () => buildSamplePreviewData(draft.document_type),
    [draft.document_type],
  );
  const logoPreviewUrl = resolveLogoAssetUrl(draft.logo_url);

  const updateField = <K extends keyof DocumentTemplate>(
    key: K,
    value: DocumentTemplate[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!ALLOWED_LOGO_TYPES.has(file.type.toLowerCase())) {
      setFormError("Format logo harus PNG, JPG, atau WEBP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setFormError("Ukuran file logo maksimal 2 MB.");
      return;
    }
    setFormError(null);
    try {
      const uploaded = await uploadLogo.mutateAsync(file);
      updateField("logo_url", uploaded.logo_url);
      toast.success("Logo berhasil diunggah. Klik Simpan template untuk menerapkan.");
    } catch (err) {
      const mapped = mapApiFormError(err, "Gagal mengunggah logo perusahaan.");
      setFormError(mapped.formMessage);
    }
  };

  const handleResetDefault = () => {
    const base = DEFAULT_DOCUMENT_TEMPLATES[draft.document_type];
    setDraft({
      ...base,
      section_order: [...base.section_order],
      table_columns: base.table_columns.map((col) => ({ ...col })),
      signature_layout: base.signature_layout.map((sig) => ({ ...sig })),
    });
    setFieldErrors({});
    setFormError(null);
    toast.info("Pengaturan form dikembalikan ke standar bawaan. Klik Simpan untuk menyimpan ke database.");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = validateZodSchema(templateSchema, {
      document_title: draft.document_title,
      company_name: draft.company_name,
      company_address: draft.company_address ?? "",
      company_contact: draft.company_contact ?? "",
      header_notes: draft.header_notes ?? "",
      footer_notes: draft.footer_notes ?? "",
      margin_mm: Number(draft.margin_mm),
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.firstError);
      return;
    }

    const visibleColumns = draft.table_columns.filter((col) => col.visible);
    if (visibleColumns.length === 0) {
      setFormError("Minimal 1 kolom tabel harus ditampilkan pada dokumen cetak.");
      return;
    }
    if (draft.table_columns.some((col) => !col.label.trim())) {
      setFormError("Semua label kolom tabel wajib diisi dan tidak boleh kosong.");
      return;
    }
    if (
      draft.signature_layout.some(
        (sig) => !sig.title.trim() || !sig.placeholder.trim(),
      )
    ) {
      setFormError("Setiap blok tanda tangan wajib memiliki judul peran dan placeholder.");
      return;
    }

    const payload: DocumentTemplateUpdatePayload = {
      document_title: parsed.data.document_title,
      company_name: parsed.data.company_name,
      company_address: parsed.data.company_address.trim() || null,
      company_contact: parsed.data.company_contact.trim() || null,
      logo_url: draft.logo_url?.trim() || null,
      logo_position: draft.logo_position,
      logo_size: draft.logo_size,
      header_notes: parsed.data.header_notes.trim() || null,
      footer_notes: parsed.data.footer_notes.trim() || null,
      paper_size: draft.paper_size,
      orientation: draft.orientation,
      margin_mm: parsed.data.margin_mm,
      show_barcode: draft.show_barcode,
      show_line_notes: draft.show_line_notes,
      show_company_contact: draft.show_company_contact,
      section_order: draft.section_order,
      table_columns: draft.table_columns.map((col) => ({
        ...col,
        label: col.label.trim(),
      })),
      signature_layout: draft.signature_layout.map((sig) => ({
        title: sig.title.trim(),
        subtitle: sig.subtitle?.trim() || null,
        placeholder: sig.placeholder.trim(),
      })),
    };

    try {
      const saved = await updateTemplate.mutateAsync({
        documentType: draft.document_type,
        payload,
      });
      setDraft(saved);
      toast.success(
        `Template ${DOCUMENT_TYPE_LABELS[draft.document_type]} berhasil disimpan.`,
      );
    } catch (err) {
      const mapped = mapApiFormError(
        err,
        "Gagal menyimpan pengaturan template dokumen.",
      );
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formMessage);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <form
        className="space-y-5 xl:col-span-5"
        noValidate
        onSubmit={handleSubmit}
      >
        {formError && (
          <div
            className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            role="alert"
          >
            {formError}
          </div>
        )}

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
              onChange={(e) => updateField("document_title", e.target.value)}
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
              onChange={(e) => updateField("company_name", e.target.value)}
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
              onChange={(e) => updateField("company_address", e.target.value)}
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
              onChange={(e) => updateField("company_contact", e.target.value)}
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
                  onChange={handleLogoUpload}
                  ref={logoInputRef}
                  type="file"
                />
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-50"
                  disabled={uploadLogo.isPending}
                  onClick={() => logoInputRef.current?.click()}
                  type="button"
                >
                  <ImagePlus size={14} />
                  {uploadLogo.isPending ? "Mengunggah..." : "Unggah Logo"}
                </button>
                {draft.logo_url && (
                  <button
                    className="inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    onClick={() => updateField("logo_url", null)}
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
                    updateField("logo_position", e.target.value as LogoPosition)
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
                    updateField("logo_size", e.target.value as LogoSize)
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

        <div className="space-y-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            2. Ukuran Kertas, Margin & Visibilitas
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-700"
                htmlFor="tpl-paper-size"
              >
                Kertas
              </label>
              <select
                className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
                id="tpl-paper-size"
                onChange={(e) =>
                  updateField("paper_size", e.target.value as PaperSize)
                }
                value={draft.paper_size}
              >
                <option value="A4">A4</option>
                <option value="LETTER">Letter</option>
                <option value="F4">F4 (Folio)</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-700"
                htmlFor="tpl-orientation"
              >
                Orientasi
              </label>
              <select
                className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
                id="tpl-orientation"
                onChange={(e) =>
                  updateField("orientation", e.target.value as PaperOrientation)
                }
                value={draft.orientation}
              >
                <option value="PORTRAIT">Portrait</option>
                <option value="LANDSCAPE">Landscape</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-700"
                htmlFor="tpl-margin-mm"
              >
                Margin (mm)
              </label>
              <input
                className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-2.5 text-xs tabular-nums"
                id="tpl-margin-mm"
                max={40}
                min={4}
                onChange={(e) =>
                  updateField("margin_mm", Number(e.target.value) || 0)
                }
                type="number"
                value={draft.margin_mm}
              />
            </div>
          </div>
          {fieldErrors.margin_mm && (
            <p className="text-xs text-red-600">{fieldErrors.margin_mm}</p>
          )}

          <div className="space-y-2 pt-1 text-xs text-slate-700">
            <label className="flex items-center gap-2">
              <input
                checked={draft.show_barcode}
                onChange={(e) => updateField("show_barcode", e.target.checked)}
                type="checkbox"
              />
              <span>Tampilkan barcode nomor dokumen di kop surat</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={draft.show_line_notes}
                onChange={(e) => updateField("show_line_notes", e.target.checked)}
                type="checkbox"
              />
              <span>Tampilkan kolom catatan per baris (line notes)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={draft.show_company_contact}
                onChange={(e) =>
                  updateField("show_company_contact", e.target.checked)
                }
                type="checkbox"
              />
              <span>Tampilkan informasi kontak perusahaan di header</span>
            </label>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-700"
              htmlFor="tpl-header-notes"
            >
              Catatan Header (Opsional)
            </label>
            <textarea
              className="w-full rounded-[var(--radius-md)] border border-line-200 p-2.5 text-xs"
              id="tpl-header-notes"
              onChange={(e) => updateField("header_notes", e.target.value)}
              rows={2}
              value={draft.header_notes ?? ""}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-700"
              htmlFor="tpl-footer-notes"
            >
              Catatan Footer / Legal (Opsional)
            </label>
            <textarea
              className="w-full rounded-[var(--radius-md)] border border-line-200 p-2.5 text-xs"
              id="tpl-footer-notes"
              onChange={(e) => updateField("footer_notes", e.target.value)}
              rows={2}
              value={draft.footer_notes ?? ""}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            3. Urutan Bagian Dokumen
          </h3>
          <ul className="space-y-2">
            {draft.section_order.map((sectionKey, index) => (
              <li
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 px-3 py-2 text-xs"
                key={sectionKey}
              >
                <span className="font-medium text-slate-800">
                  {index + 1}. {SECTION_LABELS[sectionKey]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Naikkan bagian ${sectionKey}`}
                    className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() =>
                      updateField(
                        "section_order",
                        moveArrayItem(draft.section_order, index, -1),
                      )
                    }
                    type="button"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    aria-label={`Turunkan bagian ${sectionKey}`}
                    className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                    disabled={index === draft.section_order.length - 1}
                    onClick={() =>
                      updateField(
                        "section_order",
                        moveArrayItem(draft.section_order, index, 1),
                      )
                    }
                    type="button"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            4. Kolom Tabel Rincian
          </h3>
          <ul className="space-y-2">
            {draft.table_columns.map((column, index) => (
              <li
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-2"
                key={column.key}
              >
                <input
                  aria-label={`Tampilkan kolom ${column.key}`}
                  checked={column.visible}
                  onChange={(e) => {
                    const next = draft.table_columns.map((item, idx) =>
                      idx === index
                        ? { ...item, visible: e.target.checked }
                        : item,
                    );
                    updateField("table_columns", next);
                  }}
                  type="checkbox"
                />
                <input
                  aria-label={`Label kolom ${column.key}`}
                  className="min-h-8 flex-1 rounded border border-line-200 bg-surface-0 px-2 text-xs"
                  onChange={(e) => {
                    const next = draft.table_columns.map((item, idx) =>
                      idx === index ? { ...item, label: e.target.value } : item,
                    );
                    updateField("table_columns", next);
                  }}
                  type="text"
                  value={column.label}
                />
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Naikkan kolom ${column.key}`}
                    className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() =>
                      updateField(
                        "table_columns",
                        moveArrayItem(draft.table_columns, index, -1),
                      )
                    }
                    type="button"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    aria-label={`Turunkan kolom ${column.key}`}
                    className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                    disabled={index === draft.table_columns.length - 1}
                    onClick={() =>
                      updateField(
                        "table_columns",
                        moveArrayItem(draft.table_columns, index, 1),
                      )
                    }
                    type="button"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              5. Blok Tanda Tangan ({draft.signature_layout.length}/4)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                className="rounded border border-line-200 bg-surface-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-surface-100"
                onClick={() =>
                  updateField(
                    "signature_layout",
                    SIGNATURE_PRESETS.TWO.map((item) => ({ ...item })),
                  )
                }
                type="button"
              >
                Preset 2 Kolom
              </button>
              <button
                className="rounded border border-line-200 bg-surface-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-surface-100"
                onClick={() =>
                  updateField(
                    "signature_layout",
                    SIGNATURE_PRESETS.THREE.map((item) => ({ ...item })),
                  )
                }
                type="button"
              >
                Preset 3 Kolom
              </button>
              <button
                className="inline-flex items-center gap-1 rounded border border-teal-600 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-40"
                disabled={draft.signature_layout.length >= 4}
                onClick={() =>
                  updateField("signature_layout", [
                    ...draft.signature_layout,
                    {
                      title: `Pejabat ${draft.signature_layout.length + 1}`,
                      subtitle: "Keterangan Jabatan",
                      placeholder: "( Nama Terang & Tanda Tangan )",
                    },
                  ])
                }
                type="button"
              >
                <Plus size={12} />
                Tambah Blok
              </button>
            </div>
          </div>

          {draft.signature_layout.length === 0 ? (
            <p className="rounded border border-dashed border-line-200 p-3 text-center text-xs text-slate-500">
              Tidak ada blok tanda tangan aktif. Klik Tambah Blok atau pilih preset di atas jika diperlukan.
            </p>
          ) : (
            <div className="space-y-2.5">
              {draft.signature_layout.map((sig, index) => (
                <div
                  className="space-y-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-3"
                  key={`sig-${index}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Blok Tanda Tangan #{index + 1}
                    </span>
                    <button
                      aria-label={`Hapus blok tanda tangan ${index + 1}`}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                      onClick={() =>
                        updateField(
                          "signature_layout",
                          draft.signature_layout.filter((_, idx) => idx !== index),
                        )
                      }
                      type="button"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      aria-label={`Judul blok tanda tangan ${index + 1}`}
                      className="min-h-8 rounded border border-line-200 bg-surface-0 px-2 text-xs"
                      onChange={(e) => {
                        const next = draft.signature_layout.map((item, idx) =>
                          idx === index ? { ...item, title: e.target.value } : item,
                        );
                        updateField("signature_layout", next);
                      }}
                      placeholder="Judul (mis. Dibuat Oleh)"
                      type="text"
                      value={sig.title}
                    />
                    <input
                      aria-label={`Subjudul blok tanda tangan ${index + 1}`}
                      className="min-h-8 rounded border border-line-200 bg-surface-0 px-2 text-xs"
                      onChange={(e) => {
                        const next = draft.signature_layout.map((item, idx) =>
                          idx === index
                            ? { ...item, subtitle: e.target.value }
                            : item,
                        );
                        updateField("signature_layout", next);
                      }}
                      placeholder="Subjudul peran"
                      type="text"
                      value={sig.subtitle ?? ""}
                    />
                  </div>
                  <input
                    aria-label={`Placeholder blok tanda tangan ${index + 1}`}
                    className="min-h-8 w-full rounded border border-line-200 bg-surface-0 px-2 text-xs"
                    onChange={(e) => {
                      const next = draft.signature_layout.map((item, idx) =>
                        idx === index
                          ? { ...item, placeholder: e.target.value }
                          : item,
                      );
                      updateField("signature_layout", next);
                    }}
                    placeholder="Teks garis tanda tangan"
                    type="text"
                    value={sig.placeholder}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50"
            onClick={handleResetDefault}
            type="button"
          >
            <RotateCcw size={14} />
            Reset Bawaan
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-4 text-xs font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
            disabled={updateTemplate.isPending}
            type="submit"
          >
            <Save size={14} />
            {updateTemplate.isPending ? "Menyimpan..." : "Simpan Template"}
          </button>
        </div>
      </form>

      <div className="space-y-3 xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Pratinjau Langsung Dokumen
            </h3>
            <p className="text-xs text-slate-500">
              Kertas {draft.paper_size} | {draft.orientation} | Margin {draft.margin_mm} mm
            </p>
          </div>
          <span className="rounded bg-surface-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Data contoh simulasi
          </span>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line-200 bg-slate-100 p-4">
          <ModularDocumentPrintSheet
            ariaLabel={`Pratinjau template ${DOCUMENT_TYPE_LABELS[draft.document_type]}`}
            documentBarcodeValue={samplePreview.documentBarcodeValue}
            documentNotes={samplePreview.documentNotes}
            documentNumberLabel={samplePreview.documentNumberLabel}
            metadata={samplePreview.metadata}
            rows={samplePreview.rows}
            statusLabel={samplePreview.statusLabel}
            tableSummary={samplePreview.tableSummary}
            template={draft}
            visibleOnScreen={true}
          />
        </div>
      </div>
    </div>
  );
}
