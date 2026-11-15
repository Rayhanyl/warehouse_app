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
import { ApprovalSettingsPanel } from "../components/ApprovalSettingsPanel";
import { MenuFormDialog } from "../components/MenuFormDialog";
import { MenusPanel } from "../components/MenusPanel";
import { RolesPanel } from "../components/RolesPanel";
import { UserFormDialog } from "../components/UserFormDialog";
import { UsersPanel } from "../components/UsersPanel";
import type { AdminMenu, AdminUser } from "../types";

const userInitial: UserParams = { limit: 25, offset: 0, search: "", is_active: "" };
const menuInitial: MenuParams = { limit: 25, offset: 0, search: "", is_active: "" };

const ADMIN_SECTIONS = [
  ["/admin/users", "users", "Pengguna", "user:manage"],
  ["/admin/roles", "roles", "Peran dan permission", "user:manage"],
  ["/admin/menus", "menus", "Menu", "user:manage"],
  ["/admin/document-templates", "document-templates", "Template dokumen", "user:manage"],
  ["/admin/settings", "settings", "Pengaturan Approval", "settings:manage"],
] as const;

const SECTION_TITLES = {
  users: "Pengguna dan peran",
  roles: "Peran dan permission",
  menus: "Menu",
  "document-templates": "Template dokumen cetak",
  settings: "Pengaturan Approval",
} as const;

export function AdministrationPage() {
  const { can } = usePermission();
  const { pathname } = useLocation();
  const canManageUsers = can("user:manage");
  const canManageSettings = can("settings:manage");
  const canAccessAny = canManageUsers || canManageSettings;
  const activeSection = pathname.includes("/settings")
    ? "settings"
    : pathname.includes("/document-templates")
      ? "document-templates"
      : pathname.includes("/menus")
        ? "menus"
        : pathname.includes("/roles")
          ? "roles"
          : !canManageUsers && canManageSettings
            ? "settings"
            : "users";
  const canManage = activeSection === "settings" ? canManageSettings : canManageUsers;
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AdminMenu | null>(null);
  const [userParams, setUserParams] = useState(userInitial);
  const [menuParams, setMenuParams] = useState(menuInitial);

  const users = useAdminUsers(userParams, activeSection === "users" && canManageUsers);
  const roles = useAdminRoles((activeSection === "roles" || userFormOpen) && canManageUsers);
  const permissions = useAdminPermissions(activeSection === "roles" && canManageUsers);
  const menus = useAdminMenus(menuParams, activeSection === "menus" && canManageUsers);
  const menuPermissions = useAdminPermissions(activeSection === "menus" && canManageUsers);
  const warehouses = useAdminWarehouses(userFormOpen && canManageUsers);
  const assignedWarehouses = useAdminUserWarehouses(
    editingUser?.id ?? null,
    userFormOpen && canManageUsers,
  );

  if (!canAccessAny || !canManage) {
    return (
      <AdminState
        error
        text="Anda tidak memiliki izin untuk membuka administrasi dan keamanan."
      />
    );
  }

  const visibleSections = ADMIN_SECTIONS.filter(([, , , perm]) => can(perm));

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
        items={visibleSections.map(([path, key, label]) => ({
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
      {activeSection === "settings" && <ApprovalSettingsPanel enabled={canManageSettings} />}

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
