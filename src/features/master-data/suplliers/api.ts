import type { Supplier } from "./types";

export const initialSampleSuppliers: Supplier[] = [
  {
    id: 1,
    code: "SUP-ELK-01",
    name: "PT Nusantara Elektronik",
    contact_person: "Hendra Wijaya",
    phone: "021-5551234",
    email: "sales@nusantara.co.id",
    address: "Kawasan Industri Jababeka Blok C-12, Cikarang",
    is_active: true,
    created_by: 1,
    created_at: "2026-10-21T08:12:00Z",
    updated_at: "2026-10-21T08:12:00Z",
  },
  {
    id: 2,
    code: "SUP-KMS-02",
    name: "CV Mitra Kemasan Mandiri",
    contact_person: "Dewi Lestari",
    phone: "021-8890112",
    email: "order@mitrakemasan.id",
    address: "Jl. Raya Daan Mogot KM 18, Jakarta Barat",
    is_active: true,
    created_by: 1,
    created_at: "2026-10-22T09:15:00Z",
    updated_at: "2026-10-22T09:15:00Z",
  },
  {
    id: 3,
    code: "SUP-LOG-03",
    name: "PT Baja Presisi Indonesia",
    contact_person: "Bambang Sutrisno",
    phone: "031-8432210",
    email: "kontak@bajapresisi.co.id",
    address: "Kawasan Industri Rungkut SIER, Surabaya",
    is_active: false,
    created_by: 2,
    created_at: "2026-10-23T11:20:00Z",
    updated_at: "2026-10-24T14:05:00Z",
  },
];

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildSuppliersCsv(suppliers: Supplier[]): string {
  const headers = [
    "ID",
    "Kode Pemasok",
    "Nama Pemasok",
    "Narahubung",
    "Telepon",
    "Email",
    "Alamat",
    "Status",
    "Diperbarui Pada",
  ];
  const rows = suppliers.map((supplier) => [
    escapeCsvCell(supplier.id),
    escapeCsvCell(supplier.code),
    escapeCsvCell(supplier.name),
    escapeCsvCell(supplier.contact_person ?? ""),
    escapeCsvCell(supplier.phone ?? ""),
    escapeCsvCell(supplier.email ?? ""),
    escapeCsvCell(supplier.address ?? ""),
    escapeCsvCell(supplier.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(supplier.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
