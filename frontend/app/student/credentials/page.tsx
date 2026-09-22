"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

type Application = {
  id: number;
  project_id: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  project: {
    id: number;
    title: string;
    location: string | null;
    start_at: string;
    end_at: string;
  };
};

type Credential = {
  id: number;
  application_id: number;
  credential_number: string;
  title: string;
  issued_at: string;
  status: "active" | "revoked";
  revoked_at: string | null;
  revocation_reason: string | null;
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type CredentialResponse = {
  message: string;
  data: Credential;
};

type CredentialItem = {
  credential: Credential;
  project: Application["project"];
};

const navigation = [
  {
    label: "Explore",
    href: "/student",
  },
  {
    label: "My Applications",
    href: "/student/applications",
  },
  {
    label: "My Activity",
    href: "/student/activity",
  },
  {
    label: "Credentials",
    href: "/student/credentials",
  },
  {
    label: "Profile",
    href: "/student/profile",
  },
];

export default function StudentCredentialsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "student") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadCredentials() {
      try {
        const applicationResult =
          await apiFetch<ApplicationsResponse>(
            "/student/applications",
            {
              token: token ?? undefined,
            },
          );

        const results = await Promise.all(
          applicationResult.data.map(async (application) => {
            try {
              const credentialResult =
                await apiFetch<CredentialResponse>(
                  `/student/applications/${application.id}/credential`,
                  {
                    token: token ?? undefined,
                  },
                );

              return {
                credential: credentialResult.data,
                project: application.project,
              };
            } catch {
              return null;
            }
          }),
        );

        setCredentials(
          results.filter(
            (item): item is CredentialItem => item !== null,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil credential.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCredentials();
  }, [router]);

  async function copyCredential(
    credentialNumber: string,
    credentialId: number,
  ) {
    try {
      await navigator.clipboard.writeText(credentialNumber);

      setCopiedId(credentialId);

      setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch {
      setError("Credential number gagal disalin.");
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan credential...
        </p>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
      navigation={navigation}
    >
      <div className="max-w-6xl">
        {/* Heading */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Verified achievements
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Credentials
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Kumpulan credential volunteer yang telah kamu
            peroleh melalui kegiatan yang sudah diselesaikan.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="h-52 bg-gray-200" />

                <div className="space-y-4 p-6">
                  <div className="h-5 w-1/2 rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-12 rounded-2xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">
              Gagal memuat credential
            </p>

            <p className="mt-1 text-sm leading-6 text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          credentials.length === 0 && (
            <div className="mt-8 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="text-gray-500"
                >
                  <path d="M7 3h10a2 2 0 0 1 2 2v14l-7-3-7 3V5a2 2 0 0 1 2-2Z" />
                </svg>
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Belum ada credential
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Credential akan muncul setelah kamu menyelesaikan
                kegiatan volunteer dan credential diterbitkan.
              </p>

              <button
                onClick={() => router.push("/student")}
                className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Explore Projects
              </button>
            </div>
          )}

        {/* Credential cards */}
        {!loading &&
          !error &&
          credentials.length > 0 && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {credentials.map(
                ({ credential, project }) => (
                  <article
                    key={credential.id}
                    className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Credential visual */}
                    <div className="relative overflow-hidden bg-gray-900 px-6 py-7 text-white">
                      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10" />

                      <div className="absolute -bottom-24 left-12 h-44 w-44 rounded-full border border-white/10" />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                              Volunteer Match
                            </p>

                            <h2 className="mt-3 text-2xl font-bold tracking-tight">
                              {credential.title}
                            </h2>
                          </div>

                          <div
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              credential.status ===
                              "active"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-red-400/10 text-red-300"
                            }`}
                          >
                            {credential.status}
                          </div>
                        </div>

                        <div className="mt-9">
                          <p className="text-xs text-white/45">
                            Credential Number
                          </p>

                          <p className="mt-2 break-all font-mono text-lg font-semibold tracking-wide">
                            {credential.credential_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        Activity
                      </p>

                      <h3 className="mt-2 text-xl font-bold tracking-tight">
                        {project.title}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-gray-500">
                        <p>
                          <span className="font-medium text-gray-900">
                            Location:
                          </span>{" "}
                          {project.location ??
                            "Location not specified"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-900">
                            Issued:
                          </span>{" "}
                          {new Date(
                            credential.issued_at,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {credential.status === "revoked" && (
                        <div className="mt-5 rounded-2xl bg-red-50 p-4">
                          <p className="text-xs font-semibold text-red-700">
                            Credential revoked
                          </p>

                          {credential.revocation_reason && (
                            <p className="mt-1 text-sm leading-6 text-red-600">
                              {credential.revocation_reason}
                            </p>
                          )}

                          {credential.revoked_at && (
                            <p className="mt-2 text-xs text-red-500">
                              Revoked on{" "}
                              {new Date(
                                credential.revoked_at,
                              ).toLocaleDateString("id-ID")}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() =>
                            copyCredential(
                              credential.credential_number,
                              credential.id,
                            )
                          }
                          className="rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          {copiedId === credential.id
                            ? "Copied ✓"
                            : "Copy Number"}
                        </button>

                        <button
                          onClick={() =>
                            router.push(
                              `/student/applications/${credential.application_id}/credential`,
                            )
                          }
                          className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
      </div>
    </DashboardShell>
  );
}