import type { WarehouseRecord } from "./types";

export const initialSampleWarehouses: WarehouseRecord[] = [
  {
    id: 1,
    code: "WH-JKT-01",
    name: "Gudang Utama Jakarta",
    address: "Jl. Raya Cakung Cilincing KM 4, Jakarta Timur",
    allow_negative_stock: false,
    is_active: true,
    created_by: 1,
    created_at: "2026-10-21T08:20:00Z",
    updated_at: "2026-10-21T08:20:00Z",
  },
  {
    id: 2,
    code: "WH-SBY-01",
    name: "Gudang Distribusi Surabaya",
    address: "Kawasan Industri Margomulyo Permai Blok D-8, Surabaya",
    allow_negative_stock: false,
    is_active: true,
    created_by: 1,
    created_at: "2026-10-22T09:10:00Z",
    updated_at: "2026-10-22T09:10:00Z",
  },
  {
    id: 3,
    code: "WH-BDG-02",
    name: "Gudang Transit Bandung",
    address: "Jl. Soekarno Hatta No. 412, Bandung",
    allow_negative_stock: true,
    is_active: false,
    created_by: 1,
    created_at: "2026-10-23T10:30:00Z",
    updated_at: "2026-10-24T11:15:00Z",
  },
];

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildWarehousesCsv(warehouses: WarehouseRecord[]): string {
  const headers = [
    "ID",
    "Kode Gudang",
    "Nama Gudang",
    "Alamat",
    "Kebijakan Stok Negatif",
    "Status",
    "Diperbarui Pada",
  ];
  const rows = warehouses.map((wh) => [
    escapeCsvCell(wh.id),
    escapeCsvCell(wh.code),
    escapeCsvCell(wh.name),
    escapeCsvCell(wh.address ?? ""),
    escapeCsvCell(wh.allow_negative_stock ? "Diizinkan" : "Ditolak (Ketat)"),
    escapeCsvCell(wh.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(wh.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
