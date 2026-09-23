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

type VerificationRecord = {
  id: number;
  ngo_id: number;
  reviewer_id?: number | null;
  status: string;
  notes?: string | null;
  evidence_reference?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type VerificationResponse = {
  verification_status?: string | null;
  verification_tier?: string | null;
  verification?: VerificationRecord | null;
};

type SubmitResponse = {
  message: string;
  verification: VerificationRecord;
};

const navigation = [
  { label: "Dashboard", href: "/ngo" },
  { label: "Projects", href: "/ngo/projects" },
  { label: "Applications", href: "/ngo/applications" },
  { label: "Verification", href: "/ngo/verification" },
  { label: "Profile", href: "/ngo/profile" },
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

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "reviewing":
      return "Reviewing";
    case "needs_info":
      return "Needs Info";
    default:
      return status || "Not Submitted";
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "submitted":
    case "reviewing":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";

    case "needs_info":
      return "bg-orange-50 text-orange-700 ring-orange-200";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

export default function NgoVerificationPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [verificationStatus, setVerificationStatus] =
    useState<string>("not_submitted");

  const [verificationTier, setVerificationTier] =
    useState<string | null>(null);

  const [verification, setVerification] =
    useState<VerificationRecord | null>(null);

  const [evidenceReference, setEvidenceReference] =
    useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "ngo") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadVerification() {
      try {
        const response =
          await apiFetch<VerificationResponse>(
            "/ngo/verification",
            {
              token: token ?? undefined,
            }
          );

        setVerificationStatus(
          response.verification_status ??
            response.verification?.status ??
            "not_submitted"
        );

        setVerificationTier(
          response.verification_tier ?? null
        );

        setVerification(response.verification ?? null);

        if (response.verification?.evidence_reference) {
          setEvidenceReference(
            response.verification.evidence_reference
          );
        }

        if (response.verification?.notes) {
          setNotes(response.verification.notes);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data verification."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!evidenceReference.trim()) {
      setError("Evidence reference wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<SubmitResponse>(
          "/ngo/verification",
          {
            method: "POST",
            token,
            body: JSON.stringify({
              evidence_reference:
                evidenceReference.trim(),
              notes: notes.trim() || null,
            }),
          }
        );

      setVerification(response.verification);

      setVerificationStatus(
        response.verification.status || "submitted"
      );

      setSuccess(
        response.message ||
          "Verification submitted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim verification."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan verification...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={navigation}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Trust & Verification
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Organization Verification
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Kirim referensi bukti organisasi agar admin dapat
                melakukan proses verifikasi.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ring-1 ${getStatusClass(
                verificationStatus
              )}`}
            >
              {getStatusLabel(verificationStatus)}
            </span>
          </div>
        </section>

        {/* Alerts */}
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
              Verification submitted
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-3">
          <InfoCard
            label="Current Status"
            value={getStatusLabel(
              verificationStatus
            )}
          />

          <InfoCard
            label="Verification Tier"
            value={
              verificationTier
                ? verificationTier
                : "Not Assigned"
            }
          />

          <InfoCard
            label="Last Submitted"
            value={
              verification?.submitted_at
                ? formatDate(
                    verification.submitted_at
                  )
                : "Never"
            }
          />
        </section>

        {/* Latest verification */}
        {!loading && verification && (
          <section className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Latest Submission
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/40">
                  Evidence Reference
                </p>

                <p className="mt-2 break-all text-sm font-medium leading-6 text-white/80">
                  {verification.evidence_reference || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Status
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {getStatusLabel(verification.status)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Submitted
                </p>

                <p className="mt-2 text-sm font-medium text-white/80">
                  {formatDate(
                    verification.submitted_at
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Reviewed
                </p>

                <p className="mt-2 text-sm font-medium text-white/80">
                  {verification.reviewed_at
                    ? formatDate(
                        verification.reviewed_at
                      )
                    : "Not reviewed yet"}
                </p>
              </div>
            </div>

            {verification.notes && (
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs text-white/40">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/70">
                  {verification.notes}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Verification Submission
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
              Submit organization evidence
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Masukkan referensi dokumen atau bukti yang dapat
              digunakan admin untuk memverifikasi organisasi.
            </p>
          </div>

          {loading ? (
            <div className="mt-7 space-y-5">
              <div className="animate-pulse">
                <div className="h-4 w-36 rounded bg-gray-200" />
                <div className="mt-3 h-12 rounded-xl bg-gray-100" />
              </div>

              <div className="animate-pulse">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-3 h-32 rounded-xl bg-gray-100" />
              </div>
            </div>
          ) : (
            <div className="mt-7 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Evidence Reference
                </label>

                <input
                  required
                  maxLength={500}
                  value={evidenceReference}
                  onChange={(event) =>
                    setEvidenceReference(
                      event.target.value
                    )
                  }
                  placeholder="Document URL, Drive link, reference number, etc."
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Backend menerima maksimal 500 karakter.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Notes
                </label>

                <textarea
                  maxLength={2000}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={6}
                  placeholder="Additional information for the verification reviewer..."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-gray-400"
                />

                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>Optional</span>
                  <span>{notes.length}/2000</span>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-900">
                  Before submitting
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Pastikan referensi bukti dapat diakses oleh admin.
                  Pengiriman baru akan membuat record verification
                  baru dengan status submitted.
                </p>
              </div>

              <div className="flex justify-end border-t border-black/5 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Verification"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>

      <p className="mt-3 text-lg font-bold tracking-tight text-gray-900">
        {value}
      </p>
    </div>
  );
}