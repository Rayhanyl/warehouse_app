import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { BarcodeStickerSheet, QrCodeVisual } from "@/components/ui/BarcodeVisual";
import { StockLookupModal } from "@/components/ui/StockLookupModal";
import { StockFormDialog } from "@/features/master-data/stocks/components/StockFormDialog";
import {
  calculateEan13CheckDigit,
  generateInternalBarcode,
  isValidEan13,
} from "@/features/master-data/stocks/utils/barcode";

describe("AC-34 & MST-F09: Barcode Generation & Stock Location Quick Lookup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Barcode Utility (EAN-13 GS1 Internal Prefix 200)", () => {
    it("menghitung modulo-10 check digit standar EAN-13 dengan benar", () => {
      // 400638133393 -> check digit 1 (4006381333931)
      expect(calculateEan13CheckDigit("400638133393")).toBe(1);
      // 899100100001 -> sum 51 -> check digit (10 - 1) = 9
      expect(calculateEan13CheckDigit("899100100001")).toBe(9);
      // Validasi throw error jika panjang bukan 12 digit
      expect(() => calculateEan13CheckDigit("12345")).toThrow();
    });

    it("memvalidasi validitas barcode EAN-13 melalui isValidEan13", () => {
      expect(isValidEan13("4006381333931")).toBe(true);
      expect(isValidEan13("8991001000019")).toBe(true);
      expect(isValidEan13("4006381333939")).toBe(false); // Check digit salah
      expect(isValidEan13("ABC1234567890")).toBe(false);
      expect(isValidEan13("")).toBe(false);
    });

    it("menghasilkan barcode EAN-13 internal unik dengan prefix 200", () => {
      const generated = generateInternalBarcode(["2000000000015"]);
      expect(generated).toHaveLength(13);
      expect(generated.startsWith("200")).toBe(true);
      expect(isValidEan13(generated)).toBe(true);
      expect(generated).not.toBe("2000000000015");
    });
  });

  describe("StockFormDialog: Auto-Generate Barcode WMS (MST-F09)", () => {
    it("menghasilkan barcode internal otomatis saat tombol Generate diklik", () => {
      const onClose = vi.fn();
      const onSubmit = vi.fn();

      const { container } = render(
        <StockFormDialog
          categoryOptions={[{ id: 1, name: "Komponen Elektronik" }]}
          existingItems={[]}
          initialItem={null}
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          uomOptions={[{ id: 1, code: "PCS", name: "Pieces", allow_decimal: false }]}
        />,
      );

      // Verifikasi larangan tanda hubung em-dash/en-dash
      expect(container.textContent).not.toMatch(/[—–]/);

      const barcodeInput = screen.getByLabelText(
        /Barcode \(EAN \/ UPC \/ Code-128\)/i,
      ) as HTMLInputElement;
      expect(barcodeInput.value).toBe("");

      // Klik tombol generate barcode otomatis
      const generateBtn = screen.getByRole("button", {
        name: "Generate barcode internal otomatis",
      });
      fireEvent.click(generateBtn);

      // Barcode harus terisi 13 digit diawali '200' dan checksum valid
      expect(barcodeInput.value).toHaveLength(13);
      expect(barcodeInput.value.startsWith("200")).toBe(true);
      expect(isValidEan13(barcodeInput.value)).toBe(true);
    });
  });

  describe("StockLookupModal: Quick Stock & Location Finder (INV-F08, AC-34)", () => {
    it("memuat profil barang dan tabel sebaran lokasi rak aktual saat barcode dipindai/dicari", async () => {
      const mockBalances = [
        {
          warehouse_id: 1,
          warehouse_code: "WH-UTAMA",
          warehouse_name: "Gudang Utama Jakarta",
          location_id: 101,
          location_code: "RAK-A-01",
          location_name: "Rak Depan Komponen A",
          item_id: 10,
          item_sku: "ELK-MCU-001",
          item_barcode: "8991001000011",
          item_name: "Microcontroller ESP32-S3",
          category_id: 1,
          category_name: "Komponen Elektronik",
          uom_id: 1,
          uom_code: "PCS",
          qty_on_hand: "150.0000",
          qty_in_transit: "0.0000",
          updated_at: "2026-11-10T10:00:00Z",
        },
        {
          warehouse_id: 1,
          warehouse_code: "WH-UTAMA",
          warehouse_name: "Gudang Utama Jakarta",
          location_id: 102,
          location_code: "RAK-B-02",
          location_name: "Rak Cadangan B",
          item_id: 10,
          item_sku: "ELK-MCU-001",
          item_barcode: "8991001000011",
          item_name: "Microcontroller ESP32-S3",
          category_id: 1,
          category_name: "Komponen Elektronik",
          uom_id: 1,
          uom_code: "PCS",
          qty_on_hand: "50.0000",
          qty_in_transit: "20.0000",
          updated_at: "2026-11-10T10:00:00Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
        if (url === "/stock/by-location") {
          return {
            data: {
              items: mockBalances,
              total: 2,
              limit: 100,
              offset: 0,
            },
          } as any;
        }
        return { data: { items: [], total: 0, limit: 10, offset: 0 } } as any;
      });

      const onClose = vi.fn();
      const { container } = render(
        <MemoryRouter>
          <StockLookupModal isOpen={true} onClose={onClose} />
        </MemoryRouter>,
      );

      // Verifikasi larangan em-dash/en-dash
      expect(container.textContent).not.toMatch(/[—–]/);

      const input = screen.getByLabelText(/Cari barcode atau SKU/i);
      fireEvent.change(input, { target: { value: "8991001000011" } });

      const searchBtn = screen.getByRole("button", { name: /^Cari$/i });
      fireEvent.click(searchBtn);

      // Verifikasi data barang dan total saldo
      await waitFor(() => {
        expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();
      });
      expect(screen.getByText("ELK-MCU-001")).toBeInTheDocument();
      expect(screen.getByText("8991001000011")).toBeInTheDocument();

      // Total saldo on-hand = 150 + 50 = 200
      expect(screen.getByText("200")).toBeInTheDocument();

      // Verifikasi sebaran lokasi rak
      expect(screen.getByText("RAK-A-01")).toBeInTheDocument();
      expect(screen.getByText("Rak Depan Komponen A")).toBeInTheDocument();
      expect(screen.getByText("RAK-B-02")).toBeInTheDocument();
      expect(screen.getByText("Rak Cadangan B")).toBeInTheDocument();

      // Verifikasi status rak
      const statusBadges = screen.getAllByText("Tersedia");
      expect(statusBadges.length).toBeGreaterThanOrEqual(2);
    });

    it("menampilkan penanda khusus jika barang ada di master data namun belum memiliki stok di rak mana pun", async () => {
      vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
        if (url === "/stock/by-location") {
          return { data: { items: [], total: 0, limit: 100, offset: 0 } } as any;
        }
        if (url === "/items") {
          return {
            data: {
              items: [
                {
                  id: 99,
                  sku: "BRG-BARU-01",
                  barcode: "2009998881112",
                  name: "Barang Contoh Baru",
                  category_name: "Umum",
                  uom_code: "PCS",
                },
              ],
              total: 1,
              limit: 5,
              offset: 0,
            },
          } as any;
        }
        return { data: { items: [], total: 0 } } as any;
      });

      const { container } = render(
        <MemoryRouter>
          <StockLookupModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      const input = screen.getByLabelText(/Cari barcode atau SKU/i);
      fireEvent.change(input, { target: { value: "2009998881112" } });
      fireEvent.click(screen.getByRole("button", { name: /^Cari$/i }));

      await waitFor(() => {
        expect(screen.getByText("Barang Contoh Baru")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Saldo belum tersedia di rak gudang"),
      ).toBeInTheDocument();
      expect(container.textContent).not.toMatch(/[—–]/);
    });

    it("menampilkan pesan jika barang sama sekali tidak ditemukan", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { items: [], total: 0, limit: 100, offset: 0 },
      } as any);

      render(
        <MemoryRouter>
          <StockLookupModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      const input = screen.getByLabelText(/Cari barcode atau SKU/i);
      fireEvent.change(input, { target: { value: "BARCODE-TIDAK-ADA" } });
      fireEvent.click(screen.getByRole("button", { name: /^Cari$/i }));

      await waitFor(() => {
        expect(screen.getByText("Barang tidak ditemukan")).toBeInTheDocument();
      });
    });

    it("AC-36: menampilkan Kartu Identitas Rak dan daftar multi-SKU saat kode lokasi rak dipindai", async () => {
      const mockRackBalances = [
        {
          warehouse_id: 1,
          warehouse_code: "WH-JKT-01",
          warehouse_name: "Gudang Pusat Jakarta",
          location_id: 101,
          location_code: "JKT-RAK-A1",
          location_name: "Rak Utama A1",
          item_id: 10,
          item_sku: "ELK-MCU-001",
          item_barcode: "8991001000019",
          item_name: "Microcontroller ESP32-S3",
          category_id: 1,
          category_name: "Komponen Elektronik",
          uom_id: 1,
          uom_code: "PCS",
          qty_on_hand: "40.0000",
          qty_in_transit: "0.0000",
          updated_at: "2026-11-11T10:00:00Z",
        },
        {
          warehouse_id: 1,
          warehouse_code: "WH-JKT-01",
          warehouse_name: "Gudang Pusat Jakarta",
          location_id: 101,
          location_code: "JKT-RAK-A1",
          location_name: "Rak Utama A1",
          item_id: 11,
          item_sku: "ELK-SNS-002",
          item_barcode: "8991001000026",
          item_name: "Sensor Suhu Industri",
          category_id: 1,
          category_name: "Komponen Elektronik",
          uom_id: 1,
          uom_code: "PCS",
          qty_on_hand: "25.0000",
          qty_in_transit: "5.0000",
          updated_at: "2026-11-11T10:00:00Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
        if (url === "/stock/by-location") {
          return {
            data: {
              items: mockRackBalances,
              total: 2,
              limit: 100,
              offset: 0,
            },
          } as any;
        }
        return { data: { items: [], total: 0, limit: 10, offset: 0 } } as any;
      });

      const { container } = render(
        <MemoryRouter>
          <StockLookupModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      const input = screen.getByLabelText(/Cari barcode atau SKU/i);
      fireEvent.change(input, { target: { value: "JKT-RAK-A1" } });
      fireEvent.click(screen.getByRole("button", { name: /^Cari$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Daftar Macam Barang di Lokasi Ini"),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Rak Utama A1")).toBeInTheDocument();
      expect(screen.getByLabelText("Visual QR code JKT-RAK-A1")).toBeInTheDocument();
      expect(screen.getByText(/2 macam SKU/i)).toBeInTheDocument();
      expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();
      expect(screen.getByText("Sensor Suhu Industri")).toBeInTheDocument();
      expect(container.textContent).not.toMatch(/[—–]/);
    });

    it("AC-37: merender QrCodeVisual SVG dan BarcodeStickerSheet dalam format QR Code maupun Barcode 1D", () => {
      const { container, rerender } = render(
        <div>
          <QrCodeVisual subtitle="LOKASI RAK" value="JKT-RAK-A1" />
          <BarcodeStickerSheet
            badgeText="LABEL LOKASI RAK"
            code="JKT-RAK-A1"
            format="qr"
            metaLabel="GUDANG: WH-JKT-01"
            secondaryCode="Gudang Pusat Jakarta"
            title="JKT-RAK-A1 · Rak Utama A1"
            visibleOnScreen={true}
          />
        </div>,
      );

      expect(screen.getAllByLabelText("Visual QR code JKT-RAK-A1")).toHaveLength(2);
      expect(
        screen.getByLabelText("Label stiker QR code JKT-RAK-A1"),
      ).toBeInTheDocument();
      expect(container.querySelectorAll("svg path").length).toBeGreaterThanOrEqual(2);
      expect(container.textContent).not.toMatch(/[—–]/);

      rerender(
        <BarcodeStickerSheet
          badgeText="LABEL LOKASI RAK"
          code="JKT-RAK-A1"
          format="barcode"
          metaLabel="GUDANG: WH-JKT-01"
          secondaryCode="Gudang Pusat Jakarta"
          title="JKT-RAK-A1 · Rak Utama A1"
          visibleOnScreen={true}
        />,
      );

      expect(
        screen.getByLabelText("Label stiker barcode JKT-RAK-A1"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Visual barcode JKT-RAK-A1")).toBeInTheDocument();
    });
  });
});
