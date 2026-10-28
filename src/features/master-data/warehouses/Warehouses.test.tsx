import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WarehousesPage } from "./pages/WarehousesPage";

describe("WarehousesPage (Contoh data pratinjau Gudang)", () => {
  it("merender contoh data gudang, mendukung detail, tambah, dan filter", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/master/warehouses"]}>
        <WarehousesPage />
      </MemoryRouter>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Contoh data")).toBeInTheDocument();
    expect(screen.getByText("Gudang Utama Jakarta")).toBeInTheDocument();

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
  });
});
