import { apiClient } from "@/lib/api-client";
import { mapMasterDomainError, type MasterFormSubmitError } from "../errors";
import type { Paginated } from "@/types/api";
import type {
  WarehouseCreatePayload,
  WarehouseRecord,
  WarehouseStatusFilter,
  WarehouseUpdatePayload,
} from "./types";

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

export interface WarehouseListParams {
  limit: number;
  offset: number;
  search: string;
  status: WarehouseStatusFilter;
  sort_by: "id" | "code" | "name" | "created_at";
  sort_dir: "asc" | "desc";
}

export function toWarehouseQueryParams(params: WarehouseListParams): URLSearchParams {
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

export async function fetchWarehouses(
  params: WarehouseListParams,
): Promise<Paginated<WarehouseRecord>> {
  const { data } = await apiClient.get<Paginated<WarehouseRecord>>("/warehouses", {
    params: toWarehouseQueryParams(params),
  });
  return data;
}

export async function createWarehouse(
  payload: WarehouseCreatePayload,
): Promise<WarehouseRecord> {
  const { data } = await apiClient.post<WarehouseRecord>("/warehouses", {
    code: payload.code.trim(),
    name: payload.name.trim(),
    address: payload.address?.trim() ? payload.address.trim() : null,
    allow_negative_stock: payload.allow_negative_stock ?? false,
    is_active: payload.is_active ?? true,
  });
  return data;
}

export async function updateWarehouse(
  warehouseId: number,
  payload: WarehouseUpdatePayload,
): Promise<WarehouseRecord> {
  const body: WarehouseUpdatePayload = {};
  if (payload.code !== undefined) {
    body.code = payload.code.trim();
  }
  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }
  if (payload.address !== undefined) {
    body.address = payload.address?.trim() ? payload.address.trim() : null;
  }
  if (payload.allow_negative_stock !== undefined) {
    body.allow_negative_stock = payload.allow_negative_stock;
  }
  if (payload.is_active !== undefined) {
    body.is_active = payload.is_active;
  }

  const { data } = await apiClient.patch<WarehouseRecord>(
    `/warehouses/${warehouseId}`,
    body,
  );
  return data;
}

export function mapWarehouseApiError(
  error: unknown,
  fallbackMessage: string,
): MasterFormSubmitError {
  return mapMasterDomainError(error, fallbackMessage, {
    entityLabel: "Gudang",
    duplicateField: "code",
  });
}

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
