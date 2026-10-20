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

type Project = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  capacity?: number | null;
  status?: string | null;
};

type ProjectsResponse = {
  message?: string;
  data?: Project[];
  projects?: Project[];
};

type FilterStatus =
  | "all"
  | "draft"
  | "submitted"
  | "published"
  | "approved"
  | "rejected";

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

const fallbackHeroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "No date";
  }

  return new Date(
    date,
  ).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function formatTime(
  date?: string | null,
) {
  if (!date) {
    return "--:--";
  }

  return new Date(
    date,
  ).toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(
  status?: string | null,
) {
  switch (status) {
    case "published":
      return "Published";

    case "submitted":
      return "Under Review";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "draft":
      return "Draft";

    default:
      return status || "Unknown";
  }
}

function getStatusClass(
  status?: string | null,
) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700";

    case "approved":
      return "bg-[#f1ebff] text-[#6d35e8]";

    case "submitted":
      return "bg-amber-50 text-amber-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "draft":
      return "bg-[#f1eef4] text-[#756a7e]";

    default:
      return "bg-[#f1eef4] text-[#756a7e]";
  }
}

function getProjectImage(
  project: Project,
) {
  const text =
    `${project.title} ${project.description ?? ""}`.toLowerCase();

  if (
    text.includes("beach") ||
    text.includes("cleanup") ||
    text.includes("environment")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1400&q=85";
  }

  if (
    text.includes("education") ||
    text.includes("school") ||
    text.includes("teach")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85";
  }

  if (
    text.includes("tech") ||
    text.includes("digital") ||
    text.includes("technology")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85";
  }

  if (
    text.includes("football") ||
    text.includes("soccer") ||
    text.includes("futsal")
  ) {
    return "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1400&q=85";
  }

  return fallbackHeroImage;
}

export default function NgoProjectsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterStatus>(
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
      "ngo"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProjects(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<ProjectsResponse>(
            "/ngo/projects",
            {
              token:
                authToken,
            },
          );

        setProjects(
          response.data ||
            response.projects ||
            [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data project.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects(token);
  }, [router]);

  const stats =
    useMemo(() => {
      const published =
        projects.filter(
          (project) =>
            project.status ===
            "published",
        ).length;

      const submitted =
        projects.filter(
          (project) =>
            project.status ===
            "submitted",
        ).length;

      const rejected =
        projects.filter(
          (project) =>
            project.status ===
            "rejected",
        ).length;

      const draft =
        projects.filter(
          (project) =>
            project.status ===
            "draft",
        ).length;

      return {
        total:
          projects.length,
        published,
        submitted,
        rejected,
        draft,
      };
    }, [projects]);

  const featuredProject =
    useMemo(() => {
      if (
        projects.length === 0
      ) {
        return null;
      }

      const published =
        projects.find(
          (project) =>
            project.status ===
            "published",
        );

      return (
        published ??
        projects[0]
      );
    }, [projects]);

  const filteredProjects =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const matchesFilter =
            filter === "all" ||
            project.status ===
              filter;

          const matchesSearch =
            !keyword ||
            project.title
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            project.description
              ?.toLowerCase()
              .includes(
                keyword,
              ) ||
            project.location
              ?.toLowerCase()
              .includes(
                keyword,
              );

          return (
            matchesFilter &&
            Boolean(
              matchesSearch,
            )
          );
        },
      );
    }, [
      projects,
      search,
      filter,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan projects...
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

                PROJECT MANAGEMENT
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Your opportunities
                ✨
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Create opportunities.

                <span className="block text-[#6d35e8]">
                  Grow real impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Kelola semua project
                volunteer organisasi,
                pantau moderation status,
                dan buka kesempatan baru
                untuk student.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/projects/create",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  + Create Project
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/applications",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  View Applications →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[410px] overflow-hidden lg:block">
              <img
                src={
                  featuredProject
                    ? getProjectImage(
                        featuredProject,
                      )
                    : fallbackHeroImage
                }
                alt="Volunteer project"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* STATUS BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs font-bold text-[#6d35e8]">
                  {
                    stats.published
                  }
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Published
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Active opportunities
                  </p>
                </div>
              </div>

              {/* FEATURED PROJECT */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                {featuredProject ? (
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                          Featured Project
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${getStatusClass(
                            featuredProject.status,
                          )}`}
                        >
                          {getStatusLabel(
                            featuredProject.status,
                          )}
                        </span>
                      </div>

                      <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                        {
                          featuredProject.title
                        }
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#81748c]">
                        <span>
                          📍{" "}
                          {featuredProject.location ??
                            "Flexible location"}
                        </span>

                        <span className="h-1 w-1 self-center rounded-full bg-[#c6b9d4]" />

                        <span>
                          {formatDate(
                            featuredProject.start_at,
                          )}
                        </span>

                        <span className="h-1 w-1 self-center rounded-full bg-[#c6b9d4]" />

                        <span>
                          {featuredProject.capacity ??
                            0}{" "}
                          slots
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/ngo/projects/${featuredProject.id}`,
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                    >
                      →
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                      Featured Project
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                      Start your first
                      project.
                    </h3>

                    <p className="mt-2 text-[10px] text-[#8f829a]">
                      Create a volunteer
                      opportunity to begin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Total Projects"
              value={
                stats.total
              }
              description="All opportunities"
            />

            <HeroStat
              label="Published"
              value={
                stats.published
              }
              description="Visible to students"
            />

            <HeroStat
              label="Under Review"
              value={
                stats.submitted
              }
              description="Waiting moderation"
            />

            <HeroStat
              label="Rejected"
              value={
                stats.rejected
              }
              description="Need attention"
            />
          </div>
        </motion.section>

        {/* ERROR */}
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
                  Gagal memuat projects
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* FILTER + SEARCH */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Project Library
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Your projects
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Browse, review, dan
                manage semua volunteer
                opportunities organisasi.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-xl">
              {/* SEARCH */}
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#a092aa]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="6"
                    />

                    <path d="m16 16 4 4" />
                  </svg>
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search project..."
                  className="w-full rounded-xl border border-[#e9e3ef] bg-white py-3 pl-11 pr-4 text-sm text-[#352a3d] outline-none transition placeholder:text-[#b1a7b8] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                />
              </div>
            </div>
          </div>

          {/* FILTER BUTTONS */}
          <div className="mt-5 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#eee8f4] bg-white p-1">
            <FilterButton
              label="All"
              count={
                stats.total
              }
              active={
                filter === "all"
              }
              onClick={() =>
                setFilter(
                  "all",
                )
              }
            />

            <FilterButton
              label="Draft"
              count={
                stats.draft
              }
              active={
                filter ===
                "draft"
              }
              onClick={() =>
                setFilter(
                  "draft",
                )
              }
            />

            <FilterButton
              label="Under Review"
              count={
                stats.submitted
              }
              active={
                filter ===
                "submitted"
              }
              onClick={() =>
                setFilter(
                  "submitted",
                )
              }
            />

            <FilterButton
              label="Published"
              count={
                stats.published
              }
              active={
                filter ===
                "published"
              }
              onClick={() =>
                setFilter(
                  "published",
                )
              }
            />

            <FilterButton
              label="Rejected"
              count={
                stats.rejected
              }
              active={
                filter ===
                "rejected"
              }
              onClick={() =>
                setFilter(
                  "rejected",
                )
              }
            />
          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[360px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          )}

          {/* NO PROJECTS */}
          {!loading &&
            !error &&
            projects.length ===
              0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl text-[#6d35e8]">
                  +
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  No projects yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786d83]">
                  Buat volunteer
                  opportunity pertama
                  organisasi kamu.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/projects/create",
                    )
                  }
                  className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
                >
                  Create Project
                </button>
              </div>
            )}

          {/* FILTER EMPTY */}
          {!loading &&
            !error &&
            projects.length > 0 &&
            filteredProjects.length ===
              0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-[#6d35e8]">
                  ◇
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  No matching projects
                </h3>

                <p className="mt-2 text-sm text-[#786d83]">
                  Coba ganti search
                  atau filter status.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter(
                      "all",
                    );
                  }}
                  className="mt-4 text-sm font-semibold text-[#6d35e8]"
                >
                  Reset filter
                </button>
              </div>
            )}

          {/* PROJECT GRID */}
          {!loading &&
            !error &&
            filteredProjects.length >
              0 && (
              <motion.div
                key={`${filter}-${search}`}
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},

                  show: {
                    transition: {
                      staggerChildren:
                        0.05,
                    },
                  },
                }}
                className="mt-6 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {filteredProjects.map(
                  (
                    project,
                  ) => (
                    <ProjectCard
                      key={
                        project.id
                      }
                      project={
                        project
                      }
                      onOpen={() =>
                        router.push(
                          `/ngo/projects/${project.id}`,
                        )
                      }
                    />
                  ),
                )}
              </motion.div>
            )}
        </motion.section>

        {/* STATUS GUIDE */}
        {!loading &&
          projects.length > 0 && (
            <motion.section
              variants={
                sectionVariants
              }
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                  Project Workflow
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                  From idea to impact
                </h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <WorkflowCard
                  number="01"
                  title="Draft"
                  description="Prepare your volunteer opportunity."
                />

                <WorkflowCard
                  number="02"
                  title="Submit"
                  description="Send the project for moderation."
                />

                <WorkflowCard
                  number="03"
                  title="Published"
                  description="Students can discover and apply."
                />

                <WorkflowCard
                  number="04"
                  title="Manage"
                  description="Review applicants and participation."
                />
              </div>
            </motion.section>
          )}

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
                NGO Projects
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Ready to create another opportunity?
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Build a meaningful
                project and connect
                students with real
                volunteer experience.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/projects/create",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              + Create Project
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  const image =
    getProjectImage(
      project,
    );

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
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#eeeaf5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
    >
      {/* IMAGE */}
      <div className="relative h-[185px] overflow-hidden">
        <img
          src={image}
          alt={
            project.title
          }
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute left-4 top-4">
          <span
            className={`rounded-full px-3 py-1.5 text-[9px] font-semibold shadow-sm ${getStatusClass(
              project.status,
            )}`}
          >
            {getStatusLabel(
              project.status,
            )}
          </span>
        </div>

        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-white/65">
            Volunteer Opportunity
          </p>

          <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-tight text-white">
            {
              project.title
            }
          </h3>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-xs leading-5 text-[#7d7187]">
          {project.description ||
            "No project description available."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ProjectInfo
            label="Location"
            value={
              project.location ??
              "Flexible"
            }
          />

          <ProjectInfo
            label="Capacity"
            value={`${project.capacity ?? 0} slots`}
          />

          <ProjectInfo
            label="Start"
            value={formatDate(
              project.start_at,
            )}
          />

          <ProjectInfo
            label="Time"
            value={formatTime(
              project.start_at,
            )}
          />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#f0edf5] pt-5">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a094aa]">
              Project ID
            </p>

            <p className="mt-1 text-[10px] font-semibold text-[#62566d]">
              #{project.id}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onOpen
            }
            className="flex items-center gap-2 rounded-lg bg-[#f3eeff] px-3.5 py-2.5 text-[11px] font-semibold text-[#6d35e8] transition-colors hover:bg-[#6d35e8] hover:text-white"
          >
            Manage
            <span>
              →
            </span>
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

function ProjectInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] px-3.5 py-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9d91a6]">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-[#4a3e54]">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[#f1ebff] text-[#6d35e8]"
          : "text-[#786d83] hover:bg-[#faf8ff]"
      }`}
    >
      {label}

      <span
        className={`rounded-full px-1.5 py-0.5 text-[8px] ${
          active
            ? "bg-white text-[#6d35e8]"
            : "bg-[#f5f2f7] text-[#998da3]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function WorkflowCard({
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