import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { login } from "@/features/auth/api";
import { extractApiErrorInfo, mapApiFormError } from "@/lib/errors";
import { validateZodSchema } from "@/lib/validation";
import { LoginAsidePanel } from "../components/LoginAsidePanel";
import { LoginFormCard } from "../components/LoginFormCard";

const loginFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Nama pengguna wajib diisi (1 sampai 64 karakter).")
    .max(64, "Nama pengguna wajib diisi (1 sampai 64 karakter)."),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi (1 sampai 255 karakter).")
    .max(255, "Kata sandi wajib diisi (1 sampai 255 karakter).")
    .refine(
      (value) => value.trim().length > 0,
      "Kata sandi tidak boleh hanya berisi spasi.",
    ),
});

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

function formatLockoutMessage(lockedUntilIso?: string, fallbackMessage?: string) {
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

    const parsed = validateZodSchema(loginFormSchema, { username, password });
    if (!parsed.ok) {
      setFieldErrors({
        username: parsed.fieldErrors.username,
        password: parsed.fieldErrors.password,
      });
      setErrorMessage("Periksa kembali isian form yang belum sesuai.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        username: parsed.data.username,
        password: parsed.data.password,
      });
      navigate(resolvePostLoginPath(location.state), { replace: true });
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
            formatLockoutMessage(apiError?.details?.locked_until, apiError?.message),
          );
        } else if (status === 401 || code === "AUTH_INVALID_CREDENTIALS") {
          setErrorMessage("Nama pengguna atau kata sandi salah.");
        } else if (status === 422 || code === "VALIDATION_ERROR") {
          const mapped = mapApiFormError(
            error,
            "Format nama pengguna atau kata sandi tidak sesuai ketentuan.",
          );
          setFieldErrors({
            username: mapped.fieldErrors.username,
            password: mapped.fieldErrors.password,
          });
          setErrorMessage(
            mapped.formMessage ||
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--radius-sm)] focus:bg-teal-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-surface-0"
        href="#login-form-section"
      >
        Lompat ke form masuk
      </a>

      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <LoginAsidePanel />

        <main
          className="flex min-h-screen flex-col justify-between px-4 py-6 sm:px-8 lg:px-14 lg:py-10 xl:px-20"
          id="login-form-section"
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link
              className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2 lg:hidden"
              to="/"
            >
              <img
                alt=""
                className="size-9 rounded-[var(--radius-sm)] border border-line-200 object-cover shadow-[var(--shadow-1)]"
                src="/assets/image/icon/icon.jpg"
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
              <ArrowLeft aria-hidden="true" size={16} />
              <span>Kembali ke beranda</span>
            </Link>
          </header>

          <div className="mx-auto my-auto w-full max-w-md py-8 sm:py-12">
            <LoginFormCard
              errorMessage={errorMessage}
              errorRequestId={errorRequestId}
              fieldErrors={fieldErrors}
              isSubmitting={isSubmitting}
              onPasswordChange={(nextPassword) => {
                setPassword(nextPassword);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              onSubmit={(event) => void handleSubmit(event)}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              onUsernameChange={(nextUsername) => {
                setUsername(nextUsername);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              password={password}
              showPassword={showPassword}
              username={username}
            />
          </div>

          <footer className="text-center text-xs text-slate-600 lg:text-right">
            Jejakstok: Sistem manajemen gudang
          </footer>
        </main>
      </div>
    </div>
  );
}
