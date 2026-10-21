
import { getStoredToken, logoutUser } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

// Consumers can inspect status / fieldErrors while existing Error UI still works.
export class ApiHttpError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]>) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  const data = await response.json().catch(() => null);

  // Handle expired or invalid authenticated sessions
  if (response.status === 401 && token) {
    if (
      typeof window !== "undefined" &&
      getStoredToken() === token
    ) {
      logoutUser();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
  }

  if (!response.ok) {
    const payload: Record<string, unknown> =
      data !== null && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    const fieldErrors: Record<string, string[]> = {};
    const rawErrors = payload.errors;

    if (rawErrors && typeof rawErrors === "object" && !Array.isArray(rawErrors)) {
      for (const [field, messages] of Object.entries(rawErrors)) {
        if (Array.isArray(messages)) {
          const validMessages = messages.filter(
            (value): value is string => typeof value === "string",
          );
          if (validMessages.length > 0) fieldErrors[field] = validMessages;
        } else if (typeof messages === "string") {
          fieldErrors[field] = [messages];
        }
      }
    }

    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : Object.values(fieldErrors)[0]?.[0] ??
          `Request failed with status ${response.status}`;

    throw new ApiHttpError(response.status, message, fieldErrors);
  }

  return data as T;
}
