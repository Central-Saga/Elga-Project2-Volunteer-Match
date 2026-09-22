export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "ngo" | "campus" | "admin";
};

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("auth_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token");
}

export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}