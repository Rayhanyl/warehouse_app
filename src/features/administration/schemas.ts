import { z } from "zod";
import {
  CODE_REGEX,
  EMAIL_REGEX,
  ICON_REGEX,
  MENU_PATH_REGEX,
  USERNAME_REGEX,
} from "@/lib/validation";

export const menuFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode menu wajib diisi (1 sampai 50 karakter).")
    .max(50, "Kode menu maksimal 50 karakter.")
    .regex(
      CODE_REGEX,
      "Kode hanya boleh diawali huruf/angka dan berisi huruf, angka, '.', '_', '/', atau '-'.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Nama menu wajib diisi (1 sampai 100 karakter).")
    .max(100, "Nama menu maksimal 100 karakter."),
  path: z
    .string()
    .trim()
    .min(1, "Path menu wajib diisi.")
    .max(150, "Path menu maksimal 150 karakter.")
    .regex(MENU_PATH_REGEX, "Path menu harus diawali '/' dan tidak boleh mengandung spasi."),
  icon: z
    .string()
    .trim()
    .max(50, "Nama ikon maksimal 50 karakter.")
    .refine(
      (value) => !value || ICON_REGEX.test(value),
      "Gunakan format kebab-case huruf kecil (mis. 'package-check').",
    ),
  sort_order: z
    .number()
    .int("Urutan menu harus berupa bilangan bulat.")
    .min(0, "Urutan menu minimal 0.")
    .max(10000, "Urutan menu maksimal 10.000."),
});

const userBaseSchema = {
  full_name: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi (1 sampai 150 karakter).")
    .max(150, "Nama lengkap maksimal 150 karakter."),
  email: z
    .string()
    .trim()
    .min(3, "Email wajib diisi.")
    .max(255, "Email maksimal 255 karakter.")
    .regex(EMAIL_REGEX, "Format alamat email belum valid."),
  role_id: z.number().int().positive("Pilih peran pengguna yang valid."),
};

export const userCreateSchema = z.object({
  ...userBaseSchema,
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(64, "Username maksimal 64 karakter.")
    .regex(
      USERNAME_REGEX,
      "Username harus diawali huruf/angka dan hanya boleh berisi huruf, angka, '.', '_', atau '-'.",
    ),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter.")
    .max(255, "Kata sandi maksimal 255 karakter.")
    .refine((value) => value.trim().length > 0, "Kata sandi tidak boleh hanya berisi spasi."),
});

export const userUpdateSchema = z.object({
  ...userBaseSchema,
  password: z
    .string()
    .max(255, "Kata sandi maksimal 255 karakter.")
    .refine(
      (value) => value.length === 0 || (value.length >= 8 && value.trim().length > 0),
      "Kata sandi baru minimal 8 karakter dan tidak boleh hanya berisi spasi.",
    ),
});
