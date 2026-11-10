import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AdminMenuPage,
  AdminMenu,
  AdminMenuPayload,
  AdminUser,
  AdminUserPage,
  AdminUserWarehouse,
  AdminWarehouse,
  Permission,
  Role,
} from "./types";

export const administrationKeys = {
  all: ["administration"] as const,
  users: (params: UserParams) => [...administrationKeys.all, "users", params] as const,
  roles: () => [...administrationKeys.all, "roles"] as const,
  permissions: () => [...administrationKeys.all, "permissions"] as const,
  menus: (params: MenuParams) => [...administrationKeys.all, "menus", params] as const,
  warehouses: () => [...administrationKeys.all, "warehouses"] as const,
  userWarehouses: (id: number) => [...administrationKeys.all, "user-warehouses", id] as const,
};

export interface UserParams {
  limit: number;
  offset: number;
  search: string;
  is_active: string;
}

export interface MenuParams {
  limit: number;
  offset: number;
  search: string;
  is_active: string;
}

export function useAdminUsers(params: UserParams, enabled = true) {
  return useQuery({
    queryKey: administrationKeys.users(params),
    queryFn: async () => (await apiClient.get<AdminUserPage>("/users", { params })).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminRoles(enabled = true) {
  return useQuery({
    queryKey: administrationKeys.roles(),
    queryFn: async () => (await apiClient.get<Role[]>("/users/roles")).data,
    enabled,
  });
}

export function useAdminPermissions(enabled = true) {
  return useQuery({
    queryKey: administrationKeys.permissions(),
    queryFn: async () => (await apiClient.get<Permission[]>("/users/permissions")).data,
    enabled,
  });
}

export function useAdminMenus(params: MenuParams, enabled = true) {
  return useQuery({
    queryKey: administrationKeys.menus(params),
    queryFn: async () => (await apiClient.get<AdminMenuPage>("/menus", { params })).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateAdminMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminMenuPayload) => apiClient.post<AdminMenu>("/menus", payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...administrationKeys.all, "menus"] }),
  });
}

export function useUpdateAdminMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AdminMenuPayload> & { clear_parent?: boolean; clear_permission?: boolean } }) =>
      apiClient.patch<AdminMenu>(`/menus/${id}`, payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...administrationKeys.all, "menus"] }),
  });
}

export function useAdminWarehouses(enabled = true) {
  return useQuery({
    queryKey: administrationKeys.warehouses(),
    queryFn: async () =>
      (
        await apiClient.get<{ items: AdminWarehouse[] }>("/warehouses", {
          params: {
            limit: 200,
            offset: 0,
            is_active: true,
            sort_by: "name",
            sort_dir: "asc",
          },
        })
      ).data.items,
    enabled,
  });
}

export function useAdminUserWarehouses(userId: number | null, enabled = true) {
  return useQuery({
    queryKey: administrationKeys.userWarehouses(userId ?? 0),
    queryFn: async () => (await apiClient.get<AdminUserWarehouse[]>(`/users/${userId}/warehouses`)).data,
    enabled: enabled && userId !== null,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      username: string;
      email: string;
      password: string;
      full_name: string;
      role_id: number;
      is_active: boolean;
      warehouse_ids: number[];
    }) => apiClient.post<AdminUser>("/users", payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...administrationKeys.all, "users"] }),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Pick<AdminUser, "email" | "full_name" | "role_id" | "is_active">> & { password?: string } }) =>
      apiClient.patch<AdminUser>(`/users/${id}`, payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...administrationKeys.all, "users"] }),
  });
}

export function useUpdateAdminUserWarehouses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouse_ids }: { id: number; warehouse_ids: number[] }) =>
      apiClient.put<AdminUserWarehouse[]>(`/users/${id}/warehouses`, { warehouse_ids }).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...administrationKeys.all, "users"] });
      queryClient.invalidateQueries({ queryKey: administrationKeys.userWarehouses(variables.id) });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) =>
      apiClient.put<Role>(`/users/roles/${id}/permissions`, { permissions }).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: administrationKeys.roles() }),
  });
}
