import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Key, Search, Warehouse } from "lucide-react";

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
  const [permSearch, setPermSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const filteredPermissionGroups = useMemo(() => {
    const query = permSearch.trim().toLowerCase();
    if (!query) return permissionGroups;
    return permissionGroups
      .map((group) => {
        const labelMatches = group.label.toLowerCase().includes(query);
        const matchingCodes = labelMatches
          ? group.codes
          : group.codes.filter((code) => code.toLowerCase().includes(query));
        if (matchingCodes.length === 0) return null;
        return { ...group, codes: matchingCodes };
      })
      .filter((item): item is PermissionGroup => item !== null);
  }, [permSearch, permissionGroups]);

  function toggleGroupCollapse(groupKey: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Key aria-hidden="true" className="size-4 text-teal-700" />
              <h3
                className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                id="profile-permissions-heading"
              >
                Hak Akses Modul
              </h3>
              <Badge className="tabular-nums" variant="secondary">
                {totalPermissions} permission
              </Badge>
            </div>
            {permissionGroups.length > 4 && (
              <div className="relative w-full sm:w-64">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-500"
                />
                <input
                  aria-label="Cari modul atau kode hak akses"
                  className="h-9 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 pr-3 pl-8 text-xs text-ink-950 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  onChange={(event) => setPermSearch(event.target.value)}
                  placeholder="Cari modul atau permission..."
                  type="search"
                  value={permSearch}
                />
              </div>
            )}
          </div>

          {permissionGroups.length === 0 ? (
            <p className="text-sm text-slate-600">
              Belum ada hak akses yang ditetapkan untuk peran akun ini.
            </p>
          ) : filteredPermissionGroups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-slate-600">
              Tidak ada modul atau permission yang cocok dengan kata kunci &ldquo;{permSearch}&rdquo;.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPermissionGroups.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.key]) && !permSearch.trim();
                return (
                  <div
                    className="flex flex-col rounded-lg border border-border bg-muted/40 p-3"
                    key={group.key}
                  >
                    <button
                      aria-expanded={!isCollapsed}
                      className="flex w-full items-center justify-between gap-2 text-left"
                      onClick={() => toggleGroupCollapse(group.key)}
                      type="button"
                    >
                      <span className="text-xs font-semibold text-ink-950">
                        {group.label}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-600 tabular-nums">
                        <span>{group.codes.length}</span>
                        {isCollapsed ? (
                          <ChevronRight aria-hidden="true" className="size-3.5" />
                        ) : (
                          <ChevronDown aria-hidden="true" className="size-3.5" />
                        )}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
