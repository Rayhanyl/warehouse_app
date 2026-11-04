import type { Paginated } from "@/types/api";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  warehouse_ids: number[];
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  code: string;
  description: string;
}

export interface AdminMenu {
  id: number;
  code: string;
  name: string;
  path: string;
  icon: string | null;
  parent_id: number | null;
  parent_name?: string | null;
  sort_order: number;
  permission_id: number | null;
  permission_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AdminUserPage = Paginated<AdminUser>;
export type AdminMenuPage = Paginated<AdminMenu>;
