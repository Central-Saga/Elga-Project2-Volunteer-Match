"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, type AuthUser } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

type Application = {
  id: number;
  project_id: number;
  motivation: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  applied_at: string;
  reviewed_at: string | null;
  project: {
    id: number;
    title: string;
    description: string;
    location: string | null;
    start_at: string;
    end_at: string;
    status: string;
  };
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

const navigation = [
  { label: "Explore", href: "/student" },
  { label: "My Applications", href: "/student/applications" },
  { label: "My Activity", href: "/student/activity" },
  { label: "Credentials", href: "/student/credentials" },
  { label: "Profile", href: "/student/profile" },
];

export default function ApplicationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    async function loadApplications() {
      try {
        const result = await apiFetch<ApplicationsResponse>(
          "/student/applications",
          { token : token ?? undefined },
        );

        setApplications(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil applications.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [router]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        Loading...
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
      navigation={navigation}
    >
      <div className="max-w-6xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Your journey
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Applications
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Pantau kegiatan yang sudah kamu daftarkan dan status review-nya.
          </p>
        </div>

        {loading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/3 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                <div className="mt-6 h-10 w-full rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-3xl bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-bold">
              Belum ada application
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Mulai dari Explore dan temukan kegiatan volunteer yang sesuai
              dengan kamu.
            </p>

            <button
              onClick={() => router.push("/student")}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Explore Projects
            </button>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="mt-8 space-y-4">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />

                      <span className="text-xs text-gray-400">
                        Applied{" "}
                        {new Date(application.applied_at).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold tracking-tight">
                      {application.project.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        {application.project.location ?? "Flexible location"}
                      </span>

                      <span>
                        {new Date(
                          application.project.start_at,
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/student/projects/${application.project.id}`,
                      )
                    }
                    className="shrink-0 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    View Project
                  </button>
                </div>

                {application.motivation && (
                  <div className="mt-5 border-t border-black/5 pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Motivation
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {application.motivation}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function StatusBadge({
  status,
}: {
  status: Application["status"];
}) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    withdrawn: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}