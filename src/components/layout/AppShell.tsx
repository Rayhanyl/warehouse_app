import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { useMyMenu } from "@/features/navigation/api";
import { UserGuideModal } from "@/features/user-guide/components/UserGuideModal";
import { resolveGuideModuleFromPath } from "@/features/user-guide/guideContent";
import { AppShellGuideHostContext } from "@/features/user-guide/guideContext";
import { useUserGuideStore } from "@/features/user-guide/store";
import { extractApiErrorInfo } from "@/lib/errors";
import { StockLookupModal } from "@/components/ui/StockLookupModal";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { AppTopbar } from "./AppTopbar";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import {
  flattenMenuEntries,
  getInitialCollapsedState,
  resolveRouteContext,
} from "./routeContext";

/**
 * Main authenticated application shell coordinating sidebar, topbar, command palette, and global modals.
 */
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: menu = [], isLoading, isError, error, refetch } = useMyMenu();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsedState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isStockLookupOpen, setIsStockLookupOpen] = useState(false);
  const openUserGuide = useUserGuideStore((state) => state.openGuide);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    canAccessAllWarehouses,
    warehouseOptions,
    allowedWarehouseIds,
    activeWarehouseId,
    activeWarehouseLabel,
    showTopbarSelector,
    setSelectedWarehouseId,
    syncWithAllowedWarehouses,
  } = useWarehouseScope();

  useEffect(() => {
    if (!user) return;
    syncWithAllowedWarehouses(allowedWarehouseIds, canAccessAllWarehouses);
  }, [allowedWarehouseIds, canAccessAllWarehouses, syncWithAllowedWarehouses, user]);

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

  function handleSelectPalettePath(targetPath: string) {
    setIsPaletteOpen(false);
    setSearch("");
    setActiveIndex(0);
    navigate(targetPath);
  }

  return (
    <AppShellGuideHostContext.Provider value={true}>
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
          className={`min-h-screen min-w-0 transition-[padding] duration-200 print:pl-0 ${
            isCollapsed ? "md:pl-[72px]" : "md:pl-[248px]"
          }`}
        >
          <AppTopbar
            activeWarehouseId={activeWarehouseId}
            activeWarehouseLabel={activeWarehouseLabel}
            canAccessAllWarehouses={canAccessAllWarehouses}
            groupName={groupName}
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            isUserMenuOpen={isUserMenuOpen}
            onCloseUserMenu={() => setIsUserMenuOpen(false)}
            onLogout={() => void handleLogout()}
            onOpenHelp={() =>
              openUserGuide(resolveGuideModuleFromPath(location.pathname), "module")
            }
            onOpenMobile={() => setIsMobileOpen(true)}
            onOpenPalette={() => {
              setActiveIndex(0);
              setIsPaletteOpen(true);
            }}
            onOpenStockLookup={() => setIsStockLookupOpen(true)}
            onSelectWarehouse={setSelectedWarehouseId}
            onToggleCollapsed={() => setIsCollapsed((value) => !value)}
            onToggleUserMenu={() => setIsUserMenuOpen((value) => !value)}
            paletteTriggerRef={paletteTriggerRef}
            profileRef={profileRef}
            showTopbarSelector={showTopbarSelector}
            title={title}
            user={user}
            warehouseOptions={warehouseOptions}
          />
          <main
            className="mx-auto min-w-0 max-w-[1440px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:overflow-visible print:p-0"
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
        <CommandPaletteModal
          activeIndex={activeIndex}
          inputRef={paletteInputRef}
          isOpen={isPaletteOpen}
          onActiveIndexChange={setActiveIndex}
          onClose={closePalette}
          onSearchChange={setSearch}
          onSelectPath={handleSelectPalettePath}
          results={searchResults}
          search={search}
        />
        <StockLookupModal
          isOpen={isStockLookupOpen}
          onClose={() => setIsStockLookupOpen(false)}
        />
        <UserGuideModal />
      </div>
    </AppShellGuideHostContext.Provider>
  );
}

export { PageHeader };
