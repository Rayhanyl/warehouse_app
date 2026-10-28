import type { Paginated } from "@/types/api";

export interface Uom {
  id: number;
  code: string;
  name: string;
  allow_decimal: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type UomPage = Paginated<Uom>;

export type UomSortField = "id" | "code" | "name" | "created_at";
export type SortDirection = "asc" | "desc";
export type UomStatusFilter = "all" | "active" | "inactive";

export interface UomListParams {
  limit: number;
  offset: number;
  search: string;
  status: UomStatusFilter;
  sort_by: UomSortField;
  sort_dir: SortDirection;
}

export interface UomCreatePayload {
  code: string;
  name: string;
  allow_decimal?: boolean;
  is_active?: boolean;
}

export interface UomUpdatePayload {
  code?: string;
  name?: string;
  allow_decimal?: boolean;
  is_active?: boolean;
}

