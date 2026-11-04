import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderListParams,
  PurchaseOrderPage,
  PurchaseOrderUpdatePayload,
  ReferenceOption,
} from "./types";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (params: PurchaseOrderListParams) => [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
};

function toQueryParams(params: PurchaseOrderListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status !== "all") query.set("status", params.status);
  if (params.supplier_id) query.set("supplier_id", String(params.supplier_id));
  if (params.warehouse_id) query.set("warehouse_id", String(params.warehouse_id));
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  return query;
}

export async function fetchPurchaseOrders(
  params: PurchaseOrderListParams,
): Promise<PurchaseOrderPage> {
  const { data } = await apiClient.get<PurchaseOrderPage>("/purchase-orders", {
    params: toQueryParams(params),
  });
  return data;
}

export async function fetchPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  return data;
}

export async function createPurchaseOrder(
  payload: PurchaseOrderCreatePayload,
): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>("/purchase-orders", payload);
  return data;
}

export async function updatePurchaseOrder(
  id: number,
  payload: PurchaseOrderUpdatePayload,
): Promise<PurchaseOrder> {
  const { data } = await apiClient.patch<PurchaseOrder>(
    `/purchase-orders/${id}`,
    payload,
  );
  return data;
}

export async function runPurchaseOrderAction(
  id: number,
  action: "issue" | "cancel" | "close",
  closedReason?: string,
): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${id}/${action}`,
    action === "close" ? { closed_reason: closedReason?.trim() } : undefined,
  );
  return data;
}

async function fetchReferences(
  endpoint: string,
  params: Record<string, string>,
): Promise<ReferenceOption[]> {
  const { data } = await apiClient.get<{ items: ReferenceOption[] }>(endpoint, {
    params: { limit: "200", offset: "0", ...params },
  });
  return data.items;
}

export function usePurchaseOrders(params: PurchaseOrderListParams) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => fetchPurchaseOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseOrder(id: number | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id ?? 0),
    queryFn: () => fetchPurchaseOrder(id!),
    enabled: id !== null,
  });
}

export function usePurchaseOrderMutation(
  action: "create" | "update" | "issue" | "cancel" | "close",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      closedReason,
    }: {
      id?: number;
      payload?: PurchaseOrderCreatePayload | PurchaseOrderUpdatePayload;
      closedReason?: string;
    }) => {
      if (action === "create") return createPurchaseOrder(payload as PurchaseOrderCreatePayload);
      if (!id) throw new Error("ID purchase order tidak tersedia.");
      if (action === "update") return updatePurchaseOrder(id, payload as PurchaseOrderUpdatePayload);
      return runPurchaseOrderAction(id, action, closedReason);
    },
    onSuccess: (purchaseOrder) => {
      queryClient.setQueryData(purchaseOrderKeys.detail(purchaseOrder.id), purchaseOrder);
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function usePurchaseOrderReferences() {
  return useQuery({
    queryKey: [...purchaseOrderKeys.all, "references"],
    queryFn: async () => {
      const [suppliers, warehouses, items] = await Promise.all([
        fetchReferences("/suppliers", { is_active: "true" }),
        fetchReferences("/warehouses", { is_active: "true" }),
        fetchReferences("/items", { is_active: "true" }),
      ]);
      return { suppliers, warehouses, items };
    },
  });
}

export function mapPurchaseOrderError(error: unknown, fallback: string) {
  const info = extractApiErrorInfo(error);
  if (info.status === 403) return { message: "Anda tidak memiliki izin untuk menjalankan aksi ini.", requestId: info.requestId };
  if (info.status === 409 || info.code === "INVALID_STATE_TRANSITION") {
    return { message: info.message || "Status purchase order sudah berubah. Muat ulang data sebelum mencoba lagi.", requestId: info.requestId };
  }
  if (info.status === 422) return { message: info.message || "Data purchase order belum valid. Periksa kembali isian Anda.", requestId: info.requestId };
  return { message: info.message || fallback, requestId: info.requestId };
}
