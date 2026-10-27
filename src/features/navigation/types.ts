export interface MenuItem {
  id: number;
  code: string;
  name: string;
  short_name?: string | null;
  path: string;
  icon: string | null;
  menu_type?: "group" | "item";
  parent_id: number | null;
  sort_order: number;
  permission_code: string | null;
  is_active?: boolean;
  is_visible?: boolean;
  children: MenuItem[];
}
