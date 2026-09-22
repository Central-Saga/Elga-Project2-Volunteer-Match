"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, type AuthUser } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";
import ProjectCard from "@/components/student/ProjectCard";

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
};

type ProjectsResponse = {
  message: string;
  data: Project[];
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

export default function StudentDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "student") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProjects() {
      try {
        const result = await apiFetch<ProjectsResponse>(
          "/student/projects",
          {
            token: token ?? undefined,
          },
        );

        setProjects(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data project.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return projects;
    }

    return projects.filter((project) => {
      const matchesTitle = project.title
        .toLowerCase()
        .includes(keyword);

      const matchesDescription = project.description
        .toLowerCase()
        .includes(keyword);

      const matchesLocation = project.location
        ?.toLowerCase()
        .includes(keyword);

      const matchesInterest = project.required_interests?.some(
        (item) => item.toLowerCase().includes(keyword),
      );

      const matchesSkill = project.required_skills?.some(
        (item) => item.toLowerCase().includes(keyword),
      );

      return (
        matchesTitle ||
        matchesDescription ||
        matchesLocation ||
        Boolean(matchesInterest) ||
        Boolean(matchesSkill)
      );
    });
  }, [projects, search]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan dashboard...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
      navigation={navigation}
    >
      <div className="space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-gray-900 px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-medium text-white/55">
              Find something meaningful
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Make time matter.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Temukan kegiatan volunteer yang sesuai dengan
              passion, skill, dan waktu yang kamu punya.
            </p>

            <div className="mt-7 max-w-2xl">
              <div className="flex items-center rounded-2xl bg-white p-1.5 shadow-lg">
                <div className="flex flex-1 items-center gap-3 px-4">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari kegiatan, lokasi, skill..."
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSearch(search.trim())}
                  className="hidden rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 sm:block"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -right-10 h-80 w-80 rounded-full border border-white/10" />
        </section>

        {/* Section heading */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Explore opportunities
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Volunteer projects
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Pilih kegiatan yang paling sesuai dengan minat
                dan skill kamu.
              </p>
            </div>

            {!loading && !error && (
              <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-black/5">
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="animate-pulse space-y-4">
                    <div className="h-40 rounded-2xl bg-gray-200" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-6 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-5/6 rounded bg-gray-200" />
                    <div className="h-10 rounded-xl bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-700">
                Gagal memuat project
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            !error &&
            filteredProjects.length === 0 && (
              <div className="mt-6 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Tidak ada project ditemukan
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Coba gunakan kata kunci lain atau kosongkan
                  pencarian untuk melihat semua project.
                </p>

                <button
                  onClick={() => setSearch("")}
                  className="mt-6 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Reset Search
                </button>
              </div>
            )}

          {/* Project cards */}
          {!loading &&
            !error &&
            filteredProjects.length > 0 && (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>
            )}
        </section>
      </div>
    </DashboardShell>
  );
}