import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type {
  GoodsReceipt,
  GoodsReceiptCreatePayload,
  GoodsReceiptListParams,
  GoodsReceiptLocation,
  GoodsReceiptPage,
  GoodsReceiptUpdatePayload,
} from "./types";
import type { PurchaseOrderPage } from "@/features/purchase-orders/types";

export const goodsReceiptKeys = {
  all: ["goods-receipts"] as const,
  lists: () => [...goodsReceiptKeys.all, "list"] as const,
  list: (params: GoodsReceiptListParams) => [...goodsReceiptKeys.lists(), params] as const,
  details: () => [...goodsReceiptKeys.all, "detail"] as const,
  detail: (id: number) => [...goodsReceiptKeys.details(), id] as const,
};

function toQueryParams(params: GoodsReceiptListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: "id",
    sort_dir: "desc",
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status !== "all") query.set("status", params.status);
  if (params.warehouse_id) query.set("warehouse_id", String(params.warehouse_id));
  if (params.po_id) query.set("po_id", String(params.po_id));
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  return query;
}

export async function fetchGoodsReceipts(params: GoodsReceiptListParams): Promise<GoodsReceiptPage> {
  const { data } = await apiClient.get<GoodsReceiptPage>("/goods-receipts", {
    params: toQueryParams(params),
  });
  return data;
}

export async function fetchGoodsReceipt(id: number): Promise<GoodsReceipt> {
  const { data } = await apiClient.get<GoodsReceipt>(`/goods-receipts/${id}`);
  return data;
}

export async function createGoodsReceipt(payload: GoodsReceiptCreatePayload): Promise<GoodsReceipt> {
  const { data } = await apiClient.post<GoodsReceipt>("/goods-receipts", payload);
  return data;
}

export async function updateGoodsReceipt(id: number, payload: GoodsReceiptUpdatePayload): Promise<GoodsReceipt> {
  const { data } = await apiClient.patch<GoodsReceipt>(`/goods-receipts/${id}`, payload);
  return data;
}

export async function runGoodsReceiptAction(
  id: number,
  action: "post" | "cancel",
): Promise<GoodsReceipt> {
  const { data } = await apiClient.post<GoodsReceipt>(`/goods-receipts/${id}/${action}`);
  return data;
}

export function useGoodsReceipts(params: GoodsReceiptListParams) {
  return useQuery({
    queryKey: goodsReceiptKeys.list(params),
    queryFn: () => fetchGoodsReceipts(params),
    placeholderData: keepPreviousData,
  });
}

export function useGoodsReceipt(id: number | null) {
  return useQuery({
    queryKey: goodsReceiptKeys.detail(id ?? 0),
    queryFn: () => fetchGoodsReceipt(id!),
    enabled: id !== null,
  });
}

export function useGoodsReceiptMutation(action: "create" | "update" | "post" | "cancel") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload?: GoodsReceiptCreatePayload | GoodsReceiptUpdatePayload }) => {
      if (action === "create") return createGoodsReceipt(payload as GoodsReceiptCreatePayload);
      if (!id) throw new Error("ID penerimaan barang tidak tersedia.");
      if (action === "update") return updateGoodsReceipt(id, payload as GoodsReceiptUpdatePayload);
      return runGoodsReceiptAction(id, action);
    },
    onSuccess: (receipt) => {
      queryClient.setQueryData(goodsReceiptKeys.detail(receipt.id), receipt);
      void queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
    },
  });
}

export function useGoodsReceiptReferences() {
  return useQuery({
    queryKey: [...goodsReceiptKeys.all, "references"],
    queryFn: async () => {
      const [purchaseOrders, locations] = await Promise.all([
        apiClient.get<PurchaseOrderPage>("/purchase-orders", {
          params: { limit: 200, offset: 0, status: "ISSUED", sort_by: "id", sort_dir: "desc" },
        }),
        apiClient.get<{ items: GoodsReceiptLocation[] }>("/locations", {
          params: { limit: 200, offset: 0, is_active: "true" },
        }),
      ]);
      return { purchaseOrders: purchaseOrders.data.items, locations: locations.data.items };
    },
  });
}

export function mapGoodsReceiptError(error: unknown, fallback: string) {
  const info = extractApiErrorInfo(error);
  if (info.status === 403) return "Anda tidak memiliki izin atau akses gudang untuk aksi ini.";
  if (info.status === 409) return info.message || "Status dokumen atau kuantitas sudah berubah. Muat ulang data sebelum mencoba lagi.";
  if (info.status === 422) return info.message || "Data penerimaan belum valid. Periksa tanggal, lokasi, dan kuantitas.";
  return info.message || fallback;
}
