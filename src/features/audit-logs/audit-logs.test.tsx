import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { apiClient } from "@/lib/api-client";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import type { AuditLog } from "./types";

const sampleLogs: AuditLog[] = [
  {
    id: 101,
    user_id: 1,
    username: "superadmin",
    action: "USER_UPDATED",
    entity_type: "users",
    entity_id: "2",
    old_values: { full_name: "Staff Lama", is_active: true },
    new_values: { full_name: "Staff Baru", is_active: true },
    status: "SUCCESS",
    details: null,
    ip_address: "103.10.20.30",
    user_agent: "Mozilla/5.0 Chrome/130.0",
    request_id: "req-audit-101",
    created_at: "2026-11-14T09:15:00Z",
  },
  {
    id: 102,
    user_id: 2,
    username: "staff.gudang",
    action: "PERMISSION_DENIED",
    entity_type: "purchase_orders",
    entity_id: "12",
    old_values: null,
    new_values: null,
    status: "FAILED",
    details: {
      error_code: "PERMISSION_DENIED",
      http_status: 403,
      message: "Anda tidak memiliki izin 'po:close'.",
    },
    ip_address: "103.10.20.31",
    user_agent: "Mozilla/5.0 Firefox/131.0",
    request_id: "req-audit-102",
    created_at: "2026-11-14T09:20:00Z",
  },
];

function renderAuditLogsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/audit-logs"]}>
        <AuditLogsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuditLogsPage (Tahap 14)", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().setAuthenticated("token-auditor", {
        id: 5,
        username: "auditor",
        email: "auditor@wms.local",
        full_name: "Auditor Sistem",
        role_id: 5,
        role_name: "Auditor",
        is_active: true,
        permissions: ["audit:read"],
        warehouse_ids: [],
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("menampilkan kolom IP address, status aksi, filter status, dan modal diff viewer", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleLogs,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });

    const { container } = renderAuditLogsPage();

    expect(await screen.findByText("103.10.20.30")).toBeInTheDocument();
    expect(screen.getByText("103.10.20.31")).toBeInTheDocument();
    expect(screen.getByText("Berhasil")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[—–]/);

    // Uji buka modal detail untuk baris pertama (diff viewer old vs new values)
    const detailButtons = screen.getAllByRole("button", { name: /Detail/i });
    fireEvent.click(detailButtons[0]);

    expect(
      await screen.findByRole("dialog"),
    ).toBeInTheDocument();
    expect(screen.getByText("Detail Audit Log #101")).toBeInTheDocument();
    expect(screen.getByText("req-audit-101")).toBeInTheDocument();
    expect(screen.getByText("Mozilla/5.0 Chrome/130.0")).toBeInTheDocument();
    expect(screen.getByText("Staff Lama")).toBeInTheDocument();
    expect(screen.getByText("Staff Baru")).toBeInTheDocument();

    // Tutup modal dan buka baris kedua (status FAILED dengan details)
    fireEvent.click(
      screen.getByRole("button", { name: /Tutup detail audit log/i }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Detail/i })[1]);
    expect(await screen.findByText("Detail Audit Log #102")).toBeInTheDocument();
    expect(
      screen.getByText("Informasi Kegagalan & Konteks"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Anda tidak memiliki izin 'po:close'."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

    // Uji filter status FAILED mengirimkan parameter status=FAILED ke API
    fireEvent.change(screen.getByLabelText("Status aksi"), {
      target: { value: "FAILED" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Terapkan filter/i }),
    );

    await waitFor(() => {
      const lastCall = getSpy.mock.calls.at(-1);
      const params = lastCall?.[1]?.params as URLSearchParams | undefined;
      expect(params?.get("status")).toBe("FAILED");
    });
  });

  it("mendukung filter kategori aktivitas dan toggle log teknis historis tanpa em-dash", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: [
          ...sampleLogs,
          {
            id: 103,
            user_id: null,
            username: null,
            action: "ITEM_CREATED",
            entity_type: "items",
            entity_id: null,
            old_values: { notes: undefined },
            new_values: { sku: "SKU-NEW-1" },
            status: "SUCCESS",
            details: null,
            ip_address: null,
            user_agent: null,
            request_id: null,
            created_at: "2026-11-14T10:00:00Z",
          },
        ],
        total: 3,
        limit: 20,
        offset: 0,
      },
    });

    const { container } = renderAuditLogsPage();
    expect(await screen.findByText("ITEM_CREATED")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[—–]/);

    // Default query tidak mengirimkan include_technical=true maupun category
    const initialParams = getSpy.mock.calls[0]?.[1]?.params as URLSearchParams | undefined;
    expect(initialParams?.get("include_technical")).toBeNull();
    expect(initialParams?.get("category")).toBeNull();

    // Klik tab kategori "Aktivitas Bisnis & Data"
    const bizTab = screen.getByRole("tab", { name: "Aktivitas Bisnis & Data" });
    fireEvent.mouseDown(bizTab, { button: 0 });
    fireEvent.click(bizTab);

    await waitFor(() => {
      const lastParams = getSpy.mock.calls.at(-1)?.[1]?.params as URLSearchParams | undefined;
      expect(lastParams?.get("category")).toBe("business");
    });

    // Klik tab kategori "Autentikasi & Keamanan"
    const secTab = screen.getByRole("tab", { name: "Autentikasi & Keamanan" });
    fireEvent.mouseDown(secTab, { button: 0 });
    fireEvent.click(secTab);

    await waitFor(() => {
      const lastParams = getSpy.mock.calls.at(-1)?.[1]?.params as URLSearchParams | undefined;
      expect(lastParams?.get("category")).toBe("security");
    });

    // Aktifkan checkbox log teknis historis & terapkan filter
    fireEvent.click(
      screen.getByLabelText(/Sertakan log teknis historis/i),
    );
    fireEvent.click(screen.getByRole("button", { name: /Terapkan filter/i }));

    await waitFor(() => {
      const lastParams = getSpy.mock.calls.at(-1)?.[1]?.params as URLSearchParams | undefined;
      expect(lastParams?.get("include_technical")).toBe("true");
    });

    // Buka detail baris ITEM_CREATED yang memiliki nilai null/undefined -> bebas em-dash
    fireEvent.click(screen.getAllByRole("button", { name: /Detail/i })[2]);
    expect(await screen.findByText("Detail Audit Log #103")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[—–]/);
  });
});
