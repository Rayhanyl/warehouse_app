import { useAuthStore } from "@/features/auth/store";

const EMPTY_PERMISSIONS: string[] = [];

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? EMPTY_PERMISSIONS;

  function can(permissionCode: string): boolean {
    if (!user) {
      return true;
    }
    if (user.role_name?.toLowerCase() === "super admin") {
      return true;
    }
    return permissions.includes(permissionCode);
  }

  return { can, permissions, user };
}

