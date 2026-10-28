import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { buildUomsCsv } from "./api";
import { UomsPage } from "./pages/UomsPage";
import type { Uom } from "./types";

const sampleUoms: Uom[] = [
  {
    id: 1,
    code: "PCS",
    name: "Pieces",
    allow_decimal: false,
    is_active: true,
    created_by: 3,
    created_at: "2026-10-21T08:11:00Z",
    updated_at: "2026-10-21T08:11:00Z",
  },
  {
    id: 2,
    code: "KG",
    name: "Kilogram",
    allow_decimal: true,
    is_active: false,
    created_by: 1,
    created_at: "2026-10-22T09:00:00Z",
    updated_at: "2026-10-22T09:30:00Z",
  },
];

function renderUomsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/master/uom"]}>
        <UomsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Master Data Satuan Ukur / UoM (UomsPage)", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().setAuthenticated("token-admin", {
        id: 1,
        username: "manager.jkt",
        email: "manager@wms.local",
        full_name: "Rina Manajer",
        role_id: 2,
        role_name: "Warehouse Manager",
        is_active: true,
        permissions: ["master:read", "master:manage"],
        warehouse_ids: [1],
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("menampilkan daftar satuan ukur, mendukung filter pencarian, melihat detail modal, dan mengunduh CSV", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/uoms/1") {
        return { data: sampleUoms[0] };
      }
      return {
        data: {
          items: sampleUoms,
          total: 2,
          limit: 20,
          offset: 0,
        },
      };
    });

    const { container } = renderUomsPage();

    await waitFor(() => {
      expect(screen.getByText("Pieces")).toBeInTheDocument();
      expect(screen.getByText("Kilogram")).toBeInTheDocument();
    });

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Bilangan bulat")).toBeInTheDocument();
    expect(screen.getByText("Desimal (4 digit)")).toBeInTheDocument();
    expect(
      screen.getByText("Menampilkan 1 sampai 2 dari 2 satuan ukur"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail satuan Pieces",
      }),
    );

    const detailDialog = screen.getByRole("dialog", {
      name: "Pieces",
    });
    expect(detailDialog).toBeInTheDocument();
    expect(
      screen.getByText("Hanya bilangan bulat (pecahan desimal tidak diizinkan)"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Tutup detail satuan ukur" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Pieces" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() => {
      expect(
        screen.getByText("Data satuan ukur (2 baris) berhasil diunduh."),
      ).toBeInTheDocument();
    });

    const csvOutput = buildUomsCsv(sampleUoms);
    expect(csvOutput).toContain("ID,Kode Satuan,Nama Satuan,Kuantitas Desimal,Status");
    expect(csvOutput).toContain("1,PCS,Pieces,Bilangan Bulat,Aktif");
    expect(csvOutput).toContain("2,KG,Kilogram,Diizinkan (Desimal),Nonaktif");

    const searchInput = screen.getByPlaceholderText(
      "Cari kode atau nama satuan...",
    );
    fireEvent.change(searchInput, { target: { value: "KG" } });
    fireEvent.click(screen.getByRole("button", { name: /Terapkan filter/i }));

    await waitFor(() => {
      const lastCall = getSpy.mock.calls[getSpy.mock.calls.length - 1];
      const searchParams = lastCall?.[1]?.params as URLSearchParams | undefined;
      expect(searchParams?.get("search")).toBe("KG");
    });
  });

  it("memvalidasi form tambah satuan ukur, menangani error 409 DUPLICATE, dan menyimpan satuan ukur baru", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleUoms,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });
    const postSpy = vi.spyOn(apiClient, "post");

    renderUomsPage();

    await waitFor(() => {
      expect(screen.getByText("Pieces")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tambah satuan ukur/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Tambah satuan ukur (UoM)" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Simpan satuan ukur/i }),
    );
    expect(
      screen.getByText("Kode satuan ukur wajib diisi (1 sampai 20 karakter)."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nama satuan ukur wajib diisi (1 sampai 60 karakter)."),
    ).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/Kode satuan ukur/i);
    const nameInput = screen.getByLabelText(/Nama satuan ukur/i);
    const decimalSelect = screen.getByLabelText(/Aturan kuantitas desimal/i);

    fireEvent.change(codeInput, { target: { value: "PCS" } });
    fireEvent.change(nameInput, { target: { value: "Pieces Duplikat" } });

    postSpy.mockRejectedValueOnce(
      new ApiError("Kode satuan ukur sudah terdaftar.", {
        status: 409,
        code: "DUPLICATE",
        requestId: "req-uom-dup-01",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Simpan satuan ukur/i }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText("Kode satuan ukur sudah terdaftar.").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText("ID Permintaan: req-uom-dup-01").length,
      ).toBeGreaterThan(0);
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 3,
        code: "LTR",
        name: "Liter",
        allow_decimal: true,
        is_active: true,
        created_by: 1,
        created_at: "2026-10-28T10:00:00Z",
        updated_at: "2026-10-28T10:00:00Z",
      },
    });

    fireEvent.change(codeInput, { target: { value: "  LTR  " } });
    fireEvent.change(nameInput, { target: { value: "  Liter  " } });
    fireEvent.change(decimalSelect, { target: { value: "decimal" } });
    fireEvent.click(
      screen.getByRole("button", { name: /Simpan satuan ukur/i }),
    );

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/uoms", {
        code: "LTR",
        name: "Liter",
        allow_decimal: true,
        is_active: true,
      });
      expect(
        screen.getByText('Satuan ukur "Liter (LTR)" berhasil ditambahkan.'),
      ).toBeInTheDocument();
    });
  });

  it("mengubah satuan ukur dan menangani konfirmasi penonaktifan beserta proteksi 409 ENTITY_IN_USE", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleUoms,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });
    const patchSpy = vi.spyOn(apiClient, "patch");

    renderUomsPage();

    await waitFor(() => {
      expect(screen.getByText("Pieces")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ubah satuan Pieces",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Ubah satuan ukur (UoM)" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nama satuan ukur/i);
    fireEvent.change(nameInput, {
      target: { value: "Pieces Unit" },
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...sampleUoms[0],
        name: "Pieces Unit",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/uoms/1", {
        code: "PCS",
        name: "Pieces Unit",
        allow_decimal: false,
        is_active: true,
      });
      expect(
        screen.getByText(
          'Satuan ukur "Pieces Unit (PCS)" berhasil diperbarui.',
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Nonaktifkan satuan Pieces",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "Nonaktifkan satuan ukur?",
    });
    expect(confirmDialog).toBeInTheDocument();

    patchSpy.mockRejectedValueOnce(
      new ApiError(
        "Satuan ukur tidak dapat dinonaktifkan karena masih digunakan oleh barang aktif.",
        {
          status: 409,
          code: "ENTITY_IN_USE",
          requestId: "req-uom-in-use-77",
        },
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Ya, nonaktifkan satuan/i }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Satuan ukur tidak dapat dinonaktifkan karena masih digunakan oleh barang aktif.",
        ).length,
      ).toBeGreaterThan(0);
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...sampleUoms[0],
        is_active: false,
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Ya, nonaktifkan satuan/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Satuan ukur "Pieces (PCS)" berhasil dinonaktifkan.'),
      ).toBeInTheDocument();
    });
  });

  it("menyembunyikan tombol tambah, ubah, dan nonaktifkan bagi pengguna dengan izin baca-saja (master:read)", async () => {
    act(() => {
      useAuthStore.getState().setAuthenticated("token-auditor", {
        id: 9,
        username: "auditor.pusat",
        email: "auditor@wms.local",
        full_name: "Andi Auditor",
        role_id: 5,
        role_name: "Auditor",
        is_active: true,
        permissions: ["master:read"],
        warehouse_ids: [],
      });
    });

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleUoms,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });

    renderUomsPage();

    await waitFor(() => {
      expect(screen.getByText("Pieces")).toBeInTheDocument();
    });

    expect(screen.getByText("Mode baca saja")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tambah satuan ukur/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Ubah satuan Pieces",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Nonaktifkan satuan Pieces",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Lihat detail satuan Pieces",
      }),
    ).toBeInTheDocument();
  });
});

