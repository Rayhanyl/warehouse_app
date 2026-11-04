import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  StockBalancePage,
  StockListParams,
  StockMovementPage,
  StockSummaryPage,
  WarehouseStockBalancePage,
} from "./types";

export const stockKeys = {
  all: ["stock"] as const,
  balances: (params: StockListParams) => [...stockKeys.all, "balances", params] as const,
  warehouseBalances: (params: StockListParams) =>
    [...stockKeys.all, "warehouse-balances", params] as const,
  summary: (params: StockListParams) => [...stockKeys.all, "summary", params] as const,
  movements: (params: StockListParams) => [...stockKeys.all, "movements", params] as const,
};

function toParams(params: StockListParams) {
  return {
    limit: params.limit,
    offset: params.offset,
    search: params.search.trim() || undefined,
    warehouse_id: params.warehouse_id || undefined,
    location_id: params.location_id || undefined,
    item_id: params.item_id || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  };
}

export async function fetchStockBalances(params: StockListParams): Promise<StockBalancePage> {
  const { data } = await apiClient.get<StockBalancePage>("/stock/by-location", {
    params: toParams(params),
  });
  return data;
}

export async function fetchWarehouseBalances(
  params: StockListParams,
): Promise<WarehouseStockBalancePage> {
  const { data } = await apiClient.get<WarehouseStockBalancePage>("/stock/by-warehouse", {
    params: toParams(params),
  });
  return data;
}

export async function fetchStockSummary(params: StockListParams): Promise<StockSummaryPage> {
  const { data } = await apiClient.get<StockSummaryPage>("/stock/summary", {
    params: toParams(params),
  });
  return data;
}

export async function fetchStockMovements(params: StockListParams): Promise<StockMovementPage> {
  const { data } = await apiClient.get<StockMovementPage>("/stock/ledger", {
    params: toParams(params),
  });
  return data;
}

export function useStockBalances(params: StockListParams, enabled = true) {
  return useQuery({
    queryKey: stockKeys.balances(params),
    queryFn: () => fetchStockBalances(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useWarehouseBalances(params: StockListParams, enabled = true) {
  return useQuery({
    queryKey: stockKeys.warehouseBalances(params),
    queryFn: () => fetchWarehouseBalances(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStockSummary(params: StockListParams, enabled = true) {
  return useQuery({
    queryKey: stockKeys.summary(params),
    queryFn: () => fetchStockSummary(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStockMovements(params: StockListParams, enabled = true) {
  return useQuery({
    queryKey: stockKeys.movements(params),
    queryFn: () => fetchStockMovements(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
