import { FormEvent, useState } from "react";
import { Edit3, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import {
  useAdminMenus,
  useAdminPermissions,
  useAdminRoles,
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useUpdateRolePermissions,
} from "../api";
import type { AdminUser, Role } from "../types";

const userInitial = { limit: 25, offset: 0, search: "", is_active: "" };
const menuInitial = { limit: 50, offset: 0, search: "", is_active: "" };

export function AdministrationPage() {
  const { can } = usePermission();
  const { pathname } = window.location;
  const activeSection = pathname.includes("/menus") ? "menus" : pathname.includes("/roles") ? "roles" : "users";
  const canManage = can("user:manage");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const users = useAdminUsers(userInitial, activeSection === "users" && canManage);
  const roles = useAdminRoles((activeSection === "roles" || userFormOpen) && canManage);
  const permissions = useAdminPermissions(activeSection === "roles" && canManage);
  const menus = useAdminMenus(menuInitial, activeSection === "menus" && canManage);

  if (!canManage) {
    return <State error text="Anda tidak memiliki izin untuk membuka administrasi dan keamanan." />;
  }

  return (
    <>
      <PageHeader
        title={activeSection === "menus" ? "Menu" : activeSection === "roles" ? "Peran dan permission" : "Pengguna dan peran"}
        description="Kelola akun, akses berbasis peran, dan katalog navigasi sistem."
        action={activeSection === "users" ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => { setEditingUser(null); setUserFormOpen(true); }} type="button"><UserPlus size={17} />Tambah pengguna</button> : undefined}
      />
      <AdminNavigation active={activeSection} />
      {activeSection === "users" && <UsersPanel query={users} onEdit={(user) => { setEditingUser(user); setUserFormOpen(true); }} />}
      {activeSection === "roles" && <RolesPanel roles={roles.data ?? []} permissions={permissions.data ?? []} isLoading={roles.isLoading || permissions.isLoading} />}
      {activeSection === "menus" && <MenusPanel query={menus} />}
      {userFormOpen && <UserForm user={editingUser} roles={roles.data ?? []} onClose={() => setUserFormOpen(false)} />}
    </>
  );
}

function AdminNavigation({ active }: { active: string }) {
  return <nav aria-label="Administrasi" className="mb-6 flex gap-1 overflow-x-auto border-b border-line-200">{[["/admin/users", "Pengguna"], ["/admin/roles", "Peran dan permission"], ["/admin/menus", "Menu"]].map(([path, label]) => <a className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${active === path.slice(7).split("/")[0] ? "border-teal-600 text-teal-700" : "border-transparent text-slate-700 hover:border-line-500"}`} href={path} key={path}>{label}</a>)}</nav>;
}

function UsersPanel({ query, onEdit }: { query: ReturnType<typeof useAdminUsers>; onEdit: (user: AdminUser) => void }) {
  if (query.isLoading) return <State text="Memuat daftar pengguna..." />;
  if (query.isError) return <State error text="Daftar pengguna belum dapat dimuat." onRetry={() => void query.refetch()} />;
  const items = query.data?.items ?? [];
  return <DataFrame empty={items.length === 0} text="Belum ada pengguna terdaftar."><table className="min-w-[900px] w-full text-left text-sm"><caption className="sr-only">Daftar pengguna</caption><thead><tr><Th>Pengguna</Th><Th>Peran</Th><Th>Status</Th><Th>Gudang</Th><Th>Login terakhir</Th><Th>Aksi</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((user) => <tr key={user.id}><td className="px-4 py-4"><p className="font-semibold">{user.full_name}</p><p className="text-xs text-slate-600">{user.username} · {user.email}</p></td><td className="px-4 py-4">{user.role_name}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? "bg-teal-100 text-teal-700" : "bg-canvas-50 text-slate-700"}`}>{user.is_active ? "Aktif" : "Nonaktif"}</span></td><td className="px-4 py-4 tabular-nums">{user.warehouse_ids.length}</td><td className="px-4 py-4 text-xs text-slate-700">{user.last_login_at ? formatDate(user.last_login_at) : "Belum pernah"}</td><td className="px-4 py-4"><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50" onClick={() => onEdit(user)} type="button"><Edit3 size={15} />Ubah</button></td></tr>)}</tbody></table></DataFrame>;
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

function MenusPanel({ query }: { query: ReturnType<typeof useAdminMenus> }) {
  if (query.isLoading) return <State text="Memuat katalog menu..." />;
  if (query.isError) return <State error text="Katalog menu belum dapat dimuat." onRetry={() => void query.refetch()} />;
  const items = query.data?.items ?? [];
  return <DataFrame empty={items.length === 0} text="Belum ada menu yang tersedia."><table className="min-w-[900px] w-full text-left text-sm"><caption className="sr-only">Katalog menu</caption><thead><tr><Th>Menu</Th><Th>Path</Th><Th>Induk</Th><Th>Permission</Th><Th>Status</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((menu) => <tr key={menu.id}><td className="px-4 py-4"><p className="font-semibold">{menu.name}</p><p className="text-xs text-slate-600">{menu.code}</p></td><td className="px-4 py-4 font-mono text-xs">{menu.path}</td><td className="px-4 py-4">{menu.parent_name ?? "Root"}</td><td className="px-4 py-4">{menu.permission_code ?? "Autentikasi"}</td><td className="px-4 py-4">{menu.is_active ? "Aktif" : "Nonaktif"}</td></tr>)}</tbody></table></DataFrame>;
}

function UserForm({ user, roles, onClose }: { user: AdminUser | null; roles: Role[]; onClose: () => void }) {
  const create = useCreateAdminUser();
  const update = useUpdateAdminUser();
  const [form, setForm] = useState({ username: user?.username ?? "", email: user?.email ?? "", password: "", full_name: user?.full_name ?? "", role_id: String(user?.role_id ?? roles[0]?.id ?? ""), is_active: user?.is_active ?? true });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (user) await update.mutateAsync({ id: user.id, payload: { email: form.email, full_name: form.full_name, role_id: Number(form.role_id), is_active: form.is_active, ...(form.password ? { password: form.password } : {}) } });
      else await create.mutateAsync({ ...form, role_id: Number(form.role_id), warehouse_ids: [] });
      toast.success(user ? "Pengguna diperbarui." : "Pengguna dibuat.");
      onClose();
    } catch { toast.error("Perubahan pengguna belum dapat disimpan."); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-user-form-title"><form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-lg)] bg-surface-0 p-5 shadow-[var(--shadow-2)]" onSubmit={(event) => void submit(event)}><h2 className="text-lg font-bold" id="admin-user-form-title">{user ? "Ubah pengguna" : "Tambah pengguna"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Nama lengkap" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} /><Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Input label="Username" disabled={Boolean(user)} value={form.username} onChange={(value) => setForm({ ...form, username: value })} /><Input label={user ? "Kata sandi baru (opsional)" : "Kata sandi"} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} /><label className="text-sm font-semibold">Peran<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, role_id: event.target.value })} value={form.role_id}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input checked={form.is_active} className="size-4 accent-teal-600" onChange={(event) => setForm({ ...form, is_active: event.target.checked })} type="checkbox" />Akun aktif</label></div><div className="mt-6 flex justify-end gap-2"><button className="min-h-11 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold" onClick={onClose} type="button">Batal</button><button className="min-h-11 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0" disabled={create.isPending || update.isPending} type="submit">{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}</button></div></form></div>;
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
  return <div className={`rounded-[var(--radius-lg)] border ${error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"} p-8 text-center`}><ShieldCheck className="mx-auto mb-3 text-slate-600" size={24} /><p className="font-semibold">{text}</p>{error && onRetry && <button className="mt-4 min-h-11 rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0" onClick={onRetry} type="button">Coba lagi</button>}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
