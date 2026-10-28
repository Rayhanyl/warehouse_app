import type { Paginated } from "@/types/api";

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type SupplierPage = Paginated<Supplier>;

export type SupplierSortField = "id" | "code" | "name" | "created_at";
export type SortDirection = "asc" | "desc";
export type SupplierStatusFilter = "all" | "active" | "inactive";

export interface SupplierListParams {
  limit: number;
  offset: number;
  search: string;
  status: SupplierStatusFilter;
  sort_by: SupplierSortField;
  sort_dir: SortDirection;
}

export interface SupplierFormPayload {
  code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}
