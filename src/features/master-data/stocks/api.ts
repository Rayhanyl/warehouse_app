import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { StockImportResult, StockItem, StockStatusFilter } from "./types";

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
    barcode: "8991001000011",
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
    barcode: "8991001000028",
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
    barcode: null,
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

export interface StockListParams {
  limit: number;
  offset: number;
  search: string;
  status: StockStatusFilter;
  category_id: number | null;
  uom_id: number | null;
  sort_by: "id" | "sku" | "name" | "created_at";
  sort_dir: "asc" | "desc";
}

export function toStockQueryParams(params: StockListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status !== "all") query.set("is_active", String(params.status === "active"));
  if (params.category_id) query.set("category_id", String(params.category_id));
  if (params.uom_id) query.set("uom_id", String(params.uom_id));
  return query;
}

export async function fetchStockItems(
  params: StockListParams,
): Promise<Paginated<StockItem>> {
  const { data } = await apiClient.get<Paginated<StockItem>>("/items", {
    params: toStockQueryParams(params),
  });
  return data;
}

export async function downloadStockItemsImportTemplate(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/items/import-template", {
    responseType: "blob",
  });
  return data;
}

export async function importStockItems(file: File): Promise<StockImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<StockImportResult>("/items/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

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
    "Barcode",
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
    escapeCsvCell(item.barcode ?? ""),
    escapeCsvCell(item.name),
    escapeCsvCell(item.category_name),
    escapeCsvCell(`${item.uom_code} (${item.uom_name})`),
    escapeCsvCell(item.allow_decimal ? "Desimal (4 digit)" : "Bilangan bulat"),
    escapeCsvCell(item.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(item.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
