import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api-client";
import {
  initialSampleStorageLocations,
  sampleWarehouseOptions,
} from "./api";
import { StorageLocationsPage } from "./pages/StorageLocationsPage";

describe("StorageLocationsPage (Contoh data pratinjau Lokasi Penyimpanan)", () => {
  it("merender data lokasi dari API, mendukung detail, tambah, dan filter", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/warehouses") {
        return {
          data: {
            items: sampleWarehouseOptions.map((warehouse) => ({
              ...warehouse,
              id: Number(warehouse.id.replace("wh-", "")),
            })),
            total: sampleWarehouseOptions.length,
            limit: 200,
            offset: 0,
          },
        };
      }
      return {
        data: {
          items: initialSampleStorageLocations,
          total: initialSampleStorageLocations.length,
          limit: 25,
          offset: 0,
        },
      };
    });
    const { container } = render(
      <MemoryRouter initialEntries={["/master/locations"]}>
        <StorageLocationsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Area Karantina Penerimaan")).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/[—–]/);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail lokasi Area Karantina Penerimaan",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Area Karantina Penerimaan" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Tutup dialog detail lokasi penyimpanan",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Tambah lokasi/i }));
    fireEvent.change(screen.getByLabelText(/^Kode lokasi/i), {
      target: { value: "rack-b02-01" },
    });
    fireEvent.change(screen.getByLabelText(/^Nama lokasi/i), {
      target: { value: "Rak B Lorong 2 Tingkat 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan lokasi/i }));

    expect(screen.getByText("RACK-B02-01")).toBeInTheDocument();
    expect(screen.getByText("Rak B Lorong 2 Tingkat 1")).toBeInTheDocument();
    getSpy.mockRestore();
  });
});
