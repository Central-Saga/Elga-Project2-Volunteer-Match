"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type NgoVerification = {
  id: number;
  status?: string;
};

type Project = {
  id: number;
  title?: string | null;
  status?: string;
};

type Credential = {
  id: number;
  credential_number?: string;
  status: string;
};

type NgoVerificationResponse = {
  message: string;
  data: NgoVerification[];
};

type ProjectResponse = {
  message: string;
  data: Project[];
};

type CredentialResponse = {
  message: string;
  data: Credential[];
};

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
    label: "Projects",
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
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=90";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [verifications, setVerifications] =
    useState<NgoVerification[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [credentials, setCredentials] =
    useState<Credential[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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

    async function loadDashboard(
      authToken: string,
    ) {
      try {
        const [
          verificationResponse,
          projectResponse,
          credentialResponse,
        ] = await Promise.all([
          apiFetch<NgoVerificationResponse>(
            "/admin/ngos/verifications",
            {
              token: authToken,
            },
          ),

          apiFetch<ProjectResponse>(
            "/admin/projects/submitted",
            {
              token: authToken,
            },
          ),

          apiFetch<CredentialResponse>(
            "/admin/credentials",
            {
              token: authToken,
            },
          ),
        ]);

        setVerifications(
          verificationResponse.data,
        );

        setProjects(
          projectResponse.data,
        );

        setCredentials(
          credentialResponse.data,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data dashboard Admin.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard(token);
  }, [router]);

  const activeCredentials =
    useMemo(() => {
      return credentials.filter(
        (credential) =>
          credential.status === "active",
      ).length;
    }, [credentials]);

  const revokedCredentials =
    useMemo(() => {
      return credentials.filter(
        (credential) =>
          credential.status === "revoked",
      ).length;
    }, [credentials]);

  const totalReviewQueue =
    verifications.length +
    projects.length;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan admin dashboard...
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
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[440px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                ADMIN CONTROL CENTER
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Welcome back, {user.name.split(" ")[0]} 👋
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px] lg:text-[58px]">
                Review. Protect.

                <span className="block text-[#6d35e8]">
                  Keep it trusted.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Review organizations, moderate volunteer
                projects, dan maintain credential integrity
                across Volunteer Match.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/verifications",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Review NGO
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
                  Moderate Projects →
                </button>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ebff] text-[#6d35e8]">
                  ✓
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#30283e]">
                    Platform moderation
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#94879f]">
                    {totalReviewQueue} items currently waiting for review
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Admin review workspace"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

              {/* SMALL STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs text-[#6d35e8]">
                  ◈
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Review Queue
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {totalReviewQueue} pending
                  </p>
                </div>
              </div>

              {/* MAIN FLOATING CARD */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                        Priority Review
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                      <span className="text-[9px] font-semibold text-[#6d35e8]">
                        Admin Queue
                      </span>
                    </div>

                    <h3 className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                      {totalReviewQueue > 0
                        ? "Items need your attention"
                        : "Review queue is clear"}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <QueueMiniStat
                        label="NGO Verification"
                        value={verifications.length}
                      />

                      <QueueMiniStat
                        label="Project Moderation"
                        value={projects.length}
                      />
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
                      <div
                        className="h-full rounded-full bg-[#6d35e8]"
                        style={{
                          width:
                            totalReviewQueue > 0
                              ? "72%"
                              : "100%",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        verifications.length > 0
                          ? "/admin/verifications"
                          : "/admin/projects",
                      )
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                    aria-label="Open review queue"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M5 12h14" />
                      <path d="m14 7 5 5-5 5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="relative z-20 grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Pending NGO"
              value={verifications.length}
              description="Awaiting verification"
            />

            <HeroStat
              label="Submitted Projects"
              value={projects.length}
              description="Waiting moderation"
            />

            <HeroStat
              label="Active Credentials"
              value={activeCredentials}
              description="Currently valid"
            />

            <HeroStat
              label="Revoked"
              value={revokedCredentials}
              description="No longer valid"
            />
          </div>
        </motion.section>

        {/* ERROR */}
        {error && (
          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              Dashboard error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* REVIEW QUEUES */}
        <motion.section variants={sectionVariants}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Moderation
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Review queues
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Prioritize organization verification and
                project moderation from one place.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[230px] animate-pulse rounded-[22px] border border-[#eeeaf5] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <ReviewQueueCard
                eyebrow="Organization Review"
                title="NGO Verifications"
                value={verifications.length}
                description="Review organization verification requests before NGOs fully manage opportunities."
                action="Open verifications"
                onClick={() =>
                  router.push(
                    "/admin/verifications",
                  )
                }
              />

              <ReviewQueueCard
                eyebrow="Project Moderation"
                title="Submitted Projects"
                value={projects.length}
                description="Review submitted volunteer projects before they become visible to students."
                action="Open projects"
                onClick={() =>
                  router.push(
                    "/admin/projects",
                  )
                }
              />
            </div>
          )}
        </motion.section>

        {/* CREDENTIALS */}
        {!loading && (
          <motion.section
            variants={sectionVariants}
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Credential Integrity
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                    Credential overview
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6f84]">
                    Monitor credentials issued through completed
                    volunteer activities and revoke them when necessary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/credentials",
                    )
                  }
                  className="shrink-0 text-xs font-semibold text-[#6d35e8]"
                >
                  Manage →
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <CredentialStat
                  label="Total"
                  value={credentials.length}
                  tone="purple"
                />

                <CredentialStat
                  label="Active"
                  value={activeCredentials}
                  tone="green"
                />

                <CredentialStat
                  label="Revoked"
                  value={revokedCredentials}
                  tone="red"
                />
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Quick Actions
              </p>

              <div className="mt-4 space-y-2.5">
                <QuickAction
                  title="Review NGO"
                  description="Open organization verification requests."
                  onClick={() =>
                    router.push(
                      "/admin/verifications",
                    )
                  }
                />

                <QuickAction
                  title="Moderate Projects"
                  description="Review submitted volunteer projects."
                  onClick={() =>
                    router.push(
                      "/admin/projects",
                    )
                  }
                />

                <QuickAction
                  title="Manage Credentials"
                  description="Inspect active and revoked credentials."
                  onClick={() =>
                    router.push(
                      "/admin/credentials",
                    )
                  }
                />
              </div>
            </div>
          </motion.section>
        )}

        {/* PLATFORM HEALTH */}
        {!loading && (
          <motion.section variants={sectionVariants}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                  Platform Status
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                  Integrity at a glance
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <IntegrityCard
                title="Organization Reviews"
                value={verifications.length}
                description={
                  verifications.length === 0
                    ? "No organization review is waiting."
                    : "Organization requests need review."
                }
                icon="◈"
              />

              <IntegrityCard
                title="Project Reviews"
                value={projects.length}
                description={
                  projects.length === 0
                    ? "Project moderation queue is clear."
                    : "Submitted projects need moderation."
                }
                icon="□"
              />

              <IntegrityCard
                title="Credential Health"
                value={activeCredentials}
                description={`${revokedCredentials} credential currently revoked.`}
                icon="✓"
              />
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Volunteer Match Admin
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Keep the platform trusted.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Review pending items and maintain the integrity
                of volunteer opportunities.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  verifications.length > 0
                    ? "/admin/verifications"
                    : "/admin/projects",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Open Review Queue →
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
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="text-2xl font-bold tracking-[-0.03em] text-[#23172d]">
        {value}
      </p>
    </div>
  );
}

function QueueMiniStat({
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

function ReviewQueueCard({
  eyebrow,
  title,
  value,
  description,
  action,
  onClick,
}: {
  eyebrow: string;
  title: string;
  value: number;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
            {eyebrow}
          </p>

          <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
            {title}
          </h3>
        </div>

        <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-[#f3eeff] px-3 text-xl font-bold text-[#6d35e8]">
          {value}
        </div>
      </div>

      <p className="mt-4 max-w-xl text-sm leading-6 text-[#7a6f84]">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#6d35e8]"
      >
        {action}

        <span>→</span>
      </button>
    </motion.div>
  );
}

function CredentialStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "purple" | "green" | "red";
}) {
  const styles = {
    purple:
      "border-[#e8dfff] bg-[#f7f3ff] text-[#6d35e8]",

    green:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    red:
      "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${styles[tone]}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-65">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-[#eee9f4] bg-[#fbfaff] px-4 py-3 text-left transition-colors hover:border-[#dfd4ef] hover:bg-[#f8f5ff]"
    >
      <div>
        <p className="text-sm font-semibold text-[#30283e]">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-[#95889f]">
          {description}
        </p>
      </div>

      <span className="ml-4 text-sm text-[#6d35e8]">
        →
      </span>
    </button>
  );
}

function IntegrityCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
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
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3eeff] text-sm font-bold text-[#6d35e8]">
          {icon}
        </div>

        <span className="text-2xl font-bold tracking-[-0.03em] text-[#21172a]">
          {value}
        </span>
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