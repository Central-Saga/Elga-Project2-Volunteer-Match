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

type StudentProfile = {
  id?: number;
  nim?: string | null;
  study_program?: string | null;
  campus_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileResponse = {
  message?: string;
  data?: StudentProfile;
  profile?: StudentProfile;
  [key: string]: unknown;
};

export default function StudentProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [nim, setNim] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [campusId, setCampusId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigation = [
    { label: "Explore", href: "/student" },
    { label: "My Applications", href: "/student/applications" },
    { label: "My Activity", href: "/student/activity" },
    { label: "Credentials", href: "/student/credentials" },
    { label: "Profile", href: "/student/profile" },
  ];

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

    async function loadProfile() {
      try {
        const response = await apiFetch<ProfileResponse>(
          "/student/profile",
          {
            token: token ?? undefined,
          }
        );

        const profileData =
          response.profile ||
          response.data ||
          ({
            nim: response.nim as string | null | undefined,
            study_program: response.study_program as
              | string
              | null
              | undefined,
            campus_id: response.campus_id as
              | number
              | null
              | undefined,
          } satisfies StudentProfile);

        setProfile(profileData);

        setNim(profileData.nim ?? "");
        setStudyProgram(profileData.study_program ?? "");
        setCampusId(
          profileData.campus_id !== null &&
            profileData.campus_id !== undefined
            ? String(profileData.campus_id)
            : ""
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setError("Session tidak ditemukan.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        nim: nim.trim(),
        study_program: studyProgram.trim(),
        ...(campusId.trim()
          ? { campus_id: Number(campusId) }
          : {}),
      };

      const response = await apiFetch<ProfileResponse>(
        "/student/profile",
        {
          method: "PUT",
          token: token ?? undefined,
          body: JSON.stringify(payload),
        }
      );

      const updatedProfile =
        response.profile ||
        response.data ||
        ({
          nim: payload.nim,
          study_program: payload.study_program,
          campus_id: campusId
            ? Number(campusId)
            : profile?.campus_id ?? null,
        } satisfies StudentProfile);

      setProfile(updatedProfile);

      setNim(updatedProfile.nim ?? "");
      setStudyProgram(updatedProfile.study_program ?? "");
      setCampusId(
        updatedProfile.campus_id !== null &&
          updatedProfile.campus_id !== undefined
          ? String(updatedProfile.campus_id)
          : ""
      );

      setSuccess("Profile berhasil diperbarui.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900" />
          Menyiapkan profile...
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
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Student Workspace
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Your Profile
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Kelola informasi akademik yang digunakan untuk pengalaman
                volunteer kamu di Volunteer Match.
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-xl font-bold text-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Alerts */}
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
              Profile updated
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        {/* Account */}
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Account
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
              Basic information
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Full Name
              </label>

              <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-700">
                {user.name}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Nama akun dikelola melalui autentikasi.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>

              <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-700">
                {user.email}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Email akun tidak diubah dari halaman ini.
              </p>
            </div>
          </div>
        </section>

        {/* Academic */}
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Academic Profile
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
              Student information
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Pastikan informasi akademik kamu sesuai dengan data kampus.
            </p>
          </div>

          {loading ? (
            <div className="mt-7 animate-pulse space-y-5">
              <div className="h-12 rounded-2xl bg-gray-100" />
              <div className="h-12 rounded-2xl bg-gray-100" />
              <div className="h-12 rounded-2xl bg-gray-100" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="nim"
                  className="text-sm font-semibold text-gray-700"
                >
                  NIM
                </label>

                <input
                  id="nim"
                  type="text"
                  value={nim}
                  onChange={(event) => setNim(event.target.value)}
                  placeholder="Contoh: 230101001"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="study_program"
                  className="text-sm font-semibold text-gray-700"
                >
                  Study Program
                </label>

                <input
                  id="study_program"
                  type="text"
                  value={studyProgram}
                  onChange={(event) =>
                    setStudyProgram(event.target.value)
                  }
                  placeholder="Contoh: Teknik Informatika"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="campus_id"
                  className="text-sm font-semibold text-gray-700"
                >
                  Campus ID
                </label>

                <input
                  id="campus_id"
                  type="number"
                  min="1"
                  value={campusId}
                  onChange={(event) => setCampusId(event.target.value)}
                  placeholder="Contoh: 1"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-900"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Gunakan ID kampus yang sesuai dengan data backend.
                </p>
              </div>

              <div className="flex justify-end border-t border-black/5 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Profile summary */}
        <section className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                Profile Summary
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {user.name}
              </h2>

              <p className="mt-2 text-sm text-white/55">
                {studyProgram || "Study program belum diisi"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs text-white/40">
                NIM
              </p>

              <p className="mt-1 font-mono text-sm font-semibold">
                {nim || "Belum diisi"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}