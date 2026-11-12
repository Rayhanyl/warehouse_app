import { FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, Plus, Search, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import {
  useAdminMenus,
  useAdminPermissions,
  useAdminRoles,
  useAdminUserWarehouses,
  useAdminWarehouses,
  useAdminUsers,
  useCreateAdminUser,
  useCreateAdminMenu,
  useUpdateAdminUser,
  useUpdateAdminUserWarehouses,
  useUpdateAdminMenu,
  useUpdateRolePermissions,
} from "../api";
import type { MenuParams, UserParams } from "../api";
import type { AdminMenu, AdminUser, AdminWarehouse, Permission, Role } from "../types";

const userInitial: UserParams = { limit: 25, offset: 0, search: "", is_active: "" };
const menuInitial: MenuParams = { limit: 25, offset: 0, search: "", is_active: "" };

export function AdministrationPage() {
  const { can } = usePermission();
  const { pathname } = window.location;
  const activeSection = pathname.includes("/menus") ? "menus" : pathname.includes("/roles") ? "roles" : "users";
  const canManage = can("user:manage");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AdminMenu | null>(null);
  const [userParams, setUserParams] = useState(userInitial);
  const [menuParams, setMenuParams] = useState(menuInitial);
  const users = useAdminUsers(userParams, activeSection === "users" && canManage);
  const roles = useAdminRoles((activeSection === "roles" || userFormOpen) && canManage);
  const permissions = useAdminPermissions(activeSection === "roles" && canManage);
  const menus = useAdminMenus(menuParams, activeSection === "menus" && canManage);
  const menuPermissions = useAdminPermissions(activeSection === "menus" && canManage);
  const warehouses = useAdminWarehouses(userFormOpen && canManage);
  const assignedWarehouses = useAdminUserWarehouses(editingUser?.id ?? null, userFormOpen && canManage);

  if (!canManage) {
    return <State error text="Anda tidak memiliki izin untuk membuka administrasi dan keamanan." />;
  }

  return (
    <>
      <PageHeader
        title={activeSection === "menus" ? "Menu" : activeSection === "roles" ? "Peran dan permission" : "Pengguna dan peran"}
        description="Kelola akun, akses berbasis peran, dan katalog navigasi sistem."
        action={activeSection === "users" ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => { setEditingUser(null); setUserFormOpen(true); }} type="button"><UserPlus size={17} />Tambah pengguna</button> : activeSection === "menus" ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => setMenuFormOpen(true)} type="button"><Plus size={17} />Tambah menu</button> : undefined}
      />
      <AdminNavigation active={activeSection} />
      {activeSection === "users" && <UsersPanel query={users} params={userParams} onParamsChange={setUserParams} onEdit={(user) => { setEditingUser(user); setUserFormOpen(true); }} />}
      {activeSection === "roles" && <RolesPanel roles={roles.data ?? []} permissions={permissions.data ?? []} isLoading={roles.isLoading || permissions.isLoading} />}
      {activeSection === "menus" && <MenusPanel query={menus} params={menuParams} onParamsChange={setMenuParams} onEdit={(menu) => { setEditingMenu(menu); setMenuFormOpen(true); }} />}
      {userFormOpen && <UserForm user={editingUser} roles={roles.data ?? []} warehouses={warehouses.data ?? []} warehousesError={warehouses.isError} warehousesLoading={warehouses.isLoading} assignedWarehouses={assignedWarehouses} onClose={() => setUserFormOpen(false)} />}
      {menuFormOpen && <MenuForm menu={editingMenu} menus={menus.data?.items ?? []} permissions={menuPermissions.data ?? []} isLoading={menuPermissions.isLoading} onClose={() => { setMenuFormOpen(false); setEditingMenu(null); }} />}
    </>
  );
}

function AdminNavigation({ active }: { active: string }) {
  return <nav aria-label="Administrasi" className="mb-6 flex gap-1 overflow-x-auto border-b border-line-200">{[["/admin/users", "Pengguna"], ["/admin/roles", "Peran dan permission"], ["/admin/menus", "Menu"]].map(([path, label]) => <a className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${active === path.slice(7).split("/")[0] ? "border-teal-600 text-teal-700" : "border-transparent text-slate-700 hover:border-line-500"}`} href={path} key={path}>{label}</a>)}</nav>;
}

function UsersPanel({ query, params, onParamsChange, onEdit }: { query: ReturnType<typeof useAdminUsers>; params: UserParams; onParamsChange: (params: UserParams) => void; onEdit: (user: AdminUser) => void }) {
  const [draftSearch, setDraftSearch] = useState(params.search);
  const total = query.data?.total ?? 0;
  function applyFilters(event: FormEvent) {
    event.preventDefault();
    onParamsChange({ ...params, search: draftSearch.trim(), offset: 0 });
  }
  if (query.isLoading) return <State text="Memuat daftar pengguna..." />;
  if (query.isError) return <State error text="Daftar pengguna belum dapat dimuat." onRetry={() => void query.refetch()} />;
  const items = query.data?.items ?? [];
  return <><FilterBar onSubmit={applyFilters}><label className="min-w-52 flex-1 text-sm font-semibold">Cari pengguna<div className="relative mt-2"><Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} /><input className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 pl-9 pr-3 text-sm font-normal" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Nama, username, atau email" value={draftSearch} /></div></label><SelectFilter label="Status" value={params.is_active} onChange={(value) => onParamsChange({ ...params, is_active: value, offset: 0 })} options={[["", "Semua status"], ["true", "Aktif"], ["false", "Nonaktif"]]} /></FilterBar><DataFrame empty={items.length === 0} text={params.search || params.is_active ? "Tidak ada pengguna yang cocok dengan filter." : "Belum ada pengguna terdaftar."}><table className="min-w-[900px] w-full text-left text-sm"><caption className="sr-only">Daftar pengguna</caption><thead><tr><Th>Pengguna</Th><Th>Peran</Th><Th>Status</Th><Th>Gudang</Th><Th>Login terakhir</Th><Th>Aksi</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((user) => <tr key={user.id}><td className="px-4 py-4"><p className="font-semibold">{user.full_name}</p><p className="text-xs text-slate-600">{user.username} · {user.email}</p></td><td className="px-4 py-4">{user.role_name}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? "bg-teal-100 text-teal-700" : "bg-canvas-50 text-slate-700"}`}>{user.is_active ? "Aktif" : "Nonaktif"}</span></td><td className="px-4 py-4 tabular-nums">{user.warehouse_ids.length}</td><td className="px-4 py-4 text-xs text-slate-700">{user.last_login_at ? formatDate(user.last_login_at) : "Belum pernah"}</td><td className="px-4 py-4"><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50" onClick={() => onEdit(user)} type="button"><Edit3 size={15} />Ubah</button></td></tr>)}</tbody></table></DataFrame><Pagination offset={params.offset} limit={params.limit} total={total} isFetching={query.isFetching} onPageChange={(offset) => onParamsChange({ ...params, offset })} onLimitChange={(limit) => onParamsChange({ ...params, limit, offset: 0 })} /></>;
}

function RolesPanel({ roles, permissions, isLoading }: { roles: Role[]; permissions: { id: number; code: string; description: string }[]; isLoading: boolean }) {
  const update = useUpdateRolePermissions();
  const [selectedId, setSelectedId] = useState<number | null>(roles[0]?.id ?? null);
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0];
  if (isLoading) return <State text="Memuat peran dan permission..." />;
  if (!selected) return <State text="Belum ada peran yang tersedia." />;
  const toggle = (code: string) => {
    const next = selected.permissions.includes(code) ? selected.permissions.filter((item) => item !== code) : [...selected.permissions, code];
    void update.mutateAsync({ id: selected.id, permissions: next }).then(() => toast.success(`Permission untuk ${selected.name} diperbarui.`)).catch(() => toast.error("Permission belum dapat diperbarui."));
  };
  return <div className="grid gap-6 lg:grid-cols-[260px_1fr]"><section className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-3 shadow-[var(--shadow-1)]"><h2 className="px-3 py-2 text-sm font-bold">Peran</h2>{roles.map((role) => <button className={`flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md)] px-3 text-left text-sm font-semibold ${role.id === selected.id ? "bg-teal-100 text-teal-700" : "hover:bg-canvas-50"}`} key={role.id} onClick={() => setSelectedId(role.id)} type="button">{role.name}<span className="text-xs">{role.permissions.length}</span></button>)}</section><section className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]"><h2 className="font-bold">{selected.name}</h2><p className="mt-1 text-sm text-slate-700">{selected.description}</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{permissions.map((permission) => <label className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-line-200 p-3 text-sm" key={permission.code}><input checked={selected.permissions.includes(permission.code)} className="mt-1 size-4 accent-teal-600" disabled={update.isPending} onChange={() => toggle(permission.code)} type="checkbox" /><span><span className="block font-semibold">{permission.code}</span><span className="text-xs text-slate-600">{permission.description}</span></span></label>)}</div></section></div>;
}

function MenusPanel({ query, params, onParamsChange, onEdit }: { query: ReturnType<typeof useAdminMenus>; params: MenuParams; onParamsChange: (params: MenuParams) => void; onEdit: (menu: AdminMenu) => void }) {
  const [draftSearch, setDraftSearch] = useState(params.search);
  const total = query.data?.total ?? 0;
  function applyFilters(event: FormEvent) {
    event.preventDefault();
    onParamsChange({ ...params, search: draftSearch.trim(), offset: 0 });
  }
  if (query.isLoading) return <State text="Memuat katalog menu..." />;
  if (query.isError) return <State error text="Katalog menu belum dapat dimuat." onRetry={() => void query.refetch()} />;
  const items = query.data?.items ?? [];
  return <><FilterBar onSubmit={applyFilters}><label className="min-w-52 flex-1 text-sm font-semibold">Cari menu<div className="relative mt-2"><Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} /><input className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 pl-9 pr-3 text-sm font-normal" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Kode, nama, atau path" value={draftSearch} /></div></label><SelectFilter label="Status" value={params.is_active} onChange={(value) => onParamsChange({ ...params, is_active: value, offset: 0 })} options={[["", "Semua status"], ["true", "Aktif"], ["false", "Nonaktif"]]} /></FilterBar><DataFrame empty={items.length === 0} text={params.search || params.is_active ? "Tidak ada menu yang cocok dengan filter." : "Belum ada menu yang tersedia."}><table className="min-w-[1000px] w-full text-left text-sm"><caption className="sr-only">Katalog menu</caption><thead><tr><Th>Menu</Th><Th>Path</Th><Th>Induk</Th><Th>Permission</Th><Th>Status</Th><Th>Aksi</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((menu) => <tr key={menu.id}><td className="px-4 py-4"><p className="font-semibold">{menu.name}</p><p className="text-xs text-slate-600">{menu.code}</p></td><td className="px-4 py-4 font-mono text-xs">{menu.path}</td><td className="px-4 py-4">{menu.parent_name ?? "Root"}</td><td className="px-4 py-4">{menu.permission_code ?? "Autentikasi"}</td><td className="px-4 py-4">{menu.is_active ? "Aktif" : "Nonaktif"}</td><td className="px-4 py-4"><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50" onClick={() => onEdit(menu)} type="button"><Edit3 size={15} />Ubah</button></td></tr>)}</tbody></table></DataFrame><Pagination offset={params.offset} limit={params.limit} total={total} isFetching={query.isFetching} onPageChange={(offset) => onParamsChange({ ...params, offset })} onLimitChange={(limit) => onParamsChange({ ...params, limit, offset: 0 })} /></>;
}

function FilterBar({ children, onSubmit }: { children: React.ReactNode; onSubmit: (event: FormEvent) => void }) {
  return <form className="mb-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)]" onSubmit={onSubmit}><div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">{children}</div><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" type="submit"><Search size={16} />Terapkan</button></form>;
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="min-w-40 text-sm font-semibold">{label}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function Pagination({ offset, limit, total, isFetching, onPageChange, onLimitChange }: { offset: number; limit: number; total: number; isFetching: boolean; onPageChange: (offset: number) => void; onLimitChange: (limit: number) => void }) {
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;
  return <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-slate-700"><p>Menampilkan {pageStart} sampai {pageEnd} dari {total}</p><div className="flex items-center gap-2"><label className="flex items-center gap-2">Per halaman<select className="h-10 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2" disabled={isFetching} onChange={(event) => onLimitChange(Number(event.target.value))} value={limit}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button aria-label="Halaman sebelumnya" className="grid min-h-10 min-w-10 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={!hasPrevious || isFetching} onClick={() => onPageChange(Math.max(0, offset - limit))} type="button"><ChevronLeft size={17} /></button><button aria-label="Halaman berikutnya" className="grid min-h-10 min-w-10 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={!hasNext || isFetching} onClick={() => onPageChange(offset + limit)} type="button"><ChevronRight size={17} /></button></div></div>;
}

function MenuForm({
  menu,
  menus,
  permissions,
  isLoading,
  onClose,
}: {
  menu: AdminMenu | null;
  menus: AdminMenu[];
  permissions: Permission[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const create = useCreateAdminMenu();
  const update = useUpdateAdminMenu();
  const [form, setForm] = useState({
    code: menu?.code ?? "",
    name: menu?.name ?? "",
    path: menu?.path ?? "/",
    icon: menu?.icon ?? "",
    parent_id: menu?.parent_id ? String(menu.parent_id) : "",
    sort_order: String(menu?.sort_order ?? 0),
    permission_id: menu?.permission_id ? String(menu.permission_id) : "",
    is_active: menu?.is_active ?? true,
  });
  const parentOptions = menus.filter((item) => item.id !== menu?.id && item.is_active);
  const isSaving = create.isPending || update.isPending;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      path: form.path.trim(),
      icon: form.icon.trim() || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      sort_order: Number(form.sort_order),
      permission_id: form.permission_id ? Number(form.permission_id) : null,
      is_active: form.is_active,
    };
    if (!payload.code || !payload.name || !payload.path.startsWith("/") || !Number.isInteger(payload.sort_order)) {
      toast.error("Periksa kode, nama, path, dan urutan menu.");
      return;
    }
    try {
      if (menu) {
        await update.mutateAsync({
          id: menu.id,
          payload: {
            ...payload,
            ...(payload.parent_id === null ? { clear_parent: true } : {}),
            ...(payload.permission_id === null ? { clear_permission: true } : {}),
          },
        });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(menu ? "Menu diperbarui." : "Menu dibuat.");
      onClose();
    } catch {
      toast.error("Perubahan menu belum dapat disimpan.");
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-menu-form-title"><form className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-lg)] bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onSubmit={(event) => void submit(event)}><h2 className="text-lg font-bold" id="admin-menu-form-title">{menu ? "Ubah menu" : "Tambah menu"}</h2><p className="mt-1 text-sm text-slate-700">Atur identitas, hierarki, permission, dan status menu navigasi.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Kode menu" disabled={Boolean(menu)} value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><Input label="Nama menu" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Input label="Path" value={form.path} onChange={(value) => setForm({ ...form, path: value })} /><Input label="Ikon (opsional)" value={form.icon} onChange={(value) => setForm({ ...form, icon: value })} /><label className="text-sm font-semibold">Menu induk<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, parent_id: event.target.value })} value={form.parent_id}><option value="">Root</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-semibold">Permission<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal" disabled={isLoading} onChange={(event) => setForm({ ...form, permission_id: event.target.value })} value={form.permission_id}><option value="">Tanpa permission khusus</option>{permissions.map((permission) => <option key={permission.id} value={permission.id}>{permission.code}</option>)}</select></label><Input label="Urutan" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: value })} /><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input checked={form.is_active} className="size-4 accent-teal-600" onChange={(event) => setForm({ ...form, is_active: event.target.checked })} type="checkbox" />Menu aktif</label></div><div className="mt-6 flex justify-end gap-2"><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold hover:bg-canvas-50" onClick={onClose} type="button">Batal</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={isSaving || isLoading} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button></div></form></div>;
}

function UserForm({
  user,
  roles,
  warehouses,
  warehousesError,
  warehousesLoading,
  assignedWarehouses,
  onClose,
}: {
  user: AdminUser | null;
  roles: Role[];
  warehouses: AdminWarehouse[];
  warehousesError: boolean;
  warehousesLoading: boolean;
  assignedWarehouses: ReturnType<typeof useAdminUserWarehouses>;
  onClose: () => void;
}) {
  const create = useCreateAdminUser();
  const update = useUpdateAdminUser();
  const updateWarehouses = useUpdateAdminUserWarehouses();
  const [form, setForm] = useState({ username: user?.username ?? "", email: user?.email ?? "", password: "", full_name: user?.full_name ?? "", role_id: String(user?.role_id ?? roles[0]?.id ?? ""), is_active: user?.is_active ?? true });
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>(user?.warehouse_ids ?? []);
  const [hasEditedWarehouses, setHasEditedWarehouses] = useState(false);
  const assignedWarehouseIds = assignedWarehouses.data?.map((warehouse) => warehouse.warehouse_id);
  const effectiveWarehouseIds = assignedWarehouseIds && !hasEditedWarehouses ? assignedWarehouseIds : selectedWarehouseIds;

  function toggleWarehouse(id: number) {
    setHasEditedWarehouses(true);
    setSelectedWarehouseIds((current) => current.includes(id) ? current.filter((warehouseId) => warehouseId !== id) : [...current, id]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (user && assignedWarehouses.isError) {
      toast.error("Penugasan gudang belum dapat dimuat. Coba lagi sebelum menyimpan.");
      return;
    }
    try {
      if (user) await update.mutateAsync({ id: user.id, payload: { email: form.email, full_name: form.full_name, role_id: Number(form.role_id), is_active: form.is_active, ...(form.password ? { password: form.password } : {}) } });
      else {
        await create.mutateAsync({ ...form, role_id: Number(form.role_id), warehouse_ids: effectiveWarehouseIds });
      }
      if (user) {
        await updateWarehouses.mutateAsync({ id: user.id, warehouse_ids: effectiveWarehouseIds });
      }
      toast.success(user ? "Pengguna diperbarui." : "Pengguna dibuat.");
      onClose();
    } catch { toast.error("Perubahan pengguna belum dapat disimpan."); }
  }
  const isSaving = create.isPending || update.isPending || updateWarehouses.isPending;
  const cannotSave = isSaving || warehousesLoading || warehousesError || Boolean(user && assignedWarehouses.isError);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-user-form-title"><form className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-lg)] bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onSubmit={(event) => void submit(event)}><h2 className="text-lg font-bold" id="admin-user-form-title">{user ? "Ubah pengguna" : "Tambah pengguna"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Nama lengkap" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} /><Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Input label="Username" disabled={Boolean(user)} value={form.username} onChange={(value) => setForm({ ...form, username: value })} /><Input label={user ? "Kata sandi baru (opsional)" : "Kata sandi"} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} /><label className="text-sm font-semibold">Peran<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, role_id: event.target.value })} value={form.role_id}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input checked={form.is_active} className="size-4 accent-teal-600" onChange={(event) => setForm({ ...form, is_active: event.target.checked })} type="checkbox" />Akun aktif</label></div><fieldset className="mt-6 rounded-[var(--radius-md)] border border-line-200 p-4"><legend className="px-1 text-sm font-bold">Penugasan gudang</legend>{assignedWarehouses.isLoading || warehousesLoading ? <p className="text-sm text-slate-600">Memuat daftar gudang...</p> : assignedWarehouses.isError ? <p className="text-sm text-red-700">Penugasan gudang belum dapat dimuat.</p> : warehousesError ? <p className="text-sm text-red-700">Daftar gudang aktif belum dapat dimuat.</p> : warehouses.length === 0 ? <p className="text-sm text-slate-600">Belum ada gudang aktif yang tersedia.</p> : <div className="grid gap-2 sm:grid-cols-2">{warehouses.map((warehouse) => <label className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-line-200 p-3 text-sm" key={warehouse.id}><input checked={effectiveWarehouseIds.includes(warehouse.id)} className="mt-1 size-4 accent-teal-600" disabled={isSaving} onChange={() => toggleWarehouse(warehouse.id)} type="checkbox" /><span><span className="block font-semibold">{warehouse.name}</span><span className="block text-xs text-slate-600">{warehouse.code}</span></span></label>)}</div>}</fieldset><div className="mt-6 flex justify-end gap-2"><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold hover:bg-canvas-50" onClick={onClose} type="button">Batal</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={cannotSave} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button></div></form></div>;
}

function Input({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <label className="text-sm font-semibold">{label}<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal disabled:bg-canvas-50" disabled={disabled} onChange={(event) => onChange(event.target.value)} required={label !== "Kata sandi baru (opsional)"} type={type} value={value} /></label>;
}

function DataFrame({ children, empty, text }: { children: React.ReactNode; empty: boolean; text: string }) {
  return <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">{empty ? <State text={text} /> : <div className="overflow-x-auto">{children}</div>}</section>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="bg-canvas-50 px-4 py-3 text-left text-xs font-semibold text-slate-700">{children}</th>;
}

function State({ text, error = false, onRetry }: { text: string; error?: boolean; onRetry?: () => void }) {
  return <div className={`rounded-[var(--radius-lg)] border ${error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"} p-8 text-center`}><ShieldCheck className="mx-auto mb-3 text-slate-600" size={24} /><p className="font-semibold">{text}</p>{error && onRetry && <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0 hover:bg-red-800" onClick={onRetry} type="button">Coba lagi</button>}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
