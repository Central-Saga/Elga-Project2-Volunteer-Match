"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type StudentProfile = {
  id: number;
  student_id?: string | null;
  faculty?: string | null;
  study_program?: string | null;
  semester?: number | null;
  bio?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  availability?: string[] | null;
  location?: string | null;
};

type Attendance = {
  id: number;
  application_id: number;
  status: "checked_in" | "validated" | "absent";
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  validated_at?: string | null;
};

type Completion = {
  id: number;
  application_id: number;
  status: "confirmed" | "cancelled";
  total_hours: string | number | null;
  confirmed_at: string | null;
  notes: string | null;
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

type CredentialActionResponse = {
  message: string;
  data: Credential;
};

const navigation = [
  { label: "Dashboard", href: "/ngo" },
  { label: "Projects", href: "/ngo/projects" },
  { label: "Applications", href: "/ngo/applications" },
  { label: "Verification", href: "/ngo/verification" },
  { label: "Profile", href: "/ngo/profile" },
];

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function attendanceStatusClass(status: string) {
  switch (status) {
    case "validated":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "checked_in":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "absent":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-gray-50 text-gray-600 ring-gray-200";
  }
}

export default function NgoApplicationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingApplications, setLoadingApplications] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [rejectingId, setRejectingId] =
    useState<number | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [completionHours, setCompletionHours] =
  useState<Record<number, string>>({});

  const [completionNotes, setCompletionNotes] =
  useState<Record<number, string>>({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "ngo") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProjects() {
      try {
        const response =
          await apiFetch<ProjectsResponse>(
            "/ngo/projects",
            {
              token: token ?? undefined,
            },
          );

        setProjects(response.data);

        if (response.data.length > 0) {
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
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, [router]);

  useEffect(() => {
    if (!selectedProjectId) {
      setApplications([]);
      return;
    }

    const token = getStoredToken();

    if (!token) return;

    async function loadApplications() {
      setLoadingApplications(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await apiFetch<ApplicationsResponse>(
            `/ngo/projects/${selectedProjectId}/applications`,
            {
              token: token ?? undefined,
            },
          );

        setApplications(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil applications.",
        );
      } finally {
        setLoadingApplications(false);
      }
    }

    loadApplications();
  }, [selectedProjectId]);

  async function handleAccept(
    applicationId: number,
  ) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(applicationId);
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

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
              }
            : application,
        ),
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menerima application.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(
    applicationId: number,
  ) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (rejectionReason.trim().length < 5) {
      setError(
        "Alasan reject minimal 5 karakter.",
      );
      return;
    }

    setProcessingId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<ActionResponse>(
          `/ngo/applications/${applicationId}/reject`,
          {
            method: "POST",
            token,
            body: JSON.stringify({
              rejection_reason:
                rejectionReason.trim(),
            }),
          },
        );

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
              }
            : application,
        ),
      );

      setRejectingId(null);
      setRejectionReason("");
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menolak application.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleValidateAttendance(
    applicationId: number,
    attendanceId: number,
  ) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(applicationId);
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

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                attendance: response.data,
              }
            : application,
        ),
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memvalidasi attendance.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirmCompletion(
  applicationId: number,
) {
  const token = getStoredToken();

  if (!token) {
    router.replace("/login");
    return;
  }

  const hours = completionHours[applicationId];

  if (!hours || Number(hours) < 0.5) {
    setError(
      "Total volunteer hours minimal 0.5 jam.",
    );
    return;
  }

  setProcessingId(applicationId);
  setError("");
  setSuccess("");

  try {
    const response =
      await apiFetch<CompletionActionResponse>(
        `/ngo/applications/${applicationId}/confirm-completion`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            total_hours: Number(hours),
            notes:
              completionNotes[applicationId]?.trim() ||
              null,
          }),
        },
      );

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              completion: response.data,
            }
          : application,
      ),
    );

    setSuccess(response.message);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal mengkonfirmasi completion.",
    );
  } finally {
    setProcessingId(null);
  }
}

async function handleIssueCredential(
  applicationId: number,
) {
  const token = getStoredToken();

  if (!token) {
    router.replace("/login");
    return;
  }

  setProcessingId(applicationId);
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

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              credential: response.data,
            }
          : application,
      ),
    );

    setSuccess(response.message);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal menerbitkan credential.",
    );
  } finally {
    setProcessingId(null);
  }
}

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />

          Menyiapkan applications...
        </div>
      </main>
    );
  }

  const selectedProject = projects.find(
    (project) =>
      project.id === selectedProjectId,
  );

  const pendingCount = applications.filter(
    (application) =>
      application.status === "pending",
  ).length;

  const acceptedCount = applications.filter(
    (application) =>
      application.status === "accepted",
  ).length;

  const validatedCount = applications.filter(
    (application) =>
      application.attendance?.status ===
      "validated",
  ).length;

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Volunteer Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Applications
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review student, manage acceptance,
            dan validasi kehadiran volunteer.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-700">
              Action completed
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <label className="text-sm font-semibold text-gray-900">
            Select Project
          </label>

          {loadingProjects ? (
            <div className="mt-3 h-12 animate-pulse rounded-2xl bg-gray-100" />
          ) : projects.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Belum ada project.
            </p>
          ) : (
            <select
              value={selectedProjectId ?? ""}
              onChange={(event) =>
                setSelectedProjectId(
                  Number(event.target.value),
                )
              }
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  #{project.id} —{" "}
                  {project.title} (
                  {project.status})
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedProject && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Applicants"
              value={applications.length}
            />

            <StatCard
              label="Pending"
              value={pendingCount}
            />

            <StatCard
              label="Accepted"
              value={acceptedCount}
            />

            <StatCard
              label="Attendance Validated"
              value={validatedCount}
            />
          </section>
        )}

        {loadingApplications ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-4 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : selectedProjectId &&
          applications.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold text-gray-900">
              No applications yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Belum ada student yang apply ke
              project ini.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {applications.map(
              (application) => {
                const student =
                  application.student_profile ??
                  application.studentProfile ??
                  null;

                const attendance =
                  application.attendance ??
                  null;

                return (
                  <article
                    key={application.id}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Application #
                          {application.id}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-gray-900">
                          {student?.student_id
                            ? `Student ${student.student_id}`
                            : `Student Profile #${application.student_profile_id}`}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Applied{" "}
                          {formatDate(
                            application.applied_at,
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${statusClass(
                            application.status,
                          )}`}
                        >
                          {application.status}
                        </span>

                        {attendance && (
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${attendanceStatusClass(
                              attendance.status,
                            )}`}
                          >
                            {attendance.status.replace(
                              "_",
                              " ",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-2">
                      <Info
                        label="Faculty"
                        value={
                          student?.faculty || "-"
                        }
                      />

                      <Info
                        label="Study Program"
                        value={
                          student?.study_program ||
                          "-"
                        }
                      />

                      <Info
                        label="Semester"
                        value={
                          student?.semester
                            ? String(
                                student.semester,
                              )
                            : "-"
                        }
                      />

                      <Info
                        label="Location"
                        value={
                          student?.location || "-"
                        }
                      />
                    </div>

                    {student?.bio && (
                      <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Bio
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {student.bio}
                        </p>
                      </div>
                    )}

                    {application.motivation && (
                      <div className="mt-5 rounded-2xl border border-gray-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Motivation
                        </p>

                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                          {
                            application.motivation
                          }
                        </p>
                      </div>
                    )}

                    {student?.skills &&
                      student.skills.length >
                        0 && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            Skills
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {student.skills.map(
                              (skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                                >
                                  {skill}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {student?.interests &&
                      student.interests.length >
                        0 && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            Interests
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {student.interests.map(
                              (interest) => (
                                <span
                                  key={interest}
                                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                                >
                                  {interest}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {application.status ===
                      "rejected" &&
                      application.rejection_reason && (
                        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-500">
                            Rejection Reason
                          </p>

                          <p className="mt-2 text-sm text-red-700">
                            {
                              application.rejection_reason
                            }
                          </p>
                        </div>
                      )}

                    {rejectingId ===
                      application.id &&
                      application.status ===
                        "pending" && (
                        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                          <label className="text-sm font-semibold text-red-800">
                            Rejection Reason
                          </label>

                          <textarea
                            rows={4}
                            maxLength={2000}
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
                            placeholder="Jelaskan alasan application ditolak..."
                            className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none"
                          />

                          <p className="mt-2 text-xs text-red-500">
                            Minimal 5 karakter.
                          </p>

                          <div className="mt-4 flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(
                                  null,
                                );
                                setRejectionReason(
                                  "",
                                );
                              }}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                application.id
                              }
                              onClick={() =>
                                handleReject(
                                  application.id,
                                )
                              }
                              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {processingId ===
                              application.id
                                ? "Rejecting..."
                                : "Confirm Reject"}
                            </button>
                          </div>
                        </div>
                      )}

                    {application.status ===
                      "pending" && (
                      <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={
                            processingId ===
                            application.id
                          }
                          onClick={() => {
                            setRejectingId(
                              application.id,
                            );
                            setRejectionReason(
                              "",
                            );
                            setError("");
                            setSuccess("");
                          }}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={
                            processingId ===
                            application.id
                          }
                          onClick={() =>
                            handleAccept(
                              application.id,
                            )
                          }
                          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                          {processingId ===
                          application.id
                            ? "Processing..."
                            : "Accept Student"}
                        </button>
                      </div>
                    )}

                    {application.status ===
                      "accepted" &&
                      !attendance && (
                        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                          <p className="text-sm font-bold text-gray-900">
                            Waiting for student
                            check-in
                          </p>

                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            Student sudah
                            diterima, tetapi belum
                            melakukan check-in.
                          </p>
                        </div>
                      )}

                    {application.status ===
                      "accepted" &&
                      attendance?.status ===
                        "checked_in" && (
                        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-blue-900">
                                Student checked in
                              </p>

                              <p className="mt-1 text-sm leading-6 text-blue-700">
                                Student sudah
                                melakukan check-in.
                                Validasi kehadiran
                                jika student memang
                                hadir di kegiatan.
                              </p>

                              {attendance.checked_in_at && (
                                <p className="mt-2 text-xs text-blue-600">
                                  Check-in:{" "}
                                  {formatDate(
                                    attendance.checked_in_at,
                                  )}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                application.id
                              }
                              onClick={() =>
                                handleValidateAttendance(
                                  application.id,
                                  attendance.id,
                                )
                              }
                              className="shrink-0 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processingId ===
                              application.id
                                ? "Validating..."
                                : "Validate Attendance"}
                            </button>
                          </div>
                        </div>
                      )}

                    {attendance?.status ===
                      "validated" && (
                      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                        <p className="text-sm font-bold text-emerald-900">
                          Attendance Validated
                        </p>

                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                          Kehadiran student sudah
                          berhasil divalidasi.
                        </p>

                        {attendance.validated_at && (
                          <p className="mt-2 text-xs text-emerald-600">
                            Validated:{" "}
                            {formatDate(
                              attendance.validated_at,
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    {application.status === "accepted" &&
  attendance?.status === "validated" &&
  !application.completion && (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5">
      <p className="text-sm font-bold text-violet-900">
        Confirm Volunteer Completion
      </p>

      <p className="mt-1 text-sm leading-6 text-violet-700">
        Attendance student sudah tervalidasi. Masukkan total jam
        volunteer sebelum mengkonfirmasi kegiatan selesai.
      </p>

      <div className="mt-5">
        <label className="text-sm font-semibold text-violet-900">
          Total Volunteer Hours
        </label>

        <input
          type="number"
          min="0.5"
          max="1000"
          step="0.5"
          value={completionHours[application.id] ?? ""}
          onChange={(event) =>
            setCompletionHours((current) => ({
              ...current,
              [application.id]: event.target.value,
            }))
          }
          placeholder="Contoh: 3"
          className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-violet-900">
          Notes
        </label>

        <textarea
          rows={4}
          maxLength={2000}
          value={completionNotes[application.id] ?? ""}
          onChange={(event) =>
            setCompletionNotes((current) => ({
              ...current,
              [application.id]: event.target.value,
            }))
          }
          placeholder="Catatan mengenai partisipasi student (optional)..."
          className="mt-2 w-full resize-none rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={processingId === application.id}
          onClick={() =>
            handleConfirmCompletion(application.id)
          }
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processingId === application.id
            ? "Confirming..."
            : "Confirm Completion"}
        </button>
      </div>
    </div>
  )}

                    {application.completion?.status === "confirmed" && (
                      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-emerald-900">
                              Completion Confirmed
                            </p>
                    
                            <p className="mt-1 text-sm leading-6 text-emerald-700">
                              Volunteer activity student sudah dikonfirmasi selesai.
                            </p>
                    
                            <p className="mt-3 text-sm text-emerald-800">
                              <span className="font-semibold">
                                Total Hours:
                              </span>{" "}
                              {application.completion.total_hours ?? "-"} hours
                            </p>
                    
                            {application.completion.confirmed_at && (
                              <p className="mt-1 text-xs text-emerald-600">
                                Confirmed:{" "}
                                {formatDate(
                                  application.completion.confirmed_at,
                                )}
                              </p>
                            )}
                    
                            {application.completion.notes && (
                              <div className="mt-4 rounded-xl bg-white/60 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                                  Notes
                                </p>
                            
                                <p className="mt-2 text-sm leading-6 text-emerald-800">
                                  {application.completion.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            Completed
                          </span>
                        </div>
                      </div>
                    )}
                    {application.completion?.status === "confirmed" &&
  !application.credential && (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-900">
            Ready to Issue Credential
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            Completion sudah dikonfirmasi. Credential student
            sekarang bisa diterbitkan.
          </p>
        </div>

        <button
          type="button"
          disabled={processingId === application.id}
          onClick={() =>
            handleIssueCredential(application.id)
          }
          className="shrink-0 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {processingId === application.id
            ? "Issuing..."
            : "Issue Credential"}
        </button>
      </div>
    </div>
  )}
  {application.credential && (
  <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
    <p className="text-sm font-bold text-emerald-900">
      Credential Issued
    </p>

    <p className="mt-1 text-sm leading-6 text-emerald-700">
      Credential volunteer student sudah berhasil diterbitkan.
    </p>

    <div className="mt-4 space-y-1 text-sm text-emerald-800">
      <p>
        <span className="font-semibold">
          Credential Number:
        </span>{" "}
        {application.credential.credential_number}
      </p>

      <p>
        <span className="font-semibold">
          Title:
        </span>{" "}
        {application.credential.title}
      </p>

      <p>
        <span className="font-semibold">
          Status:
        </span>{" "}
        {application.credential.status}
      </p>

      <p>
        <span className="font-semibold">
          Issued:
        </span>{" "}
        {formatDate(application.credential.issued_at)}
      </p>
    </div>
  </div>
)}
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}