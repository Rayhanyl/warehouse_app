import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type { OpnameReference, StockOpname, StockOpnamePage } from "./types";

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
}

export async function fetchOpnames(params: OpnameListParams): Promise<StockOpnamePage> {
  const { data } = await apiClient.get<StockOpnamePage>("/stock-opnames", { params: { ...params, search: params.search.trim() || undefined, status: params.status === "all" ? undefined : params.status } });
  return data;
}

export async function fetchOpname(id: number) {
  const { data } = await apiClient.get<StockOpname>(`/stock-opnames/${id}`);
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

export function useOpnameMutation(action: "create" | "start" | "count" | "submit" | "approve" | "reject" | "cancel") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload?: unknown }) => action === "create" ? apiClient.post<StockOpname>("/stock-opnames", payload).then((response) => response.data) : opnameAction(id!, action, payload),
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
      const [warehouses, locations] = await Promise.all([
        apiClient.get<{ items: OpnameReference[] }>("/warehouses", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: OpnameReference[] }>("/locations", { params: { limit: 500, offset: 0, is_active: true } }),
      ]);
      return { warehouses: warehouses.data.items, locations: locations.data.items };
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
