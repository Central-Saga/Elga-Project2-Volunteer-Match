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

const navigation = [
  { label: "Dashboard", href: "/admin" },
  { label: "NGO Verifications", href: "/admin/verifications" },
  { label: "Project Reviews", href: "/admin/projects" },
  { label: "Credentials", href: "/admin/credentials" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function riskClass(risk: string) {
  switch (risk) {
    case "high":
      return "bg-red-50 text-red-700 ring-red-200";
    case "medium":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

export default function AdminProjectsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);

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

    if (storedUser.role !== "admin") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProjects() {
      try {
        const response =
          await apiFetch<ProjectsResponse>(
            "/admin/projects/submitted",
            {
              token: token ?? undefined,
            }
          );

        setProjects(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil submitted projects."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  async function handleApprove(projectId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProcessingId(projectId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/admin/projects/${projectId}/approve`,
        {
          method: "POST",
          token,
        }
      );

      setProjects((current) =>
        current.filter(
          (project) => project.id !== projectId
        )
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal approve project."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(projectId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (rejectionReason.trim().length < 5) {
      setError(
        "Rejection reason minimal 5 karakter."
      );
      return;
    }

    setProcessingId(projectId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<ActionResponse>(
        `/admin/projects/${projectId}/reject`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            rejection_reason:
              rejectionReason.trim(),
          }),
        }
      );

      setProjects((current) =>
        current.filter(
          (project) => project.id !== projectId
        )
      );

      setRejectingId(null);
      setRejectionReason("");
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal reject project."
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
          Menyiapkan project review...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="admin"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Moderation
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Project Reviews
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review project yang sudah dikirim NGO
            sebelum dipublikasikan ke student.
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

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-4 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold text-gray-900">
              No projects waiting for review
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Semua submitted project sudah diproses.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const ngo =
                project.ngo_profile ??
                project.ngoProfile ??
                null;

              return (
                <article
                  key={project.id}
                  className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Project #{project.id}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-gray-900">
                        {project.title}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {ngo?.organization_name ||
                          `NGO #${project.ngo_profile_id}`}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Submitted
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-gray-500">
                    {project.description}
                  </p>

                  <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-2">
                    <Info
                      label="Location"
                      value={project.location || "-"}
                    />

                    <Info
                      label="Capacity"
                      value={`${project.capacity} volunteers`}
                    />

                    <Info
                      label="Date"
                      value={formatDate(
                        project.start_at
                      )}
                    />

                    <Info
                      label="Time"
                      value={`${formatTime(
                        project.start_at
                      )} — ${formatTime(
                        project.end_at
                      )}`}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${riskClass(
                        project.risk_level
                      )}`}
                    >
                      {project.risk_level} risk
                    </span>

                    {ngo?.verification_status && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700 ring-1 ring-emerald-200">
                        NGO{" "}
                        {ngo.verification_status}
                      </span>
                    )}
                  </div>

                  {project.required_skills &&
                    project.required_skills.length >
                      0 && (
                      <div className="mt-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Required Skills
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.required_skills.map(
                            (skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {project.required_interests &&
                    project.required_interests
                      .length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                          Relevant Interests
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.required_interests.map(
                            (interest) => (
                              <span
                                key={interest}
                                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
                              >
                                {interest}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {rejectingId === project.id && (
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
                        placeholder="Jelaskan perubahan yang diperlukan..."
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
                            processingId === project.id
                          }
                          onClick={() =>
                            handleReject(project.id)
                          }
                          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {processingId === project.id
                            ? "Rejecting..."
                            : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={
                        processingId === project.id
                      }
                      onClick={() => {
                        setRejectingId(project.id);
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
                        processingId === project.id
                      }
                      onClick={() =>
                        handleApprove(project.id)
                      }
                      className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                    >
                      {processingId === project.id
                        ? "Processing..."
                        : "Approve & Publish"}
                    </button>
                  </div>
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