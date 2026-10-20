"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
  required_skills?: string[] | null;
  required_interests?: string[] | null;
  risk_level?: string | null;
  status?: string | null;
};

type Application = {
  id: number;
  status: string;

  attendance?: {
    id: number;
    status: string;
  } | null;

  completion?: {
    id: number;
    status: string;
  } | null;

  credential?: {
    id: number;
    status: string;
  } | null;
};

type ProjectsResponse = {
  message?: string;
  data?: Project[];
  projects?: Project[];
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type SubmitResponse = {
  message: string;
  data?: Project;
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
    case "draft":
      return "Draft";

    case "submitted":
      return "Under Review";

    case "approved":
      return "Approved";

    case "published":
      return "Published";

    case "rejected":
      return "Rejected";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return (
        status || "Unknown"
      );
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

    case "completed":
      return "bg-emerald-50 text-emerald-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-[#f1eef4] text-[#756a7e]";
  }
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

function getProjectImage(
  project: Project,
) {
  const text =
    `${project.title} ${project.description ?? ""}`.toLowerCase();

  if (
    text.includes("environment") ||
    text.includes("beach") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1600&q=90";
  }

  if (
    text.includes("education") ||
    text.includes("school") ||
    text.includes("teach")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=90";
  }

  if (
    text.includes("tech") ||
    text.includes("digital") ||
    text.includes("technology")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=90";
  }

  if (
    text.includes("football") ||
    text.includes("soccer") ||
    text.includes("futsal")
  ) {
    return "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=90";
  }

  return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";
}

export default function NgoProjectDetailPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const projectId =
    Number(params.id);

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [project, setProject] =
    useState<Project | null>(
      null,
    );

  const [
    applications,
    setApplications,
  ] = useState<Application[]>(
    [],
  );

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

    async function loadProject(
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

        const projects =
          response.data ||
          response.projects ||
          [];

        const found =
          projects.find(
            (item) =>
              item.id ===
              projectId,
          ) ?? null;

        if (!found) {
          setError(
            "Project tidak ditemukan.",
          );

          return;
        }

        setProject(found);

        try {
          const applicationResponse =
            await apiFetch<ApplicationsResponse>(
              `/ngo/projects/${projectId}/applications`,
              {
                token:
                  authToken,
              },
            );

          setApplications(
            applicationResponse.data,
          );
        } catch {
          setApplications([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil detail project.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject(token);
  }, [
    projectId,
    router,
  ]);

  async function handleSubmitProject() {
    if (!project) {
      return;
    }

    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<SubmitResponse>(
          `/ngo/projects/${project.id}/submit`,
          {
            method: "POST",
            token,
          },
        );

      setProject(
        (current) =>
          current
            ? {
                ...current,
                ...(response.data ??
                  {}),
                status:
                  response.data
                    ?.status ??
                  "submitted",
              }
            : current,
      );

      setSuccess(
        response.message ||
          "Project berhasil dikirim untuk review.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal submit project.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const stats =
    useMemo(() => {
      const pending =
        applications.filter(
          (application) =>
            application.status ===
            "pending",
        ).length;

      const accepted =
        applications.filter(
          (application) =>
            application.status ===
            "accepted",
        ).length;

      const validated =
        applications.filter(
          (application) =>
            application
              .attendance
              ?.status ===
            "validated",
        ).length;

      const completed =
        applications.filter(
          (application) =>
            application
              .completion
              ?.status ===
            "confirmed",
        ).length;

      return {
        total:
          applications.length,
        pending,
        accepted,
        validated,
        completed,
      };
    }, [applications]);

  const heroImage =
    useMemo(() => {
      if (!project) {
        return "";
      }

      return getProjectImage(
        project,
      );
    }, [project]);

  const isDraft =
    project?.status ===
    "draft";

  const isSubmitted =
    project?.status ===
    "submitted";

  const isPublished =
    project?.status ===
    "published";

  const projectProgress =
    useMemo(() => {
      switch (
        project?.status
      ) {
        case "published":
          return 100;

        case "approved":
          return 90;

        case "submitted":
          return 60;

        case "rejected":
          return 35;

        case "draft":
          return 25;

        default:
          return 15;
      }
    }, [project]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan project...
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <DashboardShell
        user={user}
        role="ngo"
        navigation={
          navigation
        }
      >
        <div className="space-y-6">
          <div className="h-[430px] animate-pulse rounded-[28px] border border-[#eeeaf5] bg-white" />

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="h-[390px] animate-pulse rounded-[24px] bg-white" />

            <div className="h-[390px] animate-pulse rounded-[24px] bg-white" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!project) {
    return (
      <DashboardShell
        user={user}
        role="ngo"
        navigation={
          navigation
        }
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-[24px] border border-red-100 bg-white p-8 text-center shadow-[0_10px_35px_rgba(72,45,120,0.06)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 font-bold text-red-600">
              ×
            </div>

            <h1 className="mt-4 text-xl font-semibold text-[#21172a]">
              Project tidak ditemukan
            </h1>

            <p className="mt-2 text-sm text-[#786d83]">
              {error ||
                "Project yang kamu cari tidak tersedia."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/projects",
                )
              }
              className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </DashboardShell>
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
        className="space-y-9"
      >
        {/* BACK */}
        <motion.div
          variants={
            sectionVariants
          }
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/ngo/projects",
              )
            }
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#81748c] transition-colors hover:text-[#6d35e8]"
          >
            ← Back to Projects
          </button>

          <span className="text-[10px] font-semibold text-[#a094aa]">
            Project #{project.id}
          </span>
        </motion.div>

        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[440px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                    project.status,
                  )}`}
                >
                  {getStatusLabel(
                    project.status,
                  )}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize ${getRiskClass(
                    project.risk_level,
                  )}`}
                >
                  {project.risk_level ??
                    "low"}{" "}
                  risk
                </span>
              </div>

              <h1 className="mt-5 max-w-[620px] text-[40px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                {project.title}
              </h1>

              <p className="mt-5 line-clamp-4 max-w-xl text-sm leading-7 text-[#74687f] sm:text-base">
                {project.description ||
                  "No project description available."}
              </p>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-medium text-[#7e7189]">
                <span>
                  📍{" "}
                  {project.location ??
                    "Flexible location"}
                </span>

                <span>
                  ◷{" "}
                  {formatDate(
                    project.start_at,
                  )}
                </span>

                <span>
                  👥{" "}
                  {project.capacity ??
                    0}{" "}
                  volunteer slots
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {isDraft && (
                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={
                      handleSubmitProject
                    }
                    className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit for Review →"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/applications",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Manage Applications
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {projectProgress}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Project Journey
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {getStatusLabel(
                      project.status,
                    )}
                  </p>
                </div>
              </div>

              {/* PROJECT SNAPSHOT */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Project Snapshot
                </p>

                <h3 className="mt-2 truncate text-lg font-bold text-[#19131f]">
                  {project.title}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <SnapshotItem
                    label="Applicants"
                    value={
                      stats.total
                    }
                  />

                  <SnapshotItem
                    label="Accepted"
                    value={
                      stats.accepted
                    }
                  />

                  <SnapshotItem
                    label="Validated"
                    value={
                      stats.validated
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
                        width: `${projectProgress}%`,
                      }}
                      transition={{
                        duration: 0.7,
                      }}
                      className="h-full rounded-full bg-[#6d35e8]"
                    />
                  </div>

                  <span className="text-[9px] font-semibold text-[#8e8299]">
                    Workflow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroInfo
              label="Start"
              value={formatDate(
                project.start_at,
              )}
              description={formatTime(
                project.start_at,
              )}
            />

            <HeroInfo
              label="End"
              value={formatDate(
                project.end_at,
              )}
              description={formatTime(
                project.end_at,
              )}
            />

            <HeroInfo
              label="Capacity"
              value={`${project.capacity ?? 0}`}
              description="Volunteer slots"
            />

            <HeroInfo
              label="Applicants"
              value={`${stats.total}`}
              description="Total applications"
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
                  Project submitted
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          {/* DETAILS */}
          <div className="space-y-6">
            {/* OVERVIEW */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Project Overview
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                About this opportunity
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#766a80]">
                {project.description ||
                  "No description available."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailBox
                  label="Location"
                  value={
                    project.location ??
                    "Flexible location"
                  }
                />

                <DetailBox
                  label="Risk Level"
                  value={`${project.risk_level ?? "low"} risk`}
                />

                <DetailBox
                  label="Start"
                  value={`${formatDate(
                    project.start_at,
                  )} • ${formatTime(
                    project.start_at,
                  )}`}
                />

                <DetailBox
                  label="End"
                  value={`${formatDate(
                    project.end_at,
                  )} • ${formatTime(
                    project.end_at,
                  )}`}
                />
              </div>
            </div>

            {/* REQUIREMENTS */}
            <div className="grid gap-5 md:grid-cols-2">
              <RequirementCard
                eyebrow="Required Skills"
                title="Skills"
                emptyText="No required skills."
                items={
                  project.required_skills ??
                  []
                }
              />

              <RequirementCard
                eyebrow="Relevant Interests"
                title="Interests"
                emptyText="No interests specified."
                items={
                  project.required_interests ??
                  []
                }
              />
            </div>

            {/* APPLICATION PIPELINE */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Volunteer Pipeline
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                    Participation overview
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/applications",
                    )
                  }
                  className="text-xs font-semibold text-[#6d35e8]"
                >
                  Manage Applications →
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PipelineStat
                  label="Applications"
                  value={
                    stats.total
                  }
                />

                <PipelineStat
                  label="Pending"
                  value={
                    stats.pending
                  }
                />

                <PipelineStat
                  label="Accepted"
                  value={
                    stats.accepted
                  }
                />

                <PipelineStat
                  label="Completed"
                  value={
                    stats.completed
                  }
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* STATUS */}
            <div className="rounded-[24px] border border-[#e8dfff] bg-[#f7f3ff] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6d35e8] shadow-sm">
                  ◇
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                    project.status,
                  )}`}
                >
                  {getStatusLabel(
                    project.status,
                  )}
                </span>
              </div>

              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
                Project Status
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[#30233a]">
                {isDraft &&
                  "Ready when you are."}

                {isSubmitted &&
                  "Waiting for admin review."}

                {isPublished &&
                  "Project is live."}

                {project.status ===
                  "rejected" &&
                  "Project needs attention."}

                {!isDraft &&
                  !isSubmitted &&
                  !isPublished &&
                  project.status !==
                    "rejected" &&
                  getStatusLabel(
                    project.status,
                  )}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#7d6d89]">
                {isDraft &&
                  "Project masih draft dan belum terlihat oleh student."}

                {isSubmitted &&
                  "Project sudah dikirim dan sedang menunggu moderation admin."}

                {isPublished &&
                  "Project sudah published dan dapat ditemukan student."}

                {project.status ===
                  "rejected" &&
                  "Project ditolak saat moderation. Review kembali detail project sebelum melanjutkan."}
              </p>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#6d35e8]"
                  style={{
                    width: `${projectProgress}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[9px] text-[#998aa5]">
                <span>
                  Draft
                </span>

                <span>
                  Review
                </span>

                <span>
                  Published
                </span>
              </div>

              {isDraft && (
                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={
                    handleSubmitProject
                  }
                  className="mt-6 w-full rounded-xl bg-[#6d35e8] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,53,232,0.16)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Project →"}
                </button>
              )}
            </div>

            {/* WORKFLOW */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.04)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
                Project Journey
              </p>

              <div className="mt-5 space-y-4">
                <WorkflowStep
                  number="01"
                  title="Draft Created"
                  active
                />

                <WorkflowStep
                  number="02"
                  title="Submitted"
                  active={
                    projectProgress >=
                    60
                  }
                />

                <WorkflowStep
                  number="03"
                  title="Admin Review"
                  active={
                    projectProgress >=
                    60
                  }
                />

                <WorkflowStep
                  number="04"
                  title="Published"
                  active={
                    project.status ===
                      "published" ||
                    projectProgress >=
                      100
                  }
                  last
                />
              </div>
            </div>

            {/* QUICK ACTION */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
                Quick Actions
              </p>

              <div className="mt-4 space-y-2">
                <QuickAction
                  title="Applications"
                  description="Review volunteers"
                  onClick={() =>
                    router.push(
                      "/ngo/applications",
                    )
                  }
                />

                <QuickAction
                  title="All Projects"
                  description="Back to project library"
                  onClick={() =>
                    router.push(
                      "/ngo/projects",
                    )
                  }
                />

                <QuickAction
                  title="Create Another"
                  description="Start a new draft"
                  onClick={() =>
                    router.push(
                      "/ngo/projects/create",
                    )
                  }
                />
              </div>
            </div>
          </aside>
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
                Volunteer Impact
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Build the right team for this project.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Review applicants and guide
                volunteers through the
                complete participation
                journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/ngo/applications",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Review Applications →
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
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="max-w-[145px] truncate text-right text-xs font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] px-4 py-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9d91a6]">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold capitalize leading-5 text-[#4b3f55]">
        {value}
      </p>
    </div>
  );
}

function RequirementCard({
  eyebrow,
  title,
  items,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_6px_22px_rgba(72,45,120,0.04)]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-semibold text-[#21172a]">
        {title}
      </h3>

      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map(
            (item) => (
              <span
                key={item}
                className="rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[9px] font-semibold text-[#6d35e8]"
              >
                {item}
              </span>
            ),
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#9d91a6]">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function PipelineStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.11em] text-[#9d91a6]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#261a30]">
        {value}
      </p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  active,
  last = false,
}: {
  number: string;
  title: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div
          className={`absolute left-[13px] top-7 h-6 w-px ${
            active
              ? "bg-[#cdbdf3]"
              : "bg-[#eeeaf2]"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[8px] font-bold ${
          active
            ? "bg-[#6d35e8] text-white"
            : "bg-[#f3f0f5] text-[#aaa0b2]"
        }`}
      >
        {number}
      </div>

      <div className="pt-1">
        <p
          className={`text-[11px] font-semibold ${
            active
              ? "text-[#403249]"
              : "text-[#9c90a4]"
          }`}
        >
          {title}
        </p>
      </div>
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
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#eeeaf5] px-4 py-3.5 text-left transition-colors hover:bg-[#faf8ff]"
    >
      <div>
        <p className="text-xs font-semibold text-[#43364c]">
          {title}
        </p>

        <p className="mt-1 text-[9px] text-[#9a8da4]">
          {description}
        </p>
      </div>

      <span className="text-xs font-semibold text-[#6d35e8]">
        →
      </span>
    </button>
  );
}