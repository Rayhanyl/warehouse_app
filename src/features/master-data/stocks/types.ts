export interface StockItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string;
  uom_id: number;
  uom_code: string;
  uom_name: string;
  allow_decimal: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type StockStatusFilter = "all" | "active" | "inactive";

export interface StockFormPayload {
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string;
  uom_id: number;
  uom_code: string;
  uom_name: string;
  allow_decimal: boolean;
  is_active: boolean;
}
