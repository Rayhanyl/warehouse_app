import { Warehouse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DashboardAssignedWarehouse } from "../types";

export interface WarehouseScopeBarProps {
  assignedWarehouses: readonly DashboardAssignedWarehouse[];
  activeWarehouseId: number | null;
  activeWarehouseLabel: string;
}

/**
 * Menampilkan ringkasan cakupan gudang pengguna serta filter gudang aktif dari Top Bar.
 */
export function WarehouseScopeBar({
  assignedWarehouses,
  activeWarehouseId,
  activeWarehouseLabel,
}: WarehouseScopeBarProps) {
  return (
    <div
      aria-label="Cakupan gudang dashboard"
      className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/45 px-4 py-2.5 text-xs text-slate-700"
      data-slot="dashboard-warehouse-scope-bar"
    >
      <Warehouse aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
      <span className="font-semibold text-ink-950">Cakupan Gudang:</span>

      {assignedWarehouses.length === 0 ? (
        <span className="text-slate-600">
          Tidak ada gudang yang ditugaskan atau akun berstatus non-operasional.
        </span>
      ) : assignedWarehouses.length === 1 ? (
        <Badge
          className="border-teal-200 bg-teal-50 text-teal-700"
          variant="outline"
        >
          {assignedWarehouses[0].code} ({assignedWarehouses[0].name})
        </Badge>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {assignedWarehouses.map((wh) => (
            <Badge
              className="border-border bg-card text-slate-700"
              key={wh.id}
              title={wh.name}
              variant="outline"
            >
              {wh.code}
            </Badge>
          ))}
          <span className="text-slate-600">
            ({assignedWarehouses.length} gudang)
          </span>
        </div>
      )}

      {activeWarehouseId !== null ? (
        <Badge
          className="border-teal-300 bg-teal-100 font-semibold text-teal-800 sm:ml-auto"
          variant="outline"
        >
          Filter aktif: {activeWarehouseLabel}
        </Badge>
      ) : null}
    </div>
  );
}
