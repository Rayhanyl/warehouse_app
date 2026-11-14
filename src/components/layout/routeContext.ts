import type { MenuItem } from "@/features/navigation/types";

export interface FlattenedMenuEntry {
  item: MenuItem;
  groupName: string | null;
}

export interface RouteContextInfo {
  title: string;
  groupName: string | null;
}

const ROUTE_CONTEXT_MAP: Record<string, RouteContextInfo> = {
  "/profile": { title: "Profil", groupName: null },
  "/master/categories": { title: "Kategori barang", groupName: "Master data" },
  "/categories": { title: "Kategori barang", groupName: "Master data" },
  "/master/uom": { title: "Satuan ukur (UoM)", groupName: "Master data" },
  "/master/uoms": { title: "Satuan ukur (UoM)", groupName: "Master data" },
  "/uom": { title: "Satuan ukur (UoM)", groupName: "Master data" },
  "/uoms": { title: "Satuan ukur (UoM)", groupName: "Master data" },
  "/master/suppliers": { title: "Pemasok", groupName: "Master data" },
  "/suppliers": { title: "Pemasok", groupName: "Master data" },
  "/master/items": { title: "Barang (SKU)", groupName: "Master data" },
  "/items": { title: "Barang (SKU)", groupName: "Master data" },
  "/master/stocks": { title: "Barang (SKU)", groupName: "Master data" },
  "/stocks": { title: "Barang (SKU)", groupName: "Master data" },
  "/master/warehouses": { title: "Gudang", groupName: "Master data" },
  "/warehouses": { title: "Gudang", groupName: "Master data" },
  "/master/locations": { title: "Lokasi penyimpanan", groupName: "Master data" },
  "/master/storage-locations": { title: "Lokasi penyimpanan", groupName: "Master data" },
  "/locations": { title: "Lokasi penyimpanan", groupName: "Master data" },
  "/storage-locations": { title: "Lokasi penyimpanan", groupName: "Master data" },
  "/audit-logs": { title: "Audit log", groupName: "Administrasi" },
  "/users": { title: "Pengguna dan peran", groupName: "Administrasi dan keamanan" },
  "/admin": { title: "Pengguna dan peran", groupName: "Administrasi dan keamanan" },
  "/admin/users": { title: "Pengguna dan peran", groupName: "Administrasi dan keamanan" },
  "/admin/roles": { title: "Peran dan permission", groupName: "Administrasi dan keamanan" },
  "/admin/menus": { title: "Menu", groupName: "Administrasi dan keamanan" },
  "/admin/document-templates": {
    title: "Template dokumen",
    groupName: "Administrasi dan keamanan",
  },
  "/document-templates": {
    title: "Template dokumen",
    groupName: "Administrasi dan keamanan",
  },
  "/purchase-orders/new": {
    title: "Buat purchase order",
    groupName: "Pengadaan dan penerimaan",
  },
  "/purchasing/purchase-orders/new": {
    title: "Buat purchase order",
    groupName: "Pengadaan dan penerimaan",
  },
  "/purchase-orders": { title: "Purchase order", groupName: "Pengadaan dan penerimaan" },
  "/purchasing/purchase-orders": {
    title: "Purchase order",
    groupName: "Pengadaan dan penerimaan",
  },
  "/goods-receipts": { title: "Penerimaan barang", groupName: "Pengadaan dan penerimaan" },
  "/purchasing/goods-receipts": {
    title: "Penerimaan barang",
    groupName: "Pengadaan dan penerimaan",
  },
  "/goods-receipts/new": {
    title: "Buat penerimaan barang",
    groupName: "Pengadaan dan penerimaan",
  },
  "/purchasing/goods-receipts/new": {
    title: "Buat penerimaan barang",
    groupName: "Pengadaan dan penerimaan",
  },
  "/stock-transfers": { title: "Transfer stok", groupName: "Operasional gudang" },
  "/operations/stock-transfers": { title: "Transfer stok", groupName: "Operasional gudang" },
  "/stock-opnames": { title: "Stock opname", groupName: "Operasional gudang" },
  "/operations/stock-opnames": { title: "Stock opname", groupName: "Operasional gudang" },
  "/stock": { title: "Saldo stok per lokasi", groupName: "Monitoring saldo stok" },
  "/stock/warehouse": { title: "Saldo stok per gudang", groupName: "Monitoring saldo stok" },
  "/stock/by-warehouse": { title: "Saldo stok per gudang", groupName: "Monitoring saldo stok" },
  "/stock/by-location": { title: "Saldo stok per lokasi", groupName: "Monitoring saldo stok" },
  "/stock/summary": { title: "Ringkasan stok", groupName: "Monitoring saldo stok" },
  "/stock/in-transit": { title: "Stok dalam perjalanan", groupName: "Monitoring saldo stok" },
  "/stock/ledger": { title: "Buku besar stok", groupName: "Monitoring saldo stok" },
};

/**
 * Flattens nested navigation menu trees into linear entries paired with their parent group title.
 */
export function flattenMenuEntries(
  items: MenuItem[],
  parentName: string | null = null,
): FlattenedMenuEntry[] {
  return items.flatMap((item) => {
    const current: FlattenedMenuEntry = { item, groupName: parentName };
    const descendants = flattenMenuEntries(item.children, item.name);
    return [current, ...descendants];
  });
}

/**
 * Resolves breadcrumb title and section group for the active route pathname.
 */
export function resolveRouteContext(
  pathname: string,
  entries: FlattenedMenuEntry[],
): RouteContextInfo {
  const matched = entries.find((entry) => entry.item.path === pathname);
  if (matched) {
    return { title: matched.item.name, groupName: matched.groupName };
  }
  return ROUTE_CONTEXT_MAP[pathname] ?? { title: "Dasbor", groupName: null };
}

/**
 * Returns default sidebar collapsed state based on tablet breakpoint width.
 */
export function getInitialCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}
