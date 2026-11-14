import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/features/auth/api";
import { mapApiFormError } from "@/lib/errors";
import { validateZodSchema } from "@/lib/validation";

type PasswordField = "current" | "next" | "confirmation";

const initialPasswords = {
  current: "",
  next: "",
  confirmation: "",
};

const changePasswordSchema = z
  .object({
    current: z
      .string()
      .min(1, "Kata sandi saat ini wajib diisi.")
      .max(255, "Kata sandi saat ini maksimal 255 karakter.")
      .refine((v) => v.trim().length > 0, "Kata sandi saat ini tidak boleh hanya berisi spasi."),
    next: z
      .string()
      .min(8, "Kata sandi baru minimal terdiri dari 8 karakter.")
      .max(255, "Kata sandi baru maksimal 255 karakter.")
      .refine((v) => v.trim().length > 0, "Kata sandi baru tidak boleh hanya berisi spasi."),
    confirmation: z.string().min(1, "Konfirmasi kata sandi baru wajib diisi."),
  })
  .refine((data) => data.next === data.confirmation, {
    path: ["confirmation"],
    message: "Konfirmasi kata sandi belum sama.",
  });

const PASSWORD_FIELDS: readonly [PasswordField, string, string][] = [
  ["current", "Kata sandi saat ini", "Masukkan kata sandi saat ini"],
  ["next", "Kata sandi baru", "Masukkan kata sandi baru"],
  ["confirmation", "Konfirmasi kata sandi baru", "Ulangi kata sandi baru"],
];

/**
 * Kartu formulir ganti kata sandi pengguna beserta validasi Zod dan pemetaan galat server.
 */
export function ChangePasswordCard() {
  const [passwords, setPasswords] = useState(initialPasswords);
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirmation: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    requestId?: string | null;
  } | null>(null);

  function updatePassword(field: PasswordField, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }

  function toggleVisibility(field: PasswordField) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsed = validateZodSchema(changePasswordSchema, passwords);
    if (!parsed.ok) {
      setFieldErrors({
        current: parsed.fieldErrors.current,
        next: parsed.fieldErrors.next,
        confirmation: parsed.fieldErrors.confirmation,
      });
      setFeedback({
        type: "error",
        message: parsed.firstError,
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: parsed.data.current,
        new_password: parsed.data.next,
      });
      setPasswords(initialPasswords);
      setFeedback({
        type: "success",
        message: "Kata sandi berhasil diperbarui. Sesi lain telah dicabut oleh server.",
      });
    } catch (error) {
      const mapped = mapApiFormError(
        error,
        "Kata sandi belum dapat diperbarui. Periksa koneksi ke server.",
        { current_password: "current", new_password: "next" },
      );
      setFieldErrors({
        current: mapped.fieldErrors.current,
        next: mapped.fieldErrors.next,
      });
      setFeedback({
        type: "error",
        message: mapped.formMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card aria-labelledby="password-title" className="gap-5 self-start py-5 sm:py-6">
      <CardHeader className="flex flex-row items-start gap-3 px-5 sm:px-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-700">
          <KeyRound aria-hidden="true" size={19} />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-ink-950" id="password-title">
            Ganti kata sandi
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-700">
            Gunakan kata sandi baru minimal 8 karakter. Setelah disimpan, sesi di perangkat lain akan dicabut otomatis.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6">
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {PASSWORD_FIELDS.map(([field, label, placeholder]) => (
            <div key={field}>
              <Label
                className="font-semibold text-ink-950"
                htmlFor={`profile-password-${field}`}
              >
                {label}
              </Label>
              <div className="relative mt-2">
                <Input
                  aria-invalid={Boolean(fieldErrors[field])}
                  autoComplete={field === "current" ? "current-password" : "new-password"}
                  className="h-12 pr-12"
                  id={`profile-password-${field}`}
                  minLength={field === "current" ? 1 : 8}
                  onChange={(event) => updatePassword(field, event.target.value)}
                  placeholder={placeholder}
                  required
                  type={visibleFields[field] ? "text" : "password"}
                  value={passwords[field]}
                />
                <button
                  aria-label={
                    visibleFields[field]
                      ? `Sembunyikan ${label.toLowerCase()}`
                      : `Tampilkan ${label.toLowerCase()}`
                  }
                  aria-pressed={visibleFields[field]}
                  className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-sm text-slate-700 transition hover:bg-muted hover:text-ink-950"
                  onClick={() => toggleVisibility(field)}
                  type="button"
                >
                  {visibleFields[field] ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </div>
              {fieldErrors[field] && (
                <p className="mt-1 text-xs font-medium text-red-700" role="alert">
                  {fieldErrors[field]}
                </p>
              )}
            </div>
          ))}

          {feedback && (
            <div
              className={`rounded-md border px-3.5 py-3 text-sm leading-5 ${
                feedback.type === "success"
                  ? "border-teal-600/30 bg-teal-100 text-teal-700"
                  : "border-red-600/30 bg-red-100 text-red-700"
              }`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              <p className="font-semibold">{feedback.message}</p>
              {feedback.requestId && (
                <p className="mt-1 text-xs text-slate-600 tabular-nums">
                  ID Permintaan: {feedback.requestId}
                </p>
              )}
            </div>
          )}

          <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
            {isSubmitting ? "Menyimpan..." : "Simpan kata sandi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
