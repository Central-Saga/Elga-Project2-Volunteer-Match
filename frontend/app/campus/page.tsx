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

type Campus = {
  id: number;
  name: string;
};

type CampusProfile = {
  id: number;
  user_id: number;
  campus_id: number;
  position?: string | null;
  campus?: Campus | null;
};

type ProfileResponse = {
  profile: CampusProfile | null;
};

type Credential = {
  id: number;
  credential_number: string;
  status: string;
};

type CredentialResponse = {
  message: string;
  data: Credential[];
};

type ReportMeta = {
  total_records: number;
  total_hours: number;
};

type ReportResponse = {
  message: string;
  data: unknown[];
  meta: ReportMeta;
};

const navigation = [
  { label: "Dashboard", href: "/campus" },
  { label: "Credentials", href: "/campus/credentials" },
  { label: "Verify Credential", href: "/campus/verify" },
  { label: "Reports", href: "/campus/reports" },
  { label: "Profile", href: "/campus/profile" },
];

export default function CampusDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [reportMeta, setReportMeta] = useState<ReportMeta>({
    total_records: 0,
    total_hours: 0,
  });

  const [loading, setLoading] = useState(true);
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

    async function loadDashboard(authToken: string) {
      try {
        const [
          profileResponse,
          credentialResponse,
          reportResponse,
        ] = await Promise.all([
          apiFetch<ProfileResponse>("/campus/profile", {
            token: authToken,
          }),

          apiFetch<CredentialResponse>("/campus/credentials", {
            token: authToken,
          }),

          apiFetch<ReportResponse>(
            "/campus/reports/volunteer-activities",
            {
              token: authToken,
            },
          ),
        ]);

        setProfile(profileResponse.profile);
        setCredentials(credentialResponse.data);
        setReportMeta(reportResponse.meta);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data dashboard Campus.",
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
          Menyiapkan campus dashboard...
        </p>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="campus"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] bg-gray-900 p-8 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Campus Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {profile?.campus?.name ?? "Campus Volunteer Monitoring"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Pantau credential mahasiswa, aktivitas volunteer,
            total jam kegiatan, dan validitas credential dalam
            satu dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/campus/verify")}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Verify Credential
            </button>

            <button
              type="button"
              onClick={() => router.push("/campus/reports")}
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Reports
            </button>
          </div>
        </section>

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

        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              />
            ))}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Total Credentials
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {credentials.length}
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/campus/credentials")}
                  className="mt-4 text-sm font-semibold text-gray-700 hover:text-gray-900"
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
                  Credential mahasiswa yang masih valid.
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
                  Credential yang sudah dicabut oleh admin.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-500">
                  Volunteer Hours
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {Number(reportMeta.total_hours ?? 0).toFixed(1)}
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Total jam dari aktivitas volunteer yang tercatat.
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Campus Overview
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  Volunteer Activity Summary
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Activity Records
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {reportMeta.total_records}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Total Hours
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {Number(reportMeta.total_hours ?? 0).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/campus/reports")}
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Open Reports
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/campus/credentials")
                    }
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    View Credentials
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Campus Profile
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  {profile?.campus?.name ?? "Profile belum lengkap"}
                </h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Campus ID
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {profile?.campus_id ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Position
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {profile?.position ?? "-"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/campus/profile")}
                  className="mt-7 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Manage Profile
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Quick Actions
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-900">
                Campus Tools
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => router.push("/campus/verify")}
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Verify Credential
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Periksa keaslian dan status credential mahasiswa.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/campus/reports")}
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Volunteer Reports
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Pantau aktivitas dan jam volunteer mahasiswa.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/campus/credentials")
                  }
                  className="rounded-2xl border border-gray-100 p-5 text-left transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-900">
                    Student Credentials
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Lihat seluruh credential mahasiswa kampus.
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