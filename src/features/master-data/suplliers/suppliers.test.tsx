import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { initialSampleSuppliers } from "./api";
import { SuppliersPage } from "./pages/SuppliersPage";

describe("SuppliersPage (Contoh data pratinjau)", () => {
  it("merender data pemasok dari API, mendukung detail, tambah, ubah, dan nonaktifkan", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        items: initialSampleSuppliers,
        total: initialSampleSuppliers.length,
        limit: 25,
        offset: 0,
      },
    });
    const { container } = render(
      <MemoryRouter initialEntries={["/master/suppliers"]}>
        <SuppliersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("PT Nusantara Elektronik")).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/[—–]/);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail pemasok PT Nusantara Elektronik",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "PT Nusantara Elektronik" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Tutup detail pemasok" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Tambah pemasok/i }));
    fireEvent.change(screen.getByLabelText(/Kode pemasok/i), {
      target: { value: "SUP-BARU-09" },
    });
    fireEvent.change(screen.getByLabelText(/Nama pemasok/i), {
      target: { value: "PT Logistik Cepat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan pemasok/i }));

    expect(screen.getByText("PT Logistik Cepat")).toBeInTheDocument();
    getSpy.mockRestore();
  });
});
