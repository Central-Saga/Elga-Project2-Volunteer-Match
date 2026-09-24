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

type Campus = {
  id: number;
  name: string;
};

type CampusProfile = {
  id: number;
  user_id: number;
  campus_id: number;
  position?: string | null;
  campus?: Campus | null;
};

type ProfileResponse = {
  profile: CampusProfile | null;
};

type UpdateProfileResponse = {
  message: string;
  profile: CampusProfile;
};

const navigation = [
  { label: "Dashboard", href: "/campus" },
  { label: "Credentials", href: "/campus/credentials" },
  { label: "Verify Credential", href: "/campus/verify" },
  { label: "Reports", href: "/campus/reports" },
  { label: "Profile", href: "/campus/profile" },
];

export default function CampusProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] =
    useState<CampusProfile | null>(null);

  const [campusId, setCampusId] = useState("");
  const [position, setPosition] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "campus") {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProfile() {
      try {
        const response =
          await apiFetch<ProfileResponse>(
            "/campus/profile",
            {
              token: token ?? undefined,
            },
          );

        setProfile(response.profile);

        if (response.profile) {
          setCampusId(
            String(response.profile.campus_id),
          );

          setPosition(
            response.profile.position ?? "",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil campus profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!campusId) {
      setError("Campus ID wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<UpdateProfileResponse>(
          "/campus/profile",
          {
            method: "PUT",
            token,
            body: JSON.stringify({
              campus_id: Number(campusId),
              position:
                position.trim() || null,
            }),
          },
        );

      setProfile(response.profile);
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan campus profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan campus profile...
        </p>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="campus"
      navigation={navigation}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Campus Account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Campus Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Kelola informasi kampus yang terhubung dengan akun ini.
          </p>
        </section>

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
              Profile saved
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="mt-6 h-12 rounded-xl bg-gray-100" />
            <div className="mt-4 h-12 rounded-xl bg-gray-100" />
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5"
            >
              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Campus ID
                </label>

                <input
                  type="number"
                  min="1"
                  value={campusId}
                  onChange={(event) =>
                    setCampusId(
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: 1"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Gunakan ID campus yang tersedia di database.
                </p>
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-900">
                  Position
                </label>

                <input
                  type="text"
                  maxLength={255}
                  value={position}
                  onChange={(event) =>
                    setPosition(
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: Student Affairs"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>
              </div>
            </form>

            <div className="rounded-[2rem] bg-gray-900 p-7 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Connected Campus
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                {profile?.campus?.name ??
                  "Belum terhubung"}
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-white/50">
                    Campus ID
                  </p>

                  <p className="mt-1 font-semibold">
                    {profile?.campus_id ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-white/50">
                    Position
                  </p>

                  <p className="mt-1 font-semibold">
                    {profile?.position ?? "-"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}