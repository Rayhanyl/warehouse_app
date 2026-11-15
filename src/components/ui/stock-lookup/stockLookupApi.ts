import { apiClient } from "@/lib/api-client";
import type { StockBalance } from "@/features/stock/types";
import type { Paginated } from "@/types/api";

export interface ItemSummary {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  category_name?: string;
  uom_code?: string;
}

export interface LocationSummary {
  scope: "location" | "warehouse";
  code: string;
  name: string;
  warehouse_code: string;
  warehouse_name: string;
}

export interface LookupResolution {
  balances: StockBalance[];
  itemInfo: ItemSummary | null;
  locationInfo: LocationSummary | null;
}

/**
 * Resolves a scanned barcode, SKU, or location/warehouse code into matching stock balances and metadata.
 */
export async function fetchStockLookupResult(trimmed: string): Promise<LookupResolution> {
  const lower = trimmed.toLowerCase();
  const { data: balanceData } = await apiClient.get<Paginated<StockBalance>>(
    "/stock/by-location",
    {
      params: {
        search: trimmed,
        limit: 100,
      },
    },
  );

  const items = balanceData?.items || [];
  if (items.length > 0) {
    const first = items[0];
    const exactLocationMatch = items.some(
      (row) =>
        row.location_code.toLowerCase() === lower ||
        row.location_name.toLowerCase() === lower,
    );
    const exactWarehouseMatch =
      !exactLocationMatch &&
      items.some(
        (row) =>
          row.warehouse_code.toLowerCase() === lower ||
          row.warehouse_name.toLowerCase() === lower,
      );
    const anyItemFieldMatch = items.some(
      (row) =>
        row.item_sku.toLowerCase().includes(lower) ||
        Boolean(row.item_barcode && row.item_barcode.toLowerCase().includes(lower)) ||
        row.item_name.toLowerCase().includes(lower),
    );

    if (exactLocationMatch || exactWarehouseMatch || !anyItemFieldMatch) {
      return {
        balances: items,
        itemInfo: null,
        locationInfo: exactWarehouseMatch
          ? {
              scope: "warehouse",
              code: first.warehouse_code,
              name: first.warehouse_name,
              warehouse_code: first.warehouse_code,
              warehouse_name: first.warehouse_name,
            }
          : {
              scope: "location",
              code: first.location_code,
              name: first.location_name,
              warehouse_code: first.warehouse_code,
              warehouse_name: first.warehouse_name,
            },
      };
    }

    return {
      balances: items,
      locationInfo: null,
      itemInfo: {
        id: first.item_id,
        sku: first.item_sku,
        barcode: first.item_barcode || null,
        name: first.item_name,
        category_name: first.category_name,
        uom_code: first.uom_code,
      },
    };
  }

  let resolvedItemInfo: ItemSummary | null = null;
  try {
    const { data: itemData } = await apiClient.get<
      Paginated<{
        id: number;
        sku: string;
        barcode: string | null;
        name: string;
        category_name: string;
        uom_code: string;
      }>
    >("/items", {
      params: {
        search: trimmed,
        limit: 5,
      },
    });

    const matched =
      itemData?.items?.find(
        (it) =>
          it.sku.toLowerCase() === lower ||
          (it.barcode && it.barcode.toLowerCase() === lower),
      ) || itemData?.items?.[0];

    if (matched) {
      resolvedItemInfo = {
        id: matched.id,
        sku: matched.sku,
        barcode: matched.barcode,
        name: matched.name,
        category_name: matched.category_name,
        uom_code: matched.uom_code,
      };
    }
  } catch {
    // Abaikan dan lanjutkan cek lokasi rak bila perlu
  }

  if (resolvedItemInfo) {
    return {
      balances: [],
      itemInfo: resolvedItemInfo,
      locationInfo: null,
    };
  }

  let resolvedLocationInfo: LocationSummary | null = null;
  try {
    const { data: locationData } = await apiClient.get<
      Paginated<{
        id: number;
        code: string;
        name: string;
        warehouse_code: string;
        warehouse_name: string;
      }>
    >("/locations", {
      params: {
        search: trimmed,
        limit: 5,
      },
    });

    const matchedLoc =
      locationData?.items?.find(
        (loc) =>
          loc.code.toLowerCase() === lower ||
          loc.name.toLowerCase() === lower,
      ) || locationData?.items?.[0];

    if (matchedLoc) {
      resolvedLocationInfo = {
        scope: "location",
        code: matchedLoc.code,
        name: matchedLoc.name,
        warehouse_code: matchedLoc.warehouse_code,
        warehouse_name: matchedLoc.warehouse_name,
      };
    }
  } catch {
    // Biarkan kosong jika tidak ditemukan di items maupun locations
  }

  return {
    balances: [],
    itemInfo: null,
    locationInfo: resolvedLocationInfo,
  };
}
