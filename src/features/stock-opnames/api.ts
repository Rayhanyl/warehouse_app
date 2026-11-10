import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type { OpnameItemReference, OpnameReference, StockOpname, StockOpnameCreatePayload, StockOpnamePage, StockOpnameUpdatePayload } from "./types";

export const opnameKeys = {
  all: ["stock-opnames"] as const,
  lists: () => [...opnameKeys.all, "list"] as const,
  list: (params: OpnameListParams) => [...opnameKeys.lists(), params] as const,
  detail: (id: number) => [...opnameKeys.all, "detail", id] as const,
};

export interface OpnameListParams {
  limit: number;
  offset: number;
  search: string;
  status: string;
  warehouse_id: number | null;
  date_from: string;
  date_to: string;
}

export async function fetchOpnames(params: OpnameListParams): Promise<StockOpnamePage> {
  const { data } = await apiClient.get<StockOpnamePage>("/stock-opnames", { params: {
    limit: params.limit,
    offset: params.offset,
    search: params.search.trim() || undefined,
    status: params.status === "all" ? undefined : params.status,
    warehouse_id: params.warehouse_id ?? undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  } });
  return data;
}

export async function fetchOpname(id: number) {
  const { data } = await apiClient.get<StockOpname>(`/stock-opnames/${id}`);
  return data;
}

export async function updateOpname(id: number, payload: StockOpnameUpdatePayload) {
  const { data } = await apiClient.patch<StockOpname>(`/stock-opnames/${id}`, payload);
  return data;
}

export async function opnameAction(id: number, action: string, payload?: unknown) {
  const { data } = await apiClient.post<StockOpname>(`/stock-opnames/${id}/${action}`, payload);
  return data;
}

export function useOpnames(params: OpnameListParams) {
  return useQuery({ queryKey: opnameKeys.list(params), queryFn: () => fetchOpnames(params), placeholderData: keepPreviousData });
}

export function useOpname(id: number | null) {
  return useQuery({ queryKey: opnameKeys.detail(id ?? 0), queryFn: () => fetchOpname(id!), enabled: id !== null });
}

export function useOpnameMutation(action: "create" | "update" | "start" | "count" | "submit" | "approve" | "reject" | "cancel") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload?: StockOpnameCreatePayload | StockOpnameUpdatePayload | unknown }) => {
      if (action === "create") return apiClient.post<StockOpname>("/stock-opnames", payload).then((response) => response.data);
      if (action === "update") {
        if (!id) throw new Error("ID stock opname tidak tersedia.");
        return updateOpname(id, payload as StockOpnameUpdatePayload);
      }
      return opnameAction(id!, action, payload);
    },
    onSuccess: (opname) => {
      queryClient.setQueryData(opnameKeys.detail(opname.id), opname);
      void queryClient.invalidateQueries({ queryKey: opnameKeys.lists() });
    },
  });
}

export function useOpnameReferences() {
  return useQuery({
    queryKey: [...opnameKeys.all, "references"],
    queryFn: async () => {
      const [warehouses, locations, items] = await Promise.all([
        apiClient.get<{ items: OpnameReference[] }>("/warehouses", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: OpnameReference[] }>("/locations", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: OpnameItemReference[] }>("/items", { params: { limit: 200, offset: 0, is_active: true } }),
      ]);
      return { warehouses: warehouses.data.items, locations: locations.data.items, items: items.data.items };
    },
  });
}

export function mapOpnameError(error: unknown, fallback: string) {
  const info = extractApiErrorInfo(error);
  if (info.status === 403) return "Anda tidak memiliki izin atau akses gudang untuk aksi ini.";
  if (info.status === 409) return info.message || "Status sesi atau lokasi sudah berubah. Muat ulang data sebelum mencoba lagi.";
  if (info.status === 422) return info.message || "Data stock opname belum valid.";
  return info.message || fallback;
}
