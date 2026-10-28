import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/features/auth/api";
import { extractApiErrorInfo } from "@/lib/errors";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: {
      locked_until?: string;
    };
  };
}

interface LoginLocationState {
  from?: string;
}

const operationalBenefits = [
  {
    icon: MapPin,
    title: "Stok hingga tingkat lokasi",
    description: "Saldo dapat ditelusuri sampai gudang dan lokasi penyimpanan.",
  },
  {
    icon: Waypoints,
    title: "Alur transaksi terkendali",
    description:
      "Penerimaan, transfer, dan stock opname berjalan mengikuti status dokumen.",
  },
  {
    icon: ShieldCheck,
    title: "Akses sesuai peran dan gudang",
    description:
      "Menu dan tindakan menyesuaikan permission serta penugasan gudang akun Anda.",
  },
] as const;

function formatLockoutMessage(
  lockedUntilIso?: string,
  fallbackMessage?: string,
) {
  if (lockedUntilIso) {
    const parsedDate = new Date(lockedUntilIso);
    if (!Number.isNaN(parsedDate.getTime())) {
      const formattedTime = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsedDate);
      return `Akun dikunci sementara karena terlalu banyak percobaan masuk. Silakan coba lagi setelah pukul ${formattedTime}.`;
    }
  }
  return (
    fallbackMessage ??
    "Akun dikunci sementara karena terlalu banyak percobaan masuk. Silakan coba lagi beberapa saat lagi."
  );
}

function resolvePostLoginPath(state: unknown): string {
  if (!state || typeof state !== "object" || !("from" in state)) {
    return "/dashboard";
  }
  const from = (state as LoginLocationState).from;
  if (
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    from !== "/login"
  ) {
    return from;
  }
  return "/dashboard";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setErrorRequestId(null);
    setFieldErrors({});

    const trimmedUsername = username.trim();
    const nextFieldErrors: { username?: string; password?: string } = {};

    if (trimmedUsername.length < 1 || trimmedUsername.length > 64) {
      nextFieldErrors.username =
        "Nama pengguna wajib diisi (1 sampai 64 karakter).";
    }
    if (password.length < 1 || password.length > 255) {
      nextFieldErrors.password =
        "Kata sandi wajib diisi (1 sampai 255 karakter).";
    }

    if (nextFieldErrors.username || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("Periksa kembali isian form yang belum sesuai.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ username: trimmedUsername, password });
      const destination = resolvePostLoginPath(location.state);
      navigate(destination, { replace: true });
    } catch (error) {
      const info = extractApiErrorInfo(error);
      if (info.requestId) {
        setErrorRequestId(info.requestId);
      }

      if (axios.isAxiosError<ApiErrorPayload>(error)) {
        const status = error.response?.status;
        const apiError = error.response?.data?.error;
        const code = apiError?.code;

        if (status === 429 || code === "AUTH_TOO_MANY_ATTEMPTS") {
          setErrorMessage(
            formatLockoutMessage(
              apiError?.details?.locked_until,
              apiError?.message,
            ),
          );
        } else if (status === 401 || code === "AUTH_INVALID_CREDENTIALS") {
          setErrorMessage("Nama pengguna atau kata sandi salah.");
        } else if (status === 422 || code === "VALIDATION_ERROR") {
          setErrorMessage(
            "Format nama pengguna atau kata sandi tidak sesuai ketentuan.",
          );
        } else if (info.isTimeout) {
          setErrorMessage(
            "Permintaan masuk melewati batas waktu. Periksa koneksi jaringan Anda lalu coba lagi.",
          );
        } else if (info.isNetworkError || !error.response) {
          setErrorMessage(
            "Tidak dapat terhubung ke server. Periksa koneksi jaringan lalu coba lagi.",
          );
        } else if (status !== undefined && status >= 500) {
          setErrorMessage(
            "Terjadi gangguan sementara pada server. Silakan coba masuk beberapa saat lagi.",
          );
        } else {
          setErrorMessage(
            apiError?.message ??
              "Gagal memproses permintaan masuk. Silakan coba kembali.",
          );
        }
      } else {
        setErrorMessage(
          "Tidak dapat terhubung ke server. Periksa koneksi jaringan lalu coba lagi.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-50 text-ink-950">
      <a
        href="#login-form-section"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--radius-sm)] focus:bg-teal-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-surface-0"
      >
        Lompat ke form masuk
      </a>

      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <aside
          aria-label="Informasi ruang kerja Jejakstok"
          className="relative hidden overflow-hidden bg-ink-950 px-10 py-10 text-canvas-50 lg:flex lg:flex-col lg:justify-between xl:px-14"
        >
          <div className="relative flex items-center justify-between gap-4">
            <Link
              className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2"
              to="/"
            >
              <img
                className="size-9 rounded-[var(--radius-sm)] border border-[#8a9995]/50 object-cover"
                src="/assets/image/icon/icon.jpg"
                alt=""
              />
              <span className="flex flex-col">
                <span className="text-base leading-tight font-bold text-canvas-50">
                  Jejakstok
                </span>
                <span className="text-xs leading-tight text-[#c8d0cd]">
                  Sistem manajemen gudang
                </span>
              </span>
            </Link>
          </div>

          <div className="relative my-auto py-8">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[#8a9995]/50 bg-ink-800 shadow-[var(--shadow-2)]">
              <img
                className="aspect-[16/7] w-full object-cover object-center"
                src="/assets/image/login.jpg"
                alt="Aktivitas pemeriksaan dan pencatatan stok di ruang kerja gudang"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#8a9995]/40 bg-ink-950 px-4 py-3">
                <span className="text-xs font-medium text-[#e2e6e4]">
                  Siklus terkendali: PO → GR → Transfer → Stock Opname
                </span>
                <span className="inline-flex rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                  RBAC & Audit Aktif
                </span>
              </div>
            </div>

            <p className="mt-7 text-xs font-semibold text-amber-400">
              Ruang kerja operasional gudang
            </p>
            <h2 className="mt-2 max-w-lg text-[clamp(1.75rem,2.5vw+1rem,2.375rem)] leading-[1.2] font-bold tracking-[-0.02em] text-canvas-50">
              Satu kendali untuk setiap pergerakan stok.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-[1.65] text-[#e2e6e4]">
              Masuk untuk memproses purchase order, penerimaan barang, transfer
              antar-gudang, serta stock opname sesuai peran dan penugasan gudang.
            </p>

            <dl className="mt-6 grid gap-3">
              {operationalBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    className="flex items-start gap-3.5 rounded-[var(--radius-md)] border border-[#8a9995]/40 bg-ink-800 p-3.5"
                    key={benefit.title}
                  >
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-sm font-bold text-canvas-50">
                        {benefit.title}
                      </dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-[#c8d0cd]">
                        {benefit.description}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>

          <p className="relative text-xs text-[#c8d0cd]">
            Jejakstok: Sistem manajemen gudang
          </p>
        </aside>

        <main
          id="login-form-section"
          className="flex min-h-screen flex-col justify-between px-4 py-6 sm:px-8 lg:px-14 lg:py-10 xl:px-20"
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link
              className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2 lg:hidden"
              to="/"
            >
              <img
                className="size-9 rounded-[var(--radius-sm)] border border-line-200 object-cover shadow-[var(--shadow-1)]"
                src="/assets/image/icon/icon.jpg"
                alt=""
              />
              <span className="flex flex-col">
                <span className="text-base leading-tight font-bold text-ink-950">
                  Jejakstok
                </span>
                <span className="text-xs leading-tight text-slate-600">
                  Sistem manajemen gudang
                </span>
              </span>
            </Link>

            <Link
              className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-3.5 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 hover:border-teal-600 hover:text-teal-600"
              to="/"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Kembali ke beranda</span>
            </Link>
          </header>

          <div className="mx-auto my-auto w-full max-w-md py-8 sm:py-12">
            <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 shadow-[var(--shadow-2)] sm:p-9">
              <p className="text-xs font-semibold text-teal-700">
                Gerbang ruang kerja operasional
              </p>

              <h1 className="mt-2 text-[clamp(1.625rem,2vw+1rem,2rem)] leading-[1.25] font-bold tracking-[-0.015em] text-ink-950">
                Masuk ke Jejakstok
              </h1>
              <p className="mt-2 text-sm leading-[1.6] text-slate-700">
                Gunakan akun yang telah ditugaskan untuk mengakses modul dan
                gudang sesuai hak akses Anda.
              </p>

              {errorMessage && (
                <div
                  id="login-form-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-5 rounded-[var(--radius-sm)] border border-red-600 bg-red-100 px-4 py-3 text-sm leading-relaxed font-medium text-red-700"
                >
                  <p>{errorMessage}</p>
                  {errorRequestId && (
                    <p className="mt-1 tabular-nums text-xs text-red-700">
                      ID Permintaan: {errorRequestId}
                    </p>
                  )}
                </div>
              )}

              <form
                className="mt-6 space-y-5"
                noValidate
                onSubmit={handleSubmit}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className="text-xs font-semibold text-ink-950"
                      htmlFor="username"
                    >
                      Nama pengguna
                    </label>
                    <span
                      id="username-hint"
                      className="tabular-nums text-xs text-slate-600"
                    >
                      Wajib (1-64 karakter)
                    </span>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    maxLength={64}
                    required
                    disabled={isSubmitting}
                    value={username}
                    aria-invalid={
                      Boolean(fieldErrors.username) || Boolean(errorMessage)
                    }
                    aria-describedby={
                      fieldErrors.username
                        ? "username-hint username-error"
                        : errorMessage
                          ? "username-hint login-form-error"
                          : "username-hint"
                    }
                    onChange={(event) => {
                      setUsername(event.target.value);
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          username: undefined,
                        }));
                      }
                    }}
                    placeholder="Contoh: staff.jkt"
                    className={`mt-2 h-12 w-full rounded-[var(--radius-sm)] border bg-surface-0 px-3.5 text-sm text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 placeholder:text-slate-600 disabled:cursor-not-allowed disabled:bg-canvas-50 ${
                      fieldErrors.username
                        ? "border-red-600"
                        : "border-line-500 hover:border-ink-950 focus:border-teal-600"
                    }`}
                  />
                  {fieldErrors.username && (
                    <p
                      id="username-error"
                      className="mt-1.5 text-xs font-medium text-red-700"
                    >
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className="text-xs font-semibold text-ink-950"
                      htmlFor="password"
                    >
                      Kata sandi
                    </label>
                    <span
                      id="password-hint"
                      className="tabular-nums text-xs text-slate-600"
                    >
                      Wajib (1-255 karakter)
                    </span>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      maxLength={255}
                      required
                      disabled={isSubmitting}
                      value={password}
                      aria-invalid={
                        Boolean(fieldErrors.password) || Boolean(errorMessage)
                      }
                      aria-describedby={
                        fieldErrors.password
                          ? "password-hint password-error"
                          : errorMessage
                            ? "password-hint login-form-error"
                            : "password-hint"
                      }
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }
                      }}
                      placeholder="Masukkan kata sandi akun"
                      className={`h-12 w-full rounded-[var(--radius-sm)] border bg-surface-0 pr-12 pl-3.5 text-sm text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 placeholder:text-slate-600 disabled:cursor-not-allowed disabled:bg-canvas-50 ${
                        fieldErrors.password
                          ? "border-red-600"
                          : "border-line-500 hover:border-ink-950 focus:border-teal-600"
                      }`}
                    />
                    <button
                      type="button"
                      disabled={isSubmitting}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-0.5 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-slate-600 transition-colors duration-150 hover:bg-canvas-50 hover:text-ink-950 active:bg-teal-100 disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p
                      id="password-error"
                      className="mt-1.5 text-xs font-medium text-red-700"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-5 py-3 text-sm font-semibold text-surface-0 shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && (
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-surface-0 border-t-transparent"
                    />
                  )}
                  <span>
                    {isSubmitting
                      ? "Memverifikasi kredensial..."
                      : "Masuk ke ruang kerja"}
                  </span>
                  {!isSubmitting && (
                    <ArrowRight size={17} aria-hidden="true" />
                  )}
                </button>
              </form>

              <p className="mt-6 border-t border-line-200 pt-5 text-xs leading-relaxed text-slate-600">
                Belum memiliki akun atau lupa kata sandi? Hubungi Super Admin
                atau pengelola pengguna di organisasi Anda.
              </p>
            </div>
          </div>

          <footer className="text-center text-xs text-slate-600 lg:text-right">
            Jejakstok: Sistem manajemen gudang
          </footer>
        </main>
      </div>
    </div>
  );
}
