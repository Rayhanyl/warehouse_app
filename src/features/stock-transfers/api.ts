import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type { StockTransfer, StockTransferCreatePayload, StockTransferPage, TransferReceiveLinePayload, TransferReference } from "./types";

export const transferKeys = {
  all: ["stock-transfers"] as const,
  lists: () => [...transferKeys.all, "list"] as const,
  list: (params: TransferListParams) => [...transferKeys.lists(), params] as const,
  detail: (id: number) => [...transferKeys.all, "detail", id] as const,
};

export interface TransferListParams {
  limit: number;
  offset: number;
  search: string;
  status: string;
  date_from: string;
  date_to: string;
}

export async function fetchTransfers(params: TransferListParams): Promise<StockTransferPage> {
  const query = { ...params, search: params.search.trim() || undefined, status: params.status === "all" ? undefined : params.status };
  const { data } = await apiClient.get<StockTransferPage>("/stock-transfers", { params: query });
  return data;
}

export async function fetchTransfer(id: number) {
  const { data } = await apiClient.get<StockTransfer>(`/stock-transfers/${id}`);
  return data;
}

export async function createTransfer(payload: StockTransferCreatePayload) {
  const { data } = await apiClient.post<StockTransfer>("/stock-transfers", payload);
  return data;
}

export async function transferAction(id: number, action: "approve" | "ship" | "cancel" | "receive", lines?: TransferReceiveLinePayload[]) {
  const { data } = await apiClient.post<StockTransfer>(`/stock-transfers/${id}/${action}`, action === "receive" ? { lines } : undefined);
  return data;
}

export function useTransfers(params: TransferListParams) {
  return useQuery({ queryKey: transferKeys.list(params), queryFn: () => fetchTransfers(params), placeholderData: keepPreviousData });
}

export function useTransfer(id: number | null) {
  return useQuery({ queryKey: transferKeys.detail(id ?? 0), queryFn: () => fetchTransfer(id!), enabled: id !== null });
}

export function useTransferMutation(action: "create" | "approve" | "ship" | "cancel" | "receive") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, lines }: { id?: number; payload?: StockTransferCreatePayload; lines?: TransferReceiveLinePayload[] }) => {
      if (action === "create") return createTransfer(payload!);
      if (!id) throw new Error("ID transfer tidak tersedia.");
      return transferAction(id, action, lines);
    },
    onSuccess: (transfer) => {
      queryClient.setQueryData(transferKeys.detail(transfer.id), transfer);
      void queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
    },
  });
}

export function useTransferReferences() {
  return useQuery({
    queryKey: [...transferKeys.all, "references"],
    queryFn: async () => {
      const [warehouses, locations, items] = await Promise.all([
        apiClient.get<{ items: TransferReference[] }>("/warehouses", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: TransferReference[] }>("/locations", { params: { limit: 500, offset: 0, is_active: true } }),
        apiClient.get<{ items: TransferReference[] }>("/items", { params: { limit: 200, offset: 0, is_active: true } }),
      ]);
      return { warehouses: warehouses.data.items, locations: locations.data.items, items: items.data.items };
    },
  });
}

export function mapTransferError(error: unknown, fallback: string) {
  const info = extractApiErrorInfo(error);
  if (info.status === 403) return "Anda tidak memiliki izin atau akses gudang untuk aksi ini.";
  if (info.status === 409) return info.message || "Status transfer atau saldo sudah berubah. Muat ulang data sebelum mencoba lagi.";
  if (info.status === 422) return info.message || "Data transfer belum valid. Periksa lokasi dan kuantitas.";
  return info.message || fallback;
}
