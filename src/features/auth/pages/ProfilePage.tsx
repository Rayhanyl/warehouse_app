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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProfileIdentityCard user={user} />
          <ProfileWarehousePermissionsCard user={user} />
        </div>
        <ChangePasswordCard />
      </div>
    </>
  );
}
