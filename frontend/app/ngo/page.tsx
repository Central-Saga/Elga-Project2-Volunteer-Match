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

type NgoProfile = {
  id?: number;
  organization_name?: string | null;
  organization_description?: string | null;
  verification_status?: string | null;
};

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

type ProfileResponse = {
  message?: string;
  data?: NgoProfile;
  profile?: NgoProfile;
  [key: string]: unknown;
};

type ProjectsResponse = {
  message?: string;
  data?: Project[];
  projects?: Project[];
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

const ngoHeroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function getProfile(
  response: ProfileResponse,
): NgoProfile {
  if (response.profile) {
    return response.profile;
  }

  if (response.data) {
    return response.data;
  }

  return {
    organization_name:
      typeof response.organization_name ===
      "string"
        ? response.organization_name
        : null,

    organization_description:
      typeof response.organization_description ===
      "string"
        ? response.organization_description
        : null,

    verification_status:
      typeof response.verification_status ===
      "string"
        ? response.verification_status
        : null,
  };
}

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
      return "Submitted";

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
    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "submitted":
      return "bg-amber-50 text-amber-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    default:
      return "bg-[#f5f2f8] text-[#74687f]";
  }
}

function getVerificationCopy(
  status: string,
) {
  switch (status) {
    case "approved":
      return {
        label: "Verified Organization",
        title:
          "Your organization is verified.",
        description:
          "You can create and manage volunteer projects on Volunteer Match.",
      };

    case "submitted":
      return {
        label: "Under Review",
        title:
          "Verification is being reviewed.",
        description:
          "Your organization verification is currently waiting for admin review.",
      };

    case "rejected":
      return {
        label: "Needs Attention",
        title:
          "Verification needs an update.",
        description:
          "Review the verification result and update your organization information.",
      };

    default:
      return {
        label: "Not Verified",
        title:
          "Complete your organization verification.",
        description:
          "Verify your organization before managing the full volunteer project workflow.",
      };
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
    text.includes("tech") ||
    text.includes("digital") ||
    text.includes("technology")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("football") ||
    text.includes("soccer") ||
    text.includes("futsal")
  ) {
    return "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85";
  }

  return ngoHeroImage;
}

export default function NgoDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [profile, setProfile] =
    useState<NgoProfile | null>(
      null,
    );

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
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

    async function loadDashboard(
      authToken: string,
    ) {
      try {
        const [
          profileResponse,
          projectsResponse,
        ] =
          await Promise.all([
            apiFetch<ProfileResponse>(
              "/ngo/profile",
              {
                token:
                  authToken,
              },
            ),

            apiFetch<ProjectsResponse>(
              "/ngo/projects",
              {
                token:
                  authToken,
              },
            ),
          ]);

        setProfile(
          getProfile(
            profileResponse,
          ),
        );

        setProjects(
          projectsResponse.data ||
            projectsResponse.projects ||
            [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data NGO.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard(token);
  }, [router]);

  const projectStats =
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

      return {
        total:
          projects.length,

        published,

        submitted,

        rejected,
      };
    }, [projects]);

  const verificationStatus =
    profile?.verification_status ||
    "not_submitted";

  const organizationName =
    profile?.organization_name ||
    user?.name ||
    "Your Organization";

  const verificationCopy =
    getVerificationCopy(
      verificationStatus,
    );

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

  const featuredImage =
    featuredProject
      ? getProjectImage(
          featuredProject,
        )
      : ngoHeroImage;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan dashboard NGO...
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
          <div className="grid min-h-[440px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                NGO WORKSPACE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Welcome back 👋
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px] lg:text-[58px]">
                Create opportunities.

                <span className="block text-[#6d35e8]">
                  Build real impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                {organizationName} can
                create projects, review
                volunteer applications,
                and manage participation
                from one workspace.
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
                  Create Project
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
                  Review Applications →
                </button>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ebff] text-[#6d35e8]">
                  ✓
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#30283e]">
                    {
                      verificationCopy.label
                    }
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#94879f]">
                    {
                      verificationCopy.title
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              <img
                src={
                  featuredImage
                }
                alt={
                  featuredProject?.title ??
                  "Volunteer project"
                }
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

              {/* STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    verificationStatus ===
                    "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#f1ebff] text-[#6d35e8]"
                  }`}
                >
                  ✓
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Organization
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {
                      verificationCopy.label
                    }
                  </p>
                </div>
              </div>

              {/* FEATURED PROJECT */}
              {featuredProject && (
                <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                          Featured Project
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${getStatusClass(
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

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#81748c]">
                        <span>
                          📍{" "}
                          {featuredProject.location ||
                            "Location not specified"}
                        </span>

                        <span className="hidden h-1 w-1 rounded-full bg-[#c8becf] sm:block" />

                        <span>
                          {formatDate(
                            featuredProject.start_at,
                          )}
                        </span>

                        <span className="hidden h-1 w-1 rounded-full bg-[#c8becf] sm:block" />

                        <span>
                          {featuredProject.capacity ??
                            "-"}{" "}
                          volunteers
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-1 text-[10px] text-[#8b7e95]">
                        {featuredProject.description ||
                          "Manage project details and volunteer participation."}
                      </p>
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
              )}
            </div>
          </div>

          {/* STAT STRIP */}
          <div className="relative z-20 grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Total Projects"
              value={
                projectStats.total
              }
              description="All projects"
            />

            <HeroStat
              label="Published"
              value={
                projectStats.published
              }
              description="Visible to students"
            />

            <HeroStat
              label="Submitted"
              value={
                projectStats.submitted
              }
              description="Waiting for review"
            />

            <HeroStat
              label="Rejected"
              value={
                projectStats.rejected
              }
              description="Need changes"
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
            <p className="text-sm font-semibold text-red-700">
              Dashboard error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* VERIFICATION + QUICK ACTIONS */}
        {!loading && (
          <motion.section
            variants={
              sectionVariants
            }
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            {/* VERIFICATION */}
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Organization Verification
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                    {
                      verificationCopy.title
                    }
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6f84]">
                    {
                      verificationCopy.description
                    }
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold ${getStatusClass(
                    verificationStatus,
                  )}`}
                >
                  {getStatusLabel(
                    verificationStatus,
                  )}
                </span>
              </div>

              {verificationStatus !==
                "approved" && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/verification",
                    )
                  }
                  className="mt-5 text-sm font-semibold text-[#6d35e8]"
                >
                  Open verification →
                </button>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Quick Actions
              </p>

              <div className="mt-4 space-y-2.5">
                <QuickAction
                  title="Create Project"
                  description="Start a new volunteer opportunity."
                  onClick={() =>
                    router.push(
                      "/ngo/projects/create",
                    )
                  }
                />

                <QuickAction
                  title="Review Applications"
                  description="Review students who applied."
                  onClick={() =>
                    router.push(
                      "/ngo/applications",
                    )
                  }
                />

                <QuickAction
                  title="Manage Profile"
                  description="Update organization information."
                  onClick={() =>
                    router.push(
                      "/ngo/profile",
                    )
                  }
                />
              </div>
            </div>
          </motion.section>
        )}

        {/* PROJECTS */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Project Workspace
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Recent projects
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Manage project status,
                schedules, capacity,
                and volunteer activities.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/projects",
                )
              }
              className="text-xs font-semibold text-[#6d35e8]"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[360px] animate-pulse rounded-2xl border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          ) : projects.length ===
            0 ? (
            <div className="mt-6 rounded-[22px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl text-[#6d35e8]">
                +
              </div>

              <h3 className="mt-4 font-semibold text-[#19131f]">
                No projects yet
              </h3>

              <p className="mt-2 text-sm text-[#7d7188]">
                Create your first
                volunteer project.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/ngo/projects/create",
                  )
                }
                className="mt-5 rounded-lg bg-[#6d35e8] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Create Project
              </button>
            </div>
          ) : (
            <motion.div
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
              className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {projects
                .slice(0, 6)
                .map(
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
                      onClick={() =>
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
                Volunteer Match
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Create the next
                meaningful opportunity.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Connect your organization
                with students ready to
                contribute.
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
              Create Project →
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

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
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
        y: -4,
      }}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#eeeaf5] bg-white shadow-[0_6px_22px_rgba(72,45,120,0.05)]"
    >
      <div className="relative h-[175px] overflow-hidden">
        <img
          src={image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute right-3 top-3">
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

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Volunteer Project
          </p>

          <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-white">
            {project.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-[#786d83]">
          {project.description ||
            "No project description available."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#f0edf5] pt-4">
          <ProjectInfo
            label="Date"
            value={formatDate(
              project.start_at,
            )}
          />

          <ProjectInfo
            label="Time"
            value={`${formatTime(
              project.start_at,
            )} — ${formatTime(
              project.end_at,
            )}`}
          />

          <ProjectInfo
            label="Capacity"
            value={`${project.capacity ?? "-"} people`}
          />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#f0edf5] pt-4">
          <p className="line-clamp-1 text-[10px] font-medium text-[#8d8198]">
            📍{" "}
            {project.location ||
              "Location not specified"}
          </p>

          <button
            type="button"
            onClick={onClick}
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1ebff] text-[#6d35e8] transition-colors hover:bg-[#6d35e8] hover:text-white"
          >
            →
          </button>
        </div>
      </div>
    </motion.article>
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
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a095aa]">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-[#392d43]">
        {value}
      </p>
    </div>
  );
}