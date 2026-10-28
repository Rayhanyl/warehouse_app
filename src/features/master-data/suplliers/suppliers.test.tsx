import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SuppliersPage } from "./pages/SuppliersPage";

describe("SuppliersPage (Contoh data pratinjau)", () => {
  it("merender contoh data pemasok, mendukung detail, tambah, ubah, dan nonaktifkan", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/master/suppliers"]}>
        <SuppliersPage />
      </MemoryRouter>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Contoh data")).toBeInTheDocument();
    expect(screen.getByText("PT Nusantara Elektronik")).toBeInTheDocument();

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
  });
});
