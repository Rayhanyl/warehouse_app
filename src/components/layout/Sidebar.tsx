import {
  Archive,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  ListTree,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { MenuItem } from "@/features/navigation/types";

interface SidebarProps {
  menu: MenuItem[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  arrowleftright: Truck,
  archive: Archive,
  boxes: Boxes,
  clipboardcheck: ClipboardList,
  clipboard: ClipboardList,
  database: Archive,
  dashboard: LayoutDashboard,
  layoutdashboard: LayoutDashboard,
  filetext: ClipboardList,
  help: CircleHelp,
  list: ListTree,
  map: MapPin,
  package: Package,
  settings: Settings,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  truck: Truck,
  users: Users,
  warehouse: Warehouse,
};

function getIcon(item: MenuItem) {
  const normalizedIcon = item.icon?.toLowerCase().replace(/[\s_-]/g, "");
  const normalizedCode = item.code.toLowerCase().replace(/[\s_-]/g, "");
  const Icon = (normalizedIcon && iconMap[normalizedIcon]) || iconMap[normalizedCode] || Package;
  return <Icon aria-hidden="true" size={18} strokeWidth={1.8} />;
}

function SidebarItem({
  item,
  isCollapsed,
  onNavigate,
}: {
  item: MenuItem;
  isCollapsed: boolean;
  onNavigate: () => void;
}) {
  const hasChildren = item.children.length > 0;

  if (hasChildren) {
    return (
      <details className="group relative" open={!isCollapsed}>
        <summary
          className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#f5f0e8] outline-none transition hover:bg-[#293b3d] focus-visible:ring-2 focus-visible:ring-[#f5f0e8]"
          title={isCollapsed ? item.name : undefined}
        >
          {getIcon(item)}
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1 whitespace-normal leading-5">{item.name}</span>
              <ChevronDown className="transition group-open:rotate-180" aria-hidden="true" size={16} />
            </>
          )}
        </summary>
        <div
          className={
            isCollapsed
              ? "invisible absolute left-full top-0 z-50 ml-2 w-64 rounded-xl border border-[#293b3d] bg-[#17252a] p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100"
              : "ml-4 border-l border-[#416a8a]/40 pl-2"
          }
        >
          {item.children.map((child) => (
            <SidebarItem key={child.id} item={child} isCollapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      </details>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        `relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#f5f0e8] ${
          isActive
            ? "bg-[#293b3d] text-[#f5f0e8] before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-r before:bg-[#2f7a68]"
            : "text-[#dce4df] hover:bg-[#293b3d] hover:text-[#f5f0e8]"
        }`
      }
      to={item.path}
      title={isCollapsed ? item.name : undefined}
      onClick={onNavigate}
      end={item.path === "/dashboard"}
    >
      {getIcon(item)}
      {!isCollapsed && <span className="min-w-0 whitespace-normal leading-5">{item.name}</span>}
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
  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-30 bg-[#17252a]/60 md:hidden"
          onClick={onCloseMobile}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[288px] flex-col bg-[#17252a] text-[#f5f0e8] transition-transform duration-200 md:translate-x-0 ${
          isCollapsed ? "md:w-[72px]" : ""
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#293b3d] px-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2f7a68] text-sm font-bold text-white">
            J
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight">Jejakstok</span>}
        </div>
        <nav aria-label="Navigasi utama" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-5">
          <p className={`mb-3 px-3 text-xs font-semibold text-[#9aacab] ${isCollapsed ? "sr-only" : ""}`}>
            Ruang kerja
          </p>
          {menu.length === 0 ? (
            <p className={`px-3 text-xs leading-5 text-[#b8c5c1] ${isCollapsed ? "sr-only" : ""}`}>
              Belum ada menu yang dapat ditampilkan.
            </p>
          ) : (
            <div className="space-y-1">
              {menu.map((item) => (
                <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} onNavigate={onCloseMobile} />
              ))}
            </div>
          )}
        </nav>
        <div className="border-t border-[#293b3d] p-3">
          <button
            aria-label={isCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
            className="hidden min-h-11 w-full items-center justify-center rounded-lg text-[#dce4df] transition hover:bg-[#293b3d] focus-visible:ring-2 focus-visible:ring-[#f5f0e8] md:flex"
            onClick={onToggleCollapsed}
            type="button"
            title={isCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
          >
            <ChevronRight className={`transition ${isCollapsed ? "" : "rotate-180"}`} aria-hidden="true" size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
