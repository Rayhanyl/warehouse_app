import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordCard } from "@/features/auth/components/ChangePasswordCard";
import { ProfileIdentityCard } from "@/features/auth/components/ProfileIdentityCard";
import { ProfileWarehousePermissionsCard } from "@/features/auth/components/ProfileWarehousePermissionsCard";
import { useAuthStore } from "@/features/auth/store";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <>
      <PageHeader
        description="Lihat informasi akun, peran kerja, cakupan gudang, hak akses, dan kelola kata sandi Anda."
        title="Profil"
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ProfileIdentityCard user={user} />
        <ChangePasswordCard />
        <div className="lg:col-span-2">
          <ProfileWarehousePermissionsCard user={user} />
        </div>
      </div>
    </>
  );
}
