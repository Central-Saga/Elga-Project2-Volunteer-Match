"use client";

import { FormEvent, useEffect, useState } from "react";
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
  title: string;
};

type CreateResponse = {
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

export default function CreateNgoProjectPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");

  const [riskLevel, setRiskLevel] = useState<
    "low" | "medium" | "high"
  >("low");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setAuthLoading(false);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    const skillList = skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const interestList = interests
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await apiFetch<CreateResponse>("/ngo/projects", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim() || null,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          capacity: Number(capacity),
          required_skills: skillList,
          required_interests: interestList,
          risk_level: riskLevel,
        }),
      });

      router.push("/ngo/projects");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat project."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan create project...
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
      <div className="mx-auto max-w-4xl space-y-8">
        <section>
          <button
            type="button"
            onClick={() => router.push("/ngo/projects")}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            ← Back to Projects
          </button>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900">
            Create Volunteer Project
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Project baru akan disimpan sebagai draft terlebih dahulu.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Cannot create project
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
        >
          <Field label="Project Title">
            <input
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Beach Cleanup Sanur"
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the volunteer activity..."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Location">
            <input
              maxLength={255}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sanur Beach, Bali"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Start">
              <input
                required
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="End">
              <input
                required
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Volunteer Capacity">
              <input
                required
                min={1}
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Risk Level">
              <select
                value={riskLevel}
                onChange={(e) =>
                  setRiskLevel(
                    e.target.value as "low" | "medium" | "high"
                  )
                }
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>

          <Field label="Required Skills">
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="communication, teamwork"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-gray-400">
              Pisahkan skill menggunakan koma.
            </p>
          </Field>

          <Field label="Relevant Interests">
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="environment, community"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-gray-400">
              Pisahkan interest menggunakan koma.
            </p>
          </Field>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-900">
              Draft workflow
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Setelah project dibuat, status awal adalah{" "}
              <strong>draft</strong>. Submit project dari halaman
              Projects ketika sudah siap direview admin.
            </p>
          </div>

          <div className="flex justify-end border-t border-black/5 pt-6">
            <button
              disabled={saving}
              type="submit"
              className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Draft Project"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-900">
        {label}
      </label>

      {children}
    </div>
  );
}