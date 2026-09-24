"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type NgoVerification = {
  id: number;
  status?: string;
};

type Project = {
  id: number;
  title?: string | null;
  status?: string;
};

type Credential = {
  id: number;
  credential_number?: string;
  status: string;
};

type NgoVerificationResponse = {
  message: string;
  data: NgoVerification[];
};

type ProjectResponse = {
  message: string;
  data: Project[];
};

type CredentialResponse = {
  message: string;
  data: Credential[];
};

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "NGO Verifications",
    href: "/admin/verifications",
  },
  {
    label: "Projects",
    href: "/admin/projects",
  },
  {
    label: "Credentials",
    href: "/admin/credentials",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [verifications, setVerifications] = useState<
    NgoVerification[]
  >([]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "admin") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadDashboard(authToken: string) {
      try {
        const [
          verificationResponse,
          projectResponse,
          credentialResponse,
        ] = await Promise.all([
          apiFetch<NgoVerificationResponse>(
            "/admin/ngos/verifications",
            {
              token: authToken,
            },
          ),

          apiFetch<ProjectResponse>(
            "/admin/projects/submitted",
            {
              token: authToken,
            },
          ),

          apiFetch<CredentialResponse>(
            "/admin/credentials",
            {
              token: authToken,
            },
          ),
        ]);

        setVerifications(verificationResponse.data);
        setProjects(projectResponse.data);
        setCredentials(credentialResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data dashboard Admin.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard(token);
  }, [router]);

  const activeCredentials = useMemo(() => {
    return credentials.filter(
      (credential) => credential.status === "active",
    ).length;
  }, [credentials]);

  const revokedCredentials = useMemo(() => {
    return credentials.filter(
      (credential) => credential.status === "revoked",
    ).length;
  }, [credentials]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan admin dashboard...
        </p>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="admin"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HERO */}
        <section className="rounded-[2rem] bg-gray-900 p-8 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Volunteer Match Administration
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Kelola verifikasi NGO, review project volunteer,
            serta monitor dan mengelola credential mahasiswa.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/verifications")
              }
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Review NGO
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/projects")
              }
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Review Projects
            </button>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Dashboard error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              />
            ))}
          </section>
        ) : (
          <>
            {/* STATS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Pending NGO
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {verifications.length}
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Verifikasi NGO yang menunggu review.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Submitted Projects
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {projects.length}
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Project yang menunggu persetujuan.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Total Credentials
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {credentials.length}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/credentials")
                  }
                  className="mt-4 text-sm font-semibold text-gray-700 transition hover:text-gray-900"
                >
                  View credentials →
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Active Credentials
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {activeCredentials}
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Credential yang masih aktif.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Revoked Credentials
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {revokedCredentials}
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Credential yang sudah dicabut.
                </p>
              </div>
            </section>

            {/* REVIEW OVERVIEW */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  NGO Verification
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Pending Verifications
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Review NGO yang telah mengirimkan permintaan
                      verifikasi sebelum mereka dapat menjalankan
                      project volunteer.
                    </p>
                  </div>

                  <p className="text-4xl font-bold text-gray-900">
                    {verifications.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/verifications")
                  }
                  className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Open NGO Verifications
                </button>
              </div>

              <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Project Review
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Submitted Projects
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Periksa project volunteer dari NGO sebelum
                      project dipublikasikan kepada mahasiswa.
                    </p>
                  </div>

                  <p className="text-4xl font-bold text-gray-900">
                    {projects.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/projects")
                  }
                  className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Open Project Reviews
                </button>
              </div>
            </section>

            {/* CREDENTIAL SUMMARY */}
            <section className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Credential Management
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-gray-900">
                    Credential Overview
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    Monitor credential volunteer yang telah
                    diterbitkan dan lakukan revoke jika diperlukan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/credentials")
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Manage Credentials
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {credentials.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Active
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {activeCredentials}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Revoked
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {revokedCredentials}
                  </p>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Quick Actions
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-900">
                Administration Tools
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/verifications")
                  }
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Review NGO
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Approve atau reject pengajuan verifikasi NGO.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/projects")
                  }
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Review Projects
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Approve dan publish project volunteer NGO.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/credentials")
                  }
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Manage Credentials
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Monitor status credential dan lakukan revoke.
                  </p>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}