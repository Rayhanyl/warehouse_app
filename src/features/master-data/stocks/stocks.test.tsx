import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import {
  initialSampleStockItems,
  sampleCategoryOptions,
  sampleUomOptions,
} from "./api";
import { StocksPage } from "./pages/StocksPage";

describe("StocksPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockInitialGets() {
    return vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/categories") {
        return { data: { items: sampleCategoryOptions, total: 3, limit: 200, offset: 0 } };
      }
      if (url === "/uoms") {
        return { data: { items: sampleUomOptions, total: 3, limit: 200, offset: 0 } };
      }
      return {
        data: {
          items: initialSampleStockItems,
          total: initialSampleStockItems.length,
          limit: 200,
          offset: 0,
        },
      };
    });
  }

  it("merender data barang dari API, mendukung detail label barcode, tambah barang, dan tangani 409 DUPLICATE", async () => {
    mockInitialGets();
    const postSpy = vi.spyOn(apiClient, "post");

    const { container } = render(
      <MemoryRouter initialEntries={["/master/items"]}>
        <StocksPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/[—–]/);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail barang Microcontroller ESP32-S3",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Microcontroller ESP32-S3" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Visual Barcode Pemindaian")).toBeInTheDocument();

    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Cetak Label Barcode/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("region", { name: /Label stiker barcode/i }),
    ).toBeInTheDocument();
    printSpy.mockRestore();

    fireEvent.click(
      screen.getByRole("button", { name: "Tutup detail barang" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Tambah barang/i }));
    const skuInput = screen.getByLabelText(/Kode SKU/i);
    const nameInput = screen.getByLabelText(/Nama barang/i);
    fireEvent.change(skuInput, { target: { value: "ELK-RES-10K" } });
    fireEvent.change(nameInput, { target: { value: "Resistor 10K Ohm" } });

    postSpy.mockRejectedValueOnce(
      new ApiError("Kode SKU sudah digunakan.", {
        status: 409,
        code: "DUPLICATE",
        requestId: "req-stock-dup-1",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Simpan barang/i }));

    await waitFor(() => {
      expect(screen.getByText("ID Permintaan: req-stock-dup-1")).toBeInTheDocument();
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 99,
        sku: "ELK-RES-10K",
        barcode: null,
        name: "Resistor 10K Ohm",
        description: null,
        category_id: sampleCategoryOptions[0].id,
        category_name: sampleCategoryOptions[0].name,
        uom_id: sampleUomOptions[0].id,
        uom_code: sampleUomOptions[0].code,
        uom_name: sampleUomOptions[0].name,
        allow_decimal: sampleUomOptions[0].allow_decimal,
        is_active: true,
        created_by: 1,
        created_at: "2026-11-14T10:00:00Z",
        updated_at: "2026-11-14T10:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan barang/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/items", {
        sku: "ELK-RES-10K",
        barcode: null,
        name: "Resistor 10K Ohm",
        description: null,
        category_id: sampleCategoryOptions[0].id,
        uom_id: sampleUomOptions[0].id,
        is_active: true,
      });
      expect(screen.getByText("Resistor 10K Ohm")).toBeInTheDocument();
    });
  });

  it("mendukung ubah barang via PATCH dan menangani proteksi 409 ENTITY_IN_USE saat menonaktifkan", async () => {
    mockInitialGets();
    const firstItem = initialSampleStockItems[0];
    const patchSpy = vi.spyOn(apiClient, "patch");

    render(
      <MemoryRouter initialEntries={["/master/items"]}>
        <StocksPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(firstItem.name)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Ubah barang ${firstItem.name}` }),
    );
    const updatedName = "Microcontroller ESP32-S3 DevKitC";
    fireEvent.change(screen.getByLabelText(/Nama barang/i), {
      target: { value: updatedName },
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...firstItem,
        name: updatedName,
        updated_at: "2026-11-14T11:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        `/items/${firstItem.id}`,
        expect.objectContaining({ name: updatedName }),
      );
      expect(screen.getByText(updatedName)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Nonaktifkan barang ${updatedName}` }),
    );

    patchSpy.mockRejectedValueOnce(
      new ApiError("Barang masih digunakan oleh saldo stok aktif.", {
        status: 409,
        code: "ENTITY_IN_USE",
        requestId: "req-stock-in-use",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan barang/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Barang masih digunakan oleh saldo stok aktif."),
      ).toBeInTheDocument();
      expect(screen.getByText("ID Permintaan: req-stock-in-use")).toBeInTheDocument();
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        ...firstItem,
        name: updatedName,
        is_active: false,
        updated_at: "2026-11-14T11:05:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan barang/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenLastCalledWith(`/items/${firstItem.id}`, {
        is_active: false,
      });
      expect(
        screen.getByText(`Barang "${updatedName}" berhasil dinonaktifkan.`),
      ).toBeInTheDocument();
    });
  });
});
