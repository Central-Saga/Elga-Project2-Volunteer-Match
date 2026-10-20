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

type Application = {
  id: number;
  project_id: number;
  motivation: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  applied_at: string;
  reviewed_at: string | null;

  project: {
    id: number;
    title: string;
    description: string;
    location: string | null;
    start_at: string;
    end_at: string;
    status: string;
  };
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type FilterStatus =
  | "all"
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

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

const applicationHeroImage =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=90";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProjectImage(application: Application) {
  const text =
    `${application.project.title} ${application.project.description}`.toLowerCase();

  if (
    text.includes("environment") ||
    text.includes("beach") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("education") ||
    text.includes("school") ||
    text.includes("teach")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("digital")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
  }

  return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85";
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [applications, setApplications] =
    useState<Application[]>([]);

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

    async function loadApplications(
      authToken: string,
    ) {
      try {
        const result =
          await apiFetch<ApplicationsResponse>(
            "/student/applications",
            {
              token: authToken,
            },
          );

        setApplications(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil applications.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications(token);
  }, [router]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      pending: applications.filter(
        (application) =>
          application.status === "pending",
      ).length,

      accepted: applications.filter(
        (application) =>
          application.status === "accepted",
      ).length,

      rejected: applications.filter(
        (application) =>
          application.status === "rejected",
      ).length,
    };
  }, [applications]);

  const filteredApplications =
    useMemo(() => {
      if (filter === "all") {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status === filter,
      );
    }, [applications, filter]);

  const latestApplication =
    useMemo(() => {
      if (applications.length === 0) {
        return null;
      }

      return [...applications].sort(
        (a, b) =>
          new Date(b.applied_at).getTime() -
          new Date(a.applied_at).getTime(),
      )[0];
    }, [applications]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan applications...
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
          <div className="grid min-h-[340px] lg:grid-cols-[1fr_0.8fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                YOUR JOURNEY
              </div>

              <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#171321] sm:text-[46px]">
                Your applications.

                <span className="block text-[#6d35e8]">
                  Follow every step.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#74687f]">
                Pantau semua kegiatan yang sudah
                kamu daftarkan dan lihat status
                review dari organisasi.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/student")
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Explore Projects
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/activity",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  My Activity →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[340px] overflow-hidden lg:block">
              <img
                src={applicationHeroImage}
                alt="Volunteer application journey"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              {/* SUMMARY */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[20px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8e809b]">
                      Application Progress
                    </p>

                    <p className="mt-2 text-lg font-bold text-[#19131f]">
                      {stats.accepted} accepted
                    </p>

                    <p className="mt-1 text-[10px] text-[#92869d]">
                      from {stats.total} total applications
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1ebff] text-sm font-bold text-[#6d35e8]">
                    {stats.total > 0
                      ? Math.round(
                          (stats.accepted /
                            stats.total) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ede8f3]">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${
                        stats.total > 0
                          ? Math.round(
                              (stats.accepted /
                                stats.total) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                    transition={{
                      duration: 0.7,
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Total"
              value={stats.total}
              description="All applications"
            />

            <HeroStat
              label="Pending"
              value={stats.pending}
              description="Waiting for review"
            />

            <HeroStat
              label="Accepted"
              value={stats.accepted}
              description="Ready to participate"
            />

            <HeroStat
              label="Rejected"
              value={stats.rejected}
              description="Not selected"
            />
          </div>
        </motion.section>

        {/* ERROR */}
        {!loading && error && (
          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-red-100 bg-red-50 p-5"
          >
            <p className="text-sm font-semibold text-red-700">
              Gagal memuat applications
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* APPLICATION LIST */}
        <motion.section
          variants={sectionVariants}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Applications
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Track your journey
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Lihat status application dan detail
                project yang sudah kamu pilih.
              </p>
            </div>

            {/* FILTER */}
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#eee8f4] bg-white p-1">
              <FilterButton
                label="All"
                active={filter === "all"}
                onClick={() =>
                  setFilter("all")
                }
              />

              <FilterButton
                label="Pending"
                active={filter === "pending"}
                onClick={() =>
                  setFilter("pending")
                }
              />

              <FilterButton
                label="Accepted"
                active={filter === "accepted"}
                onClick={() =>
                  setFilter("accepted")
                }
              />

              <FilterButton
                label="Rejected"
                active={filter === "rejected"}
                onClick={() =>
                  setFilter("rejected")
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
                    className="h-[260px] animate-pulse rounded-[22px] border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          )}

          {/* EMPTY ALL */}
          {!loading &&
            !error &&
            applications.length === 0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl">
                  ✦
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  Belum ada application
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786d83]">
                  Mulai dari Explore dan temukan
                  kegiatan volunteer yang sesuai
                  dengan profile kamu.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/student")
                  }
                  className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
                >
                  Explore Projects
                </button>
              </div>
            )}

          {/* EMPTY FILTER */}
          {!loading &&
            !error &&
            applications.length > 0 &&
            filteredApplications.length === 0 && (
              <div className="mt-6 rounded-[22px] border border-[#eeeaf5] bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[#30283e]">
                  Tidak ada application dengan status ini.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("all")
                  }
                  className="mt-3 text-sm font-semibold text-[#6d35e8]"
                >
                  View all applications
                </button>
              </div>
            )}

          {/* CARDS */}
          {!loading &&
            !error &&
            filteredApplications.length > 0 && (
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
                {filteredApplications.map(
                  (application) => (
                    <ApplicationCard
                      key={application.id}
                      application={
                        application
                      }
                      onClick={() =>
                        router.push(
                          `/student/projects/${application.project.id}`,
                        )
                      }
                    />
                  ),
                )}
              </motion.div>
            )}
        </motion.section>

        {/* RECENT JOURNEY */}
        {!loading &&
          !error &&
          latestApplication && (
            <motion.section
              variants={sectionVariants}
              className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
            >
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                    Latest Application
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {
                      latestApplication
                        .project.title
                    }
                  </h2>

                  <p className="mt-2 text-sm text-white/75">
                    Applied{" "}
                    {formatDate(
                      latestApplication.applied_at,
                    )}{" "}
                    • Status:{" "}
                    {latestApplication.status}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/student/projects/${latestApplication.project.id}`,
                    )
                  }
                  className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
                >
                  View Project →
                </button>
              </div>
            </motion.section>
          )}
      </motion.div>
    </DashboardShell>
  );
}

function ApplicationCard({
  application,
  onClick,
}: {
  application: Application;
  onClick: () => void;
}) {
  const image =
    getProjectImage(application);

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
      className="group flex h-full overflow-hidden rounded-[22px] border border-[#eeeaf5] bg-white shadow-[0_6px_22px_rgba(72,45,120,0.05)]"
    >
      {/* IMAGE */}
      <div className="relative hidden w-[180px] shrink-0 overflow-hidden sm:block">
        <img
          src={image}
          alt={application.project.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={application.status}
          />

          <span className="text-[10px] text-[#a095aa]">
            Applied{" "}
            {formatDate(
              application.applied_at,
            )}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-semibold tracking-[-0.02em] text-[#21172a]">
          {application.project.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#84778f]">
          {application.project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-[#887b93]">
          <span>
            📍{" "}
            {application.project.location ??
              "Flexible location"}
          </span>

          <span>
            ◷{" "}
            {formatDate(
              application.project.start_at,
            )}
          </span>
        </div>

        {application.motivation && (
          <div className="mt-4 rounded-xl bg-[#faf8ff] px-3 py-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9b8ca7]">
              Motivation
            </p>

            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#75687f]">
              {application.motivation}
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#f0edf5] pt-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#a194aa]">
              Application ID
            </p>

            <p className="mt-1 text-[10px] font-semibold text-[#6f6379]">
              #{application.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 rounded-lg bg-[#f3eeff] px-3.5 py-2.5 text-[11px] font-semibold text-[#6d35e8] transition-colors hover:bg-[#6d35e8] hover:text-white"
          >
            View Project
            <span>→</span>
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
      className={`relative shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-colors ${
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
  status: Application["status"];
}) {
  const styles = {
    pending:
      "bg-amber-50 text-amber-700",

    accepted:
      "bg-emerald-50 text-emerald-700",

    rejected:
      "bg-red-50 text-red-700",

    withdrawn:
      "bg-[#f1eef4] text-[#746b7c]",
  };

  const labels = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}