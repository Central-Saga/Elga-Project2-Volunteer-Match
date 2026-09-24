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

type StudentProfile = {
  nim?: string | null;
  study_program?: string | null;
};

type Project = {
  id: number;
  title: string;
  location?: string | null;
};

type Application = {
  id: number;
  project?: Project | null;
  student_profile?: StudentProfile | null;
};

type Credential = {
  id: number;
  credential_number: string;
  title?: string | null;
  issued_at?: string | null;
  status: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  application?: Application | null;
};

type CredentialResponse = {
  message: string;
  data: Credential[];
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

export default function CampusCredentialsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

    async function loadCredentials() {
      try {
        const response = await apiFetch<CredentialResponse>(
          "/campus/credentials",
          {
            token: token ?? undefined,
          },
        );

        setCredentials(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data credentials.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCredentials();
  }, [router]);

  const filteredCredentials = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return credentials;

    return credentials.filter((credential) => {
      const studentId =
        credential.application?.student_profile?.nim ?? "";

      const studyProgram =
        credential.application?.student_profile?.study_program ?? "";

      const projectTitle =
        credential.application?.project?.title ?? "";

      return (
        credential.credential_number.toLowerCase().includes(keyword) ||
        credential.title?.toLowerCase().includes(keyword) ||
        studentId.toLowerCase().includes(keyword) ||
        studyProgram.toLowerCase().includes(keyword) ||
        projectTitle.toLowerCase().includes(keyword)
      );
    });
  }, [credentials, search]);

  const totalActive = credentials.filter(
    (credential) => credential.status === "active",
  ).length;

  const totalRevoked = credentials.filter(
    (credential) => credential.status === "revoked",
  ).length;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan credentials...
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
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Campus Monitoring
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Student Credentials
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Lihat credential volunteer mahasiswa yang terhubung dengan kampus.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">
              Total Credentials
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {credentials.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">
              Active
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalActive}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">
              Revoked
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalRevoked}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Credential List
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Cari berdasarkan credential, NIM, program studi, atau project.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search credential..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 md:max-w-sm"
            />
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Belum ada credential yang ditemukan.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredCredentials.map((credential) => {
                const application = credential.application;
                const student = application?.student_profile;
                const project = application?.project;

                return (
                  <div
                    key={credential.id}
                    className="rounded-2xl border border-gray-100 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900">
                            {credential.title ??
                              "Volunteer Credential"}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              credential.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {credential.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-medium text-gray-700">
                          {credential.credential_number}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              NIM
                            </p>
                            <p className="mt-1 font-medium text-gray-700">
                              {student?.nim ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              Study Program
                            </p>
                            <p className="mt-1 font-medium text-gray-700">
                              {student?.study_program ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              Project
                            </p>
                            <p className="mt-1 font-medium text-gray-700">
                              {project?.title ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              Issued Date
                            </p>
                            <p className="mt-1 font-medium text-gray-700">
                              {formatDate(credential.issued_at)}
                            </p>
                          </div>
                        </div>

                        {credential.status === "revoked" &&
                          credential.revocation_reason && (
                            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                                Revocation Reason
                              </p>

                              <p className="mt-1 text-sm text-red-700">
                                {credential.revocation_reason}
                              </p>
                            </div>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/credentials/verify/${credential.credential_number}`,
                          )
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Verify Credential
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}