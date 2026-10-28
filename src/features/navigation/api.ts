import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MenuItem } from "./types";

export const menuQueryKey = ["navigation", "my-menu"];

export function normalizeMenu(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.is_visible !== false && item.is_active !== false)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id)
    .map((item) => ({
      ...item,
      children: normalizeMenu(Array.isArray(item.children) ? item.children : []),
    }))
    .filter((item) => {
      if (item.menu_type === "group") {
        return item.children.length > 0;
      }
      return true;
    });
}

async function fetchMyMenu() {
  const { data } = await apiClient.get<MenuItem[]>("/menus/my-menu");
  return normalizeMenu(Array.isArray(data) ? data : []);
}

export function useMyMenu() {
  return useQuery({
    queryKey: menuQueryKey,
    queryFn: fetchMyMenu,
    staleTime: 5 * 60 * 1000,
  });
}
