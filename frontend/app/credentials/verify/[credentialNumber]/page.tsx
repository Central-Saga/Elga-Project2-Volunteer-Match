"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api";

type Student = {
  name?: string | null;
  nim?: string | null;
  study_program?: string | null;
  campus?: string | null;
};

type Project = {
  id?: number | null;
  title?: string | null;
  location?: string | null;
};

type Credential = {
  id?: number;
  application_id?: number;
  credential_number?: string;
  title?: string;
  issued_at?: string;
  status?: string;

  revoked_at?: string | null;

  revocation_reason?:
    | string
    | null;

  student?: Student | null;
  project?: Project | null;
};

type VerifyResponse = {
  message?: string;

  valid?: boolean;
  verified?: boolean;
  active?: boolean;
  revoked?: boolean;

  credential?: Credential;
  data?: Credential;

  [key: string]: unknown;
};

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  return new Date(
    value,
  ).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

export default function CredentialVerificationPage() {
  const params = useParams();

  const credentialNumber =
    decodeURIComponent(
      params
        .credentialNumber as string,
    );

  const [
    credential,
    setCredential,
  ] =
    useState<Credential | null>(
      null,
    );

  const [
    active,
    setActive,
  ] = useState(false);

  const [
    revoked,
    setRevoked,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!credentialNumber) {
      setError(
        "Credential number tidak ditemukan.",
      );

      setLoading(false);

      return;
    }

    apiFetch<VerifyResponse>(
      `/credentials/verify/${encodeURIComponent(
        credentialNumber,
      )}`,
    )
      .then((response) => {
        const credentialData =
          response.credential ||
          response.data ||
          ({
            credential_number:
              response.credential_number as
                | string
                | undefined,

            title:
              response.title as
                | string
                | undefined,

            issued_at:
              response.issued_at as
                | string
                | undefined,

            status:
              response.status as
                | string
                | undefined,

            revoked_at:
              response.revoked_at as
                | string
                | null
                | undefined,

            revocation_reason:
              response.revocation_reason as
                | string
                | null
                | undefined,
          } satisfies Credential);

        setCredential(
          credentialData,
        );

        const isRevoked =
          response.revoked ===
            true ||
          credentialData.status ===
            "revoked";

        const isActive =
          !isRevoked &&
          (response.active ===
            true ||
            response.valid ===
              true ||
            credentialData.status ===
              "active");

        setRevoked(
          isRevoked,
        );

        setActive(
          isActive,
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Credential tidak ditemukan atau tidak valid.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [credentialNumber]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">

        {/* BRAND */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-slate-900"
          >
            VOLUNTEER MATCH
          </Link>
        </div>

        {/* HEADER */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Public Verification
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Credential Verification
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Verifikasi keaslian
            credential volunteer yang
            diterbitkan oleh Volunteer
            Match.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-200" />

              <div className="mx-auto mt-5 h-6 w-64 rounded bg-slate-200" />

              <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-24 rounded-2xl bg-slate-100"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading &&
          error && (
            <div className="mt-10 rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
                !
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-semibold text-slate-900">
                  Credential Not Found
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Credential dengan nomor
                  berikut tidak dapat
                  diverifikasi.
                </p>

                <div className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 px-5 py-4">
                  <p className="break-all font-mono text-sm font-medium text-slate-700">
                    {
                      credentialNumber
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* CREDENTIAL */}
        {!loading &&
          !error &&
          credential && (
            <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

              {/* STATUS */}
              <div
                className={`px-6 py-9 sm:px-10 ${
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
                    {active
                      ? "✓"
                      : "!"}
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
                      : revoked
                        ? "Credential Revoked"
                        : "Credential Invalid"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {credential.title ||
                      "Volunteer Credential"}
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    {active
                      ? "Credential ini terdaftar dan statusnya masih aktif."
                      : revoked
                        ? "Credential ini terdaftar, tetapi telah dicabut dan tidak lagi aktif."
                        : "Credential ini tidak aktif."}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-10">

                {/* STUDENT IDENTITY */}
                <section>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Credential Holder
                  </p>

                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Student Information
                  </h3>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoCard
                      label="Student Name"
                      value={
                        credential
                          .student
                          ?.name ??
                        "-"
                      }
                    />

                    <InfoCard
                      label="NIM"
                      value={
                        credential
                          .student
                          ?.nim ??
                        "-"
                      }
                    />

                    <InfoCard
                      label="Study Program"
                      value={
                        credential
                          .student
                          ?.study_program ??
                        "-"
                      }
                    />

                    <InfoCard
                      label="Campus"
                      value={
                        credential
                          .student
                          ?.campus ??
                        "-"
                      }
                    />
                  </div>
                </section>

                {/* PROJECT */}
                <section className="mt-8 border-t border-slate-100 pt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Volunteer Activity
                  </p>

                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Project Information
                  </h3>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Project
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {credential
                        .project
                        ?.title ??
                        "-"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <div>
                        <span className="font-medium text-slate-400">
                          Location:
                        </span>{" "}
                        <span className="font-semibold text-slate-700">
                          {credential
                            .project
                            ?.location ??
                            "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* CREDENTIAL DETAILS */}
                <section className="mt-8 border-t border-slate-100 pt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Credential Details
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoCard
                      label="Credential Number"
                      value={
                        credential
                          .credential_number ||
                        credentialNumber
                      }
                      mono
                    />

                    <InfoCard
                      label="Status"
                      value={
                        active
                          ? "Active"
                          : revoked
                            ? "Revoked"
                            : "Inactive"
                      }
                      status={
                        active
                          ? "active"
                          : "revoked"
                      }
                    />

                    <InfoCard
                      label="Issued Date"
                      value={formatDate(
                        credential
                          .issued_at,
                      )}
                    />

                    <InfoCard
                      label="Application ID"
                      value={
                        credential
                          .application_id !==
                          null &&
                        credential
                          .application_id !==
                          undefined
                          ? String(
                              credential
                                .application_id,
                            )
                          : "-"
                      }
                    />
                  </div>
                </section>

                {/* REVOCATION */}
                {revoked &&
                  credential.revocation_reason && (
                    <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                      <p className="text-sm font-semibold text-red-800">
                        Revocation
                        Information
                      </p>

                      <p className="mt-2 text-sm leading-6 text-red-700">
                        {
                          credential.revocation_reason
                        }
                      </p>

                      {credential.revoked_at && (
                        <p className="mt-3 text-xs text-red-500">
                          Revoked at:{" "}
                          {new Date(
                            credential.revoked_at,
                          ).toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      )}
                    </section>
                  )}
              </div>
            </div>
          )}

        {/* FOOTER */}
        <div className="mt-8 text-center">
          <p className="text-xs leading-5 text-slate-400">
            Volunteer Match · Digital
            Volunteer Credential
            Verification
          </p>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
  mono = false,
  status,
}: {
  label: string;
  value: string;
  mono?: boolean;

  status?:
    | "active"
    | "revoked";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-semibold ${
          mono
            ? "font-mono"
            : ""
        } ${
          status === "active"
            ? "text-emerald-700"
            : status === "revoked"
              ? "text-red-700"
              : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}