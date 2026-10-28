import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  describeSessionRestoreError,
  initAuthTabSync,
  isForbiddenSessionError,
  isRecoverableSessionError,
  logout,
  refreshSession,
  SessionRestoreTimeoutError,
} from "@/features/auth/api";
import {
  useAuthStore,
  type SessionRestoreErrorInfo,
} from "@/features/auth/store";

type RestorePhase = "checking" | "ready" | "unavailable" | "forbidden";

export function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) =>
    Boolean(state.accessToken && state.user),
  );

  const [restorePhase, setRestorePhase] = useState<RestorePhase>(
    isAuthenticated ? "ready" : "checking",
  );
  const [localErrorInfo, setLocalErrorInfo] =
    useState<SessionRestoreErrorInfo | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    return initAuthTabSync();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    let isMounted = true;

    const restoreTimeout = window.setTimeout(() => {
      if (isMounted) {
        const timeoutError = new SessionRestoreTimeoutError();
        setLocalErrorInfo(describeSessionRestoreError(timeoutError));
        setRestorePhase("unavailable");
      }
    }, 12000);

    refreshSession()
      .then(() => {
        if (isMounted) {
          setLocalErrorInfo(null);
          setRestorePhase("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }
        if (isForbiddenSessionError(error)) {
          setLocalErrorInfo(describeSessionRestoreError(error));
          setRestorePhase("forbidden");
          return;
        }
        if (isRecoverableSessionError(error)) {
          setLocalErrorInfo(describeSessionRestoreError(error));
          setRestorePhase("unavailable");
          return;
        }
        setLocalErrorInfo(null);
        setRestorePhase("ready");
      })
      .finally(() => {
        window.clearTimeout(restoreTimeout);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(restoreTimeout);
    };
  }, [isAuthenticated, retryAttempt]);

  if (isAuthenticated) {
    return <Outlet />;
  }

  const effectiveError = localErrorInfo ?? useAuthStore.getState().restoreError;

  if (restorePhase === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas-50 px-4 text-ink-950">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 px-6 py-5 text-center shadow-[var(--shadow-1)]"
        >
          <span
            aria-hidden="true"
            className="size-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
          />
          <p className="text-sm font-semibold text-ink-950">
            Memulihkan sesi...
          </p>
          <p className="text-xs text-slate-700">
            Memverifikasi sesi kerja Anda dengan server.
          </p>
        </div>
      </main>
    );
  }

  if (restorePhase === "forbidden") {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas-50 px-4 text-ink-950">
        <section
          role="alert"
          className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 shadow-[var(--shadow-1)] sm:p-7"
        >
          <div className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] bg-red-100 text-red-700">
            <ShieldAlert size={20} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink-950">
            Akses ruang kerja ditolak
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {effectiveError?.message ??
              "Akun Anda tidak memiliki izin untuk mengakses halaman ruang kerja ini."}
          </p>
          {effectiveError?.requestId && (
            <p className="mt-2 tabular-nums text-xs text-slate-600">
              ID Permintaan: {effectiveError.requestId}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void logout().then(() => {
                  navigate("/login", { replace: true });
                });
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-teal-600 px-4 py-2.5 text-sm font-semibold text-surface-0 transition-colors hover:bg-teal-700"
            >
              Masuk dengan akun lain
            </button>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:border-teal-600 hover:text-teal-600"
            >
              Kembali ke beranda
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (restorePhase === "unavailable") {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas-50 px-4 text-ink-950">
        <section
          role="alert"
          className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 shadow-[var(--shadow-1)] sm:p-7"
        >
          <div className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] bg-amber-100 text-amber-700">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink-950">
            Sesi belum dapat dipulihkan
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {effectiveError?.message ??
              "Server atau jaringan sedang tidak tersedia. Sesi Anda tetap disimpan. Coba lagi tanpa harus masuk ulang."}
          </p>
          {effectiveError?.requestId && (
            <p className="mt-2 tabular-nums text-xs text-slate-600">
              ID Permintaan: {effectiveError.requestId}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-4 py-2.5 text-sm font-semibold text-surface-0 transition-colors hover:bg-teal-700"
              onClick={() => {
                setRestorePhase("checking");
                setRetryAttempt((attempt) => attempt + 1);
              }}
              type="button"
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>Coba lagi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => {
                  navigate("/login", { replace: true });
                });
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:border-teal-600 hover:text-teal-600"
            >
              Ke halaman masuk
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <Navigate
      replace
      to="/login"
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}
