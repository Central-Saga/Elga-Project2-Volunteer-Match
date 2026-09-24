"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type StudentProfile = {
  id: number;
  student_id?: string | null;
  study_program?: string | null;
};

type Project = {
  id: number;
  title: string;
};

type Application = {
  id: number;
  project?: Project | null;
  student_profile?: StudentProfile | null;
  studentProfile?: StudentProfile | null;
};

type Credential = {
  id: number;
  application_id: number;
  credential_number: string;
  title: string;
  issued_at: string;
  status: "active" | "revoked";
  revoked_at?: string | null;
  revocation_reason?: string | null;
  application?: Application | null;
};

type CredentialsResponse = {
  message: string;
  data: Credential[];
};

type RevokeResponse = {
  message: string;
  data: Credential;
};

const navigation = [
  { label: "Dashboard", href: "/admin" },
  { label: "NGO Verifications", href: "/admin/verifications" },
  { label: "Project Reviews", href: "/admin/projects" },
  { label: "Credentials", href: "/admin/credentials" },
];

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminCredentialsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const [revokingId, setRevokingId] =
    useState<number | null>(null);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [revocationReason, setRevocationReason] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    async function loadCredentials() {
      try {
        const response =
          await apiFetch<CredentialsResponse>(
            "/admin/credentials",
            {
              token: token ?? undefined,
            },
          );

        setCredentials(response.data);
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

  async function handleRevoke(
    credentialId: number,
  ) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (revocationReason.trim().length < 5) {
      setError(
        "Alasan revoke minimal 5 karakter.",
      );
      return;
    }

    setProcessingId(credentialId);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<RevokeResponse>(
          `/admin/credentials/${credentialId}/revoke`,
          {
            method: "POST",
            token,
            body: JSON.stringify({
              revocation_reason:
                revocationReason.trim(),
            }),
          },
        );

      setCredentials((current) =>
        current.map((credential) =>
          credential.id === credentialId
            ? {
                ...credential,
                ...response.data,
              }
            : credential,
        ),
      );

      setRevokingId(null);
      setRevocationReason("");
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal revoke credential.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan credentials...
        </p>
      </main>
    );
  }

  const activeCount = credentials.filter(
    (credential) =>
      credential.status === "active",
  ).length;

  const revokedCount = credentials.filter(
    (credential) =>
      credential.status === "revoked",
  ).length;

  return (
    <DashboardShell
      user={user}
      role="admin"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Credential Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Credentials
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Lihat credential volunteer yang sudah diterbitkan dan
            lakukan revoke jika diperlukan.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-700">
              Action completed
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Credentials"
            value={credentials.length}
          />

          <StatCard
            label="Active"
            value={activeCount}
          />

          <StatCard
            label="Revoked"
            value={revokedCount}
          />
        </section>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-4 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold text-gray-900">
              No credentials yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Belum ada credential yang diterbitkan.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {credentials.map((credential) => {
              const application =
                credential.application ?? null;

              const student =
                application?.student_profile ??
                application?.studentProfile ??
                null;

              const project =
                application?.project ?? null;

              return (
                <article
                  key={credential.id}
                  className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Credential #{credential.id}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-gray-900">
                        {credential.title}
                      </h2>

                      <p className="mt-1 break-all font-mono text-sm text-gray-500">
                        {credential.credential_number}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                        credential.status === "revoked"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {credential.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-2">
                    <Info
                      label="Student"
                      value={
                        student?.student_id
                          ? `Student ${student.student_id}`
                          : "-"
                      }
                    />

                    <Info
                      label="Study Program"
                      value={
                        student?.study_program || "-"
                      }
                    />

                    <Info
                      label="Project"
                      value={project?.title || "-"}
                    />

                    <Info
                      label="Issued"
                      value={formatDate(
                        credential.issued_at,
                      )}
                    />
                  </div>

                  {credential.status === "revoked" && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">
                      <p className="text-sm font-bold text-red-800">
                        Credential Revoked
                      </p>

                      <p className="mt-2 text-sm leading-6 text-red-700">
                        {credential.revocation_reason ||
                          "No reason provided."}
                      </p>

                      {credential.revoked_at && (
                        <p className="mt-2 text-xs text-red-500">
                          Revoked:{" "}
                          {formatDate(
                            credential.revoked_at,
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {credential.status === "active" &&
                    revokingId !== credential.id && (
                      <div className="mt-6 flex justify-end border-t border-black/5 pt-5">
                        <button
                          type="button"
                          onClick={() => {
                            setRevokingId(
                              credential.id,
                            );
                            setRevocationReason("");
                            setError("");
                            setSuccess("");
                          }}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Revoke Credential
                        </button>
                      </div>
                    )}

                  {credential.status === "active" &&
                    revokingId === credential.id && (
                      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                        <label className="text-sm font-semibold text-red-800">
                          Revocation Reason
                        </label>

                        <textarea
                          rows={4}
                          maxLength={2000}
                          value={revocationReason}
                          onChange={(event) =>
                            setRevocationReason(
                              event.target.value,
                            )
                          }
                          placeholder="Jelaskan alasan credential dicabut..."
                          className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none"
                        />

                        <p className="mt-2 text-xs text-red-500">
                          Minimal 5 karakter.
                        </p>

                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingId(null);
                              setRevocationReason("");
                            }}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={
                              processingId ===
                              credential.id
                            }
                            onClick={() =>
                              handleRevoke(
                                credential.id,
                              )
                            }
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {processingId ===
                            credential.id
                              ? "Revoking..."
                              : "Confirm Revoke"}
                          </button>
                        </div>
                      </div>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}