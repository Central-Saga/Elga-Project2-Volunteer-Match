"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type Student = {
  nim?: string | null;
  study_program?: string | null;
  campus_id?: number | null;
};

type Project = {
  id?: number;
  title?: string | null;
  location?: string | null;
};

type CredentialData = {
  credential_number?: string;
  title?: string | null;
  issued_at?: string | null;
  status?: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  student?: Student | null;
  project?: Project | null;
};

type VerifyResponse = {
  valid: boolean;
  message: string;
  data?: CredentialData;
};

const navigation = [
  { label: "Dashboard", href: "/campus" },
  { label: "Credentials", href: "/campus/credentials" },
  { label: "Verify Credential", href: "/campus/verify" },
  { label: "Reports", href: "/campus/reports" },
  { label: "Profile", href: "/campus/profile" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function CampusVerifyPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [credentialNumber, setCredentialNumber] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const token = getStoredToken();
  const storedUser = getStoredUser();

  if (!token || !storedUser) {
    router.replace("/login");
    return;
  }

  if (storedUser.role !== "campus") {
    router.replace("/");
    return;
  }

  setUser(storedUser);
}, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "campus") {
      router.replace("/");
      return;
    }

    if (!credentialNumber.trim()) {
      setError("Credential number wajib diisi.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiFetch<VerifyResponse>(
        `/campus/credentials/verify/${encodeURIComponent(
          credentialNumber.trim(),
        )}`,
        {
          token,
        },
      );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi credential.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan halaman verifikasi...
        </p>
      </main>
    );
  }

  const credential = result?.data;
  const isRevoked =
    credential?.status === "revoked" || result?.valid === false;

  return (
    <DashboardShell
      user={user}
      role="campus"
      navigation={navigation}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Credential Verification
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Verify Student Credential
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Masukkan nomor credential untuk memeriksa status dan detail
            aktivitas volunteer mahasiswa.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 md:flex-row"
          >
            <input
              type="text"
              value={credentialNumber}
              onChange={(event) =>
                setCredentialNumber(event.target.value)
              }
              placeholder="Contoh: VM-20260924-ABC12345"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Credential"}
            </button>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-semibold text-red-700">
                Verification failed
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          )}
        </section>

        {result && (
          <section
            className={`rounded-[2rem] border p-7 shadow-sm ${
              isRevoked
                ? "border-red-200 bg-red-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                    isRevoked
                      ? "text-red-500"
                      : "text-emerald-600"
                  }`}
                >
                  {isRevoked
                    ? "Credential Revoked"
                    : "Credential Valid"}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {credential?.title ?? "Volunteer Credential"}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {result.message}
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                  isRevoked
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {credential?.status ??
                  (result.valid ? "active" : "invalid")}
              </span>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Credential Number
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {credential?.credential_number ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  NIM
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {credential?.student?.nim ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Study Program
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {credential?.student?.study_program ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Project
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {credential?.project?.title ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Location
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {credential?.project?.location ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Issued Date
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatDate(credential?.issued_at)}
                </p>
              </div>
            </div>

            {isRevoked && credential?.revocation_reason && (
              <div className="mt-6 rounded-2xl bg-white/70 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                  Revocation Reason
                </p>

                <p className="mt-2 text-sm text-red-700">
                  {credential.revocation_reason}
                </p>

                <p className="mt-2 text-xs text-red-500">
                  Revoked at: {formatDate(credential.revoked_at)}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}