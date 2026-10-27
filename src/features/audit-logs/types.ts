import type { Paginated } from "@/types/api";

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export type AuditLogPage = Paginated<AuditLog>;

export interface AuditLogFilters {
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  date_from: string;
  date_to: string;
}
