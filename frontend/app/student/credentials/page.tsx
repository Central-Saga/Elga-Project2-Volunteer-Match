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

type Project = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  start_at: string;
  end_at: string;
  status: string;
};

type Application = {
  id: number;
  project_id: number;
  status: string;
  applied_at: string;
  reviewed_at: string | null;
  project: Project;
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
};

type CredentialItem = {
  application: Application;
  credential: Credential;
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type CredentialResponse = {
  message: string;
  data: Credential;
};

type FilterStatus =
  | "all"
  | "active"
  | "revoked";

const navigation = [
  {
    label: "Explore",
    href: "/student",
  },
  {
    label: "My Applications",
    href: "/student/applications",
  },
  {
    label: "My Activity",
    href: "/student/activity",
  },
  {
    label: "Credentials",
    href: "/student/credentials",
  },
  {
    label: "Profile",
    href: "/student/profile",
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
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getCredentialImage(
  item: CredentialItem,
) {
  const text =
    `${item.application.project.title} ${item.application.project.description}`.toLowerCase();

  if (
    text.includes("environment") ||
    text.includes("beach") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("education") ||
    text.includes("teach") ||
    text.includes("school")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("technology") ||
    text.includes("digital") ||
    text.includes("tech")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
  }

  return heroImage;
}

export default function StudentCredentialsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [credentials, setCredentials] =
    useState<CredentialItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<FilterStatus>("all");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "student") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadCredentials(
      authToken: string,
    ) {
      try {
        const applicationResult =
          await apiFetch<ApplicationsResponse>(
            "/student/applications",
            {
              token: authToken,
            },
          );

        const results =
          await Promise.all(
            applicationResult.data.map(
              async (application) => {
                try {
                  const credentialResult =
                    await apiFetch<CredentialResponse>(
                      `/student/applications/${application.id}/credential`,
                      {
                        token: authToken,
                      },
                    );

                  if (!credentialResult.data) {
                    return null;
                  }

                  return {
                    application,
                    credential:
                      credentialResult.data,
                  };
                } catch {
                  return null;
                }
              },
            ),
          );

        const availableCredentials =
          results.filter(
            (
              item,
            ): item is CredentialItem =>
              item !== null,
          );

        setCredentials(
          availableCredentials,
        );
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

    loadCredentials(token);
  }, [router]);

  const stats = useMemo(() => {
    const active =
      credentials.filter(
        (item) =>
          item.credential.status ===
          "active",
      ).length;

    const revoked =
      credentials.filter(
        (item) =>
          item.credential.status ===
          "revoked",
      ).length;

    return {
      total: credentials.length,
      active,
      revoked,
    };
  }, [credentials]);

  const filteredCredentials =
    useMemo(() => {
      if (filter === "all") {
        return credentials;
      }

      return credentials.filter(
        (item) =>
          item.credential.status ===
          filter,
      );
    }, [credentials, filter]);

  const latestCredential =
    useMemo(() => {
      if (credentials.length === 0) {
        return null;
      }

      return [...credentials].sort(
        (a, b) =>
          new Date(
            b.credential.issued_at,
          ).getTime() -
          new Date(
            a.credential.issued_at,
          ).getTime(),
      )[0];
    }, [credentials]);

  const activeRate =
    stats.total > 0
      ? Math.round(
          (stats.active /
            stats.total) *
            100,
        )
      : 0;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan credentials...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
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
          <div className="grid min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                VERIFIED EXPERIENCE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Your achievements ✨
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Your contribution.

                <span className="block text-[#6d35e8]">
                  Verified forever.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Credential menjadi bukti
                pengalaman volunteer yang
                sudah diselesaikan dan
                divalidasi oleh organisasi.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/activity",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  My Activity
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Explore More →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Volunteer achievement"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* HEALTH BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs text-emerald-600">
                  ✓
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Credential Health
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {activeRate}% active
                  </p>
                </div>
              </div>

              {/* LATEST CREDENTIAL */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                {latestCredential ? (
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                          Latest Credential
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                        <StatusBadge
                          status={
                            latestCredential
                              .credential.status
                          }
                        />
                      </div>

                      <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                        {
                          latestCredential
                            .application.project
                            .title
                        }
                      </h3>

                      <p className="mt-2 text-[10px] font-medium text-[#81748c]">
                        {
                          latestCredential
                            .credential
                            .credential_number
                        }
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8c7f96]">
                        <span>
                          Issued{" "}
                          {formatDate(
                            latestCredential
                              .credential
                              .issued_at,
                          )}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#c8becf]" />

                        <span>
                          📍{" "}
                          {latestCredential
                            .application.project
                            .location ??
                            "Flexible location"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/applications/${latestCredential.application.id}/credential`,
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                      aria-label="View credential"
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
                ) : (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                      Latest Credential
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                      No credential yet
                    </h3>

                    <p className="mt-2 text-[10px] text-[#8c7f96]">
                      Complete a volunteer
                      journey to earn your
                      first credential.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-3">
            <HeroStat
              label="Total Credentials"
              value={stats.total}
              description="All achievements"
            />

            <HeroStat
              label="Active"
              value={stats.active}
              description="Verified and valid"
            />

            <HeroStat
              label="Revoked"
              value={stats.revoked}
              description="No longer active"
            />
          </div>
        </motion.section>

        {/* ERROR */}
        {!loading && error && (
          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              Gagal memuat credentials
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* LIST */}
        <motion.section
          variants={sectionVariants}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Achievements
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                My credentials
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Semua credential dari
                volunteer activity yang
                sudah berhasil diselesaikan.
              </p>
            </div>

            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#eee8f4] bg-white p-1">
              <FilterButton
                label="All"
                active={filter === "all"}
                onClick={() =>
                  setFilter("all")
                }
              />

              <FilterButton
                label="Active"
                active={filter === "active"}
                onClick={() =>
                  setFilter("active")
                }
              />

              <FilterButton
                label="Revoked"
                active={filter === "revoked"}
                onClick={() =>
                  setFilter("revoked")
                }
              />
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[300px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            credentials.length === 0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl text-[#6d35e8]">
                  ◇
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  Belum ada credential
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786d83]">
                  Credential akan muncul
                  setelah kegiatan selesai,
                  attendance divalidasi, dan
                  completion dikonfirmasi NGO.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/activity",
                    )
                  }
                  className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
                >
                  View My Activity
                </button>
              </div>
            )}

          {/* EMPTY FILTER */}
          {!loading &&
            !error &&
            credentials.length > 0 &&
            filteredCredentials.length ===
              0 && (
              <div className="mt-6 rounded-[22px] border border-[#eeeaf5] bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[#30283e]">
                  Tidak ada credential
                  dengan status ini.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("all")
                  }
                  className="mt-3 text-sm font-semibold text-[#6d35e8]"
                >
                  View all credentials
                </button>
              </div>
            )}

          {/* CREDENTIAL CARDS */}
          {!loading &&
            !error &&
            filteredCredentials.length >
              0 && (
              <motion.div
                key={filter}
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},

                  show: {
                    transition: {
                      staggerChildren:
                        0.06,
                    },
                  },
                }}
                className="mt-6 grid items-stretch gap-5 lg:grid-cols-2"
              >
                {filteredCredentials.map(
                  (item) => (
                    <CredentialCard
                      key={
                        item.credential.id
                      }
                      item={item}
                      onView={() =>
                        router.push(
                          `/student/applications/${item.application.id}/credential`,
                        )
                      }
                      onVerify={() =>
                        router.push(
                          `/credentials/verify/${encodeURIComponent(
                            item.credential
                              .credential_number,
                          )}`,
                        )
                      }
                    />
                  ),
                )}
              </motion.div>
            )}
        </motion.section>

        {/* INFO */}
        {!loading &&
          credentials.length > 0 && (
            <motion.section
              variants={sectionVariants}
              className="grid gap-5 md:grid-cols-3"
            >
              <InfoCard
                number="01"
                title="Completed"
                description="Volunteer activity selesai dan attendance sudah divalidasi."
              />

              <InfoCard
                number="02"
                title="Credential Issued"
                description="Credential diterbitkan sebagai bukti pengalaman volunteer."
              />

              <InfoCard
                number="03"
                title="Publicly Verifiable"
                description="Credential dapat dicek melalui public verification page."
              />
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
                Verified Experience
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Build a journey worth sharing.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Keep participating in
                meaningful projects and grow
                your verified volunteer
                experience.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/student")
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Explore Projects →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function CredentialCard({
  item,
  onView,
  onVerify,
}: {
  item: CredentialItem;
  onView: () => void;
  onVerify: () => void;
}) {
  const image =
    getCredentialImage(item);

  const isActive =
    item.credential.status ===
    "active";

  return (
    <motion.article
      variants={{
        hidden: {
          opacity: 0,
          y: 14,
        },

        show: {
          opacity: 1,
          y: 0,

          transition: {
            duration: 0.35,
            ease: "easeOut" as const,
          },
        },
      }}
      whileHover={{
        y: -3,
      }}
      className="group overflow-hidden rounded-[24px] border border-[#eeeaf5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
    >
      {/* IMAGE */}
      <div className="relative h-[160px] overflow-hidden">
        <img
          src={image}
          alt={
            item.application.project
              .title
          }
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

        <div className="absolute left-4 top-4">
          <StatusBadge
            status={
              item.credential.status
            }
          />
        </div>

        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Verified Volunteer Experience
          </p>

          <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-white">
            {
              item.application.project
                .title
            }
          </h3>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
              Credential ID
            </p>

            <p className="mt-1 truncate text-sm font-bold text-[#30283e]">
              {
                item.credential
                  .credential_number
              }
            </p>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isActive ? "✓" : "×"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#f0edf5] pt-4">
          <CredentialInfo
            label="Issued"
            value={formatDate(
              item.credential
                .issued_at,
            )}
          />

          <CredentialInfo
            label="Event"
            value={formatDate(
              item.application.project
                .start_at,
            )}
          />

          <CredentialInfo
            label="Status"
            value={
              item.credential.status
            }
          />
        </div>

        <div className="mt-4 rounded-xl bg-[#faf8ff] px-3.5 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#998ca4]">
            Location
          </p>

          <p className="mt-1 text-xs font-medium text-[#6f6379]">
            📍{" "}
            {item.application.project
              .location ??
              "Flexible location"}
          </p>
        </div>

        {item.credential.status ===
          "revoked" &&
          item.credential
            .revocation_reason && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-red-500">
                Revocation reason
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {
                  item.credential
                    .revocation_reason
                }
              </p>
            </div>
          )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#f0edf5] pt-4">
          <button
            type="button"
            onClick={onVerify}
            className="text-[11px] font-semibold text-[#6d35e8]"
          >
            Verify Publicly →
          </button>

          <button
            type="button"
            onClick={onView}
            className="rounded-lg bg-[#6d35e8] px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#5d2dca]"
          >
            View Credential
          </button>
        </div>
      </div>
    </motion.article>
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
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
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

function CredentialInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a095aa]">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 text-[10px] font-semibold capitalize text-[#392d43]">
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
      className={`shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[#f1ebff] text-[#6d35e8]"
          : "text-[#786d83] hover:bg-[#faf8ff]"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "revoked";
}) {
  const styles = {
    active:
      "bg-emerald-50 text-emerald-700",

    revoked:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize shadow-sm ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function InfoCard({
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