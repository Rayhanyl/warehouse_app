import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isRecoverableSessionError, refreshSession } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [restoreState, setRestoreState] = useState<"checking" | "ready" | "retry">(
    accessToken && user ? "ready" : "checking",
  );
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (accessToken && user) {
      return;
    }

    let isMounted = true;
    const restoreTimeout = window.setTimeout(() => {
      if (isMounted) {
        setRestoreState("retry");
      }
    }, 12000);

    refreshSession()
      .then(() => {
        if (isMounted) {
          setRestoreState("ready");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setRestoreState(isRecoverableSessionError(error) ? "retry" : "ready");
        }
      })
      .finally(() => {
        window.clearTimeout(restoreTimeout);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(restoreTimeout);
    };
  }, [accessToken, retryAttempt, user]);

  if (accessToken && user) {
    return <Outlet />;
  }

  if (restoreState === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f0e8] text-[#17252a]">
        <p role="status">Memulihkan sesi...</p>
      </main>
    );
  }

  if (restoreState === "retry") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f0e8] px-4 text-[#17252a]">
        <section className="w-full max-w-md rounded-2xl border border-[#d9dfd8] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Sesi belum dapat dipulihkan</h1>
          <p className="mt-2 text-sm leading-6 text-[#667876]">
            Server atau jaringan sedang tidak tersedia. Sesi Anda tetap disimpan.
            Coba lagi tanpa harus login ulang.
          </p>
          <button
            className="mt-5 rounded-lg bg-[#2f7a68] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256354] focus-visible:ring-2 focus-visible:ring-[#2f7a68]"
            onClick={() => {
              setRestoreState("checking");
              setRetryAttempt((attempt) => attempt + 1);
            }}
            type="button"
          >
            Coba lagi
          </button>
        </section>
      </main>
    );
  }

  if (!accessToken || !user) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
