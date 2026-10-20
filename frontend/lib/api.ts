
import { getStoredToken, logoutUser } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

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
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}
