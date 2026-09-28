"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import { adminNavigation } from "@/lib/admin-navigation";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type NgoProfile = {
  id: number;
  organization_name?: string | null;
  verification_status?: string | null;
  risk_level?: string | null;
};

type Project = {
  id: number;
  ngo_profile_id: number;
  title: string;
  description: string;
  location?: string | null;
  start_at: string;
  end_at: string;
  capacity: number;
  required_skills?: string[] | null;
  required_interests?: string[] | null;
  status: string;
  risk_level: "low" | "medium" | "high";
  rejection_reason?: string | null;
  ngo_profile?: NgoProfile | null;
  ngoProfile?: NgoProfile | null;
};

type ProjectsResponse = {
  message: string;
  data: Project[];
};

type ActionResponse = {
  message: string;
  data: Project;
};

type FilterMode =
  | "all"
  | "low"
  | "medium"
  | "high";

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
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90";

function formatDate(
  date: string,
) {
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
  date: string,
) {
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

function riskClass(
  risk: string,
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

function verificationClass(
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
    default:
      return "bg-[#f1eef4] text-[#746b7c]";
  }
}

function getProjectImage(
  project: Project,
) {
  const text =
    `${project.title} ${project.description}`.toLowerCase();

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

  return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85";
}

function getNgo(
  project: Project,
) {
  return (
    project.ngo_profile ??
    project.ngoProfile ??
    null
  );
}

export default function AdminProjectsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [projects, setProjects] =
    useState<Project[]>([]);

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
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    filterMode,
    setFilterMode,
  ] = useState<FilterMode>(
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

    async function loadProjects(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<ProjectsResponse>(
            "/admin/projects/submitted",
            {
              token:
                authToken,
            },
          );

        setProjects(
          response.data,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil submitted projects.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects(token);
  }, [router]);

  async function handleApprove(
    projectId: number,
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
      projectId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/admin/projects/${projectId}/approve`,
          {
            method: "POST",
            token,
          },
        );

      setProjects(
        (current) =>
          current.filter(
            (project) =>
              project.id !==
              projectId,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal approve project.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(
    projectId: number,
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
      rejectionReason.trim()
        .length < 5
    ) {
      setError(
        "Rejection reason minimal 5 karakter.",
      );

      return;
    }

    setProcessingId(
      projectId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/admin/projects/${projectId}/reject`,
          {
            method: "POST",
            token,

            body: JSON.stringify(
              {
                rejection_reason:
                  rejectionReason.trim(),
              },
            ),
          },
        );

      setProjects(
        (current) =>
          current.filter(
            (project) =>
              project.id !==
              projectId,
          ),
      );

      setRejectingId(
        null,
      );

      setRejectionReason(
        "",
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal reject project.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  const stats =
    useMemo(() => {
      const low =
        projects.filter(
          (project) =>
            project.risk_level ===
            "low",
        ).length;

      const medium =
        projects.filter(
          (project) =>
            project.risk_level ===
            "medium",
        ).length;

      const high =
        projects.filter(
          (project) =>
            project.risk_level ===
            "high",
        ).length;

      return {
        total:
          projects.length,
        low,
        medium,
        high,
      };
    }, [projects]);

  const filteredProjects =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const ngo =
            getNgo(
              project,
            );

          const matchesSearch =
            !keyword ||
            project.title
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            project.description
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              project.location ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              ngo?.organization_name ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              );

          const matchesFilter =
            filterMode ===
              "all" ||
            project.risk_level ===
              filterMode;

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      projects,
      search,
      filterMode,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan project review...
        </div>
      </main>
    );
  }

  return (
   <DashboardShell
  user={user}
  role="admin"
  navigation={adminNavigation}
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
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                PROJECT MODERATION
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Admin review workspace
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Review opportunities.

                <span className="block text-[#6d35e8]">
                  Publish with confidence.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Review submitted volunteer
                projects sebelum project
                dipublikasikan ke student.
                Periksa schedule, capacity,
                requirements, NGO status,
                dan risk level.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "project-queue",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Review Projects
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/verifications",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  NGO Verifications →
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Project moderation"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  {stats.total}
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Moderation Queue
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Submitted Projects
                  </p>
                </div>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Queue Overview
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  Risk distribution
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-[#81748c]">
                  Use risk context as one
                  part of project review.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <HeroStat
                    label="Low"
                    value={
                      stats.low
                    }
                  />

                  <HeroStat
                    label="Medium"
                    value={
                      stats.medium
                    }
                  />

                  <HeroStat
                    label="High"
                    value={
                      stats.high
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <InfoStrip
              label="Submitted"
              value={`${stats.total}`}
              description="Waiting review"
            />

            <InfoStrip
              label="Low Risk"
              value={`${stats.low}`}
              description="Standard review"
            />

            <InfoStrip
              label="Medium Risk"
              value={`${stats.medium}`}
              description="Additional attention"
            />

            <InfoStrip
              label="High Risk"
              value={`${stats.high}`}
              description="Priority review"
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
          id="project-queue"
          className="scroll-mt-28"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Moderation Queue
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Submitted projects
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                Review setiap project
                sebelum dipublish ke
                marketplace student.
              </p>
            </div>

            <div className="relative min-w-[270px]">
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
                placeholder="Search project, NGO, location..."
                className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3 pl-10 pr-4 text-xs text-[#43364c] outline-none transition placeholder:text-[#aea3b6] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterButton
              label={`All (${stats.total})`}
              active={
                filterMode ===
                "all"
              }
              onClick={() =>
                setFilterMode(
                  "all",
                )
              }
            />

            <FilterButton
              label={`Low (${stats.low})`}
              active={
                filterMode ===
                "low"
              }
              onClick={() =>
                setFilterMode(
                  "low",
                )
              }
            />

            <FilterButton
              label={`Medium (${stats.medium})`}
              active={
                filterMode ===
                "medium"
              }
              onClick={() =>
                setFilterMode(
                  "medium",
                )
              }
            />

            <FilterButton
              label={`High (${stats.high})`}
              active={
                filterMode ===
                "high"
              }
              onClick={() =>
                setFilterMode(
                  "high",
                )
              }
            />
          </div>
        </motion.section>

        {/* PROJECTS */}
        {loading ? (
          <motion.div
            variants={
              sectionVariants
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-[650px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                />
              ),
            )}
          </motion.div>
        ) : filteredProjects.length ===
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
              No matching projects
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#84788e]">
              {projects.length ===
              0
                ? "Semua submitted project sudah diproses."
                : "Tidak ada project yang cocok dengan search atau filter."}
            </p>
          </motion.section>
        ) : (
          <motion.section
            variants={
              sectionVariants
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {filteredProjects.map(
              (project) => {
                const ngo =
                  getNgo(
                    project,
                  );

                const isRejecting =
                  rejectingId ===
                  project.id;

                const isProcessing =
                  processingId ===
                  project.id;

                return (
                  <motion.article
                    key={
                      project.id
                    }
                    whileHover={{
                      y: -2,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
                  >
                    {/* IMAGE */}
                    <div className="relative h-[220px] overflow-hidden">
                      <img
                        src={getProjectImage(
                          project,
                        )}
                        alt={
                          project.title
                        }
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

                      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold text-[#6d35e8] backdrop-blur-md">
                          Submitted
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize ${riskClass(
                            project.risk_level,
                          )}`}
                        >
                          {
                            project.risk_level
                          }{" "}
                          risk
                        </span>
                      </div>

                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">
                          Project #
                          {
                            project.id
                          }
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                          {
                            project.title
                          }
                        </h3>

                        <p className="mt-1 text-xs font-medium text-white/75">
                          {ngo?.organization_name ||
                            `NGO #${project.ngo_profile_id}`}
                        </p>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {ngo?.verification_status && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${verificationClass(
                              ngo.verification_status,
                            )}`}
                          >
                            NGO{" "}
                            {
                              ngo.verification_status
                            }
                          </span>
                        )}

                        <span className="rounded-full bg-[#f3eeff] px-2.5 py-1 text-[9px] font-semibold text-[#6d35e8]">
                          {
                            project.capacity
                          }{" "}
                          slots
                        </span>
                      </div>

                      <p className="mt-5 line-clamp-4 text-sm leading-7 text-[#786d83]">
                        {
                          project.description
                        }
                      </p>

                      {/* DETAILS */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <DetailBox
                          label="Location"
                          value={
                            project.location ||
                            "-"
                          }
                        />

                        <DetailBox
                          label="Capacity"
                          value={`${project.capacity} volunteers`}
                        />

                        <DetailBox
                          label="Date"
                          value={formatDate(
                            project.start_at,
                          )}
                        />

                        <DetailBox
                          label="Time"
                          value={`${formatTime(
                            project.start_at,
                          )} — ${formatTime(
                            project.end_at,
                          )}`}
                        />
                      </div>

                      {/* SKILLS */}
                      {project.required_skills &&
                        project.required_skills.length >
                          0 && (
                          <TagSection
                            label="Required Skills"
                            items={
                              project.required_skills
                            }
                          />
                        )}

                      {/* INTERESTS */}
                      {project.required_interests &&
                        project.required_interests.length >
                          0 && (
                          <TagSection
                            label="Relevant Interests"
                            items={
                              project.required_interests
                            }
                          />
                        )}

                      {/* REJECT */}
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
                          className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                              !
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-red-800">
                                Reject project
                              </p>

                              <p className="mt-1 text-[10px] leading-5 text-red-600/80">
                                Jelaskan perubahan
                                yang diperlukan
                                sebelum project
                                dapat disubmit ulang.
                              </p>
                            </div>
                          </div>

                          <textarea
                            rows={4}
                            maxLength={
                              2000
                            }
                            value={
                              rejectionReason
                            }
                            onChange={(
                              event,
                            ) =>
                              setRejectionReason(
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Jelaskan perubahan yang diperlukan..."
                            className="mt-4 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-xs leading-6 text-[#4b3d54] outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                          />

                          <div className="mt-2 flex items-center justify-between text-[9px] text-red-500">
                            <span>
                              Minimal 5
                              karakter
                            </span>

                            <span>
                              {
                                rejectionReason.length
                              }
                              /2000
                            </span>
                          </div>

                          <div className="mt-4 flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                setRejectingId(
                                  null,
                                );

                                setRejectionReason(
                                  "",
                                );
                              }}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600"
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
                                  project.id,
                                )
                              }
                              className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Rejecting..."
                                : "Confirm Reject"}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* ACTIONS */}
                      <div className="mt-6 border-t border-[#f0edf5] pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                              Moderation Decision
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-[#93869e]">
                              Approve akan
                              memproses project
                              menuju publication.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                setRejectingId(
                                  project.id,
                                );

                                setRejectionReason(
                                  "",
                                );

                                setError(
                                  "",
                                );

                                setSuccess(
                                  "",
                                );
                              }}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
                                  project.id,
                                )
                              }
                              className="rounded-lg bg-[#6d35e8] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(109,53,232,0.15)] transition hover:bg-[#5d2dca] disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Processing..."
                                : "Approve & Publish →"}
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

        {/* PRINCIPLES */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Moderation Principles
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Review before publish
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <PrincipleCard
              number="01"
              title="Clarity"
              description="Pastikan title, description, lokasi, dan schedule cukup jelas."
            />

            <PrincipleCard
              number="02"
              title="Requirements"
              description="Review skills, interests, capacity, dan expectation volunteer."
            />

            <PrincipleCard
              number="03"
              title="Risk Context"
              description="Gunakan risk level sebagai bagian dari proses moderation."
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
                Credential Integrity
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Keep issued credentials trustworthy.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Setelah moderation project,
                admin juga dapat memonitor
                dan revoke credentials bila
                diperlukan.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/credentials",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Manage Credentials →
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

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8da5]">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#4e4258]">
        {value}
      </p>
    </div>
  );
}

function TagSection({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="mt-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9789a2]">
        {label}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
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