import type { Paginated } from "@/types/api";

export type AuditLogStatus = "SUCCESS" | "FAILED";

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  status: AuditLogStatus;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

export type AuditLogPage = Paginated<AuditLog>;

export interface AuditLogFilters {
  search: string;
  status: "" | AuditLogStatus;
  action: string;
  entity_type: string;
  date_from: string;
  date_to: string;
}
