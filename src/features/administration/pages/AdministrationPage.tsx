import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { RouteTabNav } from "@/components/shared/RouteTabNav";
import { DocumentTemplateSettingsPanel } from "@/features/document-templates/components/DocumentTemplateSettingsPanel";
import { usePermission } from "@/hooks/usePermission";
import {
  type MenuParams,
  type UserParams,
  useAdminMenus,
  useAdminPermissions,
  useAdminRoles,
  useAdminUserWarehouses,
  useAdminUsers,
  useAdminWarehouses,
} from "../api";
import { AdminState } from "../components/AdminShared";
import { MenuFormDialog } from "../components/MenuFormDialog";
import { MenusPanel } from "../components/MenusPanel";
import { RolesPanel } from "../components/RolesPanel";
import { UserFormDialog } from "../components/UserFormDialog";
import { UsersPanel } from "../components/UsersPanel";
import type { AdminMenu, AdminUser } from "../types";

const userInitial: UserParams = { limit: 25, offset: 0, search: "", is_active: "" };
const menuInitial: MenuParams = { limit: 25, offset: 0, search: "", is_active: "" };

const ADMIN_SECTIONS = [
  ["/admin/users", "users", "Pengguna"],
  ["/admin/roles", "roles", "Peran dan permission"],
  ["/admin/menus", "menus", "Menu"],
  ["/admin/document-templates", "document-templates", "Template dokumen"],
] as const;

const SECTION_TITLES = {
  users: "Pengguna dan peran",
  roles: "Peran dan permission",
  menus: "Menu",
  "document-templates": "Template dokumen cetak",
} as const;

export function AdministrationPage() {
  const { can } = usePermission();
  const { pathname } = useLocation();
  const activeSection = pathname.includes("/document-templates")
    ? "document-templates"
    : pathname.includes("/menus")
      ? "menus"
      : pathname.includes("/roles")
        ? "roles"
        : "users";
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
  const assignedWarehouses = useAdminUserWarehouses(
    editingUser?.id ?? null,
    userFormOpen && canManage,
  );

  if (!canManage) {
    return (
      <AdminState
        error
        text="Anda tidak memiliki izin untuk membuka administrasi dan keamanan."
      />
    );
  }

  const headerAction =
    activeSection === "users" ? (
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
        onClick={() => {
          setEditingUser(null);
          setUserFormOpen(true);
        }}
        type="button"
      >
        <UserPlus size={17} />
        Tambah pengguna
      </button>
    ) : activeSection === "menus" ? (
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
        onClick={() => setMenuFormOpen(true)}
        type="button"
      >
        <Plus size={17} />
        Tambah menu
      </button>
    ) : undefined;

  return (
    <>
      <PageHeader
        action={headerAction}
        description="Kelola akun, akses berbasis peran, katalog navigasi, dan format dokumen cetak sistem."
        title={SECTION_TITLES[activeSection]}
      />
      <RouteTabNav
        ariaLabel="Administrasi"
        items={ADMIN_SECTIONS.map(([path, key, label]) => ({
          to: path,
          label,
          active: activeSection === key,
        }))}
      />

      {activeSection === "users" && (
        <UsersPanel
          onEdit={(user) => {
            setEditingUser(user);
            setUserFormOpen(true);
          }}
          onParamsChange={setUserParams}
          params={userParams}
          query={users}
        />
      )}
      {activeSection === "roles" && (
        <RolesPanel
          isLoading={roles.isLoading || permissions.isLoading}
          permissions={permissions.data ?? []}
          roles={roles.data ?? []}
        />
      )}
      {activeSection === "menus" && (
        <MenusPanel
          onEdit={(menu) => {
            setEditingMenu(menu);
            setMenuFormOpen(true);
          }}
          onParamsChange={setMenuParams}
          params={menuParams}
          query={menus}
        />
      )}
      {activeSection === "document-templates" && <DocumentTemplateSettingsPanel />}

      {userFormOpen && (
        <UserFormDialog
          assignedWarehouses={assignedWarehouses}
          onClose={() => setUserFormOpen(false)}
          roles={roles.data ?? []}
          user={editingUser}
          warehouses={warehouses.data ?? []}
          warehousesError={warehouses.isError}
          warehousesLoading={warehouses.isLoading}
        />
      )}
      {menuFormOpen && (
        <MenuFormDialog
          isLoading={menuPermissions.isLoading}
          menu={editingMenu}
          menus={menus.data?.items ?? []}
          onClose={() => {
            setMenuFormOpen(false);
            setEditingMenu(null);
          }}
          permissions={menuPermissions.data ?? []}
        />
      )}
    </>
  );
}
