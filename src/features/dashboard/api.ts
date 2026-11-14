import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardSummaryOut } from "./types";

export const dashboardQueryKeys = {
  summary: (warehouseId: number | null = null) =>
    ["dashboard", "summary", warehouseId] as const,
};

async function fetchDashboardSummary(
  warehouseId: number | null,
): Promise<DashboardSummaryOut> {
  const { data } =
    warehouseId !== null
      ? await apiClient.get<DashboardSummaryOut>("/dashboard/summary", {
          params: { warehouse_id: warehouseId },
        })
      : await apiClient.get<DashboardSummaryOut>("/dashboard/summary");
  return data;
}

export function useDashboardSummary(warehouseId: number | null = null) {
  return useQuery({
    queryKey: dashboardQueryKeys.summary(warehouseId),
    queryFn: () => fetchDashboardSummary(warehouseId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
