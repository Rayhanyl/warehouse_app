import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardSummaryOut } from "./types";

export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"] as const,
};

async function fetchDashboardSummary(): Promise<DashboardSummaryOut> {
  const { data } = await apiClient.get<DashboardSummaryOut>("/dashboard/summary");
  return data;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: fetchDashboardSummary,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
