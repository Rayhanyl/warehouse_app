import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { initialSampleSuppliers } from "./api";
import { SuppliersPage } from "./pages/SuppliersPage";

describe("SuppliersPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockSuppliersGet(items = initialSampleSuppliers) {
    return vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/suppliers/import-template") {
        return { data: new Blob(["template"]) };
      }
      return {
        data: {
          items,
          total: items.length,
          limit: 200,
          offset: 0,
        },
      };
    });
  }

  it("merender data pemasok dari API, mendukung detail, tambah, dan menangani 409 DUPLICATE", async () => {
    mockSuppliersGet();
    const postSpy = vi.spyOn(apiClient, "post");

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

    postSpy.mockRejectedValueOnce(
      new ApiError("Kode pemasok sudah digunakan.", {
        status: 409,
        code: "DUPLICATE",
        requestId: "req-sup-dup-1",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Simpan pemasok/i }));

    await waitFor(() => {
      expect(screen.getByText("ID Permintaan: req-sup-dup-1")).toBeInTheDocument();
    });

    postSpy.mockResolvedValueOnce({
      data: {
        id: 88,
        code: "SUP-BARU-09",
        name: "PT Logistik Cepat",
        contact_person: null,
        phone: null,
        email: null,
        address: null,
        is_active: true,
        created_by: 1,
        created_at: "2026-11-14T10:00:00Z",
        updated_at: "2026-11-14T10:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan pemasok/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenLastCalledWith("/suppliers", {
        code: "SUP-BARU-09",
        name: "PT Logistik Cepat",
        contact_person: null,
        phone: null,
        email: null,
        address: null,
        is_active: true,
      });
      expect(screen.getByText("PT Logistik Cepat")).toBeInTheDocument();
    });
  });

  it("mendukung ubah pemasok, proteksi 409 ENTITY_IN_USE, unduh template, dan import Excel pemasok", async () => {
    const getSpy = mockSuppliersGet();
    const firstSupplier = initialSampleSuppliers[0];
    const patchSpy = vi.spyOn(apiClient, "patch");
    const postSpy = vi.spyOn(apiClient, "post");

    render(
      <MemoryRouter initialEntries={["/master/suppliers"]}>
        <SuppliersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(firstSupplier.name)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Ubah pemasok ${firstSupplier.name}` }),
    );
    const updatedName = "PT Nusantara Elektronik Mandiri";
    fireEvent.change(screen.getByLabelText(/Nama pemasok/i), {
      target: { value: updatedName },
    });
    patchSpy.mockResolvedValueOnce({
      data: {
        ...firstSupplier,
        name: updatedName,
        updated_at: "2026-11-14T11:00:00Z",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Simpan perubahan/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        `/suppliers/${firstSupplier.id}`,
        expect.objectContaining({ name: updatedName }),
      );
      expect(screen.getByText(updatedName)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: `Nonaktifkan pemasok ${updatedName}`,
      }),
    );
    patchSpy.mockRejectedValueOnce(
      new ApiError("Pemasok masih memiliki Purchase Order terkait.", {
        status: 409,
        code: "ENTITY_IN_USE",
        requestId: "req-sup-in-use",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Ya, nonaktifkan pemasok/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Pemasok masih memiliki Purchase Order terkait."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Batal$/i }));

    fireEvent.click(screen.getByRole("button", { name: /Unduh template/i }));
    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith("/suppliers/import-template", {
        responseType: "blob",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /Import Excel/i }));
    expect(
      screen.getByRole("dialog", { name: "Import pemasok dari Excel" }),
    ).toBeInTheDocument();

    const excelFile = new File(["excel-content"], "pemasok.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileInput = screen.getByLabelText(/Berkas Excel/i);
    fireEvent.change(fileInput, { target: { files: [excelFile] } });

    postSpy.mockResolvedValueOnce({
      data: {
        total_rows: 2,
        imported_count: 1,
        failed_count: 1,
        errors: [
          {
            row: 3,
            field: "email",
            code: "INVALID_EMAIL",
            message: "Format email tidak valid.",
          },
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Mulai import/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/suppliers/import",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      expect(screen.getByText("Import selesai")).toBeInTheDocument();
      expect(screen.getByText("Format email tidak valid.")).toBeInTheDocument();
    });
  });
});
