import axios from "axios";
import { extractApiErrorInfo } from "@/lib/errors";
import {
  localStorageRepository,
  REFRESH_LOCK_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/storage";
import type { SessionRestoreErrorInfo } from "@/features/auth/store";

export class SessionRestoreTimeoutError extends Error {
  constructor() {
    super("Pemulihan sesi melewati batas waktu.");
    this.name = "SessionRestoreTimeoutError";
  }
}

export function getRefreshToken(): string | null {
  const raw = localStorageRepository.getString(REFRESH_TOKEN_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
    return null;
  }
  return trimmed;
}

export function hasRefreshToken(): boolean {
  return getRefreshToken() !== null;
}

export function saveRefreshToken(refreshToken: string): void {
  const trimmed = refreshToken.trim();
  if (!trimmed) {
    return;
  }
  localStorageRepository.setString(REFRESH_TOKEN_STORAGE_KEY, trimmed);
}

export function clearRefreshToken(): void {
  localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
  localStorageRepository.remove(REFRESH_LOCK_STORAGE_KEY);
}

export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === 401 || status === 422;
}

export function isForbiddenSessionError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isRecoverableSessionError(error: unknown): boolean {
  if (error instanceof SessionRestoreTimeoutError) {
    return true;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  const info = extractApiErrorInfo(error);
  const status = info.status;
  return (
    info.isTimeout ||
    info.isNetworkError ||
    !error.response ||
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  );
}

export function describeSessionRestoreError(
  error: unknown,
): SessionRestoreErrorInfo {
  if (error instanceof SessionRestoreTimeoutError) {
    return {
      message:
        "Pemulihan sesi melewati batas waktu. Sesi Anda tetap tersimpan. Periksa koneksi jaringan lalu coba lagi.",
      code: "SESSION_RESTORE_TIMEOUT",
      isOffline: true,
    };
  }

  const info = extractApiErrorInfo(error);

  if (info.status === 403) {
    return {
      message:
        info.message ??
        "Akun Anda tidak memiliki izin untuk mengakses ruang kerja ini.",
      code: info.code ?? "PERMISSION_DENIED",
      requestId: info.requestId,
      isOffline: false,
    };
  }

  if (info.isTimeout) {
    return {
      message:
        "Waktu tunggu koneksi ke server habis. Sesi Anda tetap tersimpan di perangkat ini. Silakan coba lagi.",
      code: info.code ?? "REQUEST_TIMEOUT",
      requestId: info.requestId,
      isOffline: true,
    };
  }

  if (info.isNetworkError || info.status === undefined) {
    return {
      message:
        "Server atau jaringan sedang tidak dapat dihubungi. Sesi Anda tetap disimpan. Coba lagi tanpa harus masuk ulang.",
      code: info.code ?? "NETWORK_ERROR",
      requestId: info.requestId,
      isOffline: true,
    };
  }

  if (info.status >= 500) {
    return {
      message:
        "Server sedang mengalami gangguan sementara. Sesi Anda tetap disimpan. Silakan coba lagi beberapa saat lagi.",
      code: info.code ?? "INTERNAL_ERROR",
      requestId: info.requestId,
      isOffline: false,
    };
  }

  return {
    message:
      info.message ?? "Sesi belum dapat dipulihkan saat ini. Silakan coba kembali.",
    code: info.code,
    requestId: info.requestId,
    isOffline: false,
  };
}
