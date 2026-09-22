"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api";

type Credential = {
  id?: number;
  application_id?: number;
  credential_number?: string;
  title?: string;
  issued_at?: string;
  status?: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
};

type VerifyResponse = {
  message?: string;
  verified?: boolean;
  active?: boolean;
  revoked?: boolean;
  credential?: Credential;
  data?: Credential;
  [key: string]: unknown;
};

export default function CredentialVerificationPage() {
  const params = useParams();

  const credentialNumber = decodeURIComponent(
    params.credentialNumber as string
  );

  const [credential, setCredential] = useState<Credential | null>(null);
  const [verified, setVerified] = useState(false);
  const [active, setActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!credentialNumber) {
      setError("Credential number tidak ditemukan.");
      setLoading(false);
      return;
    }

    apiFetch<VerifyResponse>(
      `/credentials/verify/${encodeURIComponent(credentialNumber)}`
    )
      .then((response) => {
        const credentialData =
          response.credential ||
          response.data ||
          ({
            credential_number: response.credential_number as
              | string
              | undefined,
            title: response.title as string | undefined,
            issued_at: response.issued_at as string | undefined,
            status: response.status as string | undefined,
            revoked_at: response.revoked_at as string | null | undefined,
            revocation_reason: response.revocation_reason as
              | string
              | null
              | undefined,
          } satisfies Credential);

        setCredential(credentialData);

        const isRevoked =
          response.revoked === true ||
          credentialData.status === "revoked";

        const isActive =
          response.active === true ||
          response.verified === true ||
          (!isRevoked &&
            credentialData.status !== undefined &&
            credentialData.status !== "revoked");

        setVerified(response.verified === true || !isRevoked);
        setActive(isActive);
      })
      .catch((err) => {
        setError(
          err.message || "Credential tidak ditemukan atau tidak valid."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [credentialNumber]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-slate-900"
          >
            VOLUNTEER MATCH
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Public Verification
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Credential Verification
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Halaman ini digunakan untuk memverifikasi keaslian credential
            volunteer yang diterbitkan oleh Volunteer Match.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-200" />

              <div className="mx-auto mt-5 h-6 w-64 rounded bg-slate-200" />

              <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />

              <div className="mt-8 h-20 rounded-2xl bg-slate-100" />

              <div className="mt-4 h-20 rounded-2xl bg-slate-100" />
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
              !
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                Credential Not Found
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Credential dengan nomor berikut tidak dapat diverifikasi:
              </p>

              <div className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 px-5 py-4">
                <p className="break-all font-mono text-sm font-medium text-slate-700">
                  {credentialNumber}
                </p>
              </div>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Verified */}
        {!loading && !error && credential && (
          <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            {/* Status */}
            <div
              className={`px-6 py-8 sm:px-10 ${
                active
                  ? "bg-emerald-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                    active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {active ? "✓" : "!"}
                </div>

                <p
                  className={`mt-5 text-xs font-bold uppercase tracking-[0.18em] ${
                    active
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {active
                    ? "Credential Verified"
                    : verified
                      ? "Credential Revoked"
                      : "Credential Invalid"}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {credential.title || "Volunteer Credential"}
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {active
                    ? "Credential ini terdaftar dan statusnya masih aktif."
                    : "Credential ini terdaftar tetapi saat ini tidak aktif."}
                </p>
              </div>
            </div>

            {/* Credential information */}
            <div className="p-6 sm:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Credential Number
                  </p>

                  <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                    {credential.credential_number || credentialNumber}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Status
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      active
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {active ? "Active" : "Revoked / Inactive"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Issued Date
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {credential.issued_at
                      ? new Date(
                          credential.issued_at
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Application ID
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {credential.application_id ?? "-"}
                  </p>
                </div>
              </div>

              {/* Revocation information */}
              {!active && credential.revocation_reason && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-800">
                    Revocation Reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {credential.revocation_reason}
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
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs leading-5 text-slate-400">
            Volunteer Match · Digital Volunteer Credential Verification
          </p>
        </div>
      </div>
    </main>
  );
}