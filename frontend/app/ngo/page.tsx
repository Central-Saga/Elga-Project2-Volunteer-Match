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

function getProfile(response: ProfileResponse): NgoProfile {
  if (response.profile) {
    return response.profile;
  }

  if (response.data) {
    return response.data;
  }

  return {
    organization_name:
      typeof response.organization_name === "string"
        ? response.organization_name
        : null,
    organization_description:
      typeof response.organization_description === "string"
        ? response.organization_description
        : null,
    verification_status:
      typeof response.verification_status === "string"
        ? response.verification_status
        : null,
  };
}

function formatDate(date?: string | null) {
  if (!date) return "No date";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date?: string | null) {
  if (!date) return "--:--";

  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status?: string | null) {
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

function getStatusClass(status?: string | null) {
  switch (status) {
    case "published":
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "submitted":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

export default function NgoDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<NgoProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigation = [
    { label: "Dashboard", href: "/ngo" },
    { label: "Projects", href: "/ngo/projects" },
    { label: "Applications", href: "/ngo/applications" },
    { label: "Verification", href: "/ngo/verification" },
    { label: "Profile", href: "/ngo/profile" },
  ];

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

    async function loadDashboard() {
      try {
        const [profileResponse, projectsResponse] =
          await Promise.all([
            apiFetch<ProfileResponse>("/ngo/profile", {
              token: token ?? undefined,
            }),
            apiFetch<ProjectsResponse>("/ngo/projects", {
              token: token ?? undefined,
            }),
          ]);

        setProfile(getProfile(profileResponse));

        setProjects(
          projectsResponse.data ||
            projectsResponse.projects ||
            []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data NGO."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const projectStats = useMemo(() => {
    const published = projects.filter(
      (project) => project.status === "published"
    ).length;

    const submitted = projects.filter(
      (project) => project.status === "submitted"
    ).length;

    const rejected = projects.filter(
      (project) => project.status === "rejected"
    ).length;

    return {
      total: projects.length,
      published,
      submitted,
      rejected,
    };
  }, [projects]);

  const verificationStatus =
    profile?.verification_status || "not_submitted";

  const organizationName =
    profile?.organization_name ||
    user?.name ||
    "Your Organization";

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan dashboard NGO...
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
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gray-900 px-7 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full border border-white/10" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              NGO Workspace
            </p>

            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome, {organizationName}.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                  Kelola volunteer projects, pantau pengajuan, dan
                  koordinasikan kegiatan organisasi dari satu workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/ngo/projects")}
                className="w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Manage Projects
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Dashboard error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Verification */}
        {!loading && (
          <section
            className={`rounded-3xl border p-6 ${
              verificationStatus === "approved"
                ? "border-emerald-200 bg-emerald-50"
                : verificationStatus === "submitted"
                  ? "border-amber-200 bg-amber-50"
                  : verificationStatus === "rejected"
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Organization Verification
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                  {verificationStatus === "approved"
                    ? "Organization verified"
                    : verificationStatus === "submitted"
                      ? "Verification is being reviewed"
                      : verificationStatus === "rejected"
                        ? "Verification needs attention"
                        : "Verification not submitted"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Status organisasi menentukan akses NGO terhadap
                  proses project pada platform.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${getStatusClass(
                    verificationStatus
                  )}`}
                >
                  {getStatusLabel(verificationStatus)}
                </span>

                {verificationStatus !== "approved" && (
                  <button
                    type="button"
                    onClick={() => router.push("/ngo/verification")}
                    className="text-sm font-semibold text-gray-700 underline underline-offset-4"
                  >
                    Open verification
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Overview
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              Project activity
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="mt-4 h-9 w-16 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-28 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Projects"
                value={projectStats.total}
                description="All projects"
              />

              <StatCard
                label="Published"
                value={projectStats.published}
                description="Visible to students"
              />

              <StatCard
                label="Submitted"
                value={projectStats.submitted}
                description="Waiting for review"
              />

              <StatCard
                label="Rejected"
                value={projectStats.rejected}
                description="Need changes"
              />
            </div>
          )}
        </section>

        {/* Projects */}
        <section>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Recent work
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                Your projects
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/ngo/projects")}
              className="text-sm font-semibold text-gray-700 underline underline-offset-4"
            >
              View all projects
            </button>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="h-5 w-2/3 rounded bg-gray-200" />
                  <div className="mt-4 h-4 w-1/3 rounded bg-gray-100" />
                  <div className="mt-6 h-4 rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-5 rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="3"
                  />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No projects yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Project yang dibuat organisasi akan muncul di sini.
              </p>

              <button
                type="button"
                onClick={() => router.push("/ngo/projects")}
                className="mt-6 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Manage Projects
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {projects.slice(0, 4).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    router.push(`/ngo/projects/${project.id}`)
                  }
                  className="group rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Volunteer Project
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight text-gray-900">
                        {project.title}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClass(
                        project.status
                      )}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-500">
                    {project.description ||
                      "No project description available."}
                  </p>

                  <div className="mt-6 grid gap-4 border-t border-black/5 pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDate(project.start_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
                        Time
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatTime(project.start_at)} —{" "}
                        {formatTime(project.end_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
                        Capacity
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {project.capacity ?? "-"} volunteers
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-sm font-semibold text-gray-700">
                    <span>
                      {project.location || "Location not specified"}
                    </span>

                    <span className="transition group-hover:translate-x-1">
                      View →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Quick Actions
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
              Manage your workspace
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Projects"
              description="Create, review, and submit volunteer projects."
              onClick={() => router.push("/ngo/projects")}
            />

            <ActionCard
              title="Applications"
              description="Review volunteer applications from students."
              onClick={() => router.push("/ngo/applications")}
            />

            <ActionCard
              title="Verification"
              description="Manage your organization's verification status."
              onClick={() => router.push("/ngo/verification")}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
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
      className="group rounded-2xl border border-gray-200 p-5 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>

        <span className="text-gray-400 transition group-hover:translate-x-1">
          →
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </button>
  );
}