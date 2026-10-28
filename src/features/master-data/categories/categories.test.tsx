import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { buildCategoriesCsv } from "./api";
import { CategoriesPage } from "./pages/CategoriesPage";
import type { Category } from "./types";

const sampleCategories: Category[] = [
  {
    id: 1,
    name: "Komponen Elektronik",
    description: "IC, Resistor, Kapasitor",
    is_active: true,
    created_by: 3,
    created_at: "2026-10-21T08:10:00Z",
    updated_at: "2026-10-21T08:10:00Z",
  },
  {
    id: 2,
    name: "Bahan Kemasan",
    description: "Kardus, Bubble Wrap, Lakban",
    is_active: false,
    created_by: 1,
    created_at: "2026-10-22T09:00:00Z",
    updated_at: "2026-10-22T09:30:00Z",
  },
];

function renderCategoriesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/master/categories"]}>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Master Data Kategori Barang (CategoriesPage)", () => {
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

  it("menampilkan daftar kategori, mendukung filter pencarian, melihat detail modal, dan mengunduh CSV", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/categories/1") {
        return { data: sampleCategories[0] };
      }
      return {
        data: {
          items: sampleCategories,
          total: 2,
          limit: 20,
          offset: 0,
        },
      };
    });

    const { container } = renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText("Komponen Elektronik")).toBeInTheDocument();
      expect(screen.getByText("Bahan Kemasan")).toBeInTheDocument();
    });

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(
      screen.getByText("Menampilkan 1 sampai 2 dari 2 kategori"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail kategori Komponen Elektronik",
      }),
    );

    const detailDialog = screen.getByRole("dialog", {
      name: "Komponen Elektronik",
    });
    expect(detailDialog).toBeInTheDocument();
    expect(screen.getByText("Pengguna #3")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Tutup detail kategori" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Komponen Elektronik" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() => {
      expect(
        screen.getByText("Data kategori barang (2 baris) berhasil diunduh."),
      ).toBeInTheDocument();
    });

    const csvOutput = buildCategoriesCsv(sampleCategories);
    expect(csvOutput).toContain("ID,Nama Kategori,Deskripsi,Status");
    expect(csvOutput).toContain(
      '1,Komponen Elektronik,"IC, Resistor, Kapasitor",Aktif',
    );

    const searchInput = screen.getByPlaceholderText(
      "Cari nama atau deskripsi...",
    );
    fireEvent.change(searchInput, { target: { value: "Elektronik" } });
    fireEvent.click(screen.getByRole("button", { name: /Terapkan filter/i }));

    await waitFor(() => {
      const lastCall = getSpy.mock.calls[getSpy.mock.calls.length - 1];
      const searchParams = lastCall?.[1]?.params as URLSearchParams | undefined;
      expect(searchParams?.get("search")).toBe("Elektronik");
    });
  });

  it("memvalidasi form tambah kategori, menangani error 409 DUPLICATE, dan menyimpan kategori baru", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleCategories,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });
    const postSpy = vi.spyOn(apiClient, "post");

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText("Komponen Elektronik")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Tambah kategori/i }));
    expect(
      screen.getByRole("dialog", { name: "Tambah kategori barang" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Simpan kategori/i }));
    expect(
      screen.getByText("Nama kategori wajib diisi (1 sampai 120 karakter)."),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nama kategori/i);
    const descInput = screen.getByLabelText(/Deskripsi kategori/i);

    fireEvent.change(nameInput, { target: { value: "Komponen Elektronik" } });
    fireEvent.change(descInput, { target: { value: "Duplikat uji" } });

    postSpy.mockRejectedValueOnce(
      new ApiError("Nama kategori sudah terdaftar.", {
        status: 409,
        code: "DUPLICATE",
        requestId: "req-dup-001",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Simpan kategori/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Nama kategori sudah terdaftar.").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText("ID Permintaan: req-dup-001").length,
      ).toBeGreaterThan(0);
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 3,
        name: "Perkakas Gudang",
        description: "Alat bantu ukur dan kunci pas",
        is_active: true,
        created_by: 1,
        created_at: "2026-10-28T10:00:00Z",
        updated_at: "2026-10-28T10:00:00Z",
      },
    });

    fireEvent.change(nameInput, { target: { value: "  Perkakas Gudang  " } });
    fireEvent.change(descInput, {
      target: { value: "Alat bantu ukur dan kunci pas" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan kategori/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/categories", {
        name: "Perkakas Gudang",
        description: "Alat bantu ukur dan kunci pas",
        is_active: true,
      });
      expect(
        screen.getByText('Kategori "Perkakas Gudang" berhasil ditambahkan.'),
      ).toBeInTheDocument();
    });
  });

  it("mengubah data kategori dan menangani konfirmasi penonaktifan beserta proteksi 409 ENTITY_IN_USE", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: sampleCategories,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });
    const patchSpy = vi.spyOn(apiClient, "patch");

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText("Komponen Elektronik")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ubah kategori Komponen Elektronik",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Ubah kategori barang" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nama kategori/i);
    fireEvent.change(nameInput, {
      target: { value: "Komponen Elektronik Presisi" },
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...sampleCategories[0],
        name: "Komponen Elektronik Presisi",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/categories/1", {
        name: "Komponen Elektronik Presisi",
        description: "IC, Resistor, Kapasitor",
        is_active: true,
      });
      expect(
        screen.getByText(
          'Kategori "Komponen Elektronik Presisi" berhasil diperbarui.',
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Nonaktifkan kategori Komponen Elektronik",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "Nonaktifkan kategori barang?",
    });
    expect(confirmDialog).toBeInTheDocument();

    patchSpy.mockRejectedValueOnce(
      new ApiError(
        "Kategori tidak dapat dinonaktifkan karena masih digunakan oleh barang aktif.",
        {
          status: 409,
          code: "ENTITY_IN_USE",
          requestId: "req-in-use-99",
        },
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Ya, nonaktifkan kategori/i }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Kategori tidak dapat dinonaktifkan karena masih digunakan oleh barang aktif.",
        ).length,
      ).toBeGreaterThan(0);
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...sampleCategories[0],
        is_active: false,
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Ya, nonaktifkan kategori/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Kategori "Komponen Elektronik" berhasil dinonaktifkan.',
        ),
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
        items: sampleCategories,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText("Komponen Elektronik")).toBeInTheDocument();
    });

    expect(screen.getByText("Mode baca saja")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tambah kategori/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Ubah kategori Komponen Elektronik",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Nonaktifkan kategori Komponen Elektronik",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Lihat detail kategori Komponen Elektronik",
      }),
    ).toBeInTheDocument();
  });
});
