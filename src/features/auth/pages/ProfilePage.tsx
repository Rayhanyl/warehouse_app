import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, UserRound, Warehouse } from "lucide-react";
import axios from "axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { changePassword } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";

type PasswordField = "current" | "next" | "confirmation";

const initialPasswords = {
  current: "",
  next: "",
  confirmation: "",
};

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [passwords, setPasswords] = useState(initialPasswords);
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirmation: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function updatePassword(field: PasswordField, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function toggleVisibility(field: PasswordField) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (passwords.next.length < 8) {
      setFeedback({ type: "error", message: "Kata sandi baru minimal terdiri dari 8 karakter." });
      return;
    }

    if (passwords.next !== passwords.confirmation) {
      setFeedback({ type: "error", message: "Konfirmasi kata sandi belum sama." });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: passwords.current,
        new_password: passwords.next,
      });
      setPasswords(initialPasswords);
      setFeedback({ type: "success", message: "Kata sandi berhasil diperbarui. Sesi lain telah dicabut oleh server." });
    } catch (error) {
      const message = axios.isAxiosError<{ error?: { message?: string } }>(error)
        ? error.response?.data?.error?.message ?? "Kata sandi belum dapat diperbarui."
        : "Kata sandi belum dapat diperbarui. Periksa koneksi ke server.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Lihat informasi akun dan kelola kata sandi Anda."
        title="Profil"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-[#d9dfd8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="profile-info-title">
          <div className="flex items-center gap-4 border-b border-[#e7ebe5] pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d96b3b] text-xl font-bold text-white">
              {(user?.full_name || user?.username || "P").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold" id="profile-info-title">{user?.full_name || "Pengguna"}</h2>
              <p className="mt-1 truncate text-sm text-[#667876]">@{user?.username}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 shrink-0 text-[#2f7a68]" size={18} />
              <div><dt className="text-xs text-[#667876]">Email</dt><dd className="mt-1 font-semibold break-all">{user?.email || "-"}</dd></div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#2f7a68]" size={18} />
              <div><dt className="text-xs text-[#667876]">Peran</dt><dd className="mt-1 font-semibold">{user?.role_name || "-"}</dd></div>
            </div>
            <div className="flex items-start gap-3">
              <Warehouse className="mt-0.5 shrink-0 text-[#2f7a68]" size={18} />
              <div>
                <dt className="text-xs text-[#667876]">Gudang yang ditugaskan</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {user?.warehouse_ids.length ? user.warehouse_ids.map((warehouseId) => (
                    <span className="rounded-full bg-[#e3ebe3] px-2.5 py-1 text-xs font-semibold text-[#2f7a68]" key={warehouseId}>Gudang #{warehouseId}</span>
                  )) : <span className="text-sm font-semibold">Semua gudang atau belum ditugaskan</span>}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[#d9dfd8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="password-title">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3ebe3] text-[#2f7a68]"><KeyRound aria-hidden="true" size={19} /></div>
            <div>
              <h2 className="text-lg font-bold" id="password-title">Ganti kata sandi</h2>
              <p className="mt-1 text-sm leading-6 text-[#667876]">Gunakan kata sandi baru minimal 8 karakter.</p>
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {([
              ["current", "Kata sandi saat ini", "Masukkan kata sandi saat ini"],
              ["next", "Kata sandi baru", "Masukkan kata sandi baru"],
              ["confirmation", "Konfirmasi kata sandi baru", "Ulangi kata sandi baru"],
            ] as const).map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="text-sm font-semibold" htmlFor={`profile-password-${field}`}>{label}</label>
                <div className="relative mt-2">
                  <input
                    autoComplete={field === "current" ? "current-password" : "new-password"}
                    className="h-11 w-full rounded-lg border border-[#c7c1b6] bg-white px-3 pr-11 text-sm outline-none focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15"
                    id={`profile-password-${field}`}
                    minLength={field === "current" ? 1 : 8}
                    onChange={(event) => updatePassword(field, event.target.value)}
                    placeholder={placeholder}
                    required
                    type={visibleFields[field] ? "text" : "password"}
                    value={passwords[field]}
                  />
                  <button aria-label={visibleFields[field] ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded text-[#667876] hover:text-[#17252a]" onClick={() => toggleVisibility(field)} type="button">
                    {visibleFields[field] ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            ))}
            {feedback && (
              <p className={`rounded-lg border px-3 py-3 text-sm leading-5 ${feedback.type === "success" ? "border-[#b8d6c3] bg-[#e3ebe3] text-[#256354]" : "border-[#efc5c0] bg-[#fbe6e4] text-[#8f2f2f]"}`} role="status">{feedback.message}</p>
            )}
            <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#2f7a68] px-4 text-sm font-semibold text-white hover:bg-[#256354] focus-visible:ring-2 focus-visible:ring-[#2f7a68] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Menyimpan..." : "Simpan kata sandi"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
