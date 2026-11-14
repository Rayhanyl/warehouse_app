import { itemFormSchema, validateZodSchema } from "../validation";
import type { StockFormPayload, StockItem } from "./types";

export { itemFormSchema, validateZodSchema };

export interface StockCategoryOption {
  id: number;
  name: string;
}

export interface StockUomOption {
  id: number;
  code: string;
  name: string;
  allow_decimal: boolean;
}

export interface StockFormErrors {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  uom?: string;
}

interface ValidateStockInput {
  mode: "create" | "edit";
  initialItem: StockItem | null;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: number;
  uomId: number;
  isActive: boolean;
  existingItems: StockItem[];
  categoryOptions: StockCategoryOption[];
  uomOptions: StockUomOption[];
}

/** Validasi form barang (SKU), duplikasi SKU/barcode lokal, dan bangun payload submit. */
export function validateAndBuildStockPayload(
  input: ValidateStockInput,
): { ok: true; payload: StockFormPayload } | { ok: false; errors: StockFormErrors } {
  const parsed = validateZodSchema(itemFormSchema, {
    sku: input.sku,
    barcode: input.barcode,
    name: input.name,
    description: input.description,
    category_id: input.categoryId,
    uom_id: input.uomId,
    is_active: input.isActive,
  });

  const nextErrors: StockFormErrors = parsed.ok
    ? {}
    : {
        sku: parsed.fieldErrors.sku,
        barcode: parsed.fieldErrors.barcode,
        name: parsed.fieldErrors.name,
        description: parsed.fieldErrors.description,
        category: parsed.fieldErrors.category_id,
        uom: parsed.fieldErrors.uom_id,
      };

  const trimmedSku = input.sku.trim();
  const trimmedBarcode = input.barcode.trim();

  if (
    !nextErrors.sku &&
    input.existingItems.some(
      (item) =>
        item.sku.toLowerCase() === trimmedSku.toLowerCase() &&
        (input.mode === "create" || item.id !== input.initialItem?.id),
    )
  ) {
    nextErrors.sku = "SKU sudah digunakan.";
  }

  if (
    trimmedBarcode &&
    !nextErrors.barcode &&
    input.existingItems.some(
      (item) =>
        item.barcode &&
        item.barcode.toLowerCase() === trimmedBarcode.toLowerCase() &&
        (input.mode === "create" || item.id !== input.initialItem?.id),
    )
  ) {
    nextErrors.barcode = "Barcode sudah digunakan pada barang lain.";
  }

  const selectedCategory = input.categoryOptions.find(
    (cat) => cat.id === input.categoryId,
  );
  if (!input.categoryId || !selectedCategory) {
    nextErrors.category = "Pilih kategori aktif.";
  }

  const selectedUom = input.uomOptions.find((u) => u.id === input.uomId);
  if (!input.uomId || !selectedUom) {
    nextErrors.uom = "Pilih satuan ukur aktif.";
  }

  if (
    !parsed.ok ||
    nextErrors.sku ||
    nextErrors.barcode ||
    nextErrors.category ||
    nextErrors.uom ||
    !selectedCategory ||
    !selectedUom
  ) {
    return { ok: false, errors: nextErrors };
  }

  return {
    ok: true,
    payload: {
      sku: parsed.data.sku,
      barcode: parsed.data.barcode || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name,
      uom_id: selectedUom.id,
      uom_code: selectedUom.code,
      uom_name: selectedUom.name,
      allow_decimal: selectedUom.allow_decimal,
      is_active: parsed.data.is_active,
    },
  };
}
