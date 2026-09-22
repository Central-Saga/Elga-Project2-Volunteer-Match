"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, type AuthUser } from "@/lib/auth";

type Credential = {
  id: number;
  application_id: number;
  credential_number: string;
  title: string;
  issued_at: string;
  status: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
};

export default function StudentCredentialDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigation = [
    { label: "Explore", href: "/student" },
    { label: "My Applications", href: "/student/applications" },
    { label: "My Activity", href: "/student/activity" },
    { label: "Credentials", href: "/student/credentials" },
    { label: "Profile", href: "/student/profile" },
  ];

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();

    setUser(storedUser);

    if (!token) {
      setError("Session tidak ditemukan.");
      setLoading(false);
      return;
    }

    apiFetch<Credential>(
      `/student/applications/${applicationId}/credential`,
      {
        token: token ?? undefined,
      }
    )
      .then((data) => {
        setCredential(data);
      })
      .catch((err) => {
        setError(err.message || "Credential tidak dapat dimuat.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading user...
        </p>
      </div>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
      navigation={navigation}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/student/credentials"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to Credentials
          </Link>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Credential Details
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Volunteer Credential
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              Credential resmi yang diterbitkan setelah aktivitas volunteer
              selesai dan dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-6 w-48 rounded bg-slate-200" />

            <div className="mt-6 h-24 rounded-2xl bg-slate-100" />

            <div className="mt-4 h-16 rounded-2xl bg-slate-100" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {/* Credential */}
        {!loading && !error && credential && (
          <>
            <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
              <div className="relative p-8 sm:p-10">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/60">
                        Volunteer Match
                      </p>

                      <h2 className="mt-3 text-3xl font-semibold">
                        {credential.title}
                      </h2>

                      <p className="mt-3 max-w-xl text-white/60">
                        Bukti digital partisipasi volunteer yang dapat
                        diverifikasi.
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                        credential.status === "revoked"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {credential.status === "revoked"
                        ? "Revoked"
                        : "Active"}
                    </span>
                  </div>

                  <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                      Credential Number
                    </p>

                    <p className="mt-2 break-all font-mono text-lg font-medium">
                      {credential.credential_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-400">
                  Issued Date
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {new Date(
                    credential.issued_at
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-400">
                  Credential Status
                </p>

                <p className="mt-2 text-lg font-semibold capitalize text-slate-900">
                  {credential.status}
                </p>
              </div>
            </div>

            {/* Revoked information */}
            {credential.status === "revoked" && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-semibold text-red-800">
                  Credential Revoked
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {credential.revocation_reason ||
                    "Credential ini telah dicabut."}
                </p>

                {credential.revoked_at && (
                  <p className="mt-3 text-xs text-red-500">
                    Revoked at:{" "}
                    {new Date(
                      credential.revoked_at
                    ).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/credentials/verify/${credential.credential_number}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Verify Credential
              </Link>

              <Link
                href="/student/credentials"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Credentials
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}