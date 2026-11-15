import type { RefObject } from "react";
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu as MenuIcon,
  ScanBarcode,
  Search,
  UserCircle,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { AuthUser, AuthWarehouseRef } from "@/features/auth/store";
import { formatWarehouseScopeLabel } from "@/hooks/useWarehouseScope";
import { Badge } from "@/components/ui/badge";

interface AppTopbarProps {
  title: string;
  groupName: string | null;
  user: AuthUser | null;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isUserMenuOpen: boolean;
  showTopbarSelector: boolean;
  canAccessAllWarehouses: boolean;
  warehouseOptions: AuthWarehouseRef[];
  activeWarehouseId: number | null;
  activeWarehouseLabel: string;
  profileRef: RefObject<HTMLDivElement | null>;
  paletteTriggerRef: RefObject<HTMLButtonElement | null>;
  onOpenMobile: () => void;
  onToggleCollapsed: () => void;
  onSelectWarehouse: (warehouseId: number | null) => void;
  onOpenHelp: () => void;
  onOpenStockLookup: () => void;
  onOpenPalette: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  onLogout: () => void;
}

/**
 * Sticky application topbar housing navigation toggles, breadcrumb context, warehouse scope selector, and user menu.
 */
export function AppTopbar({
  title,
  groupName,
  user,
  isCollapsed,
  isMobileOpen,
  isUserMenuOpen,
  showTopbarSelector,
  canAccessAllWarehouses,
  warehouseOptions,
  activeWarehouseId,
  activeWarehouseLabel,
  profileRef,
  paletteTriggerRef,
  onOpenMobile,
  onToggleCollapsed,
  onSelectWarehouse,
  onOpenHelp,
  onOpenStockLookup,
  onOpenPalette,
  onToggleUserMenu,
  onCloseUserMenu,
  onLogout,
}: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-x-2 gap-y-2 border-b border-line-200 bg-surface-0 px-3 py-2 sm:min-h-16 sm:px-6 lg:flex-nowrap lg:gap-3 lg:py-0 lg:px-8 print:hidden">
      <button
        aria-controls="admin-sidebar"
        aria-expanded={isMobileOpen}
        aria-label="Buka menu navigasi"
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 md:hidden"
        onClick={onOpenMobile}
        type="button"
      >
        <MenuIcon aria-hidden="true" size={18} />
        <span>Menu</span>
      </button>
      <button
        aria-label={isCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
        className="hidden min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-ink-950 transition hover:bg-canvas-50 md:grid"
        onClick={onToggleCollapsed}
        type="button"
      >
        <MenuIcon aria-hidden="true" size={20} />
      </button>
      <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-600 sm:flex">
        <span>Ruang kerja</span>
        {groupName && (
          <>
            <span aria-hidden="true">/</span>
            <span className="truncate">{groupName}</span>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="truncate font-semibold text-ink-950">{title}</span>
      </div>
      {showTopbarSelector ? (
        <div className="order-last flex w-full items-center justify-between gap-2 border-t border-line-200/70 pt-2 lg:order-none lg:ml-auto lg:w-auto lg:border-t-0 lg:pt-0">
          <span className="text-xs font-semibold text-slate-600 lg:hidden">Gudang aktif</span>
          <label className="sr-only" htmlFor="topbar-warehouse-select">
            Pilih gudang aktif
          </label>
          <div className="relative flex flex-1 items-center lg:flex-initial">
            <Warehouse
              aria-hidden="true"
              className="pointer-events-none absolute left-3 text-teal-700"
              size={15}
            />
            <select
              aria-label="Pilih gudang aktif"
              className="min-h-11 w-full rounded-md border border-input bg-card py-1.5 pr-8 pl-8 text-xs font-semibold text-foreground shadow-xs transition outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-10 lg:w-auto"
              id="topbar-warehouse-select"
              onChange={(event) => {
                const nextValue = event.target.value;
                onSelectWarehouse(nextValue ? Number(nextValue) : null);
              }}
              value={activeWarehouseId !== null ? String(activeWarehouseId) : ""}
            >
              {canAccessAllWarehouses ? <option value="">Semua gudang</option> : null}
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {formatWarehouseScopeLabel(warehouse)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <Badge
          aria-label="Cakupan gudang aktif"
          className="order-last inline-flex min-h-8 w-full items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold lg:order-none lg:ml-auto lg:w-auto"
          variant="secondary"
        >
          <Warehouse aria-hidden="true" size={14} />
          <span>{activeWarehouseLabel}</span>
        </Badge>
      )}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0 lg:gap-3">
        <button
          aria-label="Buka panduan / bantuan aplikasi"
          className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-600/40 hover:bg-teal-50/70 hover:text-teal-800"
          onClick={onOpenHelp}
          type="button"
        >
          <HelpCircle aria-hidden="true" size={16} />
          <span className="hidden md:inline">Bantuan</span>
        </button>
        <button
          aria-label="Pindai barcode untuk cek stok dan posisi rak gudang"
          className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-50/70 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 hover:text-teal-950"
          onClick={onOpenStockLookup}
          type="button"
        >
          <ScanBarcode aria-hidden="true" size={16} />
          <span className="hidden md:inline">Cek Stok / Rak</span>
        </button>
        <button
          aria-label="Cari menu"
          className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 px-3 text-sm font-medium text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
          onClick={onOpenPalette}
          ref={paletteTriggerRef}
          type="button"
        >
          <Search aria-hidden="true" size={18} />
          <span className="hidden sm:inline">Cari menu</span>
          <kbd className="hidden rounded border border-line-200 bg-surface-0 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 sm:inline">
            Ctrl K
          </kbd>
        </button>
        <div className="relative" ref={profileRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            aria-label="Menu akun pengguna"
            className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-2 text-left transition hover:bg-canvas-50"
            onClick={onToggleUserMenu}
            type="button"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-600 text-sm font-bold text-surface-0">
              {(user?.full_name || user?.username || "P").charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-36 sm:block">
              <span className="block truncate text-sm font-semibold text-ink-950">
                {user?.full_name || user?.username || "Pengguna"}
              </span>
              <span className="block truncate text-xs text-slate-600">
                {user?.role_name || "Pengguna"}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="hidden text-slate-600 sm:block"
              size={16}
            />
          </button>
          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-13 w-60 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-2 shadow-[var(--shadow-2)]"
              role="menu"
            >
              <div className="border-b border-line-200 px-3 py-2">
                <p className="truncate text-sm font-semibold text-ink-950">
                  {user?.full_name || user?.username || "Pengguna"}
                </p>
                <p className="truncate text-xs text-slate-600">
                  {user?.role_name || "Pengguna"}
                </p>
              </div>
              <Link
                className="mt-1 flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-medium text-ink-950 transition hover:bg-canvas-50"
                onClick={onCloseUserMenu}
                role="menuitem"
                to="/profile"
              >
                <UserCircle aria-hidden="true" size={17} /> Profil
              </Link>
              <button
                className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                onClick={onLogout}
                role="menuitem"
                type="button"
              >
                <LogOut aria-hidden="true" size={17} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
