import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import { invalidateAndRefetchAll } from "@/lib/query-invalidation";
import type { StockTransfer, StockTransferCreatePayload, StockTransferPage, StockTransferUpdatePayload, TransferReceiveLinePayload, TransferReference } from "./types";

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
  warehouse_id?: number | null;
  date_from: string;
  date_to: string;
}

export async function fetchTransfers(params: TransferListParams): Promise<StockTransferPage> {
  const query = {
    limit: params.limit,
    offset: params.offset,
    search: params.search.trim() || undefined,
    status: params.status === "all" ? undefined : params.status,
    warehouse_id: params.warehouse_id ?? undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  };
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

function getCreatePayload(payload: StockTransferCreatePayload | StockTransferUpdatePayload): StockTransferCreatePayload {
  if (
    payload.source_warehouse_id === undefined ||
    payload.source_location_id === undefined ||
    payload.destination_warehouse_id === undefined ||
    payload.destination_location_id === undefined ||
    payload.lines === undefined
  ) {
    throw new Error("Data transfer baru belum lengkap.");
  }

  return {
    source_warehouse_id: payload.source_warehouse_id,
    source_location_id: payload.source_location_id,
    destination_warehouse_id: payload.destination_warehouse_id,
    destination_location_id: payload.destination_location_id,
    notes: payload.notes,
    lines: payload.lines,
  };
}

export async function updateTransfer(id: number, payload: StockTransferUpdatePayload) {
  const { data } = await apiClient.patch<StockTransfer>(`/stock-transfers/${id}`, payload);
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

export function useTransferMutation(action: "create" | "update" | "approve" | "ship" | "cancel" | "receive") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, lines }: { id?: number; payload?: StockTransferCreatePayload | StockTransferUpdatePayload; lines?: TransferReceiveLinePayload[] }) => {
      if (action === "create") return createTransfer(getCreatePayload(payload!));
      if (action === "update") {
        if (!id) throw new Error("ID transfer tidak tersedia.");
        return updateTransfer(id, payload!);
      }
      if (!id) throw new Error("ID transfer tidak tersedia.");
      return transferAction(id, action, lines);
    },
    onSuccess: async (transfer) => {
      queryClient.setQueryData(transferKeys.detail(transfer.id), transfer);
      await invalidateAndRefetchAll(queryClient, [
        transferKeys.lists(),
        ["stock"],
        ["dashboard"],
      ]);
    },
  });
}

export function useTransferReferences() {
  return useQuery({
    queryKey: [...transferKeys.all, "references"],
    queryFn: async () => {
      const [warehouses, locations, items] = await Promise.all([
        apiClient.get<{ items: TransferReference[] }>("/warehouses", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: TransferReference[] }>("/locations", { params: { limit: 200, offset: 0, is_active: true } }),
        apiClient.get<{ items: TransferReference[] }>("/items", { params: { limit: 200, offset: 0, is_active: true } }),
      ]);
      return {
        warehouses: warehouses.data.items,
        locations: locations.data.items,
        items: items.data.items.map((item) => ({
          ...item,
          code: item.code || item.sku || "",
          sku: item.sku || item.code || "",
          barcode: item.barcode ?? null,
        })),
      };
    },
  });
}

export interface SourceLocationBalanceItem {
  item_id: number;
  qty_on_hand: string;
  uom_code?: string;
}

export function useSourceLocationStock(
  warehouseId: number | null,
  locationId: number | null,
) {
  return useQuery({
    queryKey: [...transferKeys.all, "source-stock", warehouseId, locationId],
    enabled: Boolean(warehouseId && locationId),
    queryFn: async () => {
      const [balancesRes, opnamesRes] = await Promise.all([
        apiClient.get<{ items: SourceLocationBalanceItem[] }>("/stock/by-location", {
          params: {
            warehouse_id: warehouseId,
            location_id: locationId,
            limit: 200,
            offset: 0,
          },
        }),
        apiClient
          .get<{
            items: {
              id: number;
              opname_number: string;
              scope_type?: string;
              location_ids?: number[];
            }[];
          }>("/stock-opnames", {
            params: {
              warehouse_id: warehouseId,
              status: "IN_PROGRESS",
              limit: 50,
              offset: 0,
            },
          })
          .catch(() => ({ data: { items: [] } })),
      ]);

      const activeOpnames = opnamesRes.data?.items ?? [];
      const frozenOpname = activeOpnames.find(
        (op) =>
          op.scope_type === "WAREHOUSE" ||
          (op.location_ids ?? []).includes(Number(locationId)),
      );

      return {
        balances: balancesRes.data?.items ?? [],
        frozenByOpname: frozenOpname?.opname_number ?? null,
      };
    },
  });
}

export function mapTransferError(error: unknown, fallback: string) {
  const info = extractApiErrorInfo(error);
  if (info.status === 403) {
    if (info.details?.code === "SOD_VIOLATION") {
      return (
        info.message ||
        "Pemisahan tugas (SoD): pembuat draft transfer tidak boleh menyetujui transfer-nya sendiri."
      );
    }
    return info.message || "Anda tidak memiliki izin atau akses gudang untuk aksi ini.";
  }
  if (info.status === 409) return info.message || "Status transfer atau saldo sudah berubah. Muat ulang data sebelum mencoba lagi.";
  if (info.status === 422) return info.message || "Data transfer belum valid. Periksa lokasi dan kuantitas.";
  return info.message || fallback;
}
