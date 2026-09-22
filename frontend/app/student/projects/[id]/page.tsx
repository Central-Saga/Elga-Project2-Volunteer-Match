"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

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

type ProjectResponse = {
  message: string;
  data: Project;
};

type ApplicationResponse = {
  message: string;
  data: {
    id: number;
    project_id: number;
    student_profile_id: number;
    motivation: string | null;
    status: string;
    applied_at: string;
  };
};

export default function StudentProjectDetailPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [motivation, setMotivation] = useState("");

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadProject() {
      try {
        const result = await apiFetch<ProjectResponse>(
          `/student/projects/${projectId}`,
          {
            token : token ?? undefined,
          },
        );

        setProject(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil detail project.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, router]);

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setApplying(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch<ApplicationResponse>(
        `/student/projects/${projectId}/apply`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            motivation: motivation.trim() || null,
          }),
        },
      );

      setSuccess(
        "Application berhasil dikirim. Sekarang tunggu review dari NGO.",
      );

      setMotivation("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim application.",
      );
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-5">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-12 max-w-2xl rounded bg-gray-200" />
            <div className="h-64 rounded-3xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  const formattedStart = new Date(project.start_at).toLocaleString(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  );

  const formattedEnd = new Date(project.end_at).toLocaleString(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  );

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f7f5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            ← Kembali
          </button>

          <div className="text-sm font-semibold tracking-tight">
            Volunteer Match
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Published
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm ring-1 ring-black/5">
                Project #{project.id}
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              {project.title}
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
              {project.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Lokasi"
                value={project.location ?? "Belum ditentukan"}
              />

              <InfoCard
                label="Volunteer Slots"
                value={`${project.capacity} orang`}
              />

              <InfoCard
                label="Mulai"
                value={formattedStart}
              />

              <InfoCard
                label="Selesai"
                value={formattedEnd}
              />
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <TagSection
                title="Skills yang dibutuhkan"
                items={project.required_skills ?? []}
              />

              <TagSection
                title="Minat yang relevan"
                items={project.required_interests ?? []}
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-gray-900 p-6 text-white shadow-xl">
              <p className="text-sm font-medium text-white/60">
                Mau ikut berkontribusi?
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Daftar sebagai volunteer
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/60">
                Ceritakan sedikit alasan kamu tertarik dengan
                kegiatan ini.
              </p>

              <form onSubmit={handleApply} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="motivation"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Motivation
                  </label>

                  <textarea
                    id="motivation"
                    value={motivation}
                    onChange={(event) =>
                      setMotivation(event.target.value)
                    }
                    rows={6}
                    placeholder="Kenapa kamu tertarik mengikuti kegiatan ini?"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30 focus:bg-white/[0.12]"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-300">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={applying}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-bold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applying
                    ? "Mengirim application..."
                    : "Apply sebagai Volunteer →"}
                </button>
              </form>

              <div className="mt-5 border-t border-white/10 pt-5 text-xs leading-5 text-white/45">
                Setelah apply, application kamu akan direview
                oleh penyelenggara kegiatan.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold leading-6 text-gray-900">
        {value}
      </p>
    </div>
  );
}

function TagSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>

      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-black/5"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">
          Belum ada data.
        </p>
      )}
    </div>
  );
}