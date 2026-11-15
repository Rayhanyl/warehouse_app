import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import {
  initialSampleStorageLocations,
  sampleWarehouseOptions,
} from "./api";
import { StorageLocationsPage } from "./pages/StorageLocationsPage";

describe("StorageLocationsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockInitialGets() {
    const warehouses = sampleWarehouseOptions.map((warehouse, idx) => ({
      ...warehouse,
      id: idx + 1,
    }));
    const locations = initialSampleStorageLocations.map((loc, idx) => ({
      ...loc,
      id: idx + 1,
      warehouse_id:
        loc.warehouse_id === "wh-001" ? 1 : loc.warehouse_id === "wh-002" ? 2 : 3,
      created_by: 1,
    }));

    return vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/warehouses") {
        return {
          data: {
            items: warehouses,
            total: warehouses.length,
            limit: 200,
            offset: 0,
          },
        };
      }
      return {
        data: {
          items: locations,
          total: locations.length,
          limit: 200,
          offset: 0,
        },
      };
    });
  }

  it("merender data lokasi dari API, mendukung detail QR/Barcode, tambah lokasi, dan tangani 403/409", async () => {
    mockInitialGets();
    const postSpy = vi.spyOn(apiClient, "post");

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
    expect(screen.getByText("Barcode Lokasi Rak")).toBeInTheDocument();
    expect(screen.getByText("QR Code 2D")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Barcode (1D)" }));
    expect(screen.getByText("1D Code-128")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "QR Code (2D)" }));
    expect(screen.getByText("QR Code 2D")).toBeInTheDocument();

    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Cetak Label Rak/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();

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

    postSpy.mockRejectedValueOnce(
      new ApiError("Anda tidak memiliki penugasan pada gudang ini.", {
        status: 403,
        code: "WAREHOUSE_NOT_ASSIGNED",
        requestId: "req-loc-forbid-1",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Simpan lokasi/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Anda tidak memiliki penugasan pada gudang ini."),
      ).toBeInTheDocument();
      expect(screen.getByText("ID Permintaan: req-loc-forbid-1")).toBeInTheDocument();
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 55,
        warehouse_id: 1,
        warehouse_code: sampleWarehouseOptions[0].code,
        warehouse_name: sampleWarehouseOptions[0].name,
        code: "RACK-B02-01",
        name: "Rak B Lorong 2 Tingkat 1",
        is_active: true,
        created_by: 1,
        created_at: "2026-11-14T10:00:00Z",
        updated_at: "2026-11-14T10:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan lokasi/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/locations", {
        warehouse_id: 1,
        code: "RACK-B02-01",
        name: "Rak B Lorong 2 Tingkat 1",
        is_active: true,
      });
      expect(screen.getByText("RACK-B02-01")).toBeInTheDocument();
      expect(screen.getByText("Rak B Lorong 2 Tingkat 1")).toBeInTheDocument();
    });
  });

  it("mengunci pilihan gudang saat edit dan menangani 409 ENTITY_IN_USE saat menonaktifkan", async () => {
    mockInitialGets();
    const firstLocation = initialSampleStorageLocations[0];
    const patchSpy = vi.spyOn(apiClient, "patch");

    render(
      <MemoryRouter initialEntries={["/master/locations"]}>
        <StorageLocationsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(firstLocation.name)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Edit lokasi ${firstLocation.name}` }),
    );
    expect(screen.getByLabelText(/^Gudang induk/i)).toBeDisabled();

    const updatedName = "Area Karantina Penerimaan Utama";
    fireEvent.change(screen.getByLabelText(/^Nama lokasi/i), {
      target: { value: updatedName },
    });
    patchSpy.mockResolvedValueOnce({
      data: {
        id: 1,
        warehouse_id: 1,
        warehouse_code: firstLocation.warehouse_code,
        warehouse_name: firstLocation.warehouse_name,
        code: firstLocation.code,
        name: updatedName,
        is_active: true,
        created_by: 1,
        created_at: firstLocation.created_at,
        updated_at: "2026-11-14T11:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/locations/1", {
        code: firstLocation.code,
        name: updatedName,
        is_active: true,
      });
      expect(screen.getByText(updatedName)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Nonaktifkan lokasi ${updatedName}` }),
    );
    patchSpy.mockRejectedValueOnce(
      new ApiError("Lokasi masih memiliki saldo stok aktif.", {
        status: 409,
        code: "ENTITY_IN_USE",
        requestId: "req-loc-in-use",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Lokasi masih memiliki saldo stok aktif."),
      ).toBeInTheDocument();
      expect(screen.getByText("ID Permintaan: req-loc-in-use")).toBeInTheDocument();
    });

    patchSpy.mockResolvedValueOnce({
      data: {
        id: 1,
        warehouse_id: 1,
        warehouse_code: firstLocation.warehouse_code,
        warehouse_name: firstLocation.warehouse_name,
        code: firstLocation.code,
        name: updatedName,
        is_active: false,
        created_by: 1,
        created_at: firstLocation.created_at,
        updated_at: "2026-11-14T11:05:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenLastCalledWith("/locations/1", {
        is_active: false,
      });
      expect(
        screen.getByText(`Lokasi penyimpanan "${updatedName}" berhasil dinonaktifkan.`),
      ).toBeInTheDocument();
    });
  });
});
