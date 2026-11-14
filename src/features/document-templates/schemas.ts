import { z } from "zod";
import { validateZodSchema } from "@/lib/validation";
import type {
  DocumentTemplate,
  DocumentTemplateUpdatePayload,
  DocumentType,
  SignatureBlockConfig,
} from "./types";

export const DOCUMENT_TYPES: DocumentType[] = [
  "GOODS_RECEIPT",
  "STOCK_TRANSFER",
  "PURCHASE_ORDER",
];

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const templateSchema = z.object({
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

export const SIGNATURE_PRESETS: Record<"TWO" | "THREE", SignatureBlockConfig[]> = {
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

/** Geser elemen array ke atas atau ke bawah sesuai arah (-1 / +1). */
export function moveArrayItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

/** Salin objek template agar array bagian, kolom, dan tanda tangan terisolasi untuk editing. */
export function cloneDocumentTemplate(source: DocumentTemplate): DocumentTemplate {
  return {
    ...source,
    section_order: [...source.section_order],
    table_columns: source.table_columns.map((col) => ({ ...col })),
    signature_layout: source.signature_layout.map((sig) => ({ ...sig })),
  };
}

/** Validasi tipe MIME dan ukuran maksimum berkas logo perusahaan. */
export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.has(file.type.toLowerCase())) {
    return "Format logo harus PNG, JPG, atau WEBP.";
  }
  if (file.size > MAX_LOGO_BYTES) {
    return "Ukuran file logo maksimal 2 MB.";
  }
  return null;
}

/** Validasi seluruh draft pengaturan template dan bangun payload API terstruktur. */
export function validateAndBuildTemplatePayload(draft: DocumentTemplate):
  | { ok: true; payload: DocumentTemplateUpdatePayload }
  | { ok: false; formError: string; fieldErrors: Record<string, string> } {
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
    return {
      ok: false,
      fieldErrors: parsed.fieldErrors,
      formError: parsed.firstError,
    };
  }

  const visibleColumns = draft.table_columns.filter((col) => col.visible);
  if (visibleColumns.length === 0) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "Minimal 1 kolom tabel harus ditampilkan pada dokumen cetak.",
    };
  }
  if (draft.table_columns.some((col) => !col.label.trim())) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "Semua label kolom tabel wajib diisi dan tidak boleh kosong.",
    };
  }
  if (
    draft.signature_layout.some(
      (sig) => !sig.title.trim() || !sig.placeholder.trim(),
    )
  ) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "Setiap blok tanda tangan wajib memiliki judul peran dan placeholder.",
    };
  }

  return {
    ok: true,
    payload: {
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
    },
  };
}
