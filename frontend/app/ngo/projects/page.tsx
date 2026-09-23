"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

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
};

type ProjectsResponse = {
  message: string;
  data: Project[];
};

type SubmitResponse = {
  message: string;
  data: Project;
};

const navigation = [
  { label: "Dashboard", href: "/ngo" },
  { label: "Projects", href: "/ngo/projects" },
  { label: "Applications", href: "/ngo/applications" },
  { label: "Verification", href: "/ngo/verification" },
  { label: "Profile", href: "/ngo/profile" },
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

function statusClass(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "submitted":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";
    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

export default function NgoProjectsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [submittingId, setSubmittingId] =
    useState<number | null>(null);

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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil project."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      draft: projects.filter((p) => p.status === "draft").length,
      submitted: projects.filter(
        (p) => p.status === "submitted"
      ).length,
      published: projects.filter(
        (p) => p.status === "published"
      ).length,
    };
  }, [projects]);

  async function handleSubmitProject(projectId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSubmittingId(projectId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<SubmitResponse>(
        `/ngo/projects/${projectId}/submit`,
        {
          method: "POST",
          token,
        }
      );

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId
            ? response.data
            : project
        )
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal submit project."
      );
    } finally {
      setSubmittingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan projects...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="ngo"
      navigation={navigation}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Volunteer Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Projects
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Buat dan kelola volunteer project organisasi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/ngo/projects/create")}
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            + Create Project
          </button>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Draft" value={stats.draft} />
          <StatCard label="Submitted" value={stats.submitted} />
          <StatCard label="Published" value={stats.published} />
        </section>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
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
              Belum ada project
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Buat volunteer project pertama organisasi kamu.
            </p>

            <button
              type="button"
              onClick={() => router.push("/ngo/projects/create")}
              className="mt-6 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      Project #{project.id}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-gray-900">
                      {project.title}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${statusClass(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-500">
                  {project.description}
                </p>

                <div className="mt-5 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(project.start_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatTime(project.start_at)} —{" "}
                      {formatTime(project.end_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Capacity
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {project.capacity}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.required_skills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {project.rejection_reason && (
                  <div className="mt-5 rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-semibold text-red-700">
                      Rejection reason
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                      {project.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-5">
                  <div className="text-sm text-gray-500">
                    {project.location || "No location"} ·{" "}
                    <span className="capitalize">
                      {project.risk_level} risk
                    </span>
                  </div>

                  {project.status === "draft" && (
                    <button
                      type="button"
                      disabled={submittingId === project.id}
                      onClick={() =>
                        handleSubmitProject(project.id)
                      }
                      className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {submittingId === project.id
                        ? "Submitting..."
                        : "Submit for Review"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}