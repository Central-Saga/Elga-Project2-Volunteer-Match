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

type StudentProfile = {
  id: number;
  nim?: string | null;
  study_program?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  availability?: string[] | null;
  location?: string | null;
};

type Attendance = {
  id: number;
  application_id: number;
  status:
    | "checked_in"
    | "validated"
    | "absent";
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  validated_at?: string | null;
};

type Completion = {
  id: number;
  application_id: number;
  status:
    | "confirmed"
    | "cancelled";
  total_hours:
    | string
    | number
    | null;
  confirmed_at: string | null;
  notes: string | null;
};

type Credential = {
  id: number;
  application_id: number;
  credential_number: string;
  title: string;
  issued_at: string;
  status:
    | "active"
    | "revoked";
  revoked_at?: string | null;
  revocation_reason?: string | null;
};

type Application = {
  id: number;
  project_id: number;
  student_profile_id: number;

  motivation?: string | null;

  status: string;

  applied_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;

  student_profile?: StudentProfile | null;
  studentProfile?: StudentProfile | null;

  attendance?: Attendance | null;
  completion?: Completion | null;
  credential?: Credential | null;
};

type Project = {
  id: number;
  title: string;
  status: string;
  capacity?: number | null;
};

type ProjectsResponse = {
  message: string;
  data: Project[];
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type ActionResponse = {
  message: string;
  data: Application;
};

type AttendanceActionResponse = {
  message: string;
  data: Attendance;
};

type CompletionActionResponse = {
  message: string;
  data: Completion;
};

type CredentialActionResponse = {
  message: string;
  data: Credential;
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

const heroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

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

function applicationStatusClass(
  status: string,
) {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "withdrawn":
      return "bg-[#f1eef4] text-[#756a7e]";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function attendanceStatusClass(
  status: string,
) {
  switch (status) {
    case "validated":
      return "bg-emerald-50 text-emerald-700";

    case "checked_in":
      return "bg-[#f1ebff] text-[#6d35e8]";

    case "absent":
      return "bg-red-50 text-red-700";

    default:
      return "bg-[#f1eef4] text-[#756a7e]";
  }
}

export default function NgoApplicationsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<
    number | null
  >(null);

  const [
    applications,
    setApplications,
  ] = useState<Application[]>(
    [],
  );

  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(true);

  const [
    loadingApplications,
    setLoadingApplications,
  ] = useState(false);

  const [
    processingId,
    setProcessingId,
  ] = useState<
    number | null
  >(null);

  const [
    rejectingId,
    setRejectingId,
  ] = useState<
    number | null
  >(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    completionHours,
    setCompletionHours,
  ] = useState<
    Record<number, string>
  >({});

  const [
    completionNotes,
    setCompletionNotes,
  ] = useState<
    Record<number, string>
  >({});

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
          response.data,
        );

        if (
          response.data.length >
          0
        ) {
          setSelectedProjectId(
            response.data[0].id,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data project.",
        );
      } finally {
        setLoadingProjects(
          false,
        );
      }
    }

    loadProjects(token);
  }, [router]);

  useEffect(() => {
    if (
      !selectedProjectId
    ) {
      setApplications([]);
      return;
    }

    const token =
      getStoredToken();

    if (!token) {
      return;
    }

    async function loadApplications(
      authToken: string,
    ) {
      setLoadingApplications(
        true,
      );

      setError("");
      setSuccess("");

      try {
        const response =
          await apiFetch<ApplicationsResponse>(
            `/ngo/projects/${selectedProjectId}/applications`,
            {
              token:
                authToken,
            },
          );

        setApplications(
          response.data,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil applications.",
        );
      } finally {
        setLoadingApplications(
          false,
        );
      }
    }

    loadApplications(token);
  }, [selectedProjectId]);

  async function handleAccept(
    applicationId: number,
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
      applicationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/ngo/applications/${applicationId}/accept`,
          {
            method: "POST",
            token,
          },
        );

      setApplications(
        (current) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    ...response.data,
                  }
                : application,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menerima application.",
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  async function handleReject(
    applicationId: number,
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
      rejectionReason
        .trim()
        .length < 5
    ) {
      setError(
        "Alasan reject minimal 5 karakter.",
      );

      return;
    }

    setProcessingId(
      applicationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/ngo/applications/${applicationId}/reject`,
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

      setApplications(
        (current) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    ...response.data,
                  }
                : application,
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
          : "Gagal menolak application.",
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  async function handleValidateAttendance(
    applicationId: number,
    attendanceId: number,
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
      applicationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<AttendanceActionResponse>(
          `/ngo/attendances/${attendanceId}/validate`,
          {
            method: "POST",
            token,
          },
        );

      setApplications(
        (current) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    attendance:
                      response.data,
                  }
                : application,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memvalidasi attendance.",
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  async function handleConfirmCompletion(
    applicationId: number,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    const hours =
      completionHours[
        applicationId
      ];

    if (
      !hours ||
      Number(hours) <
        0.5
    ) {
      setError(
        "Total volunteer hours minimal 0.5 jam.",
      );

      return;
    }

    setProcessingId(
      applicationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<CompletionActionResponse>(
          `/ngo/applications/${applicationId}/confirm-completion`,
          {
            method: "POST",
            token,

            body: JSON.stringify(
              {
                total_hours:
                  Number(
                    hours,
                  ),

                notes:
                  completionNotes[
                    applicationId
                  ]?.trim() ||
                  null,
              },
            ),
          },
        );

      setApplications(
        (current) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    completion:
                      response.data,
                  }
                : application,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengkonfirmasi completion.",
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  async function handleIssueCredential(
    applicationId: number,
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
      applicationId,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<CredentialActionResponse>(
          `/ngo/applications/${applicationId}/credential`,
          {
            method: "POST",
            token,
          },
        );

      setApplications(
        (current) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    credential:
                      response.data,
                  }
                : application,
          ),
      );

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menerbitkan credential.",
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (
            project,
          ) =>
            project.id ===
            selectedProjectId,
        ) ?? null,
      [
        projects,
        selectedProjectId,
      ],
    );

  const stats =
    useMemo(() => {
      const pending =
        applications.filter(
          (
            application,
          ) =>
            application.status ===
            "pending",
        ).length;

      const accepted =
        applications.filter(
          (
            application,
          ) =>
            application.status ===
            "accepted",
        ).length;

      const validated =
        applications.filter(
          (
            application,
          ) =>
            application
              .attendance
              ?.status ===
            "validated",
        ).length;

      const completed =
        applications.filter(
          (
            application,
          ) =>
            application
              .completion
              ?.status ===
            "confirmed",
        ).length;

      const credentials =
        applications.filter(
          (
            application,
          ) =>
            Boolean(
              application.credential,
            ),
        ).length;

      return {
        total:
          applications.length,

        pending,
        accepted,
        validated,
        completed,
        credentials,
      };
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
          <div className="grid min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                VOLUNTEER MANAGEMENT
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Manage your volunteers 👋
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Review people.

                <span className="block text-[#6d35e8]">
                  Build great teams.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Review student applications,
                kelola acceptance, validasi
                kehadiran, dan selesaikan
                volunteer journey dari satu
                workspace.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/projects",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Manage Projects
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/ngo/projects/create",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Create Project →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
              <img
                src={
                  heroImage
                }
                alt="Volunteer management"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs font-bold text-[#6d35e8]">
                  {stats.pending}
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Pending Review
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Applications waiting
                  </p>
                </div>
              </div>

              {/* SNAPSHOT */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                        Selected Project
                      </span>

                      {selectedProject && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                          <span className="text-[9px] font-semibold capitalize text-[#6d35e8]">
                            {
                              selectedProject.status
                            }
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                      {selectedProject
                        ? selectedProject.title
                        : "Select a project"}
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
                        label="Completed"
                        value={
                          stats.completed
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/ngo/projects",
                      )
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                    aria-label="Open projects"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Applicants"
              value={
                stats.total
              }
              description="All applications"
            />

            <HeroStat
              label="Pending"
              value={
                stats.pending
              }
              description="Waiting review"
            />

            <HeroStat
              label="Accepted"
              value={
                stats.accepted
              }
              description="Approved volunteers"
            />

            <HeroStat
              label="Validated"
              value={
                stats.validated
              }
              description="Attendance confirmed"
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

        {/* PROJECT SELECTOR */}
        <motion.section
          variants={
            sectionVariants
          }
          className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                Project Selection
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                Choose a project
              </h2>

              <p className="mt-2 text-sm text-[#7a6f84]">
                Pilih project untuk melihat
                dan mengelola student yang
                mendaftar.
              </p>
            </div>

            <div className="w-full md:max-w-lg">
              {loadingProjects ? (
                <div className="h-12 animate-pulse rounded-xl bg-[#f5f2f8]" />
              ) : projects.length ===
                0 ? (
                <div className="rounded-xl bg-[#faf8ff] px-4 py-3 text-sm text-[#84778f]">
                  Belum ada project.
                </div>
              ) : (
                <select
                  value={
                    selectedProjectId ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedProjectId(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-[#e8e2ee] bg-white px-4 py-3.5 text-sm font-medium text-[#403548] outline-none transition focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                >
                  {projects.map(
                    (
                      project,
                    ) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        #
                        {
                          project.id
                        }{" "}
                        —{" "}
                        {
                          project.title
                        }{" "}
                        (
                        {
                          project.status
                        }
                        )
                      </option>
                    ),
                  )}
                </select>
              )}
            </div>
          </div>
        </motion.section>

        {/* WORKFLOW */}
        {selectedProject && (
          <motion.section
            variants={
              sectionVariants
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                  Volunteer Pipeline
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                  {
                    selectedProject.title
                  }
                </h2>
              </div>

              <span className="rounded-full bg-[#f3eeff] px-3 py-1.5 text-[10px] font-semibold capitalize text-[#6d35e8]">
                {
                  selectedProject.status
                }
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PipelineCard
                number="01"
                label="Applicants"
                value={
                  stats.total
                }
              />

              <PipelineCard
                number="02"
                label="Accepted"
                value={
                  stats.accepted
                }
              />

              <PipelineCard
                number="03"
                label="Validated"
                value={
                  stats.validated
                }
              />

              <PipelineCard
                number="04"
                label="Credentials"
                value={
                  stats.credentials
                }
              />
            </div>
          </motion.section>
        )}

        {/* APPLICATIONS */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Applicants
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Student applications
            </h2>

            <p className="mt-2 text-sm text-[#786d83]">
              Review student profile dan
              kelola volunteer journey
              hingga credential diterbitkan.
            </p>
          </div>

          {/* LOADING */}
          {loadingApplications && (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {[1, 2].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[460px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          )}

          {/* EMPTY */}
          {!loadingApplications &&
            selectedProjectId &&
            applications.length ===
              0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl text-[#6d35e8]">
                  ◇
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  No applications yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786d83]">
                  Belum ada student yang
                  apply ke project ini.
                </p>
              </div>
            )}

          {/* CARDS */}
          {!loadingApplications &&
            applications.length >
              0 && (
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
                className="mt-6 grid items-start gap-5 xl:grid-cols-2"
              >
                {applications.map(
                  (
                    application,
                  ) => {
                    const student =
                      application.student_profile ??
                      application.studentProfile ??
                      null;

                    return (
                      <ApplicationCard
                        key={
                          application.id
                        }
                        application={
                          application
                        }
                        student={
                          student
                        }
                        processing={
                          processingId ===
                          application.id
                        }
                        rejecting={
                          rejectingId ===
                          application.id
                        }
                        rejectionReason={
                          rejectionReason
                        }
                        completionHours={
                          completionHours[
                            application.id
                          ] ?? ""
                        }
                        completionNotes={
                          completionNotes[
                            application.id
                          ] ?? ""
                        }
                        onAccept={() =>
                          handleAccept(
                            application.id,
                          )
                        }
                        onStartReject={() => {
                          setRejectingId(
                            application.id,
                          );

                          setRejectionReason(
                            "",
                          );

                          setError("");
                          setSuccess("");
                        }}
                        onCancelReject={() => {
                          setRejectingId(
                            null,
                          );

                          setRejectionReason(
                            "",
                          );
                        }}
                        onReject={() =>
                          handleReject(
                            application.id,
                          )
                        }
                        onRejectionReasonChange={
                          setRejectionReason
                        }
                        onValidate={() => {
                          if (
                            application.attendance
                          ) {
                            handleValidateAttendance(
                              application.id,
                              application
                                .attendance
                                .id,
                            );
                          }
                        }}
                        onHoursChange={(
                          value,
                        ) =>
                          setCompletionHours(
                            (
                              current,
                            ) => ({
                              ...current,

                              [application.id]:
                                value,
                            }),
                          )
                        }
                        onNotesChange={(
                          value,
                        ) =>
                          setCompletionNotes(
                            (
                              current,
                            ) => ({
                              ...current,

                              [application.id]:
                                value,
                            }),
                          )
                        }
                        onConfirmCompletion={() =>
                          handleConfirmCompletion(
                            application.id,
                          )
                        }
                        onIssueCredential={() =>
                          handleIssueCredential(
                            application.id,
                          )
                        }
                      />
                    );
                  },
                )}
              </motion.div>
            )}
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function ApplicationCard({
  application,
  student,
  processing,
  rejecting,
  rejectionReason,
  completionHours,
  completionNotes,
  onAccept,
  onStartReject,
  onCancelReject,
  onReject,
  onRejectionReasonChange,
  onValidate,
  onHoursChange,
  onNotesChange,
  onConfirmCompletion,
  onIssueCredential,
}: {
  application: Application;
  student: StudentProfile | null;

  processing: boolean;
  rejecting: boolean;

  rejectionReason: string;

  completionHours: string;
  completionNotes: string;

  onAccept: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onReject: () => void;

  onRejectionReasonChange: (
    value: string,
  ) => void;

  onValidate: () => void;

  onHoursChange: (
    value: string,
  ) => void;

  onNotesChange: (
    value: string,
  ) => void;

  onConfirmCompletion: () => void;
  onIssueCredential: () => void;
}) {
  const attendance =
    application.attendance ??
    null;

  const isAccepted =
    application.status ===
    "accepted";

  const isValidated =
    attendance?.status ===
    "validated";

  const isCompleted =
    application.completion
      ?.status ===
    "confirmed";

  const hasCredential =
    Boolean(
      application.credential,
    );

  const progress =
    application.status ===
    "rejected"
      ? 1
      : hasCredential
        ? 5
        : isCompleted
          ? 4
          : isValidated
            ? 3
            : attendance
              ? 2
              : isAccepted
                ? 1
                : 0;

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
      className="overflow-hidden rounded-[24px] border border-[#eeeaf5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
    >
      {/* HEADER */}
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#97899f]">
              Application #
              {application.id}
            </p>

            <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#21172a]">
              {student?.nim
                ? `Student ${student.nim}`
                : `Student Profile #${application.student_profile_id}`}
            </h3>

            <p className="mt-1 text-[11px] text-[#94889e]">
              Applied{" "}
              {formatDate(
                application.applied_at,
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${applicationStatusClass(
                application.status,
              )}`}
            >
              {
                application.status
              }
            </span>

            {attendance && (
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${attendanceStatusClass(
                  attendance.status,
                )}`}
              >
                {attendance.status.replace(
                  "_",
                  " ",
                )}
              </span>
            )}

            {application.credential && (
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                  application
                    .credential
                    .status ===
                  "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                Credential{" "}
                {
                  application
                    .credential
                    .status
                }
              </span>
            )}
          </div>
        </div>

        {/* PROFILE SUMMARY */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoBox
            label="NIM"
            value={
              student?.nim ??
              "-"
            }
          />

          <InfoBox
            label="Study Program"
            value={
              student?.study_program ??
              "-"
            }
          />

          <InfoBox
            label="Location"
            value={
              student?.location ??
              "-"
            }
          />
        </div>

        {/* WORKFLOW */}
        {application.status !==
          "rejected" && (
          <div className="mt-5 grid grid-cols-5 gap-1">
            {[
              "Accepted",
              "Check-in",
              "Validated",
              "Completed",
              "Credential",
            ].map(
              (
                label,
                index,
              ) => {
                const active =
                  progress >=
                  index + 1;

                return (
                  <div
                    key={
                      label
                    }
                    className="min-w-0"
                  >
                    <div
                      className={`h-1.5 rounded-full ${
                        active
                          ? "bg-[#6d35e8]"
                          : "bg-[#eee9f2]"
                      }`}
                    />

                    <p className="mt-1 hidden truncate text-center text-[7px] font-medium text-[#a094a9] sm:block">
                      {
                        label
                      }
                    </p>
                  </div>
                );
              },
            )}
          </div>
        )}

        {/* BIO */}
        {student?.bio && (
          <div className="mt-5 rounded-xl bg-[#faf8ff] p-4">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#998ca5]">
              Bio
            </p>

            <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#75687f]">
              {student.bio}
            </p>
          </div>
        )}

        {/* MOTIVATION */}
        {application.motivation && (
          <div className="mt-4 rounded-xl border border-[#eee8f3] p-4">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#998ca5]">
              Motivation
            </p>

            <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#75687f]">
              {
                application.motivation
              }
            </p>
          </div>
        )}

        {/* SKILLS */}
        {student?.skills &&
          student.skills.length >
            0 && (
            <TagRow
              label="Skills"
              items={
                student.skills
              }
            />
          )}

        {/* INTERESTS */}
        {student?.interests &&
          student.interests.length >
            0 && (
            <TagRow
              label="Interests"
              items={
                student.interests
              }
            />
          )}

        {/* AVAILABILITY */}
        {student?.availability &&
          student.availability
            .length > 0 && (
            <TagRow
              label="Availability"
              items={
                student.availability
              }
            />
          )}

        {/* REJECTION EXISTING */}
        {application.status ===
          "rejected" &&
          application.rejection_reason && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-red-500">
                Rejection Reason
              </p>

              <p className="mt-2 text-xs leading-5 text-red-700">
                {
                  application.rejection_reason
                }
              </p>
            </div>
          )}

        {/* REJECT FORM */}
        {rejecting &&
          application.status ===
            "pending" && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <label className="text-xs font-semibold text-red-800">
                Rejection Reason
              </label>

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
                  onRejectionReasonChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Jelaskan alasan application ditolak..."
                className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-[#4a3d51] outline-none focus:border-red-300"
              />

              <p className="mt-2 text-[10px] text-red-500">
                Minimal 5 karakter.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={
                    onCancelReject
                  }
                  className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    processing
                  }
                  onClick={
                    onReject
                  }
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {processing
                    ? "Rejecting..."
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          )}

        {/* PENDING */}
        {application.status ===
          "pending" && (
          <div className="mt-6 flex flex-col gap-3 border-t border-[#f0edf5] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={
                processing
              }
              onClick={
                onStartReject
              }
              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>

            <button
              type="button"
              disabled={
                processing
              }
              onClick={
                onAccept
              }
              className="rounded-lg bg-[#6d35e8] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d2dca] disabled:opacity-50"
            >
              {processing
                ? "Processing..."
                : "Accept Student"}
            </button>
          </div>
        )}
      </div>

      {/* WAITING CHECK IN */}
      {isAccepted &&
        !attendance && (
          <StatusPanel
            tone="purple"
            icon="◷"
            title="Waiting for student check-in"
            description="Student sudah diterima, tetapi belum melakukan check-in pada kegiatan."
          />
        )}

      {/* CHECKED IN */}
      {isAccepted &&
        attendance?.status ===
          "checked_in" && (
          <div className="border-t border-[#e4dcfa] bg-[#f7f3ff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6d35e8] text-sm text-white">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#352641]">
                    Student checked in
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#78678a]">
                    Student sudah
                    melakukan check-in.
                    Validasi jika student
                    memang hadir.
                  </p>

                  {attendance.checked_in_at && (
                    <p className="mt-2 text-[10px] font-medium text-[#8c78a2]">
                      Check-in:{" "}
                      {formatDate(
                        attendance.checked_in_at,
                      )}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={
                  processing
                }
                onClick={
                  onValidate
                }
                className="shrink-0 rounded-lg bg-[#6d35e8] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#5d2dca] disabled:opacity-50"
              >
                {processing
                  ? "Validating..."
                  : "Validate Attendance"}
              </button>
            </div>
          </div>
        )}

      {/* VALIDATED */}
      {isValidated && (
        <StatusPanel
          tone="green"
          icon="✓"
          title="Attendance validated"
          description="Kehadiran student sudah berhasil divalidasi."
          meta={
            attendance?.validated_at
              ? `Validated ${formatDate(
                  attendance.validated_at,
                )}`
              : undefined
          }
        />
      )}

      {/* COMPLETION FORM */}
      {isAccepted &&
        isValidated &&
        !application.completion && (
          <div className="border-t border-[#e7dffd] bg-[#faf8ff] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1ebff] text-[#6d35e8]">
                ◇
              </div>

              <div>
                <p className="text-sm font-semibold text-[#352641]">
                  Confirm volunteer completion
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7d7088]">
                  Attendance sudah
                  tervalidasi. Masukkan
                  total volunteer hours
                  sebelum kegiatan
                  dikonfirmasi selesai.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="text-xs font-semibold text-[#47384f]">
                  Total Volunteer
                  Hours
                </label>

                <input
                  type="number"
                  min="0.5"
                  max="1000"
                  step="0.5"
                  value={
                    completionHours
                  }
                  onChange={(
                    event,
                  ) =>
                    onHoursChange(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Contoh: 3"
                  className="mt-2 w-full rounded-xl border border-[#e5dded] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#47384f]">
                  Notes
                </label>

                <textarea
                  rows={3}
                  maxLength={
                    2000
                  }
                  value={
                    completionNotes
                  }
                  onChange={(
                    event,
                  ) =>
                    onNotesChange(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Catatan mengenai partisipasi student (optional)..."
                  className="mt-2 w-full resize-none rounded-xl border border-[#e5dded] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={
                  processing
                }
                onClick={
                  onConfirmCompletion
                }
                className="rounded-lg bg-[#6d35e8] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#5d2dca] disabled:opacity-50"
              >
                {processing
                  ? "Confirming..."
                  : "Confirm Completion"}
              </button>
            </div>
          </div>
        )}

      {/* COMPLETED */}
      {isCompleted && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Completion confirmed
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Volunteer activity student
                sudah dikonfirmasi selesai.
              </p>

              <p className="mt-3 text-xs font-semibold text-emerald-800">
                {
                  application
                    .completion
                    ?.total_hours ??
                  "-"
                }{" "}
                volunteer hours
              </p>

              {application
                .completion
                ?.confirmed_at && (
                <p className="mt-1 text-[10px] text-emerald-700">
                  Confirmed{" "}
                  {formatDate(
                    application
                      .completion
                      .confirmed_at,
                  )}
                </p>
              )}

              {application
                .completion
                ?.notes && (
                <div className="mt-4 rounded-xl bg-white/70 p-3">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-emerald-600">
                    Notes
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    {
                      application
                        .completion
                        .notes
                    }
                  </p>
                </div>
              )}
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[9px] font-semibold text-emerald-700">
              Completed
            </span>
          </div>
        </div>
      )}

      {/* ISSUE */}
      {isCompleted &&
        !hasCredential && (
          <div className="border-t border-[#e4dcfa] bg-[#f7f3ff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#392b45]">
                  Ready to issue credential
                </p>

                <p className="mt-1 text-xs leading-5 text-[#796b85]">
                  Completion sudah
                  dikonfirmasi. Credential
                  sekarang dapat
                  diterbitkan.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  processing
                }
                onClick={
                  onIssueCredential
                }
                className="shrink-0 rounded-lg bg-[#6d35e8] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#5d2dca] disabled:opacity-50"
              >
                {processing
                  ? "Issuing..."
                  : "Issue Credential"}
              </button>
            </div>
          </div>
        )}

      {/* CREDENTIAL */}
      {application.credential && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Credential issued
                  </p>

                  <p className="text-[10px] text-emerald-700">
                    Verified volunteer
                    experience
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <CredentialInfo
                  label="Credential"
                  value={
                    application
                      .credential
                      .credential_number
                  }
                />

                <CredentialInfo
                  label="Status"
                  value={
                    application
                      .credential
                      .status
                  }
                />

                <CredentialInfo
                  label="Title"
                  value={
                    application
                      .credential
                      .title
                  }
                />

                <CredentialInfo
                  label="Issued"
                  value={formatDate(
                    application
                      .credential
                      .issued_at,
                  )}
                />
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize ${
                application
                  .credential
                  .status ===
                "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {
                application
                  .credential
                  .status
              }
            </span>
          </div>
        </div>
      )}
    </motion.article>
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

function PipelineCard({
  number,
  label,
  value,
}: {
  number: string;
  label: string;
  value: number;
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
          {number}
        </div>

        <p className="text-2xl font-bold tracking-[-0.03em] text-[#21172a]">
          {value}
        </p>
      </div>

      <p className="mt-4 text-xs font-semibold text-[#4a3d54]">
        {label}
      </p>
    </motion.div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] px-3.5 py-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9c90a5]">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-[#4b3f55]">
        {value}
      </p>
    </div>
  );
}

function TagRow({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="mt-5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9b8da6]">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
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

function StatusPanel({
  tone,
  icon,
  title,
  description,
  meta,
}: {
  tone:
    | "purple"
    | "green";
  icon: string;
  title: string;
  description: string;
  meta?: string;
}) {
  const styles = {
    purple: {
      wrapper:
        "border-[#e4dcfa] bg-[#f7f3ff]",
      icon:
        "bg-[#eee6ff] text-[#6d35e8]",
      title:
        "text-[#392b45]",
      body:
        "text-[#796b85]",
    },

    green: {
      wrapper:
        "border-emerald-100 bg-emerald-50",
      icon:
        "bg-emerald-100 text-emerald-700",
      title:
        "text-emerald-900",
      body:
        "text-emerald-700",
    },
  };

  const selected =
    styles[tone];

  return (
    <div
      className={`border-t p-5 ${selected.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${selected.icon}`}
        >
          {icon}
        </div>

        <div>
          <p
            className={`text-sm font-semibold ${selected.title}`}
          >
            {title}
          </p>

          <p
            className={`mt-1 text-xs leading-5 ${selected.body}`}
          >
            {description}
          </p>

          {meta && (
            <p
              className={`mt-2 text-[10px] font-medium ${selected.body}`}
            >
              {meta}
            </p>
          )}
        </div>
      </div>
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
    <div className="rounded-xl bg-white/70 px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-emerald-600">
        {label}
      </p>

      <p className="mt-1 break-words text-[10px] font-semibold capitalize text-emerald-900">
        {value}
      </p>
    </div>
  );
}