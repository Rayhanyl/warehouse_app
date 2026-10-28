import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Command,
  LogOut,
  Menu as MenuIcon,
  Search,
  UserCircle,
  Warehouse,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { useMyMenu } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";
import { extractApiErrorInfo } from "@/lib/errors";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";

interface FlattenedMenuEntry {
  item: MenuItem;
  groupName: string | null;
}

function flattenMenuEntries(
  items: MenuItem[],
  parentName: string | null = null,
): FlattenedMenuEntry[] {
  return items.flatMap((item) => {
    const current: FlattenedMenuEntry = { item, groupName: parentName };
    const descendants = flattenMenuEntries(item.children, item.name);
    return [current, ...descendants];
  });
}

function resolveRouteContext(
  pathname: string,
  entries: FlattenedMenuEntry[],
): { title: string; groupName: string | null } {
  const matched = entries.find((entry) => entry.item.path === pathname);
  if (matched) {
    return { title: matched.item.name, groupName: matched.groupName };
  }
  if (pathname === "/profile") {
    return { title: "Profil", groupName: null };
  }
  if (pathname === "/master/categories" || pathname === "/categories") {
    return { title: "Kategori barang", groupName: "Master data" };
  }
  if (
    pathname === "/master/uom" ||
    pathname === "/master/uoms" ||
    pathname === "/uom" ||
    pathname === "/uoms"
  ) {
    return { title: "Satuan ukur (UoM)", groupName: "Master data" };
  }
  if (pathname === "/master/suppliers" || pathname === "/suppliers") {
    return { title: "Pemasok", groupName: "Master data" };
  }
  if (
    pathname === "/master/items" ||
    pathname === "/items" ||
    pathname === "/master/stocks" ||
    pathname === "/stocks"
  ) {
    return { title: "Barang (SKU)", groupName: "Master data" };
  }
  if (pathname === "/master/warehouses" || pathname === "/warehouses") {
    return { title: "Gudang", groupName: "Master data" };
  }
  if (
    pathname === "/master/locations" ||
    pathname === "/master/storage-locations" ||
    pathname === "/locations" ||
    pathname === "/storage-locations"
  ) {
    return { title: "Lokasi penyimpanan", groupName: "Master data" };
  }
  if (pathname === "/audit-logs") {
    return { title: "Audit log", groupName: "Administrasi" };
  }
  return { title: "Dasbor", groupName: null };
}

function getInitialCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: menu = [], isLoading, isError, error, refetch } = useMyMenu();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsedState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    () => user?.warehouse_ids?.[0] ?? null,
  );

  const profileRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const paletteTriggerRef = useRef<HTMLButtonElement>(null);

  const allEntries = useMemo(() => flattenMenuEntries(menu), [menu]);
  const { title, groupName } = useMemo(
    () => resolveRouteContext(location.pathname, allEntries),
    [location.pathname, allEntries],
  );

  const navigableEntries = useMemo(
    () =>
      allEntries.filter(
        ({ item }) =>
          Boolean(item.path) &&
          item.menu_type !== "group" &&
          item.children.length === 0,
      ),
    [allEntries],
  );

  const searchResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) {
      return navigableEntries;
    }
    return navigableEntries.filter(
      ({ item, groupName: parent }) =>
        item.name.toLocaleLowerCase().includes(query) ||
        item.path.toLocaleLowerCase().includes(query) ||
        (parent && parent.toLocaleLowerCase().includes(query)),
    );
  }, [navigableEntries, search]);

  const safeActiveIndex =
    searchResults.length > 0 ? Math.min(activeIndex, searchResults.length - 1) : 0;

  const menuErrorInfo = isError ? extractApiErrorInfo(error) : null;

  function closePalette() {
    setIsPaletteOpen(false);
    setSearch("");
    setActiveIndex(0);
    paletteTriggerRef.current?.focus();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((current) => {
          if (current) {
            return false;
          }
          setActiveIndex(0);
          return true;
        });
      }
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isPaletteOpen) {
      paletteInputRef.current?.focus();
    }
  }, [isPaletteOpen]);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  useEffect(() => {
    let lastBand =
      window.innerWidth < 768
        ? "mobile"
        : window.innerWidth < 1024
          ? "tablet"
          : "desktop";

    function handleResize() {
      const nextBand =
        window.innerWidth < 768
          ? "mobile"
          : window.innerWidth < 1024
            ? "tablet"
            : "desktop";
      if (nextBand !== lastBand) {
        lastBand = nextBand;
        if (nextBand !== "mobile") {
          setIsMobileOpen(false);
        }
        if (nextBand === "tablet") {
          setIsCollapsed(true);
        } else if (nextBand === "desktop") {
          setIsCollapsed(false);
        }
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    setIsUserMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  function handlePaletteKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (searchResults.length > 0) {
        setActiveIndex((current) => (current + 1) % searchResults.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (searchResults.length > 0) {
        setActiveIndex(
          (current) => (current - 1 + searchResults.length) % searchResults.length,
        );
      }
      return;
    }
    if (event.key === "Enter" && searchResults[safeActiveIndex]) {
      event.preventDefault();
      const targetPath = searchResults[safeActiveIndex].item.path;
      setIsPaletteOpen(false);
      setSearch("");
      setActiveIndex(0);
      navigate(targetPath);
    }
  }

  const assignedWarehouses = user?.warehouse_ids ?? [];
  const activeWarehouse =
    selectedWarehouseId && assignedWarehouses.includes(selectedWarehouseId)
      ? selectedWarehouseId
      : assignedWarehouses[0] ?? null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas-50 text-ink-950">
      <a
        className="sr-only fixed left-4 top-4 z-50 rounded-[var(--radius-md)] bg-teal-600 px-4 py-3 text-sm font-semibold text-surface-0 focus:not-sr-only"
        href="#main-content"
      >
        Lompat ke konten utama
      </a>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        menu={menu}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleCollapsed={() => setIsCollapsed((value) => !value)}
      />
      <div
        className={`min-h-screen min-w-0 transition-[padding] duration-200 ${
          isCollapsed ? "md:pl-[72px]" : "md:pl-[248px]"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line-200 bg-surface-0 px-4 sm:h-16 sm:px-6 lg:px-8">
          <button
            aria-controls="admin-sidebar"
            aria-expanded={isMobileOpen}
            aria-label="Buka menu navigasi"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 md:hidden"
            onClick={() => setIsMobileOpen(true)}
            type="button"
          >
            <MenuIcon aria-hidden="true" size={18} />
            <span>Menu</span>
          </button>
          <button
            aria-label={isCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
            className="hidden min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-ink-950 transition hover:bg-canvas-50 md:grid"
            onClick={() => setIsCollapsed((value) => !value)}
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
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {assignedWarehouses.length > 1 ? (
              <div className="hidden items-center lg:flex">
                <label className="sr-only" htmlFor="topbar-warehouse-select">
                  Pilih gudang aktif
                </label>
                <div className="relative flex items-center">
                  <Warehouse
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 text-teal-700"
                    size={15}
                  />
                  <select
                    aria-label="Pilih gudang aktif"
                    className="min-h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 py-1.5 pr-8 pl-8 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                    id="topbar-warehouse-select"
                    onChange={(event) =>
                      setSelectedWarehouseId(Number(event.target.value))
                    }
                    value={activeWarehouse ?? ""}
                  >
                    {assignedWarehouses.map((warehouseId) => (
                      <option key={warehouseId} value={warehouseId}>
                        Gudang #{warehouseId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <span
                aria-label="Cakupan gudang aktif"
                className="hidden items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-700 lg:inline-flex"
              >
                <Warehouse aria-hidden="true" size={14} />
                {activeWarehouse ? `Gudang #${activeWarehouse}` : "Semua gudang"}
              </span>
            )}
            <button
              aria-label="Cari menu"
              className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 px-3 text-sm font-medium text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
              onClick={() => {
                setActiveIndex(0);
                setIsPaletteOpen(true);
              }}
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
                onClick={() => setIsUserMenuOpen((value) => !value)}
                type="button"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-600 text-sm font-bold text-surface-0">
                  {(user?.full_name || user?.username || "P")
                    .charAt(0)
                    .toUpperCase()}
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
                    onClick={() => setIsUserMenuOpen(false)}
                    role="menuitem"
                    to="/profile"
                  >
                    <UserCircle aria-hidden="true" size={17} /> Profil
                  </Link>
                  <button
                    className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    onClick={() => void handleLogout()}
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
        <main
          className="mx-auto min-w-0 max-w-[1440px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          {isLoading ? (
            <div
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 text-sm text-slate-700 shadow-[var(--shadow-1)]"
              role="status"
            >
              Memuat navigasi...
            </div>
          ) : isError ? (
            <div
              className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-100 p-6 text-sm text-red-700"
              role="alert"
            >
              <p className="font-semibold">Menu navigasi belum dapat dimuat</p>
              <p className="mt-1 text-slate-700">
                Periksa koneksi ke server, lalu muat ulang navigasi.
              </p>
              {menuErrorInfo?.requestId && (
                <p className="mt-2 text-xs text-slate-600 tabular-nums">
                  ID Permintaan: {menuErrorInfo.requestId}
                </p>
              )}
              <button
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-red-700"
                onClick={() => void refetch()}
                type="button"
              >
                Muat ulang navigasi
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      {isPaletteOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
          onMouseDown={closePalette}
        >
          <div
            aria-label="Pencarian menu"
            aria-modal="true"
            className="max-h-[min(80vh,36rem)] w-full max-w-2xl rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-3 shadow-[var(--shadow-2)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center gap-2 border-b border-line-200 px-2 pb-3">
              <Command aria-hidden="true" className="shrink-0 text-teal-600" size={19} />
              <input
                aria-label="Ketik nama menu atau rute"
                className="min-h-11 flex-1 border-0 bg-transparent text-sm text-ink-950 placeholder:text-slate-600 focus:outline-none"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Cari menu atau halaman..."
                ref={paletteInputRef}
                value={search}
              />
              <button
                aria-label="Tutup pencarian"
                className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
                onClick={closePalette}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2" role="listbox">
              {searchResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-700">
                  Tidak ada menu yang cocok. Periksa ejaan atau gunakan kata kunci lain.
                </p>
              ) : (
                searchResults.map(({ item, groupName: parent }, index) => {
                  const isHighlighted = index === safeActiveIndex;
                  return (
                    <button
                      aria-selected={isHighlighted}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition ${
                        isHighlighted
                          ? "bg-teal-100 text-teal-700"
                          : "text-ink-950 hover:bg-canvas-50"
                      }`}
                      key={item.id}
                      onClick={() => {
                        setIsPaletteOpen(false);
                        setSearch("");
                        setActiveIndex(0);
                        navigate(item.path);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      role="option"
                      type="button"
                    >
                      <span className="font-semibold">{item.name}</span>
                      {parent && (
                        <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {parent}
                        </span>
                      )}
                      <span className="ml-auto text-xs font-normal text-slate-600 tabular-nums">
                        {item.path}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PageHeader };
