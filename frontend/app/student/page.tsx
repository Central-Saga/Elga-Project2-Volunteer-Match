"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import ProjectCard from "@/components/student/ProjectCard";
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

const categories = [
  {
    label: "Environment",
    icon: "🌱",
  },
  {
    label: "Education",
    icon: "📚",
  },
  {
    label: "Technology",
    icon: "💻",
  },
  {
    label: "Community",
    icon: "🤝",
  },
  {
    label: "Health",
    icon: "❤",
  },
  {
    label: "Social",
    icon: "✨",
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
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1500&q=90";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentDashboard() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

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

    async function loadProjects(
      authToken: string,
    ) {
      try {
        const result =
          await apiFetch<ProjectsResponse>(
            "/student/projects",
            {
              token: authToken,
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

    loadProjects(token);
  }, [router]);

  const filteredProjects =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return projects.filter(
        (project) => {
          const matchesSearch =
            !keyword ||
            project.title
              .toLowerCase()
              .includes(keyword) ||
            project.description
              .toLowerCase()
              .includes(keyword) ||
            project.location
              ?.toLowerCase()
              .includes(keyword) ||
            project.required_interests?.some(
              (item) =>
                item
                  .toLowerCase()
                  .includes(keyword),
            ) ||
            project.required_skills?.some(
              (item) =>
                item
                  .toLowerCase()
                  .includes(keyword),
            );

          const matchesCategory =
            category === "All" ||
            project.required_interests?.some(
              (interest) =>
                interest.toLowerCase() ===
                category.toLowerCase(),
            );

          return Boolean(
            matchesSearch &&
              matchesCategory,
          );
        },
      );
    }, [projects, search, category]);

  const bestProject =
    useMemo(() => {
      if (projects.length === 0) {
        return null;
      }

      return projects.reduce(
        (best, current) =>
          (current.match_score ?? 0) >
          (best.match_score ?? 0)
            ? current
            : best,
      );
    }, [projects]);

  const bestMatch =
    bestProject?.match_score ?? 0;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

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
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[440px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />
                VOLUNTEER MATCH
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Halo, {user.name.split(" ")[0]} 👋
              </p>

              <h1 className="mt-2 max-w-[600px] text-[44px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#171321] sm:text-[54px] lg:text-[60px]">
                Find. Join.

                <span className="block text-[#6d35e8]">
                  Make an impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Temukan project volunteer yang sesuai
                dengan skill, interest, lokasi,
                dan jadwal kamu.
              </p>

              {/* SEARCH */}
              <div className="mt-7 max-w-[560px]">
                <div className="flex items-center rounded-xl border border-[#e6e0f0] bg-white p-1.5 shadow-[0_8px_24px_rgba(80,55,130,0.08)]">
                  <div className="flex flex-1 items-center gap-3 px-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 shrink-0 text-[#9f94a9]"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />

                      <path d="m20 20-3.5-3.5" />
                    </svg>

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Cari volunteer opportunity..."
                      className="w-full bg-transparent py-2 text-sm text-[#171321] outline-none placeholder:text-[#a89db2]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSearch(
                        search.trim(),
                      )
                    }
                    className="rounded-lg bg-[#6d35e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5e2bd0]"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* COMMUNITY */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                  ].map(
                    (
                      image,
                      index,
                    ) => (
                      <img
                        key={image}
                        src={image}
                        alt={`Volunteer ${
                          index + 1
                        }`}
                        className="h-7 w-7 rounded-full border-2 border-white object-cover"
                      />
                    ),
                  )}
                </div>

                <p className="text-[11px] text-[#8d8199]">
                  Join meaningful volunteer opportunities
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative hidden min-h-[440px] overflow-hidden lg:block">
              {/* PHOTO */}
              <img
                src={heroImage}
                alt="Volunteer activity"
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* BLEND TO LEFT */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              {/* SOFT DARK BOTTOM */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />

              {/* TOP LABEL */}
              <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0eaff] text-xs">
                  ✨
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Best Match
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {bestMatch}% compatible
                  </p>
                </div>
              </div>

              {/* ELEGANT RECOMMENDATION */}
              {bestProject && (
                <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                          Recommended for you
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                        <span className="text-[9px] font-semibold text-[#6d35e8]">
                          {bestMatch}% Match
                        </span>
                      </div>

                      <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                        {bestProject.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#81748c]">
                        <span>
                          📍{" "}
                          {bestProject.location ??
                            "Flexible location"}
                        </span>

                        <span className="hidden h-1 w-1 rounded-full bg-[#c8becf] sm:block" />

                        <span>
                          {formatDate(
                            bestProject.start_at,
                          )}
                        </span>

                        <span className="hidden h-1 w-1 rounded-full bg-[#c8becf] sm:block" />

                        <span>
                          {bestProject.capacity} slots
                        </span>
                      </div>

                      {/* PROGRESS */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee9f3]">
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${bestMatch}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-[#6d35e8]"
                          />
                        </div>

                        <span className="shrink-0 text-[9px] font-semibold text-[#8e8299]">
                          Smart Match
                        </span>
                      </div>

                      {bestProject.match_reasons?.[0] && (
                        <p className="mt-3 line-clamp-1 text-[10px] text-[#83768e]">
                          ✓{" "}
                          {
                            bestProject
                              .match_reasons[0]
                          }
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/projects/${bestProject.id}`,
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                      aria-label={`View ${bestProject.title}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M5 12h14" />
                        <path d="m14 7 5 5-5 5" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FEATURES */}
          <div className="relative z-20 grid border-t border-[#eeeaf5] bg-white md:grid-cols-4">
            <HeroFeature
              icon="✦"
              title="Smart Matching"
              description="Based on your profile"
            />

            <HeroFeature
              icon="◈"
              title="Flexible Activities"
              description="Match your availability"
            />

            <HeroFeature
              icon="✓"
              title="Verified Credentials"
              description="Build your experience"
            />

            <HeroFeature
              icon="↗"
              title="Real Impact"
              description="Grow with community"
            />
          </div>
        </motion.section>

        {/* CATEGORIES */}
        <motion.section
          variants={sectionVariants}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Discover
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Browse by categories
              </h2>
            </div>

            {category !== "All" && (
              <button
                type="button"
                onClick={() =>
                  setCategory("All")
                }
                className="text-xs font-semibold text-[#6d35e8]"
              >
                View all
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {categories.map(
              (item) => {
                const active =
                  category ===
                  item.label;

                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    whileHover={{
                      y: -3,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() =>
                      setCategory(
                        active
                          ? "All"
                          : item.label,
                      )
                    }
                    className={`rounded-2xl border p-4 text-center transition-colors ${
                      active
                        ? "border-[#6d35e8] bg-[#f4f0ff]"
                        : "border-[#eeeaf5] bg-white hover:border-[#dcd1f5]"
                    }`}
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f0ff] text-lg">
                      {item.icon}
                    </div>

                    <p
                      className={`mt-3 text-xs font-semibold ${
                        active
                          ? "text-[#6d35e8]"
                          : "text-[#30283e]"
                      }`}
                    >
                      {item.label}
                    </p>
                  </motion.button>
                );
              },
            )}
          </div>
        </motion.section>

        {/* PROJECTS */}
        <motion.section
          id="projects"
          variants={sectionVariants}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Recommended
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Projects for you
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Rekomendasi berdasarkan profile,
                interest, skill, location, dan
                availability.
              </p>
            </div>

            {!loading &&
              !error && (
                <span className="text-xs font-semibold text-[#6d35e8]">
                  {
                    filteredProjects.length
                  }{" "}
                  projects
                </span>
              )}
          </div>

          {loading && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[390px] animate-pulse rounded-2xl border border-[#eeeaf5] bg-white"
                  />
                ),
              )}
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                Gagal memuat project
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredProjects.length ===
              0 && (
              <div className="mt-6 rounded-2xl border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl">
                  🔎
                </div>

                <p className="mt-4 font-semibold text-[#171321]">
                  Project tidak ditemukan
                </p>

                <p className="mt-2 text-sm text-[#786d83]">
                  Coba gunakan keyword
                  atau kategori lain.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-4 text-sm font-semibold text-[#6d35e8]"
                >
                  Reset filter
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            filteredProjects.length >
              0 && (
              <motion.div
                key={`${search}-${category}`}
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
                className="mt-6 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {filteredProjects.map(
                  (project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                    />
                  ),
                )}
              </motion.div>
            )}
        </motion.section>

        {/* CTA */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Volunteer Match
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Unlock your potential.
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Join meaningful activities
                and start building your volunteer journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(
                    "projects",
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8] transition-colors hover:bg-[#faf8ff]"
            >
              Explore Projects →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroFeature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#f0edf5] px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f0ff] text-sm font-bold text-[#6d35e8]">
        {icon}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#30283e]">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] text-[#9a8eaa]">
          {description}
        </p>
      </div>
    </div>
  );
}