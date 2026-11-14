import { z } from "zod";

import {
  CODE_REGEX,
  EMAIL_REGEX,
  PHONE_REGEX,
  hasMinimumDigits,
  validateZodSchema,
} from "../../lib/validation";

export { CODE_REGEX, EMAIL_REGEX, PHONE_REGEX, hasMinimumDigits, validateZodSchema };

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama kategori wajib diisi (1 sampai 120 karakter).")
    .max(120, "Nama kategori maksimal terdiri dari 120 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi kategori maksimal terdiri dari 1.000 karakter."),
  is_active: z.boolean(),
});

export const uomFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode satuan ukur wajib diisi (1 sampai 20 karakter).")
    .max(20, "Kode satuan ukur maksimal terdiri dari 20 karakter.")
    .regex(
      CODE_REGEX,
      "Kode hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama satuan ukur wajib diisi (1 sampai 60 karakter).")
    .max(60, "Nama satuan ukur maksimal terdiri dari 60 karakter."),
  allow_decimal: z.boolean(),
  is_active: z.boolean(),
});

export const supplierFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode pemasok wajib diisi (1 sampai 50 karakter).")
    .max(50, "Kode pemasok maksimal terdiri dari 50 karakter.")
    .regex(
      CODE_REGEX,
      "Kode hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama pemasok wajib diisi (1 sampai 150 karakter).")
    .max(150, "Nama pemasok maksimal terdiri dari 150 karakter."),
  contact_person: z
    .string()
    .trim()
    .max(120, "Nama narahubung maksimal terdiri dari 120 karakter."),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => !val || (PHONE_REGEX.test(val) && hasMinimumDigits(val, 6)),
      "Nomor telepon harus berisi 6 sampai 30 karakter dan minimal 6 digit.",
    ),
  email: z
    .string()
    .trim()
    .max(255, "Alamat email maksimal terdiri dari 255 karakter.")
    .refine((val) => !val || EMAIL_REGEX.test(val), "Format alamat email belum valid."),
  address: z
    .string()
    .trim()
    .max(1000, "Alamat maksimal terdiri dari 1.000 karakter."),
  is_active: z.boolean(),
});

export const warehouseFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode gudang wajib diisi (1 sampai 50 karakter).")
    .max(50, "Kode gudang maksimal terdiri dari 50 karakter.")
    .regex(
      CODE_REGEX,
      "Kode hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama gudang wajib diisi (1 sampai 150 karakter).")
    .max(150, "Nama gudang maksimal terdiri dari 150 karakter."),
  address: z
    .string()
    .trim()
    .max(1000, "Alamat maksimal terdiri dari 1.000 karakter."),
  allow_negative_stock: z.boolean(),
  is_active: z.boolean(),
});

export const storageLocationFormSchema = z.object({
  warehouse_id: z.string().trim().min(1, "Pilih gudang induk terlebih dahulu."),
  code: z
    .string()
    .trim()
    .min(1, "Kode lokasi wajib diisi.")
    .max(50, "Kode lokasi maksimal 50 karakter.")
    .regex(
      CODE_REGEX,
      "Kode hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama lokasi wajib diisi.")
    .max(120, "Nama lokasi maksimal 120 karakter."),
  is_active: z.boolean(),
});

export const itemFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "Kode SKU wajib diisi (1 sampai 64 karakter).")
    .max(64, "Kode SKU maksimal terdiri dari 64 karakter.")
    .regex(
      CODE_REGEX,
      "SKU hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.",
    ),
  barcode: z
    .string()
    .trim()
    .max(64, "Barcode maksimal terdiri dari 64 karakter.")
    .refine(
      (val) => !val || CODE_REGEX.test(val),
      "Barcode hanya boleh diawali huruf/angka dan berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung (maks. 64 karakter).",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama barang wajib diisi (1 sampai 200 karakter).")
    .max(200, "Nama barang maksimal terdiri dari 200 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi barang maksimal terdiri dari 1.000 karakter."),
  category_id: z.number().int().positive("Pilih kategori aktif."),
  uom_id: z.number().int().positive("Pilih satuan ukur aktif."),
  is_active: z.boolean(),
});
