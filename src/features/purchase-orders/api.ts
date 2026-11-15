import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import { invalidateAndRefetchAll } from "@/lib/query-invalidation";
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
  if (params.overdue_only) query.set("overdue_only", "true");
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
  action: "submit" | "approve" | "reject" | "issue" | "cancel" | "close" | "revise-draft",
  reasonOrNotes?: string,
): Promise<PurchaseOrder> {
  const body =
    action === "close"
      ? { closed_reason: reasonOrNotes?.trim() }
      : action === "reject"
        ? { rejection_reason: reasonOrNotes?.trim() }
        : (action === "submit" || action === "approve") && reasonOrNotes?.trim()
          ? { notes: reasonOrNotes.trim() }
          : undefined;
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${id}/${action}`,
    body,
  );
  return data;
}

export async function closePurchaseOrderLine(
  poId: number,
  poLineId: number,
  closedReason: string,
): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${poId}/lines/${poLineId}/close`,
    { closed_reason: closedReason.trim() },
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
  action:
    | "create"
    | "update"
    | "submit"
    | "approve"
    | "reject"
    | "issue"
    | "cancel"
    | "close"
    | "revise-draft"
    | "close-line",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      poLineId,
      payload,
      closedReason,
    }: {
      id?: number;
      poLineId?: number;
      payload?: PurchaseOrderCreatePayload | PurchaseOrderUpdatePayload;
      closedReason?: string;
    }) => {
      if (action === "create") return createPurchaseOrder(payload as PurchaseOrderCreatePayload);
      if (!id) throw new Error("ID purchase order tidak tersedia.");
      if (action === "update") return updatePurchaseOrder(id, payload as PurchaseOrderUpdatePayload);
      if (action === "close-line") {
        if (!poLineId) throw new Error("ID baris purchase order tidak tersedia.");
        return closePurchaseOrderLine(id, poLineId, closedReason ?? "");
      }
      return runPurchaseOrderAction(id, action, closedReason);
    },
    onSuccess: async (purchaseOrder) => {
      queryClient.setQueryData(purchaseOrderKeys.detail(purchaseOrder.id), purchaseOrder);
      await invalidateAndRefetchAll(queryClient, [
        purchaseOrderKeys.lists(),
        ["goods-receipts", "references"],
        ["dashboard"],
      ]);
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
  if (info.status === 403) {
    if (info.details?.code === "SOD_VIOLATION") {
      return {
        message:
          info.message ||
          "Pemisahan tugas (SoD): pembuat, pengaju, atau penyetuju sebelumnya tidak boleh menyetujui PO ini.",
        requestId: info.requestId,
      };
    }
    return {
      message: info.message || "Anda tidak memiliki izin untuk menjalankan aksi ini.",
      requestId: info.requestId,
    };
  }
  if (info.status === 409 || info.code === "INVALID_STATE_TRANSITION") {
    return {
      message:
        info.message ||
        "Status purchase order sudah berubah. Muat ulang data sebelum mencoba lagi.",
      requestId: info.requestId,
    };
  }
  if (info.status === 422) {
    return {
      message: info.message || "Data purchase order belum valid. Periksa kembali isian Anda.",
      requestId: info.requestId,
    };
  }
  return { message: info.message || fallback, requestId: info.requestId };
}
