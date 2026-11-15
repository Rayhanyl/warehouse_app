import type {
  ModularPrintMetadataItem,
  ModularPrintRow,
} from "@/components/print/ModularDocumentPrintSheet";
import type { DocumentType } from "./types";

export interface SampleDocumentPreviewData {
  documentNumberLabel: string;
  documentBarcodeValue: string;
  statusLabel: string;
  metadata: ModularPrintMetadataItem[];
  rows: ModularPrintRow[];
  tableSummary: string;
  documentNotes: string;
}

/** Bangun data simulasi pratinjau langsung sesuai jenis dokumen cetak. */
export function buildSamplePreviewData(
  documentType: DocumentType,
): SampleDocumentPreviewData {
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
