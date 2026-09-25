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

type Campus = {
  id: number;
  name: string;
};

type CampusProfile = {
  id: number;
  user_id: number;
  campus_id: number;
  position?: string | null;
  campus?: Campus | null;
};

type ProfileResponse = {
  profile: CampusProfile | null;
};

type Credential = {
  id: number;
  credential_number: string;
  status: string;
};

type CredentialResponse = {
  message: string;
  data: Credential[];
};

type ReportMeta = {
  total_records: number;
  total_hours: number;
};

type ReportResponse = {
  message: string;
  data: unknown[];
  meta: ReportMeta;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/campus",
  },
  {
    label: "Credentials",
    href: "/campus/credentials",
  },
  {
    label: "Verify Credential",
    href: "/campus/verify",
  },
  {
    label: "Reports",
    href: "/campus/reports",
  },
  {
    label: "Profile",
    href: "/campus/profile",
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

const campusHeroImage =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=90";

export default function CampusDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [profile, setProfile] =
    useState<CampusProfile | null>(null);

  const [credentials, setCredentials] =
    useState<Credential[]>([]);

  const [reportMeta, setReportMeta] =
    useState<ReportMeta>({
      total_records: 0,
      total_hours: 0,
    });

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

    if (storedUser.role !== "campus") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadDashboard(
      authToken: string,
    ) {
      try {
        const [
          profileResponse,
          credentialResponse,
          reportResponse,
        ] = await Promise.all([
          apiFetch<ProfileResponse>(
            "/campus/profile",
            {
              token: authToken,
            },
          ),

          apiFetch<CredentialResponse>(
            "/campus/credentials",
            {
              token: authToken,
            },
          ),

          apiFetch<ReportResponse>(
            "/campus/reports/volunteer-activities",
            {
              token: authToken,
            },
          ),
        ]);

        setProfile(
          profileResponse.profile,
        );

        setCredentials(
          credentialResponse.data,
        );

        setReportMeta(
          reportResponse.meta,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data dashboard Campus.",
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

  const credentialHealth =
    credentials.length > 0
      ? Math.round(
          (activeCredentials /
            credentials.length) *
            100,
        )
      : 0;

  const campusName =
    profile?.campus?.name ??
    "Campus Volunteer Monitoring";

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan campus dashboard...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="campus"
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

                CAMPUS MONITORING
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Welcome back,{" "}
                {user.name.split(" ")[0]} 👋
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px] lg:text-[58px]">
                Track experience.

                <span className="block text-[#6d35e8]">
                  Verify real impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Monitor aktivitas volunteer mahasiswa,
                total jam kontribusi, dan credential
                terverifikasi dari satu workspace kampus.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/campus/verify",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Verify Credential
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/campus/reports",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  View Reports →
                </button>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ebff] text-[#6d35e8]">
                  ✓
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#30283e]">
                    Institutional monitoring
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#94879f]">
                    {reportMeta.total_records} volunteer activity records
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              <img
                src={campusHeroImage}
                alt="Campus students"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

              {/* CAMPUS BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs text-[#6d35e8]">
                  ◈
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Campus
                  </p>

                  <p className="max-w-[180px] truncate text-xs font-bold text-[#21172b]">
                    {campusName}
                  </p>
                </div>
              </div>

              {/* CAMPUS SNAPSHOT */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                        Campus Snapshot
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                      <span className="text-[9px] font-semibold text-[#6d35e8]">
                        {credentialHealth}% credential health
                      </span>
                    </div>

                    <h3 className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                      Volunteer activity overview
                    </h3>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <SnapshotItem
                        label="Activities"
                        value={
                          reportMeta.total_records
                        }
                      />

                      <SnapshotItem
                        label="Hours"
                        value={Number(
                          reportMeta.total_hours ??
                            0,
                        ).toFixed(1)}
                      />

                      <SnapshotItem
                        label="Credentials"
                        value={
                          credentials.length
                        }
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee9f3]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${credentialHealth}%`,
                          }}
                          transition={{
                            duration: 0.7,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-[#6d35e8]"
                        />
                      </div>

                      <span className="shrink-0 text-[9px] font-semibold text-[#8e8299]">
                        Credential Health
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/campus/reports",
                      )
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                    aria-label="Open campus reports"
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

          {/* STAT STRIP */}
          <div className="relative z-20 grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Activity Records"
              value={
                reportMeta.total_records
              }
              description="Verified activity data"
            />

            <HeroStat
              label="Volunteer Hours"
              value={Number(
                reportMeta.total_hours ??
                  0,
              ).toFixed(1)}
              description="Recorded contribution"
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

        {/* ACTIVITY OVERVIEW */}
        <motion.section
          variants={sectionVariants}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Institutional Overview
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Volunteer activity
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Monitor recorded activities,
                volunteer hours, and credential
                validity.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/campus/reports",
                )
              }
              className="text-xs font-semibold text-[#6d35e8]"
            >
              Open reports →
            </button>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[180px] animate-pulse rounded-[22px] border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <OverviewCard
                title="Activity Records"
                value={String(
                  reportMeta.total_records,
                )}
                description="Volunteer activity entries currently recorded."
                icon="↗"
              />

              <OverviewCard
                title="Volunteer Hours"
                value={Number(
                  reportMeta.total_hours ??
                    0,
                ).toFixed(1)}
                description="Total contribution hours across activity records."
                icon="◷"
              />

              <OverviewCard
                title="Credentials"
                value={String(
                  credentials.length,
                )}
                description="Credentials available within campus scope."
                icon="◇"
              />

              <OverviewCard
                title="Credential Health"
                value={`${credentialHealth}%`}
                description={`${activeCredentials} active and ${revokedCredentials} revoked.`}
                icon="✓"
              />
            </div>
          )}
        </motion.section>

        {/* CREDENTIAL + CAMPUS PROFILE */}
        {!loading && (
          <motion.section
            variants={sectionVariants}
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            {/* CREDENTIAL */}
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Credential Monitoring
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                    Student credential status
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6f84]">
                    Review credentials issued through
                    completed volunteer activities and
                    verify their current status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/campus/credentials",
                    )
                  }
                  className="shrink-0 text-xs font-semibold text-[#6d35e8]"
                >
                  View all →
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <CredentialStat
                  label="Total"
                  value={
                    credentials.length
                  }
                  tone="purple"
                />

                <CredentialStat
                  label="Active"
                  value={
                    activeCredentials
                  }
                  tone="green"
                />

                <CredentialStat
                  label="Revoked"
                  value={
                    revokedCredentials
                  }
                  tone="red"
                />
              </div>
            </div>

            {/* CAMPUS PROFILE */}
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Campus Profile
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                {campusName}
              </h2>

              <div className="mt-5 space-y-3">
                <ProfileRow
                  label="Campus ID"
                  value={
                    profile?.campus_id?.toString() ??
                    "-"
                  }
                />

                <ProfileRow
                  label="Position"
                  value={
                    profile?.position ??
                    "-"
                  }
                />

                <ProfileRow
                  label="Account"
                  value={
                    user.email
                  }
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/campus/profile",
                  )
                }
                className="mt-5 text-sm font-semibold text-[#6d35e8]"
              >
                Manage profile →
              </button>
            </div>
          </motion.section>
        )}

        {/* QUICK ACTIONS */}
        {!loading && (
          <motion.section
            variants={sectionVariants}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Campus Tools
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Quick actions
              </h2>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <QuickAction
                icon="✓"
                title="Verify Credential"
                description="Check credential authenticity and current status."
                action="Verify now"
                onClick={() =>
                  router.push(
                    "/campus/verify",
                  )
                }
              />

              <QuickAction
                icon="↗"
                title="Volunteer Reports"
                description="Review volunteer activities and total contribution hours."
                action="Open reports"
                onClick={() =>
                  router.push(
                    "/campus/reports",
                  )
                }
              />

              <QuickAction
                icon="◇"
                title="Student Credentials"
                description="Browse credentials visible within the campus scope."
                action="View credentials"
                onClick={() =>
                  router.push(
                    "/campus/credentials",
                  )
                }
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
                Campus Volunteer Data
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Turn activity into verified experience.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Review student contribution data
                and export institutional reports when needed.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/campus/reports",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              View Reports →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function SnapshotItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
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

function HeroStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
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

function OverviewCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
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

function CredentialStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "purple"
    | "green"
    | "red";
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

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] px-4 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#998ca4]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-[#32273b]">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.99,
      }}
      className="group rounded-[20px] border border-[#eeeaf5] bg-white p-5 text-left shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3eeff] text-sm font-bold text-[#6d35e8]">
          {icon}
        </div>

        <span className="text-[#6d35e8]">
          →
        </span>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#30283e]">
        {title}
      </h3>

      <p className="mt-2 min-h-[40px] text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>

      <p className="mt-4 text-[10px] font-semibold text-[#6d35e8]">
        {action}
      </p>
    </motion.button>
  );
}