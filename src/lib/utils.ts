import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format a numeric string or number as Indonesian Rupiah (IDR). */
export function formatCurrencyIdr(value: string | number | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return idrFormatter.format(0);
  }
  return idrFormatter.format(num);
}

export function isSuperAdminUser(user?: { role_name?: string | null } | null): boolean {
  return user?.role_name?.trim().toLowerCase() === "super admin";
}

export interface SodGuardResult {
  isBlocked: boolean;
  isOverride: boolean;
  reason: string | null;
}

/**
 * Evaluate client-side Segregation of Duties (SoD) against prior document actor IDs.
 * Super Admin receives an override warning rather than a hard UI block.
 */
export function evaluateSodGuard(
  user: { id: number; role_name?: string | null } | null | undefined,
  priorActorIds: Array<number | null | undefined>,
  reason: string,
): SodGuardResult {
  if (!user) {
    return { isBlocked: false, isOverride: false, reason: null };
  }
  const hasConflict = priorActorIds.some(
    (actorId) => typeof actorId === "number" && actorId === user.id,
  );
  if (!hasConflict) {
    return { isBlocked: false, isOverride: false, reason: null };
  }
  if (isSuperAdminUser(user)) {
    return { isBlocked: false, isOverride: true, reason };
  }
  return { isBlocked: true, isOverride: false, reason };
}
