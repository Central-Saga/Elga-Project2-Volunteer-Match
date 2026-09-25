"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  {
    label: "Dashboard",
    href: "/ngo",
  },
  {
    label: "Projects",
    href: "/ngo/projects",
  },
  {
    label: "Applications",
    href: "/ngo/applications",
  },
  {
    label: "Verification",
    href: "/ngo/verification",
  },
  {
    label: "Profile",
    href: "/ngo/profile",
  },
];

const pageVariants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

const heroImage =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=90";

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "-";
  }

  return new Date(
    date,
  ).toLocaleString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(
  status?: string | null,
) {
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

    case "not_submitted":
      return "Not Submitted";

    default:
      return (
        status || "Not Submitted"
      );
  }
}

function getStatusClass(
  status?: string | null,
) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "submitted":
    case "reviewing":
      return "bg-amber-50 text-amber-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "needs_info":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-[#f1eef4] text-[#746b7c]";
  }
}

function getStatusDescription(
  status?: string | null,
) {
  switch (status) {
    case "approved":
      return "Organization verification has been approved.";

    case "submitted":
      return "Verification has been submitted and is waiting for review.";

    case "reviewing":
      return "Admin is currently reviewing the submitted evidence.";

    case "rejected":
      return "Verification was rejected. Review your evidence before submitting again.";

    case "needs_info":
      return "Additional information is required before verification can continue.";

    default:
      return "Submit organization evidence to start the verification process.";
  }
}

function getStatusProgress(
  status?: string | null,
) {
  switch (status) {
    case "approved":
      return 100;

    case "reviewing":
      return 70;

    case "submitted":
      return 45;

    case "needs_info":
      return 55;

    case "rejected":
      return 35;

    default:
      return 10;
  }
}

export default function NgoVerificationPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    verificationStatus,
    setVerificationStatus,
  ] = useState<string>(
    "not_submitted",
  );

  const [
    verificationTier,
    setVerificationTier,
  ] = useState<
    string | null
  >(null);

  const [
    verification,
    setVerification,
  ] = useState<VerificationRecord | null>(
    null,
  );

  const [
    evidenceReference,
    setEvidenceReference,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const token =
      getStoredToken();

    const storedUser =
      getStoredUser();

    if (
      !token ||
      !storedUser
    ) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      storedUser.role !==
      "ngo"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadVerification(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<VerificationResponse>(
            "/ngo/verification",
            {
              token:
                authToken,
            },
          );

        setVerificationStatus(
          response.verification_status ??
            response.verification
              ?.status ??
            "not_submitted",
        );

        setVerificationTier(
          response.verification_tier ??
            null,
        );

        setVerification(
          response.verification ??
            null,
        );

        if (
          response.verification
            ?.evidence_reference
        ) {
          setEvidenceReference(
            response.verification
              .evidence_reference,
          );
        }

        if (
          response.verification
            ?.notes
        ) {
          setNotes(
            response.verification
              .notes,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data verification.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadVerification(token);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      !evidenceReference.trim()
    ) {
      setError(
        "Evidence reference wajib diisi.",
      );

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

            body: JSON.stringify(
              {
                evidence_reference:
                  evidenceReference.trim(),

                notes:
                  notes.trim() ||
                  null,
              },
            ),
          },
        );

      setVerification(
        response.verification,
      );

      setVerificationStatus(
        response.verification
          .status ||
          "submitted",
      );

      setSuccess(
        response.message ||
          "Verification submitted successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim verification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const statusProgress =
    useMemo(
      () =>
        getStatusProgress(
          verificationStatus,
        ),
      [verificationStatus],
    );

  const canSubmit =
    !submitting;

  const initials =
    user?.name
      .split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "NG";

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan verification...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={
        navigation
      }
    >
      <motion.div
        variants={
          pageVariants
        }
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[410px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                TRUST & VERIFICATION
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Organization trust
                center
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Build credibility.

                <span className="block text-[#6d35e8]">
                  Earn platform trust.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Kirim evidence organisasi
                agar admin dapat melakukan
                verifikasi dan memastikan
                identitas organisasi sesuai
                dengan kebijakan platform.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "verification-form",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  {verificationStatus ===
                  "not_submitted"
                    ? "Submit Evidence"
                    : "Update Submission"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/profile",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Organization Profile →
                </button>
              </div>
            </div>

            {/* PHOTO */}
            <div className="relative hidden min-h-[410px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Organization verification"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* STATUS PILL */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {statusProgress}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Verification Journey
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {getStatusLabel(
                      verificationStatus,
                    )}
                  </p>
                </div>
              </div>

              {/* GLASS CARD */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#6d35e8] text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,53,232,0.2)]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8d7d9e]">
                      Verification Status
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-[#19131f]">
                      {getStatusLabel(
                        verificationStatus,
                      )}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#84778f]">
                      {getStatusDescription(
                        verificationStatus,
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                      verificationStatus,
                    )}`}
                  >
                    {verificationTier ||
                      "No Tier"}
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${statusProgress}%`,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-3">
            <HeroInfo
              label="Current Status"
              value={getStatusLabel(
                verificationStatus,
              )}
              description="Verification state"
            />

            <HeroInfo
              label="Verification Tier"
              value={
                verificationTier ||
                "Not Assigned"
              }
              description="Organization tier"
            />

            <HeroInfo
              label="Last Submitted"
              value={
                verification?.submitted_at
                  ? formatDate(
                      verification.submitted_at,
                    )
                  : "Never"
              }
              description="Latest submission"
            />
          </div>
        </motion.section>

        {/* ALERTS */}
        {error && (
          <motion.div
            variants={
              sectionVariants
            }
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                ×
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Verification submitted
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CURRENT STATUS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          {/* TIMELINE */}
          <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                  Verification Journey
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                  Submission progress
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a6f84]">
                  Pantau perjalanan
                  verification dari evidence
                  submission hingga admin
                  decision.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                  verificationStatus,
                )}`}
              >
                {getStatusLabel(
                  verificationStatus,
                )}
              </span>
            </div>

            <div className="mt-7 space-y-1">
              <TimelineStep
                number="01"
                title="Evidence Prepared"
                description="Organization provides a reference that can be reviewed."
                active={
                  Boolean(
                    verification,
                  ) ||
                  Boolean(
                    evidenceReference,
                  )
                }
              />

              <TimelineStep
                number="02"
                title="Submitted"
                description={
                  verification?.submitted_at
                    ? formatDate(
                        verification.submitted_at,
                      )
                    : "Waiting for submission"
                }
                active={[
                  "submitted",
                  "reviewing",
                  "approved",
                  "rejected",
                  "needs_info",
                ].includes(
                  verificationStatus,
                )}
              />

              <TimelineStep
                number="03"
                title="Admin Review"
                description={
                  verificationStatus ===
                    "reviewing" ||
                  verificationStatus ===
                    "approved" ||
                  verificationStatus ===
                    "rejected" ||
                  verificationStatus ===
                    "needs_info"
                    ? "Verification review has progressed."
                    : "Waiting for admin review"
                }
                active={[
                  "reviewing",
                  "approved",
                  "rejected",
                  "needs_info",
                ].includes(
                  verificationStatus,
                )}
              />

              <TimelineStep
                number="04"
                title="Decision"
                description={
                  verification?.reviewed_at
                    ? formatDate(
                        verification.reviewed_at,
                      )
                    : verificationStatus ===
                        "approved"
                      ? "Approved"
                      : verificationStatus ===
                          "rejected"
                        ? "Rejected"
                        : verificationStatus ===
                            "needs_info"
                          ? "Additional information requested"
                          : "No decision yet"
                }
                active={[
                  "approved",
                  "rejected",
                  "needs_info",
                ].includes(
                  verificationStatus,
                )}
                last
              />
            </div>
          </div>

          {/* STATUS CARD */}
          <div className="rounded-[24px] border border-[#e8dfff] bg-[#f7f3ff] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
              ◇
            </div>

            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8874aa]">
              Current Status
            </p>

            <h3 className="mt-2 text-lg font-semibold text-[#2c2035]">
              {getStatusLabel(
                verificationStatus,
              )}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#78698a]">
              {getStatusDescription(
                verificationStatus,
              )}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#6d35e8]"
                  style={{
                    width: `${statusProgress}%`,
                  }}
                />
              </div>

              <span className="text-xs font-bold text-[#6d35e8]">
                {statusProgress}%
              </span>
            </div>

            <div className="mt-6 border-t border-[#ded4ee] pt-5">
              <InfoRow
                label="Tier"
                value={
                  verificationTier ||
                  "Not Assigned"
                }
              />

              <InfoRow
                label="Submitted"
                value={
                  verification?.submitted_at
                    ? formatDate(
                        verification.submitted_at,
                      )
                    : "Never"
                }
              />

              <InfoRow
                label="Reviewed"
                value={
                  verification?.reviewed_at
                    ? formatDate(
                        verification.reviewed_at,
                      )
                    : "Not yet"
                }
              />
            </div>
          </div>
        </motion.section>

        {/* LATEST SUBMISSION */}
        {!loading &&
          verification && (
            <motion.section
              variants={
                sectionVariants
              }
              className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
            >
              <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
                {/* LEFT */}
                <div className="bg-[#171321] p-7 text-white">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45">
                    Latest Submission
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                    Verification record
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Detail evidence terbaru
                    yang tersimpan pada
                    verification record.
                  </p>

                  <div className="mt-6">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                        verification.status,
                      )}`}
                    >
                      {getStatusLabel(
                        verification.status,
                      )}
                    </span>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <DarkInfo
                      label="Submitted"
                      value={formatDate(
                        verification.submitted_at,
                      )}
                    />

                    <DarkInfo
                      label="Reviewed"
                      value={
                        verification.reviewed_at
                          ? formatDate(
                              verification.reviewed_at,
                            )
                          : "Not yet"
                      }
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="p-7">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                      Evidence Reference
                    </p>

                    <div className="mt-3 rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
                      <p className="break-all text-sm leading-6 text-[#5e5268]">
                        {verification.evidence_reference ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                      Submission Notes
                    </p>

                    <div className="mt-3 rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
                      <p className="whitespace-pre-line text-sm leading-6 text-[#75687f]">
                        {verification.notes ||
                          "No additional notes."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

        {/* SUBMISSION FORM */}
        <motion.section
          variants={
            sectionVariants
          }
          id="verification-form"
          className="scroll-mt-28"
        >
          <form
            onSubmit={
              handleSubmit
            }
            className="grid gap-6 xl:grid-cols-[1fr_340px]"
          >
            {/* FORM */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
              <div className="border-b border-[#f0edf5] pb-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                  Verification Submission
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                  Submit organization evidence
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a6f84]">
                  Masukkan referensi dokumen
                  atau bukti yang dapat
                  digunakan admin untuk
                  memverifikasi organisasi.
                </p>
              </div>

              {loading ? (
                <div className="mt-7 space-y-5">
                  <div className="h-14 animate-pulse rounded-xl bg-[#f5f2f8]" />

                  <div className="h-40 animate-pulse rounded-xl bg-[#f5f2f8]" />

                  <div className="ml-auto h-12 w-40 animate-pulse rounded-xl bg-[#f5f2f8]" />
                </div>
              ) : (
                <div className="mt-7 space-y-6">
                  {/* EVIDENCE */}
                  <div>
                    <label
                      htmlFor="evidence_reference"
                      className="text-xs font-semibold text-[#41364b]"
                    >
                      Evidence Reference
                      <span className="ml-1 text-[#6d35e8]">
                        *
                      </span>
                    </label>

                    <p className="mt-1 text-[10px] leading-5 text-[#9a8da5]">
                      Document URL, Drive
                      link, reference number,
                      atau referensi evidence
                      lain yang dapat diakses
                      admin.
                    </p>

                    <div className="relative mt-3">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#988ba3]">
                        ↗
                      </div>

                      <input
                        id="evidence_reference"
                        required
                        maxLength={
                          500
                        }
                        value={
                          evidenceReference
                        }
                        onChange={(
                          event,
                        ) =>
                          setEvidenceReference(
                            event.target
                              .value,
                          )
                        }
                        placeholder="https://drive.google.com/... or document reference"
                        className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3.5 pl-11 pr-4 text-sm text-[#352a3e] outline-none transition placeholder:text-[#b4aabd] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#a095aa]">
                      <span>
                        Maksimal 500 karakter.
                      </span>

                      <span>
                        {
                          evidenceReference.length
                        }
                        /500
                      </span>
                    </div>
                  </div>

                  {/* NOTES */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="text-xs font-semibold text-[#41364b]"
                    >
                      Notes
                    </label>

                    <p className="mt-1 text-[10px] leading-5 text-[#9a8da5]">
                      Tambahkan informasi
                      yang dapat membantu
                      reviewer memahami
                      evidence organisasi.
                    </p>

                    <textarea
                      id="notes"
                      maxLength={
                        2000
                      }
                      value={notes}
                      onChange={(
                        event,
                      ) =>
                        setNotes(
                          event.target
                            .value,
                        )
                      }
                      rows={7}
                      placeholder="Additional information for the verification reviewer..."
                      className="mt-3 w-full resize-none rounded-xl border border-[#e8e2ee] bg-white px-4 py-3.5 text-sm leading-6 text-[#352a3e] outline-none transition placeholder:text-[#b4aabd] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                    />

                    <div className="mt-2 flex justify-between text-[10px] text-[#a095aa]">
                      <span>
                        Optional
                      </span>

                      <span>
                        {notes.length}/2000
                      </span>
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="flex flex-col gap-3 border-t border-[#f0edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-[#94879f]">
                        Submission status
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#574a61]">
                        New submissions enter
                        review workflow.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !canSubmit
                      }
                      className="rounded-xl bg-[#6d35e8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting
                        ? "Submitting..."
                        : verification
                          ? "Submit Update →"
                          : "Submit Verification →"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              {/* CHECKLIST */}
              <div className="rounded-[22px] border border-[#e8dfff] bg-[#f7f3ff] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
                  ✓
                </div>

                <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8874aa]">
                  Before Submitting
                </p>

                <h3 className="mt-2 text-base font-semibold text-[#2f2338]">
                  Make evidence easy to review.
                </h3>

                <div className="mt-5 space-y-4">
                  <ChecklistItem
                    title="Accessible"
                    description="Pastikan referensi evidence dapat dibuka oleh admin."
                  />

                  <ChecklistItem
                    title="Relevant"
                    description="Gunakan evidence yang berhubungan dengan organisasi."
                  />

                  <ChecklistItem
                    title="Clear Context"
                    description="Gunakan notes untuk memberi informasi tambahan jika perlu."
                  />
                </div>
              </div>

              {/* CURRENT */}
              <div className="rounded-[22px] border border-[#ece7f5] bg-white p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#988ba2]">
                  Current Verification
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4a3d53]">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getStatusClass(
                      verificationStatus,
                    )}`}
                  >
                    {getStatusLabel(
                      verificationStatus,
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4a3d53]">
                    Tier
                  </span>

                  <span className="text-[10px] font-semibold text-[#81748c]">
                    {verificationTier ||
                      "Not Assigned"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4a3d53]">
                    Record
                  </span>

                  <span className="text-[10px] font-semibold text-[#81748c]">
                    {verification
                      ? `#${verification.id}`
                      : "None"}
                  </span>
                </div>
              </div>

              {/* HELP */}
              <div className="rounded-[22px] border border-[#ece7f5] bg-white p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#988ba2]">
                  Need to update profile?
                </p>

                <p className="mt-2 text-xs leading-5 text-[#85788f]">
                  Pastikan informasi
                  organisasi pada profile
                  juga sudah sesuai sebelum
                  evidence direview.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/profile",
                    )
                  }
                  className="mt-4 text-xs font-semibold text-[#6d35e8]"
                >
                  Open Organization Profile →
                </button>
              </div>
            </aside>
          </form>
        </motion.section>

        {/* CTA */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Volunteer Match Trust
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Verified organizations build stronger trust.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Keep organization
                information and evidence
                accurate throughout the
                verification process.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/projects",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              View Projects →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroInfo({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="max-w-[190px] truncate text-right text-xs font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function TimelineStep({
  number,
  title,
  description,
  active,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <div
          className={`absolute left-[17px] top-9 h-[calc(100%-20px)] w-px ${
            active
              ? "bg-[#d5c6f6]"
              : "bg-[#eeeaf3]"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold ${
          active
            ? "bg-[#6d35e8] text-white"
            : "bg-[#f3f0f5] text-[#a89dad]"
        }`}
      >
        {number}
      </div>

      <div className="pt-1">
        <p
          className={`text-sm font-semibold ${
            active
              ? "text-[#3a2d44]"
              : "text-[#9d91a5]"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#93869e]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e5ddef] py-3 last:border-b-0">
      <span className="text-[10px] font-semibold text-[#81728d]">
        {label}
      </span>

      <span className="max-w-[180px] text-right text-[10px] font-semibold text-[#4d3f57]">
        {value}
      </span>
    </div>
  );
}

function DarkInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-semibold leading-4 text-white/75">
        {value}
      </p>
    </div>
  );
}

function ChecklistItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-[#6d35e8] shadow-sm">
        ✓
      </div>

      <div>
        <p className="text-xs font-semibold text-[#4b3b56]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#86768f]">
          {description}
        </p>
      </div>
    </div>
  );
}