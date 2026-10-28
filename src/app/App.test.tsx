import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import * as authApi from "@/features/auth/api";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";
import { useAuthStore } from "@/features/auth/store";
import { menuQueryKey, normalizeMenu } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";

const sampleNestedMenu: MenuItem[] = [
  {
    id: 1,
    code: "dashboard",
    name: "Dasbor",
    short_name: "Dasbor",
    path: "/dashboard",
    icon: "layout-dashboard",
    menu_type: "item",
    parent_id: null,
    sort_order: 1,
    permission_code: null,
    children: [],
  },
  {
    id: 2,
    code: "master_data",
    name: "Data Master",
    short_name: "Master",
    path: "/master",
    icon: "database",
    menu_type: "group",
    parent_id: null,
    sort_order: 2,
    permission_code: null,
    children: [
      {
        id: 21,
        code: "items",
        name: "Barang",
        short_name: "Barang",
        path: "/items",
        icon: "package",
        menu_type: "item",
        parent_id: 2,
        sort_order: 1,
        permission_code: "items:read",
        children: [],
      },
      {
        id: 22,
        code: "warehouses",
        name: "Gudang",
        short_name: "Gudang",
        path: "/warehouses",
        icon: "warehouse",
        menu_type: "item",
        parent_id: 2,
        sort_order: 2,
        permission_code: "warehouses:read",
        children: [],
      },
    ],
  },
];

describe("normalizeMenu", () => {
  it("filters inactive/invisible items, sorts by sort_order, and removes empty group nodes", () => {
    const raw: MenuItem[] = [
      {
        id: 10,
        code: "empty_group",
        name: "Grup Kosong",
        path: "/empty",
        icon: "database",
        menu_type: "group",
        parent_id: null,
        sort_order: 1,
        permission_code: null,
        children: [
          {
            id: 11,
            code: "hidden_child",
            name: "Anak Tersembunyi",
            path: "/hidden",
            icon: "package",
            menu_type: "item",
            parent_id: 10,
            sort_order: 1,
            permission_code: null,
            is_visible: false,
            children: [],
          },
        ],
      },
      {
        id: 2,
        code: "second",
        name: "Menu Kedua",
        path: "/second",
        icon: "boxes",
        menu_type: "item",
        parent_id: null,
        sort_order: 20,
        permission_code: null,
        children: [],
      },
      {
        id: 1,
        code: "first",
        name: "Menu Pertama",
        path: "/first",
        icon: "layout-dashboard",
        menu_type: "item",
        parent_id: null,
        sort_order: 10,
        permission_code: null,
        children: [],
      },
    ];

    const normalized = normalizeMenu(raw);
    expect(normalized.map((item) => item.code)).toEqual(["first", "second"]);
  });
});

describe("AppShell, Sidebar, DashboardPage, & ProfilePage", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuthenticated("token-uji", {
      id: 1,
      username: "budi.supervisor",
      email: "budi@wms.local",
      full_name: "Budi Santoso",
      role_id: 2,
      role_name: "Warehouse Supervisor",
      is_active: true,
      permissions: ["items:read", "warehouses:read"],
      warehouse_ids: [1, 2],
    });
  });

  afterEach(() => {
    useAuthStore.getState().logout();
  });

  it("renders sidebar, topbar with visible Menu label, collapsed group flyout, command palette keyboard nav, and dashboard workflow", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(menuQueryKey, sampleNestedMenu);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/items" element={<div>Halaman Barang</div>} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Jejakstok")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Selamat datang, Budi Santoso" }),
    ).toBeInTheDocument();

    const mobileMenuButton = screen.getByRole("button", { name: "Buka menu navigasi" });
    expect(mobileMenuButton).toHaveTextContent("Menu");
    expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(mobileMenuButton);
    expect(mobileMenuButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");

    const warehouseSelect = screen.getByLabelText("Pilih gudang aktif") as HTMLSelectElement;
    expect(warehouseSelect.value).toBe("1");
    fireEvent.change(warehouseSelect, { target: { value: "2" } });
    expect(warehouseSelect.value).toBe("2");

    const expandedGroupBtn = screen.getByRole("button", { name: "Data Master" });
    expect(expandedGroupBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expandedGroupBtn);
    expect(expandedGroupBtn).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(expandedGroupBtn);
    expect(expandedGroupBtn).toHaveAttribute("aria-expanded", "false");

    const collapseButtons = screen.getAllByRole("button", { name: "Ciutkan navigasi" });
    fireEvent.click(collapseButtons[0]);

    const expandButtons = screen.getAllByRole("button", { name: "Perluas navigasi" });
    expect(expandButtons.length).toBeGreaterThan(0);

    const collapsedGroupBtn = screen.getByRole("button", { name: "Data Master" });
    expect(collapsedGroupBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(collapsedGroupBtn);
    expect(collapsedGroupBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Submenu Data Master" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const paletteDialog = screen.getByRole("dialog", { name: "Pencarian menu" });
    expect(paletteDialog).toBeInTheDocument();

    const paletteInput = screen.getByLabelText("Ketik nama menu atau rute");
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "Enter" });

    expect(screen.getByText("Halaman Barang")).toBeInTheDocument();
  });

  it("renders empty menu message when user has no visible menus and supports ProfilePage password visibility toggles", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(menuQueryKey, []);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/profile"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(
      screen.getByText("Belum ada menu yang tersedia untuk peran akun Anda."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Profil" })).toBeInTheDocument();

    const toggleCurrentBtn = screen.getByRole("button", {
      name: "Tampilkan kata sandi saat ini",
    });
    fireEvent.click(toggleCurrentBtn);
    expect(
      screen.getByRole("button", { name: "Sembunyikan kata sandi saat ini" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("LandingPage", () => {
  it("renders validated JSON content, sample data labels, and exercises all interactive controls", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<div>Halaman Login Tujuan</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Satu kendali untuk setiap pergerakan stok.",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Contoh data").length).toBe(3);
    expect(container.textContent).not.toMatch(/[—–]/);

    expect(
      screen.getByText("PO-2026-0042 → GR-2026-0019"),
    ).toBeInTheDocument();
    const stepButton = screen.getByRole("button", { name: /03.*Pindahkan/i });
    fireEvent.click(stepButton);
    expect(stepButton).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("TRF-2026-0014 · Asal ke Tujuan"),
    ).toBeInTheDocument();

    const skipLink = screen.getByRole("link", {
      name: "Lompat ke konten utama",
    });
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const workflowAnchors = screen.getAllByRole("link", {
      name: "Lihat alur kerja",
    });
    expect(workflowAnchors.length).toBe(2);
    for (const anchor of workflowAnchors) {
      expect(anchor).toHaveAttribute("href", "#workflow");
    }

    expect(container.querySelector("#workflow")).not.toBeNull();
    expect(container.querySelector("#pain-points")).not.toBeNull();
    expect(container.querySelector("#security")).not.toBeNull();

    const menuButton = screen.getByRole("button", {
      name: "Buka menu navigasi",
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(
      screen.getByRole("button", { name: "Tutup menu navigasi" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", {
        name: "Navigasi halaman utama pada perangkat seluler",
      }),
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.getByRole("button", { name: "Buka menu navigasi" }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Buka menu navigasi" }),
    );
    const mobileNav = screen.getByRole("navigation", {
      name: "Navigasi halaman utama pada perangkat seluler",
    });
    const mobileWorkflowLink = mobileNav.querySelector('a[href="#workflow"]');
    expect(mobileWorkflowLink).not.toBeNull();
    if (mobileWorkflowLink) {
      fireEvent.click(mobileWorkflowLink);
    }
    expect(
      screen.getByRole("button", { name: "Buka menu navigasi" }),
    ).toHaveAttribute("aria-expanded", "false");

    const ctaLoginLink = screen.getByRole("link", {
      name: "Masuk ke Jejakstok",
    });
    fireEvent.click(ctaLoginLink);
    expect(screen.getByText("Halaman Login Tujuan")).toBeInTheDocument();
  });
});

describe("LoginPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates fields, toggles password visibility, handles lockout/error states, and navigates on success", async () => {
    const loginSpy = vi.spyOn(authApi, "login");

    const { container } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/" element={<div>Beranda Utama</div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Halaman Dasbor</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(
      screen.getByRole("heading", { level: 1, name: "Masuk ke Jejakstok" }),
    ).toBeInTheDocument();

    const skipLink = screen.getByRole("link", { name: "Lompat ke form masuk" });
    expect(skipLink).toHaveAttribute("href", "#login-form-section");

    const submitButton = screen.getByRole("button", {
      name: "Masuk ke ruang kerja",
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Nama pengguna wajib diisi (1 sampai 64 karakter)."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kata sandi wajib diisi (1 sampai 255 karakter)."),
    ).toBeInTheDocument();

    const usernameInput = screen.getByLabelText("Nama pengguna");
    const passwordInput = screen.getByLabelText("Kata sandi");
    expect(usernameInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");

    const togglePasswordBtn = screen.getByRole("button", {
      name: "Tampilkan kata sandi",
    });
    expect(passwordInput).toHaveAttribute("type", "password");
    fireEvent.click(togglePasswordBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Sembunyikan kata sandi" }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(usernameInput, { target: { value: "  staff.jkt  " } });
    fireEvent.change(passwordInput, { target: { value: "rahasia123" } });

    loginSpy.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          error: {
            code: "AUTH_TOO_MANY_ATTEMPTS",
            message: "Akun dikunci selama 15 menit.",
            details: { locked_until: "2026-10-28T05:15:00Z" },
          },
        },
      },
    });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Akun dikunci sementara karena terlalu banyak percobaan masuk/,
      );
    });

    loginSpy.mockResolvedValueOnce({
      id: 2,
      username: "staff.jkt",
      email: "staff.jkt@wms.local",
      full_name: "Budi Operator",
      role_id: 4,
      role_name: "Warehouse Staff",
      is_active: true,
      permissions: ["stock:read"],
      warehouse_ids: [1],
    });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        username: "staff.jkt",
        password: "rahasia123",
      });
      expect(screen.getByText("Halaman Dasbor")).toBeInTheDocument();
    });
  });

  it("navigates back to home when clicking Kembali ke beranda", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/" element={<div>Beranda Utama</div>} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Kembali ke beranda" }));
    expect(screen.getByText("Beranda Utama")).toBeInTheDocument();
  });
});
