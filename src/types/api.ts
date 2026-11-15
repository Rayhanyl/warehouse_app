export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type DecimalString = string;

export interface ApprovalLog {
  id: number;
  doc_type: string;
  doc_id: number;
  approval_level: number;
  action: "SUBMITTED" | "APPROVED" | "REJECTED";
  actor_id: number | null;
  actor_name: string | null;
  actor_role: string | null;
  notes: string | null;
  created_at: string;
}
