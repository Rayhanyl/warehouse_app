import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { initialSampleWarehouses } from "./api";
import { WarehousesPage } from "./pages/WarehousesPage";

describe("WarehousesPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockWarehousesGet() {
    return vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: initialSampleWarehouses,
        total: initialSampleWarehouses.length,
        limit: 200,
        offset: 0,
      },
    });
  }

  it("merender data gudang dari API, mendukung detail QR/Barcode label, tambah gudang, dan tangani 409 DUPLICATE", async () => {
    mockWarehousesGet();
    const postSpy = vi.spyOn(apiClient, "post");

    const { container } = render(
      <MemoryRouter initialEntries={["/master/warehouses"]}>
        <WarehousesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Gudang Utama Jakarta")).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/[—–]/);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail gudang Gudang Utama Jakarta",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Gudang Utama Jakarta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("QR Code 2D")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Barcode (1D)" }));
    expect(screen.getByText("1D Code-128")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "QR Code (2D)" }));
    expect(screen.getByText("QR Code 2D")).toBeInTheDocument();

    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Cetak Label Gudang/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();

    fireEvent.click(
      screen.getByRole("button", { name: "Tutup detail gudang" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Tambah gudang/i }));
    fireEvent.change(screen.getByLabelText(/Kode gudang/i), {
      target: { value: "WH-SMG-01" },
    });
    fireEvent.change(screen.getByLabelText(/Nama gudang/i), {
      target: { value: "Gudang Cabang Semarang" },
    });

    postSpy.mockRejectedValueOnce(
      new ApiError("Kode gudang sudah digunakan.", {
        status: 409,
        code: "DUPLICATE",
        requestId: "req-wh-dup-1",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Simpan gudang/i }));

    await waitFor(() => {
      expect(screen.getByText("ID Permintaan: req-wh-dup-1")).toBeInTheDocument();
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 14,
        code: "WH-SMG-01",
        name: "Gudang Cabang Semarang",
        address: null,
        allow_negative_stock: false,
        is_active: true,
        created_by: 1,
        created_at: "2026-11-14T10:00:00Z",
        updated_at: "2026-11-14T10:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan gudang/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/warehouses", {
        code: "WH-SMG-01",
        name: "Gudang Cabang Semarang",
        address: null,
        allow_negative_stock: false,
        is_active: true,
      });
      expect(screen.getByText("Gudang Cabang Semarang")).toBeInTheDocument();
    });
  });

  it("mendukung ubah gudang via PATCH dan menangani proteksi 409 ENTITY_IN_USE saat menonaktifkan", async () => {
    mockWarehousesGet();
    const firstWh = initialSampleWarehouses[0];
    const patchSpy = vi.spyOn(apiClient, "patch");

    render(
      <MemoryRouter initialEntries={["/master/warehouses"]}>
        <WarehousesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(firstWh.name)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Ubah gudang ${firstWh.name}` }),
    );
    const updatedName = "Gudang Utama Jakarta Raya";
    fireEvent.change(screen.getByLabelText(/Nama gudang/i), {
      target: { value: updatedName },
    });
    patchSpy.mockResolvedValueOnce({
      data: {
        ...firstWh,
        name: updatedName,
        updated_at: "2026-11-14T11:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        `/warehouses/${firstWh.id}`,
        expect.objectContaining({ name: updatedName }),
      );
      expect(screen.getByText(updatedName)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Nonaktifkan gudang ${updatedName}` }),
    );
    patchSpy.mockRejectedValueOnce(
      new ApiError("Gudang masih memiliki saldo stok aktif.", {
        status: 409,
        code: "ENTITY_IN_USE",
        requestId: "req-wh-in-use",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan gudang/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Gudang masih memiliki saldo stok aktif."),
      ).toBeInTheDocument();
      expect(screen.getByText("ID Permintaan: req-wh-in-use")).toBeInTheDocument();
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...firstWh,
        name: updatedName,
        is_active: false,
        updated_at: "2026-11-14T11:05:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan gudang/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenLastCalledWith(`/warehouses/${firstWh.id}`, {
        is_active: false,
      });
      expect(
        screen.getByText(`Gudang "${updatedName}" berhasil dinonaktifkan.`),
      ).toBeInTheDocument();
    });
  });
});
