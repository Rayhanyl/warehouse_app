export const CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+() -]{6,30}$/;

export function hasMinimumDigits(value: string, minimum: number): boolean {
  return value.replace(/\D/g, "").length >= minimum;
}
