import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StocksPage } from "./pages/StocksPage";

describe("StocksPage (Contoh data pratinjau Barang SKU)", () => {
  it("merender contoh data barang SKU, mendukung detail, tambah, dan filter", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/master/items"]}>
        <StocksPage />
      </MemoryRouter>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Contoh data")).toBeInTheDocument();
    expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat detail barang Microcontroller ESP32-S3",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Microcontroller ESP32-S3" }),
    ).toBeInTheDocument();
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
  });
});
