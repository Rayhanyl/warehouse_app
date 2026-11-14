export type DocumentType = "GOODS_RECEIPT" | "STOCK_TRANSFER" | "PURCHASE_ORDER";
export type LogoPosition = "LEFT" | "CENTER" | "RIGHT";
export type LogoSize = "SMALL" | "MEDIUM" | "LARGE";
export type PaperSize = "A4" | "LETTER" | "F4";
export type PaperOrientation = "PORTRAIT" | "LANDSCAPE";
export type DocumentSectionKey =
  | "HEADER"
  | "METADATA"
  | "TABLE"
  | "NOTES"
  | "SIGNATURES";

export interface TableColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export interface SignatureBlockConfig {
  title: string;
  subtitle?: string | null;
  placeholder: string;
}

export interface DocumentTemplate {
  id: number;
  document_type: DocumentType;
  document_title: string;
  company_name: string;
  company_address?: string | null;
  company_contact?: string | null;
  logo_url?: string | null;
  logo_position: LogoPosition;
  logo_size: LogoSize;
  header_notes?: string | null;
  footer_notes?: string | null;
  paper_size: PaperSize;
  orientation: PaperOrientation;
  margin_mm: number;
  show_barcode: boolean;
  show_line_notes: boolean;
  show_company_contact: boolean;
  section_order: DocumentSectionKey[];
  table_columns: TableColumnConfig[];
  signature_layout: SignatureBlockConfig[];
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentTemplateUpdatePayload {
  document_title: string;
  company_name: string;
  company_address: string | null;
  company_contact: string | null;
  logo_url: string | null;
  logo_position: LogoPosition;
  logo_size: LogoSize;
  header_notes: string | null;
  footer_notes: string | null;
  paper_size: PaperSize;
  orientation: PaperOrientation;
  margin_mm: number;
  show_barcode: boolean;
  show_line_notes: boolean;
  show_company_contact: boolean;
  section_order: DocumentSectionKey[];
  table_columns: TableColumnConfig[];
  signature_layout: SignatureBlockConfig[];
}

export interface LogoUploadResult {
  logo_url: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  GOODS_RECEIPT: "Bukti Penerimaan Barang (GRN)",
  STOCK_TRANSFER: "Surat Jalan Transfer Stok",
  PURCHASE_ORDER: "Purchase Order (PO)",
};

export const SECTION_LABELS: Record<DocumentSectionKey, string> = {
  HEADER: "Kop Surat, Logo & Judul Dokumen",
  METADATA: "Informasi Nomor, Tanggal & Relasi",
  TABLE: "Tabel Rincian Barang",
  NOTES: "Catatan Tambahan & Footer",
  SIGNATURES: "Blok Tanda Tangan & Persetujuan",
};

export const DEFAULT_DOCUMENT_TEMPLATES: Record<DocumentType, DocumentTemplate> = {
  GOODS_RECEIPT: {
    id: 1,
    document_type: "GOODS_RECEIPT",
    document_title: "BUKTI PENERIMAAN BARANG (GOODS RECEIPT NOTE)",
    company_name: "JEJAKSTOK WAREHOUSE MANAGEMENT SYSTEM",
    company_address: "Jl. Industri Logistik Terpadu No. 1, Jakarta",
    company_contact: "Telp: (021) 555-0190 | Email: warehouse@jejakstok.local",
    logo_url: null,
    logo_position: "LEFT",
    logo_size: "MEDIUM",
    header_notes: null,
    footer_notes:
      "Dokumen ini diterbitkan secara resmi oleh sistem WMS sebagai bukti sah penerimaan fisik barang.",
    paper_size: "A4",
    orientation: "PORTRAIT",
    margin_mm: 12,
    show_barcode: true,
    show_line_notes: true,
    show_company_contact: true,
    section_order: ["HEADER", "METADATA", "TABLE", "NOTES", "SIGNATURES"],
    table_columns: [
      { key: "no", label: "No", visible: true },
      { key: "sku_barcode", label: "SKU / Barcode", visible: true },
      { key: "item_name", label: "Nama Barang", visible: true },
      { key: "location", label: "Lokasi Simpan", visible: true },
      { key: "qty_received", label: "Qty Diterima", visible: true },
      { key: "uom", label: "Satuan", visible: true },
      { key: "notes", label: "Catatan Baris", visible: true },
    ],
    signature_layout: [
      {
        title: "Diserahkan Oleh",
        subtitle: "Pengirim / Ekspedisi Pemasok",
        placeholder: "( Nama Terang & Tanda Tangan )",
      },
      {
        title: "Diterima & Diperiksa Oleh",
        subtitle: "Staf / Admin Gudang",
        placeholder: "( Nama Terang & Tanda Tangan )",
      },
      {
        title: "Diketahui Oleh",
        subtitle: "Kepala Gudang / Supervisor",
        placeholder: "( Nama Terang & Stempel Gudang )",
      },
    ],
  },
  STOCK_TRANSFER: {
    id: 2,
    document_type: "STOCK_TRANSFER",
    document_title: "SURAT JALAN TRANSFER STOK",
    company_name: "JEJAKSTOK WAREHOUSE MANAGEMENT SYSTEM",
    company_address: "Jl. Industri Logistik Terpadu No. 1, Jakarta",
    company_contact: "Telp: (021) 555-0190 | Email: warehouse@jejakstok.local",
    logo_url: null,
    logo_position: "LEFT",
    logo_size: "MEDIUM",
    header_notes: null,
    footer_notes:
      "Harap periksa fisik barang dan segel kemasan sebelum menandatangani berita acara penerimaan.",
    paper_size: "A4",
    orientation: "PORTRAIT",
    margin_mm: 12,
    show_barcode: true,
    show_line_notes: true,
    show_company_contact: true,
    section_order: ["HEADER", "METADATA", "TABLE", "NOTES", "SIGNATURES"],
    table_columns: [
      { key: "no", label: "No", visible: true },
      { key: "sku_barcode", label: "SKU / Barcode", visible: true },
      { key: "item_name", label: "Nama Barang", visible: true },
      { key: "uom", label: "Satuan", visible: true },
      { key: "qty_shipped", label: "Qty Kirim", visible: true },
      { key: "qty_received", label: "Qty Diterima", visible: true },
      { key: "variance", label: "Selisih / Keterangan Cek Fisik", visible: true },
    ],
    signature_layout: [
      {
        title: "Diserahkan Oleh",
        subtitle: "Petugas Gudang Asal",
        placeholder: "( Nama Terang & Tanda Tangan )",
      },
      {
        title: "Dibawa Oleh",
        subtitle: "Pengemudi / Kurir / Ekspedisi",
        placeholder: "( Nama Terang & No. Polisi )",
      },
      {
        title: "Diterima Oleh",
        subtitle: "Petugas Gudang / Toko Tujuan",
        placeholder: "( Nama Terang & Stempel Cabang )",
      },
    ],
  },
  PURCHASE_ORDER: {
    id: 3,
    document_type: "PURCHASE_ORDER",
    document_title: "PURCHASE ORDER (SURAT PESANAN PEMBELIAN)",
    company_name: "JEJAKSTOK WAREHOUSE MANAGEMENT SYSTEM",
    company_address: "Jl. Industri Logistik Terpadu No. 1, Jakarta",
    company_contact: "Telp: (021) 555-0190 | Email: procurement@jejakstok.local",
    logo_url: null,
    logo_position: "LEFT",
    logo_size: "MEDIUM",
    header_notes:
      "Mohon cantumkan nomor PO pada surat jalan dan faktur pengiriman barang.",
    footer_notes:
      "Pesanan sah apabila telah ditandatangani oleh pejabat berwenang dan dikirim sesuai jadwal.",
    paper_size: "A4",
    orientation: "PORTRAIT",
    margin_mm: 12,
    show_barcode: true,
    show_line_notes: true,
    show_company_contact: true,
    section_order: ["HEADER", "METADATA", "TABLE", "NOTES", "SIGNATURES"],
    table_columns: [
      { key: "no", label: "No", visible: true },
      { key: "sku_barcode", label: "Kode SKU", visible: true },
      { key: "item_name", label: "Nama Barang", visible: true },
      { key: "uom", label: "Satuan", visible: true },
      { key: "qty_ordered", label: "Qty Pesanan", visible: true },
      { key: "qty_received", label: "Qty Diterima", visible: true },
      { key: "notes", label: "Catatan Baris", visible: true },
    ],
    signature_layout: [
      {
        title: "Dibuat Oleh",
        subtitle: "Staf Pengadaan / Purchasing",
        placeholder: "( Nama Terang & Tanda Tangan )",
      },
      {
        title: "Disetujui Oleh",
        subtitle: "Manajer Gudang / Operasional",
        placeholder: "( Nama Terang & Tanda Tangan )",
      },
      {
        title: "Diterima Pemasok",
        subtitle: "Konfirmasi Supplier",
        placeholder: "( Nama Terang & Stempel Perusahaan )",
      },
    ],
  },
};
