import { ArrowLeft, ArrowRight, Eye, EyeOff, MapPin, ShieldCheck, Waypoints } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "@/features/auth/api";

const benefits = [
  {
    icon: MapPin,
    title: "Lihat posisi barang",
    description: "Saldo dapat ditelusuri sampai gudang dan lokasi penyimpanan.",
  },
  {
    icon: Waypoints,
    title: "Ikuti alur transaksi",
    description: "Penerimaan dan transfer berjalan melalui status yang jelas.",
  },
  {
    icon: ShieldCheck,
    title: "Bekerja sesuai akses",
    description: "Menu dan tindakan mengikuti peran serta gudang yang ditugaskan.",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (axios.isAxiosError<{ error?: { code?: string; message?: string } }>(error)) {
        const code = error.response?.data?.error?.code;
        setErrorMessage(
          code === "AUTH_TOO_MANY_ATTEMPTS"
            ? "Terlalu banyak percobaan login. Silakan coba lagi nanti."
            : error.response?.data?.error?.message ?? "Nama pengguna atau kata sandi tidak valid.",
        );
      } else {
        setErrorMessage("Login gagal. Periksa koneksi ke server lalu coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#17252a]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,0.9fr)_minmax(480px,1.1fr)]">
        <section className="relative hidden overflow-hidden bg-[#17252a] px-10 py-10 text-[#f5f0e8] lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute inset-x-0 top-0 h-[48%] overflow-hidden" aria-hidden="true">
            <img className="h-full w-full object-cover object-left opacity-35" src="/assets/image/login.jpg" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#17252a]/20 via-[#17252a]/60 to-[#17252a]" />
          </div>
          <div className="absolute -right-36 -bottom-36 size-[460px] rounded-full border border-[#52625d]/50" aria-hidden="true" />
          <div className="absolute right-16 -bottom-20 size-[280px] rounded-full border border-[#52625d]/30" aria-hidden="true" />
          <Link className="relative flex w-fit items-center gap-3" to="/" aria-label="Beranda Jejakstok">
            <img className="size-10 rounded-lg object-cover" src="/assets/image/icon/icon.jpg" alt="" />
            <span className="text-sm font-bold tracking-[0.12em] uppercase">Jejakstok</span>
          </Link>

          <div className="relative max-w-xl py-16">
            <p className="text-xs font-bold tracking-[0.14em] text-[#f1ad88] uppercase">Ruang kerja gudang</p>
            <h1 className="mt-5 max-w-lg text-4xl leading-[1.15] font-bold tracking-[-0.025em] xl:text-5xl">
              Lanjutkan pekerjaan dari tempat terakhir.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-[#d3d5ca]">
              Masuk untuk melihat pekerjaan yang sesuai dengan peran dan gudang Anda.
            </p>
            <div className="mt-10 space-y-5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div className="flex max-w-md gap-4" key={benefit.title}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#293b3d] text-[#a6c7b5]">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">{benefit.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#aebbb0]">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="relative text-xs text-[#8fa19b]">Satu kendali untuk setiap pergerakan stok.</p>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10 xl:px-24">
          <header className="flex items-center justify-between">
            <Link className="flex items-center gap-3 lg:hidden" to="/" aria-label="Beranda Jejakstok">
              <img className="size-9 rounded-lg object-cover" src="/assets/image/icon/icon.jpg" alt="" />
              <span className="text-sm font-bold tracking-[0.12em] uppercase">Jejakstok</span>
            </Link>
            <Link className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-[#2f7a68] transition-colors hover:text-[#17252a]" to="/">
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali ke beranda
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">
            <div className="w-full">
              <p className="text-xs font-bold tracking-[0.14em] text-[#2f7a68] uppercase">Akses ruang kerja</p>
              <h1 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] sm:text-4xl">Masuk ke Jejakstok</h1>
              <p className="mt-4 text-sm leading-7 text-[#4e5e5d]">
                Gunakan akun yang telah diberikan untuk mengakses pekerjaan gudang.
              </p>

              <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-semibold" htmlFor="username">Nama pengguna</label>
                  <input autoComplete="username" className="mt-2 h-12 w-full rounded-md border border-[#c7c1b6] bg-white px-4 text-sm outline-none transition-colors placeholder:text-[#8a948d] focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" id="username" maxLength={64} onChange={(event) => setUsername(event.target.value)} placeholder="Masukkan nama pengguna" required value={username} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold" htmlFor="password">Kata sandi</label>
                    <span className="text-xs text-[#7a8781]">Wajib diisi</span>
                  </div>
                  <div className="relative mt-2">
                    <input autoComplete="current-password" className="h-12 w-full rounded-md border border-[#c7c1b6] bg-white px-12 pr-12 text-sm outline-none transition-colors placeholder:text-[#8a948d] focus:border-[#2f7a68] focus:ring-2 focus:ring-[#2f7a68]/15" id="password" maxLength={255} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" required type={showPassword ? "text" : "password"} value={password} />
                    <ShieldCheck className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#7a8781]" size={17} aria-hidden="true" />
                    <button aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded text-[#7a8781] hover:text-[#17252a]" onClick={() => setShowPassword(!showPassword)} type="button">
                      {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p className="rounded-md border border-[#f1c7b5] bg-[#f9e8df] px-4 py-3 text-sm leading-6 text-[#8d422d]" role="status">
                    {errorMessage}
                  </p>
                )}

                <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2f7a68] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3b8f79] focus:ring-2 focus:ring-[#2f7a68]/30 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Memeriksa akun..." : "Masuk ke ruang kerja"}
                  {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
                </button>
              </form>

              <p className="mt-8 border-t border-[#ddd8ce] pt-6 text-xs leading-6 text-[#7a8781]">
                Belum memiliki akses? Hubungi administrator sistem Anda.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#7a8781] lg:text-right">Jejakstok — Sistem manajemen gudang</p>
        </section>
      </div>
    </main>
  );
}
