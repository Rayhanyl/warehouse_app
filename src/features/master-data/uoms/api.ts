import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type {
  Uom,
  UomCreatePayload,
  UomListParams,
  UomPage,
  UomUpdatePayload,
} from "./types";

export const uomKeys = {
  all: ["master-data", "uoms"] as const,
  lists: () => [...uomKeys.all, "list"] as const,
  list: (params: UomListParams) => [...uomKeys.lists(), params] as const,
  details: () => [...uomKeys.all, "detail"] as const,
  detail: (id: number) => [...uomKeys.details(), id] as const,
};

export function toUomQueryParams(params: UomListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const trimmedSearch = params.search.trim();
  if (trimmedSearch) {
    query.set("search", trimmedSearch);
  }

  if (params.status === "active") {
    query.set("is_active", "true");
  } else if (params.status === "inactive") {
    query.set("is_active", "false");
  }

  return query;
}

export async function fetchUoms(params: UomListParams): Promise<UomPage> {
  const { data } = await apiClient.get<UomPage>("/uoms", {
    params: toUomQueryParams(params),
  });
  return data;
}

export async function fetchUomById(uomId: number): Promise<Uom> {
  const { data } = await apiClient.get<Uom>(`/uoms/${uomId}`);
  return data;
}

export async function createUom(payload: UomCreatePayload): Promise<Uom> {
  const { data } = await apiClient.post<Uom>("/uoms", {
    code: payload.code.trim(),
    name: payload.name.trim(),
    allow_decimal: payload.allow_decimal ?? false,
    is_active: payload.is_active ?? true,
  });
  return data;
}

export async function updateUom(
  uomId: number,
  payload: UomUpdatePayload,
): Promise<Uom> {
  const body: UomUpdatePayload = {};
  if (payload.code !== undefined) {
    body.code = payload.code.trim();
  }
  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }
  if (payload.allow_decimal !== undefined) {
    body.allow_decimal = payload.allow_decimal;
  }
  if (payload.is_active !== undefined) {
    body.is_active = payload.is_active;
  }

  const { data } = await apiClient.patch<Uom>(`/uoms/${uomId}`, body);
  return data;
}

export function useUoms(params: UomListParams) {
  return useQuery({
    queryKey: uomKeys.list(params),
    queryFn: () => fetchUoms(params),
    placeholderData: keepPreviousData,
  });
}

export function useUomDetail(uomId: number | null, initialData?: Uom) {
  return useQuery({
    queryKey: uomKeys.detail(uomId ?? 0),
    queryFn: () => fetchUomById(uomId!),
    enabled: uomId !== null && uomId > 0,
    initialData,
  });
}

export function useCreateUom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UomCreatePayload) => createUom(payload),
    onSuccess: (created) => {
      queryClient.setQueryData(uomKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
    },
  });
}

export function useUpdateUom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uomId,
      payload,
    }: {
      uomId: number;
      payload: UomUpdatePayload;
    }) => updateUom(uomId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(uomKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
    },
  });
}

export function mapUomApiError(
  error: unknown,
  fallbackMessage: string,
): {
  message: string;
  requestId?: string;
  fieldErrors?: { code?: string; name?: string };
} {
  const info = extractApiErrorInfo(error);

  if (info.code === "DUPLICATE" || info.status === 409) {
    if (info.code === "ENTITY_IN_USE") {
      return {
        message:
          info.message ||
          "Satuan ukur tidak dapat dinonaktifkan karena masih digunakan oleh barang (SKU) yang aktif.",
        requestId: info.requestId,
      };
    }
    return {
      message:
        info.message ||
        "Kode satuan ukur sudah terdaftar. Gunakan kode satuan ukur yang berbeda.",
      requestId: info.requestId,
      fieldErrors: {
        code: "Kode satuan ukur ini sudah digunakan.",
      },
    };
  }

  if (info.status === 403 || info.code === "PERMISSION_DENIED") {
    return {
      message:
        "Anda tidak memiliki izin (master:manage) untuk mengubah data satuan ukur.",
      requestId: info.requestId,
    };
  }

  if (info.status === 404 || info.code === "NOT_FOUND") {
    return {
      message: "Data satuan ukur tidak ditemukan di server.",
      requestId: info.requestId,
    };
  }

  if (info.status === 422 || info.code === "VALIDATION_ERROR") {
    return {
      message:
        info.message ||
        "Data yang dikirim belum valid. Periksa kembali kode dan nama satuan ukur.",
      requestId: info.requestId,
    };
  }

  return {
    message: info.message || fallbackMessage,
    requestId: info.requestId,
  };
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildUomsCsv(uoms: Uom[]): string {
  const headers = [
    "ID",
    "Kode Satuan",
    "Nama Satuan",
    "Kuantitas Desimal",
    "Status",
    "ID Pembuat",
    "Dibuat Pada",
    "Diperbarui Pada",
  ];
  const rows = uoms.map((uom) => [
    escapeCsvCell(uom.id),
    escapeCsvCell(uom.code),
    escapeCsvCell(uom.name),
    escapeCsvCell(uom.allow_decimal ? "Diizinkan (Desimal)" : "Bilangan Bulat"),
    escapeCsvCell(uom.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(uom.created_by ?? ""),
    escapeCsvCell(uom.created_at),
    escapeCsvCell(uom.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

