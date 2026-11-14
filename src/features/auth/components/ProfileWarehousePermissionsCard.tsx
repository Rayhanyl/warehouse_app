import { useMemo } from "react";
import { Key, Warehouse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthUser, AuthWarehouseRef } from "@/features/auth/store";
import { formatWarehouseScopeLabel } from "@/hooks/useWarehouseScope";

export interface ProfileWarehousePermissionsCardProps {
  user: AuthUser | null;
}

const PERMISSION_MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  items: "Barang (SKU)",
  categories: "Kategori Barang",
  uoms: "Satuan (UOM)",
  suppliers: "Pemasok",
  warehouse: "Gudang",
  warehouses: "Gudang",
  location: "Lokasi Rak",
  locations: "Lokasi Rak",
  master: "Data Master",
  po: "Purchase Order (PO)",
  gr: "Penerimaan Barang (GR)",
  stock: "Saldo Stok",
  ledger: "Buku Besar Stok",
  transfer: "Transfer Stok",
  opname: "Stock Opname",
  audit: "Audit Log",
  user: "Administrasi Pengguna & Keamanan",
  templates: "Template Dokumen",
};

interface PermissionGroup {
  key: string;
  label: string;
  codes: string[];
}

function groupPermissionsByModule(permissions: readonly string[]): PermissionGroup[] {
  const buckets = new Map<string, string[]>();

  for (const rawCode of permissions) {
    const code = rawCode.trim();
    if (!code) continue;
    const prefix = (code.split(":")[0] || "lainnya").toLowerCase();
    const existing = buckets.get(prefix);
    if (existing) {
      existing.push(code);
    } else {
      buckets.set(prefix, [code]);
    }
  }

  return Array.from(buckets.entries()).map(([key, codes]) => ({
    key,
    label:
      PERMISSION_MODULE_LABELS[key] ??
      key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    codes: [...codes].sort(),
  }));
}

function resolveProfileWarehouses(user: AuthUser | null): AuthWarehouseRef[] {
  if (!user) return [];
  if (user.warehouses && user.warehouses.length > 0) {
    return user.warehouses;
  }
  return (user.warehouse_ids ?? []).map((warehouseId) => ({
    id: warehouseId,
    code: "",
    name: `Gudang #${warehouseId}`,
    is_active: true,
  }));
}

/**
 * Kartu cakupan gudang (kode & nama dari MeOut) serta ringkasan hak akses per modul.
 */
export function ProfileWarehousePermissionsCard({
  user,
}: ProfileWarehousePermissionsCardProps) {
  const hasAllWarehouseAccess = Boolean(
    user?.has_all_warehouse_access || user?.role_name === "Super Admin",
  );
  const warehouses = useMemo(() => resolveProfileWarehouses(user), [user]);
  const permissionGroups = useMemo(
    () => groupPermissionsByModule(user?.permissions ?? []),
    [user?.permissions],
  );
  const totalPermissions = user?.permissions?.length ?? 0;

  return (
    <Card aria-labelledby="profile-access-title" className="gap-5 py-5 sm:py-6">
      <CardHeader className="border-b border-border px-5 pb-4 sm:px-6">
        <CardTitle className="text-base font-bold text-ink-950" id="profile-access-title">
          Cakupan Gudang & Hak Akses
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed text-slate-600">
          Daftar penugasan gudang dan permission aktif yang melekat pada peran Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-5 sm:px-6">
        {/* Bagian Cakupan Gudang */}
        <section aria-labelledby="profile-warehouses-heading" className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Warehouse aria-hidden="true" className="size-4 text-teal-700" />
            <h3
              className="text-xs font-semibold uppercase tracking-wide text-slate-600"
              id="profile-warehouses-heading"
            >
              Gudang yang Ditugaskan
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasAllWarehouseAccess ? (
              <Badge
                className="border-teal-300 bg-teal-100 font-semibold text-teal-800"
                variant="outline"
              >
                Akses Seluruh Gudang
              </Badge>
            ) : null}

            {warehouses.map((warehouse) => (
              <Badge
                className="border-teal-200 bg-teal-50 text-teal-800"
                key={warehouse.id}
                variant="outline"
              >
                {formatWarehouseScopeLabel(warehouse)}
                {warehouse.is_active === false ? " (Nonaktif)" : ""}
              </Badge>
            ))}

            {!hasAllWarehouseAccess && warehouses.length === 0 ? (
              <p className="text-sm font-medium text-slate-600">
                Belum ada gudang yang ditugaskan.
              </p>
            ) : null}
          </div>
        </section>

        {/* Bagian Ringkasan Hak Akses */}
        <section
          aria-labelledby="profile-permissions-heading"
          className="space-y-3 border-t border-border pt-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Key aria-hidden="true" className="size-4 text-teal-700" />
              <h3
                className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                id="profile-permissions-heading"
              >
                Hak Akses Modul
              </h3>
            </div>
            <Badge className="tabular-nums" variant="secondary">
              {totalPermissions} permission
            </Badge>
          </div>

          {permissionGroups.length === 0 ? (
            <p className="text-sm text-slate-600">
              Belum ada hak akses yang ditetapkan untuk peran akun ini.
            </p>
          ) : (
            <div className="space-y-3">
              {permissionGroups.map((group) => (
                <div
                  className="rounded-lg border border-border bg-muted/40 p-3"
                  key={group.key}
                >
                  <p className="text-xs font-semibold text-ink-950">
                    {group.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.codes.map((code) => (
                      <Badge
                        className="border-border bg-card font-mono text-[11px] font-normal text-slate-700"
                        key={code}
                        variant="outline"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
