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

export default function NgoApplicationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApplications, setLoadingApplications] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [rejectingId, setRejectingId] =
    useState<number | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

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
        const response = await apiFetch<ProjectsResponse>(
          "/ngo/projects",
          {
            token: token ?? undefined,
          }
        );

        setProjects(response.data);

        if (response.data.length > 0) {
          setSelectedProjectId(response.data[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data project."
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
              token : token ?? undefined,
            }
          );

        setApplications(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil applications."
        );
      } finally {
        setLoadingApplications(false);
      }
    }

    loadApplications();
  }, [selectedProjectId]);

  async function handleAccept(applicationId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/ngo/applications/${applicationId}/accept`,
        {
          method: "POST",
          token,
        }
      );

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
              }
            : application
        )
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menerima application."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(applicationId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (rejectionReason.trim().length < 5) {
      setError("Alasan reject minimal 5 karakter.");
      return;
    }

    setProcessingId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/ngo/applications/${applicationId}/reject`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            rejection_reason: rejectionReason.trim(),
          }),
        }
      );

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
              }
            : application
        )
      );

      setRejectingId(null);
      setRejectionReason("");
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menolak application."
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
    (project) => project.id === selectedProjectId
  );

  const pendingCount = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const acceptedCount = applications.filter(
    (application) => application.status === "accepted"
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "rejected"
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
            Review student yang mendaftar ke volunteer project milik
            organisasi kamu.
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
                  Number(event.target.value)
                )
              }
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  #{project.id} — {project.title} ({project.status})
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
              label="Capacity"
              value={selectedProject.capacity ?? "-"}
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
              Belum ada student yang apply ke project ini.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {applications.map((application) => {
              const student =
                application.student_profile ??
                application.studentProfile ??
                null;

              return (
                <article
                  key={application.id}
                  className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Application #{application.id}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-gray-900">
                        {student?.student_id
                          ? `Student ${student.student_id}`
                          : `Student Profile #${application.student_profile_id}`}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Applied {formatDate(application.applied_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${statusClass(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-2">
                    <Info
                      label="Faculty"
                      value={student?.faculty || "-"}
                    />

                    <Info
                      label="Study Program"
                      value={student?.study_program || "-"}
                    />

                    <Info
                      label="Semester"
                      value={
                        student?.semester
                          ? String(student.semester)
                          : "-"
                      }
                    />

                    <Info
                      label="Location"
                      value={student?.location || "-"}
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
                        {application.motivation}
                      </p>
                    </div>
                  )}

                  {student?.skills &&
                    student.skills.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Skills
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {student.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {student?.interests &&
                    student.interests.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Interests
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {student.interests.map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {application.status === "rejected" &&
                    application.rejection_reason && (
                      <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-500">
                          Rejection Reason
                        </p>

                        <p className="mt-2 text-sm text-red-700">
                          {application.rejection_reason}
                        </p>
                      </div>
                    )}

                  {rejectingId === application.id &&
                    application.status === "pending" && (
                      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                        <label className="text-sm font-semibold text-red-800">
                          Rejection Reason
                        </label>

                        <textarea
                          rows={4}
                          maxLength={2000}
                          value={rejectionReason}
                          onChange={(event) =>
                            setRejectionReason(
                              event.target.value
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
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={
                              processingId === application.id
                            }
                            onClick={() =>
                              handleReject(application.id)
                            }
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {processingId === application.id
                              ? "Rejecting..."
                              : "Confirm Reject"}
                          </button>
                        </div>
                      </div>
                    )}

                  {application.status === "pending" && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={
                          processingId === application.id
                        }
                        onClick={() => {
                          setRejectingId(application.id);
                          setRejectionReason("");
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
                          processingId === application.id
                        }
                        onClick={() =>
                          handleAccept(application.id)
                        }
                        className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        {processingId === application.id
                          ? "Processing..."
                          : "Accept Student"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
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