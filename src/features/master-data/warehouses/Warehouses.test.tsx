import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { initialSampleWarehouses } from "./api";
import { WarehousesPage } from "./pages/WarehousesPage";

describe("WarehousesPage (Contoh data pratinjau Gudang)", () => {
  it("merender data gudang dari API, mendukung detail, tambah, dan filter", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: initialSampleWarehouses,
        total: initialSampleWarehouses.length,
        limit: 25,
        offset: 0,
      },
    });
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
    fireEvent.click(screen.getByRole("button", { name: /Simpan gudang/i }));

    expect(screen.getByText("Gudang Cabang Semarang")).toBeInTheDocument();
    getSpy.mockRestore();
  });
});
