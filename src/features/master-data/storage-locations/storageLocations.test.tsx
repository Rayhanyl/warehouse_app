import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { StorageLocationsPage } from "./pages/StorageLocationsPage";

describe("StorageLocationsPage (Contoh data pratinjau Lokasi Penyimpanan)", () => {
  it("merender contoh data lokasi penyimpanan, mendukung detail, tambah, dan filter", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/master/locations"]}>
        <StorageLocationsPage />
      </MemoryRouter>,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Contoh data")).toBeInTheDocument();
    expect(screen.getByText("Area Karantina Penerimaan")).toBeInTheDocument();

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
  });
});
