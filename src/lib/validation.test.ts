import {
  categoryFormSchema,
  itemFormSchema,
  storageLocationFormSchema,
  supplierFormSchema,
  uomFormSchema,
  warehouseFormSchema,
} from "../features/master-data/validation";
import { ApiError, extractApiFieldErrors, mapApiFormError } from "./errors";
import { validateDecimalQtyInput, validateZodSchema } from "./validation";

describe("Tahap 15: Validasi terpusat dan pemetaan error API", () => {
  describe("extractApiFieldErrors & mapApiFormError", () => {
    it("memetakan 422 details.field_errors, details.errors nested, serta mempertahankan nama field 'path'", () => {
      const error = new ApiError("Data yang dikirim tidak valid. Periksa kembali isian Anda.", {
        status: 422,
        code: "VALIDATION_ERROR",
        details: {
          field_errors: {
            "body.path": "Path menu harus diawali '/'.",
            "lines.0.qty_ordered": "Kuantitas melebihi batas.",
          },
          errors: [
            {
              loc: ["body", "email"],
              field: "body.email",
              msg: "Format alamat email belum valid.",
            },
            {
              loc: ["body", "lines", 1, "item_id"],
              msg: "Barang wajib dipilih.",
            },
          ],
        },
      });

      const mapped = mapApiFormError(error, "Fallback message");

      expect(mapped.status).toBe(422);
      expect(mapped.code).toBe("VALIDATION_ERROR");
      expect(mapped.formMessage).toBe("Data yang dikirim tidak valid. Periksa kembali isian Anda.");
      expect(mapped.fieldErrors).toEqual({
        path: "Path menu harus diawali '/'.",
        "lines.0.qty_ordered": "Kuantitas melebihi batas.",
        email: "Format alamat email belum valid.",
        "lines.1.item_id": "Barang wajib dipilih.",
      });
    });

    it("memetakan konflik 409 details.field dengan fieldAliases", () => {
      const error = new ApiError("Kode lokasi sudah terdaftar pada gudang tersebut.", {
        status: 409,
        code: "DUPLICATE",
        details: {
          field: "warehouse_id",
        },
      });

      const mapped = mapApiFormError(error, "Gagal menyimpan", {
        warehouse_id: "warehouse",
      });

      expect(mapped.status).toBe(409);
      expect(mapped.fieldErrors).toEqual({
        warehouse: "Kode lokasi sudah terdaftar pada gudang tersebut.",
      });
    });

    it("menggunakan pesan fallback 403 saat pesan server kosong serta menangani timeout (408) dan network error (0)", () => {
      const forbidden = new ApiError("   ", { status: 403, code: "PERMISSION_DENIED" });
      expect(mapApiFormError(forbidden, "Default")).toEqual({
        formMessage: "Anda tidak memiliki izin atau penugasan gudang untuk melakukan aksi ini.",
        fieldErrors: {},
        status: 403,
        code: "PERMISSION_DENIED",
      });

      const timeout = new ApiError("timeout", { status: 408 });
      expect(mapApiFormError(timeout, "Default").formMessage).toBe(
        "Permintaan melebihi batas waktu. Periksa koneksi lalu coba lagi.",
      );

      const offline = new ApiError("network", { status: 0 });
      expect(mapApiFormError(offline, "Default").formMessage).toBe(
        "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.",
      );
    });

    it("mengembalikan objek kosong jika details undefined", () => {
      expect(extractApiFieldErrors(undefined)).toEqual({});
    });
  });

  describe("validateDecimalQtyInput", () => {
    it("menerima kuantitas positif hingga 4 desimal dan mendukung allowZero", () => {
      expect(validateDecimalQtyInput("12.3456")).toBeNull();
      expect(validateDecimalQtyInput(" 10 ")).toBeNull();
      expect(validateDecimalQtyInput("0", { allowZero: true })).toBeNull();
    });

    it("menolak string kosong, bukan angka, negatif, 0 saat allowZero=false, >4 desimal, dan non-integer saat allowDecimal=false", () => {
      expect(validateDecimalQtyInput("   ")).toBe("Jumlah wajib diisi.");
      expect(validateDecimalQtyInput("abc")).toBe("Jumlah harus berupa angka yang valid.");
      expect(validateDecimalQtyInput("Infinity")).toBe("Jumlah harus berupa angka yang valid.");
      expect(validateDecimalQtyInput("-1")).toBe("Jumlah harus lebih besar dari 0.");
      expect(validateDecimalQtyInput("-0.5", { allowZero: true })).toBe(
        "Jumlah tidak boleh bernilai negatif.",
      );
      expect(validateDecimalQtyInput("0")).toBe("Jumlah harus lebih besar dari 0.");
      expect(validateDecimalQtyInput("1.12345")).toBe(
        "Jumlah maksimal memiliki 4 angka di belakang koma.",
      );
      expect(validateDecimalQtyInput("2.5", { allowDecimal: false })).toBe(
        "Jumlah untuk satuan ini harus berupa bilangan bulat.",
      );
    });

    it("menegakkan batas NUMERIC(18,4) dan maxValue over-receipt", () => {
      expect(validateDecimalQtyInput("100000000000000")).toContain("melebihi batas maksimum");
      expect(validateDecimalQtyInput("15", { label: "Qty Terima", maxValue: "10.5" })).toBe(
        "Qty Terima tidak boleh melebihi batas maksimum (10.5).",
      );
      expect(validateDecimalQtyInput("10.5", { label: "Qty Terima", maxValue: "10.5" })).toBeNull();
    });
  });

  describe("Master Data Zod Schemas", () => {
    it("menolak whitespace-only dan format tidak valid pada seluruh skema master data", () => {
      const cat = validateZodSchema(categoryFormSchema, {
        name: "   ",
        description: "",
        is_active: true,
      });
      expect(cat.ok).toBe(false);
      if (!cat.ok) expect(cat.fieldErrors.name).toBeTruthy();

      const uom = validateZodSchema(uomFormSchema, {
        code: "@PCS",
        name: "   ",
        allow_decimal: false,
        is_active: true,
      });
      expect(uom.ok).toBe(false);
      if (!uom.ok) {
        expect(uom.fieldErrors.code).toBeTruthy();
        expect(uom.fieldErrors.name).toBeTruthy();
      }

      const supplier = validateZodSchema(supplierFormSchema, {
        code: "SUP-01",
        name: "PT Sumber",
        contact_person: "",
        phone: "123",
        email: "bukan-email",
        address: "",
        is_active: true,
      });
      expect(supplier.ok).toBe(false);
      if (!supplier.ok) {
        expect(supplier.fieldErrors.phone).toBeTruthy();
        expect(supplier.fieldErrors.email).toBeTruthy();
      }

      const wh = validateZodSchema(warehouseFormSchema, {
        code: "-WH",
        name: "   ",
        address: "",
        allow_negative_stock: false,
        is_active: true,
      });
      expect(wh.ok).toBe(false);
      if (!wh.ok) {
        expect(wh.fieldErrors.code).toBeTruthy();
        expect(wh.fieldErrors.name).toBeTruthy();
      }

      const loc = validateZodSchema(storageLocationFormSchema, {
        warehouse_id: "   ",
        code: "RAK A",
        name: "   ",
        is_active: true,
      });
      expect(loc.ok).toBe(false);
      if (!loc.ok) {
        expect(loc.fieldErrors.warehouse_id).toBeTruthy();
        expect(loc.fieldErrors.code).toBeTruthy();
        expect(loc.fieldErrors.name).toBeTruthy();
      }

      const item = validateZodSchema(itemFormSchema, {
        sku: "SKU-001",
        barcode: "INVALID BARCODE",
        name: "Kertas A4",
        description: "",
        category_id: 0,
        uom_id: -1,
        is_active: true,
      });
      expect(item.ok).toBe(false);
      if (!item.ok) {
        expect(item.fieldErrors.barcode).toBeTruthy();
        expect(item.fieldErrors.category_id).toBeTruthy();
        expect(item.fieldErrors.uom_id).toBeTruthy();
      }
    });

    it("menerima input valid dan men-trim whitespace pada skema master data", () => {
      const supplier = validateZodSchema(supplierFormSchema, {
        code: " SUP-01 ",
        name: " PT Sumber Jaya ",
        contact_person: " Budi ",
        phone: "+62 812-3456-7890",
        email: "budi@sumber.co.id",
        address: "Jl. Gudang No. 1",
        is_active: true,
      });
      expect(supplier.ok).toBe(true);
      if (supplier.ok) {
        expect(supplier.data.code).toBe("SUP-01");
        expect(supplier.data.name).toBe("PT Sumber Jaya");
      }
    });
  });
});
