import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRefreshToken,
  getRefreshToken,
  handleAuthBroadcastMessage,
  handleStorageSyncEvent,
  login,
  logout,
  refreshSession,
  rotateAccessToken,
  saveRefreshToken,
} from "@/features/auth/api";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { useAuthStore, type AuthUser } from "@/features/auth/store";
import { apiClient } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import {
  localStorageRepository,
  REFRESH_LOCK_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/storage";

const sampleUser: AuthUser = {
  id: 2,
  username: "staff.jkt",
  email: "staff.jkt@wms.local",
  full_name: "Budi Operator",
  role_id: 4,
  role_name: "Warehouse Staff",
  is_active: true,
  permissions: ["stock:read", "gr:read", "po:read"],
  warehouse_ids: [1],
};

function makeAxiosError(options: {
  status?: number;
  code?: string;
  message?: string;
  axiosCode?: string;
  requestId?: string;
  url?: string;
}): AxiosError {
  const headers = new AxiosHeaders();
  if (options.requestId) {
    headers.set("x-request-id", options.requestId);
  }

  const config = {
    url: options.url ?? "/auth/refresh",
    headers: new AxiosHeaders(),
  };

  const response =
    options.status !== undefined
      ? {
          status: options.status,
          statusText: String(options.status),
          headers,
          config,
          data: {
            error: {
              code: options.code,
              message: options.message,
            },
          },
        }
      : undefined;

  return new AxiosError(
    options.message ?? "Request failed",
    options.axiosCode ?? (options.status ? "ERR_BAD_REQUEST" : "ERR_NETWORK"),
    config,
    {},
    response,
  );
}

describe("Stabilitas autentikasi dan pemulihan sesi", () => {
  beforeEach(() => {
    window.localStorage.clear();
    queryClient.clear();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    queryClient.clear();
    useAuthStore.getState().logout();
  });

  it("menyimpan dan membersihkan refresh token melalui LocalStorageRepository tanpa menyimpan token kosong", () => {
    expect(getRefreshToken()).toBeNull();

    saveRefreshToken("  token-awal-123  ");
    expect(getRefreshToken()).toBe("token-awal-123");
    expect(window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe(
      "token-awal-123",
    );

    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, "   ");
    expect(getRefreshToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();

    saveRefreshToken("token-valid");
    clearRefreshToken();
    expect(getRefreshToken()).toBeNull();
  });

  it("memulihkan sesi setelah hard refresh dengan merotasi refresh token dan memuat profil pengguna", async () => {
    saveRefreshToken("refresh-token-r1");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();

    let resolveRefresh!: (value: { data: unknown }) => void;
    const postSpy = vi.spyOn(apiClient, "post").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }) as ReturnType<typeof apiClient.post>,
    );
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: sampleUser,
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Halaman Masuk</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Ruang Kerja Dasbor</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Memulihkan sesi...");
    expect(screen.queryByText("Halaman Masuk")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[—–]/);

    await act(async () => {
      resolveRefresh({
        data: {
          access_token: "access-token-baru",
          refresh_token: "refresh-token-r2",
          token_type: "bearer",
          expires_in: 900,
          access_expires_at: "2026-10-28T16:00:00Z",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Ruang Kerja Dasbor")).toBeInTheDocument();
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith("/auth/refresh", {
      refresh_token: "refresh-token-r1",
    });
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getRefreshToken()).toBe("refresh-token-r2");
    expect(useAuthStore.getState().accessToken).toBe("access-token-baru");
    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("mengarahkan ke halaman login secara deterministik apabila refresh token tidak tersedia", async () => {
    render(
      <MemoryRouter initialEntries={["/audit-logs"]}>
        <Routes>
          <Route path="/login" element={<div>Halaman Masuk Tujuan</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/audit-logs" element={<div>Halaman Audit</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Halaman Masuk Tujuan")).toBeInTheDocument();
    });
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("menghapus sesi, refresh token, dan cache query ketika refresh mengembalikan 401 AUTH_TOKEN_INVALID", async () => {
    saveRefreshToken("refresh-token-dicabut");
    queryClient.setQueryData(["menus", "my-menu"], [{ id: 1, name: "Dasbor" }]);

    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      makeAxiosError({
        status: 401,
        code: "AUTH_TOKEN_INVALID",
        message: "Refresh token sudah dicabut.",
      }),
    );

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Redirect Ke Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Ruang Kerja Dasbor</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Redirect Ke Login")).toBeInTheDocument();
    });

    expect(getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["menus", "my-menu"])).toBeUndefined();
  });

  it("mempertahankan refresh token saat terjadi gangguan jaringan atau 5xx dan berhasil pulih ketika tombol Coba lagi ditekan", async () => {
    saveRefreshToken("refresh-token-tetap-aman");

    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce(
        makeAxiosError({
          status: 503,
          code: "INTERNAL_ERROR",
          message: "Database sedang sibuk.",
          requestId: "req-503-xyz",
        }),
      )
      .mockResolvedValueOnce({
        data: {
          access_token: "access-token-pulih",
          refresh_token: "refresh-token-rotasi-pulih",
          token_type: "bearer",
          expires_in: 900,
          access_expires_at: "2026-10-28T16:00:00Z",
        },
      });

    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: sampleUser,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Halaman Masuk</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dasbor Berhasil Pulih</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Sesi belum dapat dipulihkan" }),
      ).toBeInTheDocument();
    });

    expect(getRefreshToken()).toBe("refresh-token-tetap-aman");
    expect(screen.getByText("ID Permintaan: req-503-xyz")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Coba lagi" });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Dasbor Berhasil Pulih")).toBeInTheDocument();
    });

    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(getRefreshToken()).toBe("refresh-token-rotasi-pulih");
    expect(useAuthStore.getState().accessToken).toBe("access-token-pulih");
  });

  it("menggabungkan request refresh yang berjalan bersamaan (mutex) agar tidak memicu reuse detection", async () => {
    saveRefreshToken("refresh-token-tunggal");

    let resolvePost!: (value: { data: unknown }) => void;
    const postSpy = vi.spyOn(apiClient, "post").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }) as ReturnType<typeof apiClient.post>,
    );
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: sampleUser,
    });

    const call1 = refreshSession();
    const call2 = refreshSession();
    const call3 = rotateAccessToken();

    expect(postSpy).toHaveBeenCalledTimes(1);

    resolvePost({
      data: {
        access_token: "access-token-mutex",
        refresh_token: "refresh-token-mutex-baru",
        token_type: "bearer",
        expires_in: 900,
        access_expires_at: "2026-10-28T16:00:00Z",
      },
    });

    const [user1, user2, token3] = await Promise.all([call1, call2, call3]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(user1).toEqual(sampleUser);
    expect(user2).toEqual(sampleUser);
    expect(token3).toBe("access-token-mutex");
    expect(getRefreshToken()).toBe("refresh-token-mutex-baru");
  });

  it("menyelaraskan sesi antar-tab saat rotasi token, penggunaan kunci lintas-tab, dan saat logout di tab lain", async () => {
    saveRefreshToken("refresh-token-awal");
    queryClient.setQueryData(["menus", "my-menu"], [{ id: 1, name: "Dasbor" }]);

    // Tab lain menyiarkan pembaruan sesi
    handleAuthBroadcastMessage({
      type: "AUTH_SESSION_UPDATED",
      accessToken: "token-dari-tab-a",
      user: sampleUser,
    });

    expect(useAuthStore.getState().accessToken).toBe("token-dari-tab-a");
    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().status).toBe("authenticated");

    // Simulasi kunci refresh aktif dari tab lain yang baru saja memperbarui access token
    localStorageRepository.set(REFRESH_LOCK_STORAGE_KEY, {
      tabId: "tab-lain",
      token: "refresh-token-awal",
      startedAt: Date.now(),
    });

    const postSpy = vi.spyOn(apiClient, "post");
    window.setTimeout(() => {
      saveRefreshToken("refresh-token-rotasi-tab-lain");
      handleAuthBroadcastMessage({
        type: "AUTH_TOKEN_ROTATED",
        accessToken: "token-rotasi-tab-lain",
      });
      localStorageRepository.remove(REFRESH_LOCK_STORAGE_KEY);
    }, 50);

    const syncedToken = await rotateAccessToken();
    expect(syncedToken).toBe("token-rotasi-tab-lain");
    expect(postSpy).not.toHaveBeenCalled();

    // Tab lain menghapus refresh token dari localStorage (logout)
    handleStorageSyncEvent({
      key: REFRESH_TOKEN_STORAGE_KEY,
      newValue: null,
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(queryClient.getQueryData(["menus", "my-menu"])).toBeUndefined();
  });

  it("menjalankan logout manual dan tetap membersihkan state lokal meskipun endpoint logout gagal", async () => {
    saveRefreshToken("refresh-token-aktif");
    useAuthStore.getState().setAuthenticated("access-token-aktif", sampleUser);
    queryClient.setQueryData(["audit-logs"], { items: [] });

    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce(makeAxiosError({ status: 500, url: "/auth/logout" }));

    await logout();

    expect(postSpy).toHaveBeenCalledWith("/auth/logout", {
      refresh_token: "refresh-token-aktif",
    });
    expect(getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["audit-logs"])).toBeUndefined();
  });

  it("menampilkan pesan error yang jelas pada halaman login dan mengarahkan kembali ke halaman tujuan setelah berhasil masuk", async () => {
    const postSpy = vi.spyOn(apiClient, "post");
    const getSpy = vi.spyOn(apiClient, "get");

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/login", state: { from: "/audit-logs" } },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Halaman Dasbor</div>} />
          <Route path="/audit-logs" element={<div>Halaman Audit Tujuan</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const usernameInput = screen.getByLabelText("Nama pengguna");
    const passwordInput = screen.getByLabelText("Kata sandi");
    const submitButton = screen.getByRole("button", {
      name: "Masuk ke ruang kerja",
    });

    fireEvent.change(usernameInput, { target: { value: "staff.jkt" } });
    fireEvent.change(passwordInput, { target: { value: "salah123" } });

    postSpy.mockRejectedValueOnce(
      makeAxiosError({
        status: 401,
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Username atau kata sandi salah.",
        url: "/auth/login",
      }),
    );

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Nama pengguna atau kata sandi salah.",
      );
    });

    postSpy.mockRejectedValueOnce(
      makeAxiosError({
        axiosCode: "ECONNABORTED",
        message: "timeout of 10000ms exceeded",
        url: "/auth/login",
      }),
    );

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Permintaan masuk melewati batas waktu. Periksa koneksi jaringan Anda lalu coba lagi.",
      );
    });

    postSpy.mockResolvedValueOnce({
      data: {
        access_token: "access-token-login",
        refresh_token: "refresh-token-login",
        token_type: "bearer",
        expires_in: 900,
        access_expires_at: "2026-10-28T16:00:00Z",
      },
    });
    getSpy.mockResolvedValueOnce({
      data: sampleUser,
    });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Halaman Audit Tujuan")).toBeInTheDocument();
    });

    expect(getRefreshToken()).toBe("refresh-token-login");
    expect(useAuthStore.getState().user).toEqual(sampleUser);
  });

  it("membersihkan sesi bila pengambilan profil /auth/me gagal dengan 401 setelah login", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        access_token: "access-token-sementara",
        refresh_token: "refresh-token-sementara",
        token_type: "bearer",
        expires_in: 900,
        access_expires_at: "2026-10-28T16:00:00Z",
      },
    });
    vi.spyOn(apiClient, "get").mockRejectedValueOnce(
      makeAxiosError({
        status: 401,
        code: "AUTH_TOKEN_INVALID",
        message: "Akun pengguna sudah dinonaktifkan.",
        url: "/auth/me",
      }),
    );

    await expect(
      login({ username: "staff.jkt", password: "rahasia123" }),
    ).rejects.toThrow();

    expect(getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("menjalankan interceptor 401 pada apiClient sekali untuk merotasi token lalu mengulangi request asli", async () => {
    saveRefreshToken("refresh-token-interceptor-1");
    useAuthStore.getState().setAuthenticated("token-kedaluwarsa", sampleUser);

    let callCount = 0;
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/auth/refresh") {
        return {
          data: {
            access_token: "token-baru-interceptor",
            refresh_token: "refresh-token-interceptor-2",
            token_type: "bearer",
            expires_in: 900,
            access_expires_at: "2026-10-28T16:00:00Z",
          },
          status: 200,
          statusText: "OK",
          headers: new AxiosHeaders(),
          config,
        };
      }

      callCount += 1;
      if (callCount === 1) {
        throw makeAxiosError({
          status: 401,
          code: "AUTH_TOKEN_INVALID",
          message: "Access token kedaluwarsa.",
          url: config.url,
        });
      }

      return {
        data: { items: ["data-berhasil"], authHeader: config.headers?.Authorization },
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
      };
    };

    try {
      const response = await apiClient.get<{
        items: string[];
        authHeader: string;
      }>("/menus/my-menu");

      expect(callCount).toBe(2);
      expect(response.data.items).toEqual(["data-berhasil"]);
      expect(response.data.authHeader).toBe("Bearer token-baru-interceptor");
      expect(getRefreshToken()).toBe("refresh-token-interceptor-2");
      expect(useAuthStore.getState().accessToken).toBe("token-baru-interceptor");
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it("menampilkan status akses ditolak ketika /auth/me mengembalikan 403", async () => {
    saveRefreshToken("refresh-token-403");

    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        access_token: "access-token-403",
        refresh_token: "refresh-token-403-baru",
        token_type: "bearer",
        expires_in: 900,
        access_expires_at: "2026-10-28T16:00:00Z",
      },
    });
    vi.spyOn(apiClient, "get").mockRejectedValueOnce(
      makeAxiosError({
        status: 403,
        code: "PERMISSION_DENIED",
        message: "Akses ke ruang kerja tidak diizinkan.",
        requestId: "req-403-abc",
        url: "/auth/me",
      }),
    );

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/" element={<div>Beranda Publik</div>} />
          <Route path="/login" element={<div>Halaman Masuk</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Ruang Kerja Dasbor</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Akses ruang kerja ditolak" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Akses ke ruang kerja tidak diizinkan."),
    ).toBeInTheDocument();
    expect(screen.getByText("ID Permintaan: req-403-abc")).toBeInTheDocument();

    const switchAccountBtn = screen.getByRole("button", {
      name: "Masuk dengan akun lain",
    });
    fireEvent.click(switchAccountBtn);

    await waitFor(() => {
      expect(screen.getByText("Halaman Masuk")).toBeInTheDocument();
    });
    expect(getRefreshToken()).toBeNull();
  });
});
