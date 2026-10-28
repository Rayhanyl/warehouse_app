import type { StockItem } from "./types";

export const sampleCategoryOptions = [
  { id: 1, name: "Komponen Elektronik" },
  { id: 2, name: "Bahan Kemasan" },
  { id: 3, name: "Perkakas Mekanik" },
];

export const sampleUomOptions = [
  { id: 1, code: "PCS", name: "Pieces", allow_decimal: false },
  { id: 2, code: "KG", name: "Kilogram", allow_decimal: true },
  { id: 3, code: "BOX", name: "Box", allow_decimal: false },
];

export const initialSampleStockItems: StockItem[] = [
  {
    id: 1,
    sku: "ELK-MCU-001",
    name: "Microcontroller ESP32-S3",
    description: "Dual-core Wi-Fi & BLE MCU untuk modul IoT industri",
    category_id: 1,
    category_name: "Komponen Elektronik",
    uom_id: 1,
    uom_code: "PCS",
    uom_name: "Pieces",
    allow_decimal: false,
    is_active: true,
    created_by: 1,
    created_at: "2026-10-21T08:15:00Z",
    updated_at: "2026-10-21T08:15:00Z",
  },
  {
    id: 2,
    sku: "KMS-CRD-010",
    name: "Kardus Double Wall 60x40x40",
    description: "Kardus pengiriman luar kota tahan tumpukan berat",
    category_id: 2,
    category_name: "Bahan Kemasan",
    uom_id: 3,
    uom_code: "BOX",
    uom_name: "Box",
    allow_decimal: false,
    is_active: true,
    created_by: 1,
    created_at: "2026-10-22T10:00:00Z",
    updated_at: "2026-10-22T10:00:00Z",
  },
  {
    id: 3,
    sku: "MKN-SLD-005",
    name: "Timah Solder Bebas Timbal 0.8mm",
    description: "Gulungan timah solder presisi untuk perakitan PCB",
    category_id: 3,
    category_name: "Perkakas Mekanik",
    uom_id: 2,
    uom_code: "KG",
    uom_name: "Kilogram",
    allow_decimal: true,
    is_active: false,
    created_by: 2,
    created_at: "2026-10-23T13:20:00Z",
    updated_at: "2026-10-24T09:10:00Z",
  },
];

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildStockItemsCsv(items: StockItem[]): string {
  const headers = [
    "ID",
    "SKU",
    "Nama Barang",
    "Kategori",
    "Satuan Dasar",
    "Presisi Desimal",
    "Status",
    "Diperbarui Pada",
  ];
  const rows = items.map((item) => [
    escapeCsvCell(item.id),
    escapeCsvCell(item.sku),
    escapeCsvCell(item.name),
    escapeCsvCell(item.category_name),
    escapeCsvCell(`${item.uom_code} (${item.uom_name})`),
    escapeCsvCell(item.allow_decimal ? "Desimal (4 digit)" : "Bilangan bulat"),
    escapeCsvCell(item.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(item.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
