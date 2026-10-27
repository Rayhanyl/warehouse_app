import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AuditLogFilters, AuditLogPage } from "./types";

export const auditLogQueryKey = ["audit-logs"];

function toQueryParams(filters: AuditLogFilters, offset: number) {
  const params = new URLSearchParams({
    limit: "20",
    offset: String(offset),
    sort_by: "created_at",
    sort_dir: "desc",
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    params.set(key, key.startsWith("date_") ? new Date(value).toISOString() : value);
  });

  return params;
}

async function fetchAuditLogs(filters: AuditLogFilters, offset: number) {
  const { data } = await apiClient.get<AuditLogPage>("/audit-logs", {
    params: toQueryParams(filters, offset),
  });
  return data;
}

export function useAuditLogs(filters: AuditLogFilters, offset: number) {
  return useQuery({
    queryKey: [...auditLogQueryKey, filters, offset],
    queryFn: () => fetchAuditLogs(filters, offset),
    placeholderData: (previousData) => previousData,
  });
}
