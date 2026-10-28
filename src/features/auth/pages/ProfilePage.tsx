import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, UserRound, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { changePassword } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { extractApiErrorInfo } from "@/lib/errors";

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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    requestId?: string | null;
  } | null>(null);

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
      setFeedback({
        type: "error",
        message: "Kata sandi baru minimal terdiri dari 8 karakter.",
      });
      return;
    }

    if (passwords.next !== passwords.confirmation) {
      setFeedback({
        type: "error",
        message: "Konfirmasi kata sandi belum sama.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: passwords.current,
        new_password: passwords.next,
      });
      setPasswords(initialPasswords);
      setFeedback({
        type: "success",
        message: "Kata sandi berhasil diperbarui. Sesi lain telah dicabut oleh server.",
      });
    } catch (error) {
      const info = extractApiErrorInfo(error);
      setFeedback({
        type: "error",
        message:
          info.message ||
          "Kata sandi belum dapat diperbarui. Periksa koneksi ke server.",
        requestId: info.requestId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Lihat informasi akun, peran kerja, cakupan gudang, dan kelola kata sandi Anda."
        title="Profil"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section
          aria-labelledby="profile-info-title"
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
        >
          <div className="flex items-center gap-4 border-b border-line-200 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-amber-600 text-xl font-bold text-surface-0">
              {(user?.full_name || user?.username || "P").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-ink-950" id="profile-info-title">
                {user?.full_name || "Pengguna"}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-600">@{user?.username}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <UserRound aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Email</dt>
                <dd className="mt-1 font-semibold break-all text-ink-950">
                  {user?.email || "Belum tersedia"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Peran</dt>
                <dd className="mt-1 font-semibold text-ink-950">
                  {user?.role_name || "Belum ditetapkan"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Warehouse aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Gudang yang ditugaskan</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {user?.warehouse_ids.length ? (
                    user.warehouse_ids.map((warehouseId) => (
                      <span
                        className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700 tabular-nums"
                        key={warehouseId}
                      >
                        Gudang #{warehouseId}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-ink-950">
                      Semua gudang atau belum ditugaskan
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="password-title"
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
              <KeyRound aria-hidden="true" size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-950" id="password-title">
                Ganti kata sandi
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Gunakan kata sandi baru minimal 8 karakter. Setelah disimpan, sesi di perangkat lain akan dicabut otomatis.
              </p>
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {(
              [
                ["current", "Kata sandi saat ini", "Masukkan kata sandi saat ini"],
                ["next", "Kata sandi baru", "Masukkan kata sandi baru"],
                ["confirmation", "Konfirmasi kata sandi baru", "Ulangi kata sandi baru"],
              ] as const
            ).map(([field, label, placeholder]) => (
              <div key={field}>
                <label
                  className="text-sm font-semibold text-ink-950"
                  htmlFor={`profile-password-${field}`}
                >
                  {label}
                </label>
                <div className="relative mt-2">
                  <input
                    autoComplete={field === "current" ? "current-password" : "new-password"}
                    className="h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 pr-12 text-sm text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    id={`profile-password-${field}`}
                    minLength={field === "current" ? 1 : 8}
                    onChange={(event) => updatePassword(field, event.target.value)}
                    placeholder={placeholder}
                    required
                    type={visibleFields[field] ? "text" : "password"}
                    value={passwords[field]}
                  />
                  <button
                    aria-label={
                      visibleFields[field]
                        ? `Sembunyikan ${label.toLowerCase()}`
                        : `Tampilkan ${label.toLowerCase()}`
                    }
                    aria-pressed={visibleFields[field]}
                    className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
                    onClick={() => toggleVisibility(field)}
                    type="button"
                  >
                    {visibleFields[field] ? (
                      <EyeOff aria-hidden="true" size={18} />
                    ) : (
                      <Eye aria-hidden="true" size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {feedback && (
              <div
                className={`rounded-[var(--radius-md)] border px-3.5 py-3 text-sm leading-5 ${
                  feedback.type === "success"
                    ? "border-teal-600/30 bg-teal-100 text-teal-700"
                    : "border-red-600/30 bg-red-100 text-red-700"
                }`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                <p className="font-semibold">{feedback.message}</p>
                {feedback.requestId && (
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    ID Permintaan: {feedback.requestId}
                  </p>
                )}
              </div>
            )}
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan kata sandi"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
