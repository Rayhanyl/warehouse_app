import type { StorageLocationRecord, StorageLocationWarehouseOption } from "./types";

export const sampleWarehouseOptions: StorageLocationWarehouseOption[] = [
  {
    id: "wh-001",
    code: "WH-JKT-01",
    name: "Gudang Pusat Cakung",
  },
  {
    id: "wh-002",
    code: "WH-CKR-02",
    name: "Gudang Distribusi Cikarang",
  },
  {
    id: "wh-003",
    code: "WH-SBY-01",
    name: "Hub Regional Surabaya",
  },
];

export const initialSampleStorageLocations: StorageLocationRecord[] = [
  {
    id: "loc-001",
    warehouse_id: "wh-001",
    warehouse_code: "WH-JKT-01",
    warehouse_name: "Gudang Pusat Cakung",
    code: "RCV-STAGE-01",
    name: "Area Karantina Penerimaan",
    is_active: true,
    created_by: "usr-admin-01",
    created_at: "2026-01-12T08:15:00.000Z",
    updated_at: "2026-02-04T09:00:00.000Z",
  },
  {
    id: "loc-002",
    warehouse_id: "wh-001",
    warehouse_code: "WH-JKT-01",
    warehouse_name: "Gudang Pusat Cakung",
    code: "RACK-A01-01",
    name: "Rak A Lorong 1 Tingkat 1",
    is_active: true,
    created_by: "usr-admin-01",
    created_at: "2026-01-12T08:30:00.000Z",
    updated_at: "2026-02-06T11:20:00.000Z",
  },
  {
    id: "loc-003",
    warehouse_id: "wh-001",
    warehouse_code: "WH-JKT-01",
    warehouse_name: "Gudang Pusat Cakung",
    code: "RACK-A01-02",
    name: "Rak A Lorong 1 Tingkat 2",
    is_active: true,
    created_by: "usr-admin-01",
    created_at: "2026-01-12T08:35:00.000Z",
    updated_at: "2026-02-06T11:25:00.000Z",
  },
  {
    id: "loc-004",
    warehouse_id: "wh-002",
    warehouse_code: "WH-CKR-02",
    warehouse_name: "Gudang Distribusi Cikarang",
    code: "BULK-Z01",
    name: "Zona Palet Curah Blok Z1",
    is_active: true,
    created_by: "usr-admin-01",
    created_at: "2026-01-16T09:40:00.000Z",
    updated_at: "2026-02-11T15:10:00.000Z",
  },
  {
    id: "loc-005",
    warehouse_id: "wh-003",
    warehouse_code: "WH-SBY-01",
    warehouse_name: "Hub Regional Surabaya",
    code: "RACK-S01-01",
    name: "Rak Transit Surabaya Blok S1",
    is_active: false,
    created_by: "usr-admin-02",
    created_at: "2026-01-22T10:15:00.000Z",
    updated_at: "2026-02-18T16:00:00.000Z",
  },
];

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

export function buildStorageLocationsCsv(locations: StorageLocationRecord[]): string {
  const headers = [
    "ID",
    "Kode Lokasi",
    "Nama Lokasi",
    "Kode Gudang",
    "Nama Gudang",
    "Status",
    "Dibuat Pada",
    "Diperbarui Pada",
  ];
  const rows = locations.map((item) => [
    escapeCsvCell(item.id),
    escapeCsvCell(item.code),
    escapeCsvCell(item.name),
    escapeCsvCell(item.warehouse_code),
    escapeCsvCell(item.warehouse_name),
    escapeCsvCell(item.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(item.created_at),
    escapeCsvCell(item.updated_at),
  ]);

  return [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
