import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Command,
  LogOut,
  Menu as MenuIcon,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/features/auth/api";
import { useMyMenu } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";
import { useAuthStore } from "@/features/auth/store";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";

function flattenMenu(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenu(item.children)]);
}

function getMenuTitle(pathname: string, menu: MenuItem[]) {
  return flattenMenu(menu).find((item) => item.path === pathname)?.name ?? "Dasbor";
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: menu = [], isLoading, isError, refetch } = useMyMenu();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  const title = getMenuTitle(location.pathname, menu);
  const flattenedMenu = useMemo(() => flattenMenu(menu).filter((item) => item.path), [menu]);
  const searchResults = flattenedMenu.filter((item) =>
    item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setIsPaletteOpen(false);
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

  async function handleLogout() {
    setIsUserMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f0e8] text-[#17252a]">
      <a
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-[#2f7a68] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only"
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
      <div className={`min-w-0 min-h-screen transition-[padding] duration-200 ${isCollapsed ? "md:pl-[72px]" : "md:pl-[288px]"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#d9dfd8] bg-[#fffdf9]/95 px-4 backdrop-blur sm:px-6">
          <button
            aria-label="Buka navigasi"
            className="grid min-h-11 min-w-11 place-items-center rounded-lg text-[#17252a] hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68] md:hidden"
            onClick={() => setIsMobileOpen(true)}
            type="button"
          >
            <MenuIcon aria-hidden="true" size={20} />
          </button>
          <button
            aria-label={isCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
            className="hidden min-h-11 min-w-11 place-items-center rounded-lg text-[#17252a] hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68] md:grid"
            onClick={() => setIsCollapsed((value) => !value)}
            type="button"
          >
            <MenuIcon aria-hidden="true" size={20} />
          </button>
          <div className="hidden min-w-0 items-center gap-2 text-sm text-[#667876] sm:flex">
            <span>Ruang kerja</span>
            <span aria-hidden="true">/</span>
            <span className="truncate font-semibold text-[#17252a]">{title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Cari menu"
              className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[#667876] hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68]"
              onClick={() => setIsPaletteOpen(true)}
              type="button"
            >
              <Search aria-hidden="true" size={18} />
              <span className="hidden sm:inline">Cari menu</span>
              <kbd className="hidden rounded border border-[#d9dfd8] bg-white px-1.5 py-0.5 text-[10px] sm:inline">Ctrl K</kbd>
            </button>
            <div className="relative" ref={profileRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left hover:bg-[#e3ebe3] focus-visible:ring-2 focus-visible:ring-[#2f7a68]"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                type="button"
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#d96b3b] text-sm font-bold text-white">
                  {(user?.full_name || user?.username || "P").charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-36 sm:block">
                  <span className="block truncate text-sm font-semibold">{user?.full_name || user?.username}</span>
                  <span className="block truncate text-xs text-[#667876]">{user?.role_name || "Pengguna"}</span>
                </span>
                <ChevronDown aria-hidden="true" className="hidden sm:block" size={16} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-14 w-56 rounded-xl border border-[#d9dfd8] bg-white p-2 shadow-lg" role="menu">
                  <div className="border-b border-[#e7ebe5] px-3 py-2">
                    <p className="text-sm font-semibold">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-[#667876]">{user?.role_name || "Pengguna"}</p>
                  </div>
                  <Link className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-[#e3ebe3]" onClick={() => setIsUserMenuOpen(false)} role="menuitem" to="/profile">
                    <UserCircle aria-hidden="true" size={17} /> Profil
                  </Link>
                  <button className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-[#b83232] hover:bg-[#fbe6e4]" onClick={handleLogout} role="menuitem" type="button">
                    <LogOut aria-hidden="true" size={17} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1440px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8" id="main-content">
          {isLoading ? (
            <div className="rounded-xl border border-[#d9dfd8] bg-white p-6 text-sm text-[#667876]" role="status">Memuat navigasi...</div>
          ) : isError ? (
            <div className="rounded-xl border border-[#efc5c0] bg-[#fbe6e4] p-6 text-sm text-[#8f2f2f]" role="alert">
              <p className="font-semibold">Menu belum dapat dimuat</p>
              <p className="mt-1">Periksa koneksi ke server, lalu coba lagi.</p>
              <button className="mt-4 rounded-lg bg-[#b83232] px-4 py-2 font-semibold text-white hover:bg-[#8f2f2f]" onClick={() => void refetch()} type="button">Coba lagi</button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17252a]/50 p-4" onMouseDown={() => setIsPaletteOpen(false)}>
          <div aria-label="Pencarian menu" aria-modal="true" className="max-h-[min(80vh,36rem)] w-full max-w-2xl rounded-2xl border border-[#d9dfd8] bg-white p-3 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="flex items-center gap-2 border-b border-[#e7ebe5] px-2 pb-3">
              <Command aria-hidden="true" className="text-[#2f7a68]" size={19} />
              <input ref={paletteInputRef} className="min-h-10 flex-1 border-0 bg-transparent text-sm outline-none" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setIsPaletteOpen(false); }} placeholder="Cari menu atau halaman..." value={search} />
              <button aria-label="Tutup pencarian" className="grid size-9 place-items-center rounded-lg hover:bg-[#e3ebe3]" onClick={() => setIsPaletteOpen(false)} type="button"><X size={17} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {searchResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[#667876]">Tidak ada menu yang cocok. Periksa ejaan atau coba kata lain.</p>
              ) : searchResults.map((item) => (
                <button className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold hover:bg-[#e3ebe3]" key={item.id} onClick={() => { setIsPaletteOpen(false); setSearch(""); navigate(item.path); }} type="button">{item.name}<span className="ml-auto text-xs font-normal text-[#667876]">{item.path}</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PageHeader };
