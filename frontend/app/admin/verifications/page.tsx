"use client";

import {
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

type FilterStatus =
  | "all"
  | "submitted"
  | "medium_high";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "NGO Verifications",
    href: "/admin/verifications",
  },
  {
    label: "Project Reviews",
    href: "/admin/projects",
  },
  {
    label: "Credentials",
    href: "/admin/credentials",
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
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=90";

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

function getRiskClass(
  risk?: string | null,
) {
  switch (risk) {
    case "high":
      return "bg-red-50 text-red-700";

    case "medium":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

function getTierLabel(
  tier?: string | null,
) {
  if (!tier) {
    return "Not Assigned";
  }

  return tier
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function getOrganization(
  verification: Verification,
) {
  return (
    verification.ngo_profile ??
    verification.ngoProfile ??
    null
  );
}

export default function AdminVerificationsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    verifications,
    setVerifications,
  ] = useState<Verification[]>(
    [],
  );

  const [
    processingId,
    setProcessingId,
  ] = useState<number | null>(
    null,
  );

  const [
    rejectingId,
    setRejectingId,
  ] = useState<number | null>(
    null,
  );

  const [
    rejectNotes,
    setRejectNotes,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    filterStatus,
    setFilterStatus,
  ] = useState<FilterStatus>(
    "all",
  );

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
      "admin"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadVerifications(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<VerificationsResponse>(
            "/admin/ngos/verifications",
            {
              token:
                authToken,
            },
          );

        setVerifications(
          response.data,
        );
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

    loadVerifications(token);
  }, [router]);

  async function handleApprove(
    verificationId: number,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    setProcessingId(
      verificationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/admin/ngos/verifications/${verificationId}/approve`,
          {
            method: "POST",
            token,
          },
        );

      setVerifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              verificationId,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal approve verification.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(
    verificationId: number,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      rejectNotes.trim()
        .length < 5
    ) {
      setError(
        "Alasan reject minimal 5 karakter.",
      );

      return;
    }

    setProcessingId(
      verificationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/admin/ngos/verifications/${verificationId}/reject`,
          {
            method: "POST",
            token,

            body: JSON.stringify(
              {
                notes:
                  rejectNotes.trim(),
              },
            ),
          },
        );

      setVerifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              verificationId,
          ),
      );

      setSuccess(
        response.message,
      );

      setRejectingId(
        null,
      );

      setRejectNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal reject verification.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  const stats =
    useMemo(() => {
      const highRisk =
        verifications.filter(
          (verification) =>
            getOrganization(
              verification,
            )?.risk_level ===
            "high",
        ).length;

      const mediumRisk =
        verifications.filter(
          (verification) =>
            getOrganization(
              verification,
            )?.risk_level ===
            "medium",
        ).length;

      const withEvidence =
        verifications.filter(
          (verification) =>
            Boolean(
              verification.evidence_reference,
            ),
        ).length;

      return {
        total:
          verifications.length,
        highRisk,
        mediumRisk,
        withEvidence,
      };
    }, [verifications]);

  const filteredVerifications =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return verifications.filter(
        (verification) => {
          const ngo =
            getOrganization(
              verification,
            );

          const matchesSearch =
            !keyword ||
            (
              ngo?.organization_name ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              ngo?.contact_email ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              verification.evidence_reference ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            String(
              verification.id,
            ).includes(
              keyword,
            );

          const risk =
            ngo?.risk_level;

          const matchesFilter =
            filterStatus ===
              "all" ||
            (filterStatus ===
              "submitted" &&
              verification.status ===
                "submitted") ||
            (filterStatus ===
              "medium_high" &&
              (risk ===
                "medium" ||
                risk ===
                  "high"));

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      verifications,
      search,
      filterStatus,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan admin verification...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="admin"
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
        className="space-y-9"
      >
        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[400px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                TRUST OPERATIONS
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                NGO review workspace
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Review evidence.

                <span className="block text-[#6d35e8]">
                  Protect platform trust.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Review identitas dan
                evidence organisasi sebelum
                NGO mendapatkan status
                verification yang lebih
                tinggi di Volunteer Match.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "verification-queue",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Review Queue
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/projects",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Project Reviews →
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Admin NGO verification"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* PENDING BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {stats.total}
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Review Queue
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Pending NGO
                  </p>
                </div>
              </div>

              {/* GLASS CARD */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Trust Overview
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  Verification queue
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-[#81748c]">
                  Prioritize evidence
                  quality and risk context
                  before making a decision.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <HeroStat
                    label="Pending"
                    value={
                      stats.total
                    }
                  />

                  <HeroStat
                    label="Evidence"
                    value={
                      stats.withEvidence
                    }
                  />

                  <HeroStat
                    label="High Risk"
                    value={
                      stats.highRisk
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STAT STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <InfoStrip
              label="Pending Reviews"
              value={`${stats.total}`}
              description="Waiting decision"
            />

            <InfoStrip
              label="With Evidence"
              value={`${stats.withEvidence}`}
              description="Evidence available"
            />

            <InfoStrip
              label="Medium Risk"
              value={`${stats.mediumRisk}`}
              description="Needs attention"
            />

            <InfoStrip
              label="High Risk"
              value={`${stats.highRisk}`}
              description="Priority review"
            />
          </div>
        </motion.section>

        {/* ALERT */}
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
                  Action completed
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* QUEUE HEADER */}
        <motion.section
          variants={
            sectionVariants
          }
          id="verification-queue"
          className="scroll-mt-28"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Verification Queue
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Pending NGO reviews
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                Review evidence,
                organization context,
                contact information, dan
                risk level sebelum membuat
                keputusan.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[260px]">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-[#a095aa]">
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search NGO or evidence..."
                  className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3 pl-10 pr-4 text-xs text-[#43364c] outline-none transition placeholder:text-[#aea3b6] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                />
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="mt-5 flex flex-wrap gap-2">
            <FilterButton
              active={
                filterStatus ===
                "all"
              }
              label={`All (${stats.total})`}
              onClick={() =>
                setFilterStatus(
                  "all",
                )
              }
            />

            <FilterButton
              active={
                filterStatus ===
                "submitted"
              }
              label="Submitted"
              onClick={() =>
                setFilterStatus(
                  "submitted",
                )
              }
            />

            <FilterButton
              active={
                filterStatus ===
                "medium_high"
              }
              label={`Medium / High Risk (${stats.mediumRisk + stats.highRisk})`}
              onClick={() =>
                setFilterStatus(
                  "medium_high",
                )
              }
            />
          </div>
        </motion.section>

        {/* CONTENT */}
        {loading ? (
          <motion.div
            variants={
              sectionVariants
            }
            className="grid gap-5 lg:grid-cols-2"
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-[480px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                />
              ),
            )}
          </motion.div>
        ) : filteredVerifications.length ===
          0 ? (
          <motion.section
            variants={
              sectionVariants
            }
            className="rounded-[26px] border border-[#ece7f5] bg-white px-6 py-16 text-center shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eeff] text-lg text-[#6d35e8]">
              ✓
            </div>

            <h2 className="mt-4 text-xl font-semibold text-[#24192d]">
              No matching verifications
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#84788e]">
              {verifications.length ===
              0
                ? "Tidak ada NGO yang sedang menunggu review."
                : "Tidak ada verification yang cocok dengan pencarian atau filter."}
            </p>
          </motion.section>
        ) : (
          <motion.section
            variants={
              sectionVariants
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {filteredVerifications.map(
              (
                verification,
              ) => {
                const ngo =
                  getOrganization(
                    verification,
                  );

                const isRejecting =
                  rejectingId ===
                  verification.id;

                const isProcessing =
                  processingId ===
                  verification.id;

                return (
                  <motion.article
                    key={
                      verification.id
                    }
                    whileHover={{
                      y: -2,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
                  >
                    {/* TOP */}
                    <div className="border-b border-[#f0edf5] p-6">
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#f3eeff] text-sm font-bold text-[#6d35e8]">
                            {(
                              ngo?.organization_name ||
                              `NGO ${verification.ngo_id}`
                            )
                              .split(
                                " ",
                              )
                              .map(
                                (
                                  part,
                                ) =>
                                  part.charAt(
                                    0,
                                  ),
                              )
                              .join("")
                              .slice(
                                0,
                                2,
                              )
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9c8ca8]">
                              Verification #
                              {
                                verification.id
                              }
                            </p>

                            <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-[#21172a]">
                              {ngo?.organization_name ||
                                `NGO #${verification.ngo_id}`}
                            </h3>

                            <p className="mt-1 text-[10px] text-[#93869e]">
                              NGO ID #
                              {
                                verification.ngo_id
                              }
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-semibold text-amber-700">
                          Submitted
                        </span>
                      </div>

                      {ngo?.description && (
                        <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#786d83]">
                          {
                            ngo.description
                          }
                        </p>
                      )}
                    </div>

                    {/* ORGANIZATION INFO */}
                    <div className="p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoCard
                          label="Submitted"
                          value={formatDate(
                            verification.submitted_at,
                          )}
                        />

                        <InfoCard
                          label="Risk Level"
                          value={
                            ngo?.risk_level ||
                            "-"
                          }
                          badgeClass={getRiskClass(
                            ngo?.risk_level,
                          )}
                        />

                        <InfoCard
                          label="Verification Tier"
                          value={getTierLabel(
                            ngo?.verification_tier,
                          )}
                        />

                        <InfoCard
                          label="Address"
                          value={
                            ngo?.address ||
                            "-"
                          }
                        />
                      </div>

                      {/* CONTACT */}
                      <div className="mt-4 rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9789a2]">
                          Organization Contact
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <ContactItem
                            label="Email"
                            value={
                              ngo?.contact_email ||
                              "-"
                            }
                          />

                          <ContactItem
                            label="Phone"
                            value={
                              ngo?.contact_phone ||
                              "-"
                            }
                          />
                        </div>
                      </div>

                      {/* EVIDENCE */}
                      <div className="mt-4 rounded-xl border border-[#e6dcfb] bg-[#f8f5ff] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8066b5]">
                            Evidence Reference
                          </p>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-semibold text-[#6d35e8] shadow-sm">
                            Review Evidence
                          </span>
                        </div>

                        <p className="mt-3 break-all text-xs leading-6 text-[#675875]">
                          {verification.evidence_reference ||
                            "No evidence reference provided."}
                        </p>
                      </div>

                      {/* NGO NOTES */}
                      {verification.notes && (
                        <div className="mt-4 rounded-xl border border-[#eeeaf5] bg-white p-5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9789a2]">
                            NGO Notes
                          </p>

                          <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#786d83]">
                            {
                              verification.notes
                            }
                          </p>
                        </div>
                      )}

                      {/* REJECT FORM */}
                      {isRejecting && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -4,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="mt-5 rounded-xl border border-red-100 bg-red-50 p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                              !
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-red-800">
                                Reject verification
                              </p>

                              <p className="mt-1 text-[10px] leading-5 text-red-600/80">
                                Berikan alasan yang
                                jelas agar NGO dapat
                                memahami apa yang perlu
                                diperbaiki.
                              </p>
                            </div>
                          </div>

                          <textarea
                            rows={4}
                            maxLength={
                              2000
                            }
                            value={
                              rejectNotes
                            }
                            onChange={(
                              event,
                            ) =>
                              setRejectNotes(
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Jelaskan alasan verification ditolak..."
                            className="mt-4 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-xs leading-6 text-[#4b3d54] outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                          />

                          <div className="mt-2 flex items-center justify-between text-[9px] text-red-500">
                            <span>
                              Minimal 5
                              karakter
                            </span>

                            <span>
                              {
                                rejectNotes.length
                              }
                              /2000
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                setRejectingId(
                                  null,
                                );

                                setRejectNotes(
                                  "",
                                );
                              }}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleReject(
                                  verification.id,
                                )
                              }
                              className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Rejecting..."
                                : "Confirm Reject"}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* DECISION */}
                      <div className="mt-6 border-t border-[#f0edf5] pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                              Admin Decision
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-[#93869e]">
                              Review evidence
                              carefully before
                              making a final
                              decision.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                setRejectingId(
                                  verification.id,
                                );

                                setRejectNotes(
                                  "",
                                );

                                setError(
                                  "",
                                );

                                setSuccess(
                                  "",
                                );
                              }}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleApprove(
                                  verification.id,
                                )
                              }
                              className="rounded-lg bg-[#6d35e8] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(109,53,232,0.15)] transition hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Processing..."
                                : "Approve NGO →"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              },
            )}
          </motion.section>
        )}

        {/* REVIEW PRINCIPLES */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Review Principles
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Review with consistency
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <PrincipleCard
              number="01"
              title="Identity"
              description="Pastikan informasi organisasi dan evidence saling mendukung."
            />

            <PrincipleCard
              number="02"
              title="Accessibility"
              description="Evidence harus cukup jelas dan dapat dipahami saat review."
            />

            <PrincipleCard
              number="03"
              title="Risk Context"
              description="Pertimbangkan risk level organisasi dalam proses review."
            />
          </div>
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
                Next Review Area
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Keep project quality high too.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Setelah NGO verification,
                lanjut review project yang
                sudah disubmit sebelum
                dipublikasikan ke student.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/projects",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Review Projects →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9587a2]">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-[#24182d]">
        {value}
      </p>
    </div>
  );
}

function InfoStrip({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="text-xl font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2.5 text-[10px] font-semibold transition ${
        active
          ? "bg-[#6d35e8] text-white shadow-[0_6px_15px_rgba(109,53,232,0.14)]"
          : "border border-[#e9e3ef] bg-white text-[#7a6e84] hover:bg-[#faf8ff]"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({
  label,
  value,
  badgeClass,
}: {
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8da5]">
        {label}
      </p>

      {badgeClass ? (
        <span
          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${badgeClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 break-words text-xs font-semibold capitalize leading-5 text-[#4e4258]">
          {value}
        </p>
      )}
    </div>
  );
}

function ContactItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a094aa]">
        {label}
      </p>

      <p className="mt-1 break-all text-[10px] font-semibold text-[#55485f]">
        {value}
      </p>
    </div>
  );
}

function PrincipleCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[20px] border border-[#eeeaf5] bg-white p-5 shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
        {number}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#30283e]">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>
    </motion.div>
  );
}