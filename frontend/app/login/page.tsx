"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type LoginResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "student" | "ngo" | "campus" | "admin";
  };
  token: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));

      switch (result.user.role) {
        case "student":
          router.push("/student");
          break;

        case "ngo":
          router.push("/ngo");
          break;

        case "campus":
          router.push("/campus");
          break;

        case "admin":
          router.push("/admin");
          break;

        default:
          router.push("/");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Volunteer Match
          </h1>

          <p className="mt-2 text-gray-600">
            Login ke akun kamu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}