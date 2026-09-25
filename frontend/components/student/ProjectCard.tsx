"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

type ProjectCardProps = {
  project: Project;
};

function formatDate(date: string) {
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

function getProjectImage(
  project: Project,
) {
  const text = [
    project.title,
    project.description,
    ...(project.required_interests ??
      []),
    ...(project.required_skills ??
      []),
  ]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("beach") ||
    text.includes("environment") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=900&q=80";
  }

  if (
    text.includes("education") ||
    text.includes("teach") ||
    text.includes("school")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80";
  }

  if (
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("digital") ||
    text.includes("php")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
  }

  return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80";
}

function getMatchClass(
  score: number,
) {
  if (score >= 80) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (score >= 60) {
    return "bg-[#f2edff] text-[#6d35e8]";
  }

  if (score >= 40) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-500";
}

export default function ProjectCard({
  project,
}: ProjectCardProps) {
  const router = useRouter();

  const image =
    getProjectImage(project);

  const matchScore =
    project.match_score ?? 0;

  return (
    <motion.article
      variants={{
        hidden: {
          opacity: 0,
          y: 18,
        },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: "easeOut" as const,
          },
        },
      }}
      whileHover={{
        y: -6,
      }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#eeeaf5] bg-white shadow-[0_6px_22px_rgba(72,45,120,0.05)] transition hover:shadow-[0_14px_36px_rgba(72,45,120,0.12)]"
    >
      <div className="relative h-[180px] overflow-hidden">
        <motion.img
          src={image}
          alt={project.title}
          whileHover={{
            scale: 1.06,
          }}
          transition={{
            duration: 0.45,
          }}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8] shadow-sm">
            Volunteer
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold shadow-sm ${getMatchClass(
              matchScore,
            )}`}
          >
            {matchScore}% Match
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>
            📍{" "}
            {project.location ??
              "Flexible"}
          </span>

          <span>•</span>

          <span>
            {formatDate(
              project.start_at,
            )}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-semibold tracking-[-0.02em] text-[#171321]">
          {project.title}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
          {project.description}
        </p>

        <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
          {project.required_interests
            ?.slice(0, 3)
            .map((interest) => (
              <span
                key={interest}
                className="rounded-md bg-[#f6f3fb] px-2.5 py-1 text-[10px] font-medium text-[#685b7d]"
              >
                {interest}
              </span>
            ))}
        </div>

        {project.match_reasons?.[0] && (
          <div className="mt-4 rounded-xl bg-[#faf8ff] px-3 py-2.5">
            <p className="line-clamp-1 text-[10px] text-[#786b8f]">
              ✓{" "}
              {
                project
                  .match_reasons[0]
              }
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#f0edf5] pt-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Capacity
            </p>

            <p className="mt-1 text-xs font-semibold text-[#30283e]">
              {project.capacity} volunteers
            </p>
          </div>

          <motion.button
            whileHover={{
              scale: 1.04,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() =>
              router.push(
                `/student/projects/${project.id}`,
              )
            }
            className="rounded-lg bg-[#6d35e8] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(109,53,232,0.18)] transition hover:bg-[#5e2bd0]"
          >
            View Project
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}