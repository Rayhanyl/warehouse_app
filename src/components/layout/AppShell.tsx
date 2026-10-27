import { NavLink, Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <NavLink className="font-semibold" to="/dashboard">
            WMS
          </NavLink>
          <nav aria-label="Main navigation">
            <NavLink
              className={({ isActive }) =>
                isActive ? "font-medium text-blue-700" : "text-slate-600"
              }
              to="/dashboard"
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
