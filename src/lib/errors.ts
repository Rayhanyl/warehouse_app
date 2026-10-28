import axios from "axios";

export interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      requestId?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export function extractRequestId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  const headers = error.response?.headers;
  if (!headers) {
    return undefined;
  }
  const value = headers["x-request-id"] ?? headers["X-Request-ID"];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function extractApiErrorInfo(error: unknown): {
  status?: number;
  code?: string;
  message?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  isTimeout: boolean;
  isNetworkError: boolean;
} {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      requestId: error.requestId,
      details: error.details,
      isTimeout: error.status === 408,
      isNetworkError: error.status === 0,
    };
  }

  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const status = error.response?.status;
    const envelope = error.response?.data?.error;
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      status === 408 ||
      (typeof error.message === "string" && error.message.toLowerCase().includes("timeout"));
    const isNetworkError = !error.response && !isTimeout;

    return {
      status,
      code: envelope?.code,
      message: envelope?.message,
      requestId: extractRequestId(error),
      details: envelope?.details,
      isTimeout,
      isNetworkError,
    };
  }

  if (error instanceof Error) {
    const isTimeout = error.name === "SessionRestoreTimeoutError";
    return {
      message: error.message,
      isTimeout,
      isNetworkError: false,
    };
  }

  return {
    isTimeout: false,
    isNetworkError: false,
  };
}
