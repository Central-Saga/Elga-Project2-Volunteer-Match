"use client";

import {
  type FormEvent,
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

type MatchBreakdown = {
  skills: number;
  interests: number;
  availability: number;
  location: number;
};

type Project = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  start_at: string;
  end_at: string;
  capacity: number;
  required_skills: string[] | null;
  required_interests: string[] | null;
  status: string;

  match_score?: number;
  match_breakdown?: MatchBreakdown;
  match_reasons?: string[];
};

type ProjectResponse = {
  message: string;
  data: Project;
};

type ApplicationResponse = {
  message: string;

  data: {
    id: number;
    project_id: number;
    student_profile_id: number;
    motivation: string | null;
    status: string;
    applied_at: string;
  };
};

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

function getMatchLabel(
  score: number,
) {
  if (score >= 80) {
    return "Highly Recommended";
  }

  if (score >= 60) {
    return "Recommended";
  }

  if (score >= 40) {
    return "Potential Match";
  }

  return "Low Match";
}

function getProjectImage(
  project: Project,
) {
  const text = `${project.title} ${
    project.description
  } ${
    project.required_interests?.join(
      " ",
    ) ?? ""
  } ${
    project.required_skills?.join(
      " ",
    ) ?? ""
  }`.toLowerCase();

  if (
    text.includes("environment") ||
    text.includes("beach") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1600&q=90";
  }

  if (
    text.includes("education") ||
    text.includes("teach") ||
    text.includes("school")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=90";
  }

  if (
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("digital") ||
    text.includes("php") ||
    text.includes("laravel")
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

function formatDateTime(
  date: string,
) {
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

export default function StudentProjectDetailPage() {
  const router = useRouter();
  const params = useParams();

  const projectId =
    params.id as string;

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [project, setProject] =
    useState<Project | null>(
      null,
    );

  const [
    motivation,
    setMotivation,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [applying, setApplying] =
    useState(false);

  const [applied, setApplied] =
    useState(false);

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
      "student"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProject(
      authToken: string,
    ) {
      try {
        const result =
          await apiFetch<ProjectResponse>(
            `/student/projects/${projectId}`,
            {
              token:
                authToken,
            },
          );

        setProject(
          result.data,
        );
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

  async function handleApply(
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

    setApplying(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch<ApplicationResponse>(
        `/student/projects/${projectId}/apply`,
        {
          method: "POST",
          token,

          body: JSON.stringify({
            motivation:
              motivation.trim() ||
              null,
          }),
        },
      );

      setSuccess(
        "Application berhasil dikirim. Sekarang tunggu review dari NGO.",
      );

      setMotivation("");
      setApplied(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim application.",
      );
    } finally {
      setApplying(false);
    }
  }

  const matchScore =
    project?.match_score ??
    0;

  const matchBreakdown =
    project?.match_breakdown;

  const matchLabel =
    getMatchLabel(
      matchScore,
    );

  const heroImage =
    useMemo(() => {
      if (!project) {
        return "";
      }

      return getProjectImage(
        project,
      );
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
        role="student"
        navigation={
          navigation
        }
      >
        <div className="space-y-6">
          <div className="h-[430px] animate-pulse rounded-[28px] border border-[#eeeaf5] bg-white" />

          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="h-[400px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white" />

            <div className="h-[400px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (
    error &&
    !project
  ) {
    return (
      <DashboardShell
        user={user}
        role="student"
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
              Project tidak dapat dimuat
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student",
                )
              }
              className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Explore
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <DashboardShell
      user={user}
      role="student"
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
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/student",
              )
            }
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#81748c] transition-colors hover:text-[#6d35e8]"
          >
            <span>←</span>
            Back to Explore
          </button>
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-semibold text-emerald-700">
                  {project.status}
                </span>

                <span className="rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[9px] font-semibold text-[#6d35e8]">
                  {matchScore}% Match
                </span>

                <span className="rounded-full bg-[#faf8fc] px-3 py-1.5 text-[9px] font-semibold text-[#92859d]">
                  Project #{project.id}
                </span>
              </div>

              <h1 className="mt-5 max-w-[620px] text-[38px] font-semibold leading-[1.07] tracking-[-0.045em] text-[#171321] sm:text-[48px] lg:text-[54px]">
                {project.title}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#74687f]">
                {
                  project.description
                }
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
                  {project.capacity}{" "}
                  volunteer slots
                </span>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* MATCH BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs font-bold text-[#6d35e8]">
                  {matchScore}
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Smart Match
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {matchLabel}
                  </p>
                </div>
              </div>

              {/* PROJECT SNAPSHOT */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                      Project Snapshot
                    </p>

                    <h3 className="mt-2 truncate text-[18px] font-bold text-[#19131f]">
                      Ready to make an impact?
                    </h3>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <HeroSnapshot
                        label="Match"
                        value={`${matchScore}%`}
                      />

                      <HeroSnapshot
                        label="Capacity"
                        value={String(
                          project.capacity,
                        )}
                      />

                      <HeroSnapshot
                        label="Date"
                        value={formatDate(
                          project.start_at,
                        )}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee9f3]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                matchScore,
                              ),
                            )}%`,
                          }}
                          transition={{
                            duration: 0.7,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-[#6d35e8]"
                        />
                      </div>

                      <span className="text-[9px] font-semibold text-[#8e8299]">
                        Compatibility
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "apply-section",
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        })
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                    aria-label="Apply for project"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroInfo
              label="Location"
              value={
                project.location ??
                "Flexible"
              }
              description="Activity location"
            />

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
              value={`${project.capacity} people`}
              description="Volunteer slots"
            />
          </div>
        </motion.section>

        {/* MAIN */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-6 lg:grid-cols-[1fr_390px]"
        >
          {/* LEFT CONTENT */}
          <div className="space-y-6">
            {/* MATCH */}
            <div className="rounded-[24px] border border-[#e8dfff] bg-[#f7f3ff] p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Smart Matching
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#21172a]">
                    {matchLabel}
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#78698a]">
                    Match dihitung berdasarkan
                    skill, minat, availability,
                    dan lokasi profile kamu.
                  </p>
                </div>

                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[5px] border-white bg-white shadow-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold tracking-[-0.04em] text-[#6d35e8]">
                      {matchScore}
                    </p>

                    <p className="text-[8px] font-semibold text-[#9b8aa8]">
                      / 100
                    </p>
                  </div>
                </div>
              </div>

              {matchBreakdown && (
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <MatchRow
                    label="Skills"
                    value={
                      matchBreakdown.skills
                    }
                    maximum={40}
                  />

                  <MatchRow
                    label="Interests"
                    value={
                      matchBreakdown.interests
                    }
                    maximum={30}
                  />

                  <MatchRow
                    label="Availability"
                    value={
                      matchBreakdown.availability
                    }
                    maximum={20}
                  />

                  <MatchRow
                    label="Location"
                    value={
                      matchBreakdown.location
                    }
                    maximum={10}
                  />
                </div>
              )}

              {project.match_reasons &&
                project.match_reasons
                  .length > 0 && (
                  <div className="mt-7 border-t border-[#e5dcf2] pt-5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9584a4]">
                      Why this matches
                    </p>

                    <div className="mt-3 space-y-2.5">
                      {project.match_reasons.map(
                        (
                          reason,
                        ) => (
                          <div
                            key={
                              reason
                            }
                            className="flex items-start gap-2.5"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#6d35e8]">
                              ✓
                            </span>

                            <p className="text-xs leading-5 text-[#6f617c]">
                              {
                                reason
                              }
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* PROJECT DETAILS */}
            <div className="rounded-[24px] border border-[#eeeaf5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.04)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Project Details
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                About this opportunity
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#776b81]">
                {
                  project.description
                }
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Start"
                  value={formatDateTime(
                    project.start_at,
                  )}
                />

                <DetailItem
                  label="End"
                  value={formatDateTime(
                    project.end_at,
                  )}
                />

                <DetailItem
                  label="Location"
                  value={
                    project.location ??
                    "Flexible location"
                  }
                />

                <DetailItem
                  label="Capacity"
                  value={`${project.capacity} volunteers`}
                />
              </div>
            </div>

            {/* REQUIREMENTS */}
            <div className="grid gap-5 md:grid-cols-2">
              <TagSection
                eyebrow="Skills"
                title="Skills needed"
                items={
                  project.required_skills ??
                  []
                }
              />

              <TagSection
                eyebrow="Interests"
                title="Relevant interests"
                items={
                  project.required_interests ??
                  []
                }
              />
            </div>
          </div>

          {/* APPLY */}
          <aside
            id="apply-section"
            className="scroll-mt-28 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="overflow-hidden rounded-[24px] border border-[#e8dfff] bg-white shadow-[0_16px_45px_rgba(72,45,120,0.09)]">
              {/* APPLY TOP */}
              <div className="bg-gradient-to-br from-[#5e2bd0] via-[#7540e3] to-[#9f6ce9] p-6 text-white">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/80">
                    Join Project
                  </span>

                  <span className="text-sm font-bold">
                    {matchScore}%
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
                  Apply as volunteer.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/75">
                  Ceritakan alasan kamu
                  tertarik untuk berkontribusi
                  dalam kegiatan ini.
                </p>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs">
                    ◷
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/55">
                      Event
                    </p>

                    <p className="mt-0.5 text-xs font-semibold">
                      {formatDate(
                        project.start_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* FORM */}
              <form
                onSubmit={
                  handleApply
                }
                className="p-6"
              >
                <label
                  htmlFor="motivation"
                  className="text-xs font-semibold text-[#41364b]"
                >
                  Motivation
                </label>

                <p className="mt-1 text-[10px] leading-5 text-[#9b8fa4]">
                  Optional, tapi bisa membantu
                  NGO memahami alasan kamu
                  tertarik.
                </p>

                <textarea
                  id="motivation"
                  value={
                    motivation
                  }
                  onChange={(
                    event,
                  ) =>
                    setMotivation(
                      event.target
                        .value,
                    )
                  }
                  rows={6}
                  disabled={
                    applying ||
                    applied
                  }
                  placeholder="Kenapa kamu tertarik mengikuti kegiatan ini?"
                  className="mt-3 w-full resize-none rounded-xl border border-[#e8e2ee] bg-[#fdfcff] px-4 py-3.5 text-sm leading-6 text-[#30283e] outline-none transition placeholder:text-[#b4aabd] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5 disabled:cursor-not-allowed disabled:bg-[#f7f5f9]"
                />

                {error && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">
                        ✓
                      </span>

                      <p className="text-xs leading-5 text-emerald-700">
                        {
                          success
                        }
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    applying ||
                    applied
                  }
                  className="mt-5 w-full rounded-lg bg-[#6d35e8] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applying
                    ? "Mengirim application..."
                    : applied
                      ? "Application Sent ✓"
                      : "Apply as Volunteer →"}
                </button>

                {applied ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/student/applications",
                      )
                    }
                    className="mt-3 w-full rounded-lg border border-[#e7e0ee] bg-white px-5 py-3 text-xs font-semibold text-[#6d35e8]"
                  >
                    View My Applications
                  </button>
                ) : (
                  <p className="mt-4 text-center text-[10px] leading-5 text-[#9a8da5]">
                    Setelah apply, application
                    kamu akan direview oleh NGO.
                  </p>
                )}
              </form>
            </div>
          </aside>
        </motion.section>

        {/* FLOW */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              What Happens Next
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Your volunteer journey
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <JourneyCard
              number="01"
              title="Apply"
              description="Submit your application to the NGO."
            />

            <JourneyCard
              number="02"
              title="Get Accepted"
              description="The organization reviews your application."
            />

            <JourneyCard
              number="03"
              title="Participate"
              description="Join the activity and complete attendance."
            />

            <JourneyCard
              number="04"
              title="Earn Credential"
              description="Receive verified experience after completion."
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
                Volunteer Match
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Not quite the right project?
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Explore more opportunities and
                find another activity that
                matches your profile.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Explore More →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroSnapshot({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9587a2]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-[#24182d]">
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
      <div className="min-w-0">
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

function MatchRow({
  label,
  value,
  maximum,
}: {
  label: string;
  value: number;
  maximum: number;
}) {
  const percentage =
    maximum > 0
      ? (value /
          maximum) *
        100
      : 0;

  const safePercentage =
    Math.min(
      100,
      Math.max(
        0,
        percentage,
      ),
    );

  return (
    <div className="rounded-xl border border-white bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#4d4057]">
          {label}
        </p>

        <p className="text-xs font-bold text-[#6d35e8]">
          {value} /{" "}
          {maximum}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${safePercentage}%`,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          className="h-full rounded-full bg-[#6d35e8]"
        />
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] px-4 py-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-[#9c90a5]">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#493d53]">
        {value}
      </p>
    </div>
  );
}

function TagSection({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[22px] border border-[#eeeaf5] bg-white p-6 shadow-[0_6px_22px_rgba(72,45,120,0.04)]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b78a6]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-lg font-semibold text-[#21172a]">
        {title}
      </h2>

      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map(
            (item) => (
              <span
                key={
                  item
                }
                className="rounded-full bg-[#f4f0ff] px-3 py-2 text-[10px] font-semibold text-[#6d35e8]"
              >
                {item}
              </span>
            ),
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#a095aa]">
          Belum ada data.
        </p>
      )}
    </div>
  );
}

function JourneyCard({
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