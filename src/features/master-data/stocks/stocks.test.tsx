import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import {
  initialSampleStockItems,
  sampleCategoryOptions,
  sampleUomOptions,
} from "./api";
import { StocksPage } from "./pages/StocksPage";

describe("StocksPage (Contoh data pratinjau Barang SKU)", () => {
  it("merender data barang dari API, mendukung detail, tambah, dan filter", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
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
          limit: 25,
          offset: 0,
        },
      };
    });

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
    fireEvent.change(screen.getByLabelText(/Kode SKU/i), {
      target: { value: "ELK-RES-10K" },
    });
    fireEvent.change(screen.getByLabelText(/Nama barang/i), {
      target: { value: "Resistor 10K Ohm" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan barang/i }));

    expect(screen.getByText("Resistor 10K Ohm")).toBeInTheDocument();
    getSpy.mockRestore();
  });
});
