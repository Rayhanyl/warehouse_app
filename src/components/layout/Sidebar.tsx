import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowLeftRight,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  ListTree,
  MapPin,
  Package,
  PackageCheck,
  Ruler,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import type { MenuItem } from "@/features/navigation/types";

interface SidebarProps {
  menu: MenuItem[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  archive: Archive,
  arrowleftright: ArrowLeftRight,
  boxes: Boxes,
  clipboard: ClipboardCheck,
  clipboardcheck: ClipboardCheck,
  dashboard: LayoutDashboard,
  database: Database,
  filetext: FileText,
  help: CircleHelp,
  layoutdashboard: LayoutDashboard,
  list: ListTree,
  map: MapPin,
  package: Package,
  packagecheck: PackageCheck,
  ruler: Ruler,
  settings: Settings,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  truck: Truck,
  users: Users,
  warehouse: Warehouse,
};

function getMenuIconComponent(item: MenuItem): LucideIcon {
  const normalizedIcon = item.icon?.toLowerCase().replace(/[\s_-]/g, "");
  const normalizedCode = item.code.toLowerCase().replace(/[\s_-]/g, "");
  return (normalizedIcon && iconMap[normalizedIcon]) || iconMap[normalizedCode] || Package;
}

function getIcon(item: MenuItem) {
  const Icon = getMenuIconComponent(item);
  return <Icon aria-hidden="true" className="shrink-0" size={18} strokeWidth={1.85} />;
}

function hasActiveDescendant(item: MenuItem, pathname: string): boolean {
  if (item.path && item.path === pathname) {
    return true;
  }
  return item.children.some((child) => hasActiveDescendant(child, pathname));
}

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  openFlyoutId: number | null;
  setOpenFlyoutId: React.Dispatch<React.SetStateAction<number | null>>;
  onNavigate: () => void;
}

function SidebarItem({
  item,
  isCollapsed,
  openFlyoutId,
  setOpenFlyoutId,
  onNavigate,
}: SidebarItemProps) {
  const location = useLocation();
  const hasChildren = item.children.length > 0;
  const isChildActive = hasChildren && hasActiveDescendant(item, location.pathname);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const isFlyoutOpen = isCollapsed && openFlyoutId === item.id;

  if (hasChildren) {
    if (isCollapsed) {
      return (
        <div
          className="relative"
          onMouseEnter={() => setOpenFlyoutId(item.id)}
          onMouseLeave={() =>
            setOpenFlyoutId((current) => (current === item.id ? null : current))
          }
        >
          <button
            aria-expanded={isFlyoutOpen}
            aria-haspopup="true"
            aria-label={item.name}
            className={`relative flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${
              isChildActive || isFlyoutOpen
                ? "bg-ink-800 text-canvas-50 before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-r before:bg-teal-400"
                : "text-[#dce4df] hover:bg-ink-800 hover:text-canvas-50"
            }`}
            onClick={() =>
              setOpenFlyoutId((current) => (current === item.id ? null : item.id))
            }
            title={item.short_name || item.name}
            type="button"
          >
            {getIcon(item)}
            <span className="sr-only">{item.name}</span>
          </button>
          {isFlyoutOpen && (
            <div
              aria-label={`Submenu ${item.name}`}
              className="absolute left-full top-0 z-50 ml-2 w-[248px] rounded-[var(--radius-md)] border border-ink-800 bg-ink-950 p-2 shadow-[var(--shadow-2)]"
              role="region"
            >
              <div className="mb-1 border-b border-ink-800 px-3 py-2 text-xs font-semibold text-[#c8d0cd]">
                {item.name}
              </div>
              <div className="space-y-1">
                {item.children.map((child) => (
                  <SidebarItem
                    isCollapsed={false}
                    item={child}
                    key={child.id}
                    onNavigate={() => {
                      setOpenFlyoutId(null);
                      onNavigate();
                    }}
                    openFlyoutId={openFlyoutId}
                    setOpenFlyoutId={setOpenFlyoutId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <button
          aria-expanded={isGroupOpen}
          className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${
            isChildActive
              ? "bg-ink-800/75 text-canvas-50"
              : "text-[#dce4df] hover:bg-ink-800 hover:text-canvas-50"
          }`}
          onClick={() => setIsGroupOpen((current) => !current)}
          type="button"
        >
          {getIcon(item)}
          <span className="min-w-0 flex-1 whitespace-normal leading-5">{item.name}</span>
          <ChevronDown
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-150 ${
              isGroupOpen ? "rotate-180" : ""
            }`}
            size={16}
          />
        </button>
        {isGroupOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l border-ink-800 pl-2">
            {item.children.map((child) => (
              <SidebarItem
                isCollapsed={false}
                item={child}
                key={child.id}
                onNavigate={onNavigate}
                openFlyoutId={openFlyoutId}
                setOpenFlyoutId={setOpenFlyoutId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      aria-label={isCollapsed ? item.name : undefined}
      className={({ isActive }) =>
        `relative flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${
          isCollapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-ink-800 text-canvas-50 before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-r before:bg-teal-400"
            : "text-[#dce4df] hover:bg-ink-800 hover:text-canvas-50"
        }`
      }
      end={item.path === "/dashboard"}
      onClick={() => {
        setOpenFlyoutId(null);
        onNavigate();
      }}
      title={isCollapsed ? item.short_name || item.name : undefined}
      to={item.path}
    >
      {getIcon(item)}
      {isCollapsed ? (
        <span className="sr-only">{item.name}</span>
      ) : (
        <span className="min-w-0 whitespace-normal leading-5">{item.name}</span>
      )}
    </NavLink>
  );
}

export function Sidebar({
  menu,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const [openFlyoutId, setOpenFlyoutId] = useState<number | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const effectiveCollapsed = isCollapsed && !isMobileOpen;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenFlyoutId(null);
        if (isMobileOpen) {
          onCloseMobile();
        }
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        openFlyoutId !== null &&
        asideRef.current &&
        !asideRef.current.contains(event.target as Node)
      ) {
        setOpenFlyoutId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMobileOpen, onCloseMobile, openFlyoutId]);

  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-30 bg-ink-950/60 md:hidden"
          onClick={onCloseMobile}
          type="button"
        />
      )}
      <aside
        aria-label="Bilah sisi aplikasi"
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-ink-950 text-canvas-50 transition-[transform,width] duration-200 md:translate-x-0 ${
          effectiveCollapsed ? "md:w-[72px]" : "md:w-[248px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        id="admin-sidebar"
        ref={asideRef}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-800 px-4 sm:h-16">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-600 text-sm font-bold text-surface-0">
              J
            </div>
            {!effectiveCollapsed && (
              <span className="truncate text-lg font-bold tracking-tight text-canvas-50">
                Jejakstok
              </span>
            )}
          </div>
          {isMobileOpen && (
            <button
              aria-label="Tutup menu navigasi"
              className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-[#dce4df] transition hover:bg-ink-800 hover:text-canvas-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 md:hidden"
              onClick={onCloseMobile}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <nav
          aria-label="Navigasi utama"
          className={`min-w-0 flex-1 px-3 py-5 ${
            effectiveCollapsed ? "overflow-visible" : "overflow-x-hidden overflow-y-auto"
          }`}
        >
          <p
            className={`mb-3 px-3 text-xs font-semibold text-[#c8d0cd] ${
              effectiveCollapsed ? "sr-only" : ""
            }`}
          >
            Ruang kerja
          </p>
          {menu.length === 0 ? (
            <p
              className={`px-3 text-xs leading-5 text-[#c8d0cd] ${
                effectiveCollapsed ? "sr-only" : ""
              }`}
            >
              Belum ada menu yang tersedia untuk peran akun Anda.
            </p>
          ) : (
            <div className="space-y-1">
              {menu.map((item) => (
                <SidebarItem
                  isCollapsed={effectiveCollapsed}
                  item={item}
                  key={item.id}
                  onNavigate={onCloseMobile}
                  openFlyoutId={openFlyoutId}
                  setOpenFlyoutId={setOpenFlyoutId}
                />
              ))}
            </div>
          )}
        </nav>
        <div className="border-t border-ink-800 p-3">
          <button
            aria-label={effectiveCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
            className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 text-xs font-semibold text-[#dce4df] transition hover:bg-ink-800 hover:text-canvas-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 md:flex"
            onClick={() => {
              setOpenFlyoutId(null);
              onToggleCollapsed();
            }}
            title={effectiveCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={`shrink-0 transition-transform duration-150 ${
                effectiveCollapsed ? "" : "rotate-180"
              }`}
              size={18}
            />
            {!effectiveCollapsed && <span>Ciutkan menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
