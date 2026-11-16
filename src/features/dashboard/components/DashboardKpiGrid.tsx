import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Layers,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { DataStateBanner } from "@/components/shared/DataStateBanner";
import { formatDecimal } from "@/lib/decimal";
import type { DashboardStockSummary } from "../types";

export interface DashboardKpiGridProps {
  stockSummary?: DashboardStockSummary;
  activeWarehouseId?: number | null;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

interface KpiCardDescriptor {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  cardHoverClass: string;
  iconContainerClass: string;
  valueClass?: string;
}

/**
 * Menampilkan 4 kartu metrik utama (KPI) dashboard stok dan distribusi.
 */
export function DashboardKpiGrid({
  stockSummary,
  activeWarehouseId = null,
  isLoading,
  isError,
  onRetry,
}: DashboardKpiGridProps) {
  const lowStockCount = stockSummary?.low_stock_items_count ?? 0;
  const isScopedWarehouse = activeWarehouseId !== null && activeWarehouseId !== undefined;

  const cards: KpiCardDescriptor[] = [
    {
      id: "total-sku",
      title: "Total Katalog SKU",
      value: stockSummary?.total_active_items.toLocaleString("id-ID") ?? "0",
      subtitle: isScopedWarehouse ? "SKU aktif di gudang ini" : "Barang aktif tercatat",
      to: isScopedWarehouse ? "/stock/by-warehouse" : "/master/items",
      icon: Boxes,
      cardHoverClass: "hover:border-teal-500",
      iconContainerClass:
        "bg-teal-50 text-teal-700 group-hover:bg-teal-100",
    },
    {
      id: "on-hand",
      title: "Total Stok Fisik",
      value: stockSummary ? formatDecimal(stockSummary.total_qty_on_hand) : "0",
      subtitle: isScopedWarehouse ? "Unit saldo fisik gudang ini" : "Unit saldo on-hand",
      to: "/stock",
      icon: Layers,
      cardHoverClass: "hover:border-emerald-500",
      iconContainerClass:
        "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    },
    {
      id: "in-transit",
      title: "Dalam Pengiriman",
      value: stockSummary
        ? formatDecimal(stockSummary.total_qty_in_transit)
        : "0",
      subtitle: isScopedWarehouse ? "Unit menuju gudang ini" : "Unit transfer in-transit",
      to: "/stock-transfers",
      icon: Truck,
      cardHoverClass: "hover:border-sky-500",
      iconContainerClass: "bg-sky-50 text-sky-700 group-hover:bg-sky-100",
    },
    {
      id: "low-stock",
      title: "Perhatian Stok Kritis",
      value: lowStockCount.toLocaleString("id-ID"),
      subtitle: "Barang dengan stok <= Min. Stok",
      to: "/stock/by-warehouse?critical=true",
      icon: AlertTriangle,
      cardHoverClass: "hover:border-rose-500",
      iconContainerClass:
        lowStockCount > 0
          ? "bg-rose-50 text-rose-700 group-hover:bg-rose-100"
          : "bg-slate-100 text-slate-600",
      valueClass: lowStockCount > 0 ? "text-rose-700" : "text-ink-950",
    },
  ];

  return (
    <section aria-labelledby="kpi-title" className="mt-6">
      <h2 className="sr-only" id="kpi-title">
        Indikator Kinerja Stok Utama
      </h2>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              className="h-28 animate-pulse rounded-xl border border-border bg-card p-5 shadow-xs"
              key={index}
            />
          ))}
        </div>
      ) : isError ? (
        <DataStateBanner
          description="Gagal memuat metrik ringkasan dashboard. Silakan periksa koneksi atau klik tombol Segarkan."
          onRetry={onRetry}
          retryLabel="Segarkan"
          state="error"
          title="Gagal memuat metrik ringkasan"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link className="group block focus:outline-none" key={card.id} to={card.to}>
                <Card
                  className={`h-full justify-between gap-3 py-5 transition ${card.cardHoverClass}`}
                >
                  <CardContent className="flex flex-col justify-between px-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        {card.title}
                      </span>
                      <div
                        className={`grid size-9 shrink-0 place-items-center rounded-md transition ${card.iconContainerClass}`}
                      >
                        <Icon aria-hidden="true" size={18} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p
                        className={`text-2xl font-bold tracking-tight tabular-nums ${card.valueClass ?? "text-ink-950"}`}
                      >
                        {card.value}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                        <span>{card.subtitle}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                        />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
