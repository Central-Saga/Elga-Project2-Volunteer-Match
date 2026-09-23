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

type NgoProfile = {
  id: number;
  organization_name?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  verification_status?: string | null;
  verification_tier?: string | null;
  risk_level?: string | null;
};

type Verification = {
  id: number;
  ngo_id: number;
  reviewer_id?: number | null;
  status: string;
  notes?: string | null;
  evidence_reference?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  ngo_profile?: NgoProfile | null;
  ngoProfile?: NgoProfile | null;
};

type VerificationsResponse = {
  message: string;
  data: Verification[];
};

type ActionResponse = {
  message: string;
  data: {
    verification: Verification;
    ngo_profile: NgoProfile;
  };
};

const navigation = [
  { label: "Dashboard", href: "/admin" },
  { label: "NGO Verifications", href: "/admin/verifications" },
  { label: "Project Reviews", href: "/admin/projects" },
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

export default function AdminVerificationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [verifications, setVerifications] = useState<Verification[]>([]);

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

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

    async function loadVerifications() {
      try {
        const response = await apiFetch<VerificationsResponse>(
          "/admin/ngos/verifications",
          {
            token: token ?? undefined,
          }
        );

        setVerifications(response.data);
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

    loadVerifications();
  }, [router]);

  async function handleApprove(verificationId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(verificationId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/admin/ngos/verifications/${verificationId}/approve`,
        {
          method: "POST",
          token,
        }
      );

      setVerifications((current) =>
        current.filter((item) => item.id !== verificationId)
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal approve verification."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(verificationId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (rejectNotes.trim().length < 5) {
      setError("Alasan reject minimal 5 karakter.");
      return;
    }

    setProcessingId(verificationId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/admin/ngos/verifications/${verificationId}/reject`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            notes: rejectNotes.trim(),
          }),
        }
      );

      setVerifications((current) =>
        current.filter((item) => item.id !== verificationId)
      );

      setSuccess(response.message);
      setRejectingId(null);
      setRejectNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal reject verification."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan admin verification...
        </div>
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
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Trust & Safety
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            NGO Verifications
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review bukti organisasi yang dikirim NGO sebelum mereka
            dapat membuat volunteer project.
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

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-4 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold text-gray-900">
              No pending verifications
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Tidak ada NGO yang sedang menunggu review.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {verifications.map((verification) => {
              const ngo =
                verification.ngo_profile ??
                verification.ngoProfile ??
                null;

              return (
                <article
                  key={verification.id}
                  className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Verification #{verification.id}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-gray-900">
                        {ngo?.organization_name ||
                          `NGO #${verification.ngo_id}`}
                      </h2>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Submitted
                    </span>
                  </div>

                  {ngo?.description && (
                    <p className="mt-4 text-sm leading-6 text-gray-500">
                      {ngo.description}
                    </p>
                  )}

                  <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-2">
                    <Info
                      label="Submitted"
                      value={formatDate(
                        verification.submitted_at
                      )}
                    />

                    <Info
                      label="Risk Level"
                      value={ngo?.risk_level || "-"}
                    />

                    <Info
                      label="Contact Email"
                      value={ngo?.contact_email || "-"}
                    />

                    <Info
                      label="Contact Phone"
                      value={ngo?.contact_phone || "-"}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                      Evidence Reference
                    </p>

                    <p className="mt-2 break-all text-sm leading-6 text-gray-700">
                      {verification.evidence_reference || "-"}
                    </p>
                  </div>

                  {verification.notes && (
                    <div className="mt-4 rounded-2xl border border-gray-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                        NGO Notes
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                        {verification.notes}
                      </p>
                    </div>
                  )}

                  {rejectingId === verification.id && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">
                      <label className="text-sm font-semibold text-red-800">
                        Rejection Reason
                      </label>

                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={rejectNotes}
                        onChange={(event) =>
                          setRejectNotes(event.target.value)
                        }
                        placeholder="Jelaskan alasan verification ditolak..."
                        className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none"
                      />

                      <p className="mt-2 text-xs text-red-500">
                        Minimal 5 karakter.
                      </p>

                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectNotes("");
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            processingId === verification.id
                          }
                          onClick={() =>
                            handleReject(verification.id)
                          }
                          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {processingId === verification.id
                            ? "Rejecting..."
                            : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={
                        processingId === verification.id
                      }
                      onClick={() => {
                        setRejectingId(verification.id);
                        setRejectNotes("");
                        setError("");
                        setSuccess("");
                      }}
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={
                        processingId === verification.id
                      }
                      onClick={() =>
                        handleApprove(verification.id)
                      }
                      className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                    >
                      {processingId === verification.id
                        ? "Processing..."
                        : "Approve NGO"}
                    </button>
                  </div>
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

      <p className="mt-1 break-words text-sm font-semibold capitalize text-gray-900">
        {value}
      </p>
    </div>
  );
}