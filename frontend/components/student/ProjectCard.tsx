"use client";

import { useRouter } from "next/navigation";

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

type ProjectCardProps = {
  project: Project;
};

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

export default function ProjectCard({
  project,
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-40 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />

        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10" />

        <div className="absolute -bottom-20 left-8 h-36 w-36 rounded-full border border-white/10" />

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white">
              Published
            </span>

            <span className="text-xs text-white/55">
              {project.capacity} slots
            </span>
          </div>

          <div>
            <p className="text-xs text-white/45">
              Volunteer opportunity
            </p>

            <p className="mt-1 line-clamp-1 text-lg font-bold text-white">
              {project.title}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {project.location ?? "Flexible location"}
          </span>

          <span className="h-1 w-1 rounded-full bg-gray-300" />

          <span>{formatDate(project.start_at)}</span>
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-bold tracking-tight">
          {project.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
          {project.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.required_interests
            ?.slice(0, 3)
            .map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                {interest}
              </span>
            ))}
        </div>

        <div className="mt-6 border-t border-black/5 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
                Schedule
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatTime(project.start_at)} —{" "}
                {formatTime(project.end_at)}
              </p>
            </div>

            <button
              onClick={() =>
                router.push(`/student/projects/${project.id}`)
              }
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:px-5"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}