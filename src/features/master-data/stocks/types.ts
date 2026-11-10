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

export interface StockImportError {
  row: number;
  field: string;
  code: string;
  message: string;
}

export interface StockImportResult {
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: StockImportError[];
}
