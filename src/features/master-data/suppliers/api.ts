import { apiClient } from "@/lib/api-client";
import { mapMasterDomainError, type MasterFormSubmitError } from "../errors";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierImportResult,
  SupplierListParams,
  SupplierPage,
  SupplierUpdatePayload,
} from "./types";

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

export function toSupplierQueryParams(params: SupplierListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status !== "all") query.set("is_active", String(params.status === "active"));
  return query;
}

export async function fetchSuppliers(params: SupplierListParams): Promise<SupplierPage> {
  const { data } = await apiClient.get<SupplierPage>("/suppliers", {
    params: toSupplierQueryParams(params),
  });
  return data;
}

export async function createSupplier(
  payload: SupplierCreatePayload,
): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>("/suppliers", {
    code: payload.code.trim(),
    name: payload.name.trim(),
    contact_person: payload.contact_person?.trim() ? payload.contact_person.trim() : null,
    phone: payload.phone?.trim() ? payload.phone.trim() : null,
    email: payload.email?.trim() ? payload.email.trim().toLowerCase() : null,
    address: payload.address?.trim() ? payload.address.trim() : null,
    is_active: payload.is_active ?? true,
  });
  return data;
}

export async function updateSupplier(
  supplierId: number,
  payload: SupplierUpdatePayload,
): Promise<Supplier> {
  const body: SupplierUpdatePayload = {};
  if (payload.code !== undefined) {
    body.code = payload.code.trim();
  }
  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }
  if (payload.contact_person !== undefined) {
    body.contact_person = payload.contact_person?.trim()
      ? payload.contact_person.trim()
      : null;
  }
  if (payload.phone !== undefined) {
    body.phone = payload.phone?.trim() ? payload.phone.trim() : null;
  }
  if (payload.email !== undefined) {
    body.email = payload.email?.trim() ? payload.email.trim().toLowerCase() : null;
  }
  if (payload.address !== undefined) {
    body.address = payload.address?.trim() ? payload.address.trim() : null;
  }
  if (payload.is_active !== undefined) {
    body.is_active = payload.is_active;
  }

  const { data } = await apiClient.patch<Supplier>(`/suppliers/${supplierId}`, body);
  return data;
}

export async function downloadSupplierImportTemplate(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/suppliers/import-template", {
    responseType: "blob",
  });
  return data;
}

export async function importSuppliers(file: File): Promise<SupplierImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<SupplierImportResult>("/suppliers/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function mapSupplierApiError(
  error: unknown,
  fallbackMessage: string,
): MasterFormSubmitError {
  return mapMasterDomainError(error, fallbackMessage, {
    entityLabel: "Pemasok",
    duplicateField: "code",
    inUseMessage:
      "Pemasok tidak dapat dinonaktifkan karena masih digunakan pada purchase order aktif.",
  });
}

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
