import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

interface LoginFormCardProps {
  username: string;
  password: string;
  showPassword: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  errorRequestId: string | null;
  fieldErrors: {
    username?: string;
    password?: string;
  };
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginFormCard({
  username,
  password,
  showPassword,
  isSubmitting,
  errorMessage,
  errorRequestId,
  fieldErrors,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 shadow-[var(--shadow-2)] sm:p-9">
      <p className="text-xs font-semibold text-teal-700">
        Gerbang ruang kerja operasional
      </p>

      <h1 className="mt-2 text-[clamp(1.625rem,2vw+1rem,2rem)] leading-[1.25] font-bold tracking-[-0.015em] text-ink-950">
        Masuk ke Jejakstok
      </h1>
      <p className="mt-2 text-sm leading-[1.6] text-slate-700">
        Gunakan akun yang telah ditugaskan untuk mengakses modul dan gudang sesuai
        hak akses Anda.
      </p>

      {errorMessage && (
        <div
          aria-live="polite"
          className="mt-5 rounded-[var(--radius-sm)] border border-red-600 bg-red-100 px-4 py-3 text-sm leading-relaxed font-medium text-red-700"
          id="login-form-error"
          role="alert"
        >
          <p>{errorMessage}</p>
          {errorRequestId && (
            <p className="mt-1 text-xs text-red-700 tabular-nums">
              ID Permintaan: {errorRequestId}
            </p>
          )}
        </div>
      )}

      <form className="mt-6 space-y-5" noValidate onSubmit={onSubmit}>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-ink-950" htmlFor="username">
              Nama pengguna
            </label>
            <span className="text-xs text-slate-600 tabular-nums" id="username-hint">
              Wajib (1-64 karakter)
            </span>
          </div>
          <input
            aria-describedby={
              fieldErrors.username
                ? "username-hint username-error"
                : errorMessage
                  ? "username-hint login-form-error"
                  : "username-hint"
            }
            aria-invalid={Boolean(fieldErrors.username) || Boolean(errorMessage)}
            autoComplete="username"
            className={`mt-2 h-12 w-full rounded-[var(--radius-sm)] border bg-surface-0 px-3.5 text-sm text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 placeholder:text-slate-600 disabled:cursor-not-allowed disabled:bg-canvas-50 ${
              fieldErrors.username
                ? "border-red-600"
                : "border-line-500 hover:border-ink-950 focus:border-teal-600"
            }`}
            disabled={isSubmitting}
            id="username"
            maxLength={64}
            name="username"
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Contoh: staff.jkt"
            required
            type="text"
            value={username}
          />
          {fieldErrors.username && (
            <p className="mt-1.5 text-xs font-medium text-red-700" id="username-error">
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-ink-950" htmlFor="password">
              Kata sandi
            </label>
            <span className="text-xs text-slate-600 tabular-nums" id="password-hint">
              Wajib (1-255 karakter)
            </span>
          </div>
          <div className="relative mt-2">
            <input
              aria-describedby={
                fieldErrors.password
                  ? "password-hint password-error"
                  : errorMessage
                    ? "password-hint login-form-error"
                    : "password-hint"
              }
              aria-invalid={Boolean(fieldErrors.password) || Boolean(errorMessage)}
              autoComplete="current-password"
              className={`h-12 w-full rounded-[var(--radius-sm)] border bg-surface-0 pr-12 pl-3.5 text-sm text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 placeholder:text-slate-600 disabled:cursor-not-allowed disabled:bg-canvas-50 ${
                fieldErrors.password
                  ? "border-red-600"
                  : "border-line-500 hover:border-ink-950 focus:border-teal-600"
              }`}
              disabled={isSubmitting}
              id="password"
              maxLength={255}
              name="password"
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Masukkan kata sandi akun"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-0.5 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-slate-600 transition-colors duration-150 hover:bg-canvas-50 hover:text-ink-950 active:bg-teal-100 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={onTogglePassword}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs font-medium text-red-700" id="password-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-5 py-3 text-sm font-semibold text-surface-0 shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-surface-0 border-t-transparent"
            />
          )}
          <span>
            {isSubmitting ? "Memverifikasi kredensial..." : "Masuk ke ruang kerja"}
          </span>
          {!isSubmitting && <ArrowRight aria-hidden="true" size={17} />}
        </button>
      </form>

      <p className="mt-6 border-t border-line-200 pt-5 text-xs leading-relaxed text-slate-600">
        Belum memiliki akun atau lupa kata sandi? Hubungi Super Admin atau pengelola
        pengguna di organisasi Anda.
      </p>
    </div>
  );
}
