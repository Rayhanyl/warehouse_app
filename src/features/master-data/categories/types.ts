import type { Paginated } from "@/types/api";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type CategoryPage = Paginated<Category>;

export type CategorySortField = "id" | "name" | "created_at";
export type SortDirection = "asc" | "desc";
export type CategoryStatusFilter = "all" | "active" | "inactive";

export interface CategoryListParams {
  limit: number;
  offset: number;
  search: string;
  status: CategoryStatusFilter;
  sort_by: CategorySortField;
  sort_dir: SortDirection;
}

export interface CategoryCreatePayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryUpdatePayload {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

