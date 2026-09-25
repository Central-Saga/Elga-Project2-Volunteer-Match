"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

const profileHeroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "-";
  }

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

export default function StudentProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [profile, setProfile] =
    useState<StudentProfile | null>(
      null,
    );

  const [nim, setNim] =
    useState("");

  const [
    studyProgram,
    setStudyProgram,
  ] = useState("");

  const [campusId, setCampusId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const token =
      getStoredToken();

    const storedUser =
      getStoredUser();

    if (
      !token ||
      !storedUser
    ) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      storedUser.role !==
      "student"
    ) {
      router.replace("/");
      return;
    }

    setUser(storedUser);

    async function loadProfile(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<ProfileResponse>(
            "/student/profile",
            {
              token:
                authToken,
            },
          );

        const profileData =
          response.profile ||
          response.data ||
          ({
            nim:
              response.nim as
                | string
                | null
                | undefined,

            study_program:
              response.study_program as
                | string
                | null
                | undefined,

            campus_id:
              response.campus_id as
                | number
                | null
                | undefined,
          } satisfies StudentProfile);

        setProfile(
          profileData,
        );

        setNim(
          profileData.nim ??
            "",
        );

        setStudyProgram(
          profileData.study_program ??
            "",
        );

        setCampusId(
          profileData.campus_id !==
            null &&
            profileData.campus_id !==
              undefined
            ? String(
                profileData.campus_id,
              )
            : "",
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile(token);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getStoredToken();

    if (!token) {
      setError(
        "Session tidak ditemukan.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        nim: nim.trim(),

        study_program:
          studyProgram.trim(),

        ...(campusId.trim()
          ? {
              campus_id:
                Number(
                  campusId,
                ),
            }
          : {}),
      };

      const response =
        await apiFetch<ProfileResponse>(
          "/student/profile",
          {
            method: "PUT",
            token,

            body: JSON.stringify(
              payload,
            ),
          },
        );

      const updatedProfile =
        response.profile ||
        response.data ||
        ({
          nim: payload.nim,

          study_program:
            payload.study_program,

          campus_id:
            campusId
              ? Number(
                  campusId,
                )
              : profile?.campus_id ??
                null,
        } satisfies StudentProfile);

      setProfile(
        updatedProfile,
      );

      setNim(
        updatedProfile.nim ??
          "",
      );

      setStudyProgram(
        updatedProfile.study_program ??
          "",
      );

      setCampusId(
        updatedProfile.campus_id !==
          null &&
          updatedProfile.campus_id !==
            undefined
          ? String(
              updatedProfile.campus_id,
            )
          : "",
      );

      setSuccess(
        "Profile berhasil diperbarui.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const profileCompletion =
    useMemo(() => {
      const values = [
        nim.trim(),
        studyProgram.trim(),
        campusId.trim(),
      ];

      const completed =
        values.filter(Boolean)
          .length;

      return Math.round(
        (completed /
          values.length) *
          100,
      );
    }, [
      nim,
      studyProgram,
      campusId,
    ]);

  const initials =
    user?.name
      .split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan profile...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="student"
      navigation={
        navigation
      }
    >
      <motion.div
        variants={
          pageVariants
        }
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                STUDENT PROFILE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Personal workspace 👋
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Build your profile.

                <span className="block text-[#6d35e8]">
                  Find better matches.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Kelola identitas akademik
                yang digunakan dalam
                Volunteer Match dan pastikan
                data kamu tetap sesuai.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "academic-profile",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Explore Projects →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
              <img
                src={
                  profileHeroImage
                }
                alt="Volunteer profile"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* COMPLETION BADGE */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs text-[#6d35e8]">
                  ✓
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Profile Completion
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {
                      profileCompletion
                    }
                    % complete
                  </p>
                </div>
              </div>

              {/* PROFILE CARD */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#6d35e8] text-base font-bold text-white shadow-[0_8px_20px_rgba(109,53,232,0.2)]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                      Student Profile
                    </p>

                    <h3 className="mt-1 truncate text-lg font-bold tracking-[-0.02em] text-[#19131f]">
                      {user.name}
                    </h3>

                    <p className="mt-1 truncate text-[10px] text-[#84778f]">
                      {studyProgram ||
                        "Study program belum diisi"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a093aa]">
                      NIM
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#30283e]">
                      {nim ||
                        "Not set"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9f3]">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${profileCompletion}%`,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-[#6d35e8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-3">
            <HeroInfo
              label="Academic ID"
              value={
                nim || "Not set"
              }
              description="Student NIM"
            />

            <HeroInfo
              label="Study Program"
              value={
                studyProgram ||
                "Not set"
              }
              description="Academic program"
            />

            <HeroInfo
              label="Campus ID"
              value={
                campusId ||
                "Not set"
              }
              description="Institution link"
            />
          </div>
        </motion.section>

        {/* ALERTS */}
        {error && (
          <motion.div
            variants={
              sectionVariants
            }
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                ×
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Profile updated
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACCOUNT + PROFILE */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"
        >
          {/* ACCOUNT */}
          <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
              Account
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
              Basic information
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#7a6f84]">
              Informasi dasar akun yang
              digunakan untuk masuk ke
              Volunteer Match.
            </p>

            <div className="mt-6 flex items-center gap-4 rounded-[18px] bg-[#faf8ff] p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#6d35e8] text-sm font-bold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#30283e]">
                  {user.name}
                </p>

                <p className="mt-1 truncate text-[11px] text-[#94879f]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ReadOnlyField
                label="Full Name"
                value={
                  user.name
                }
                description="Nama dikelola melalui account authentication."
              />

              <ReadOnlyField
                label="Email Address"
                value={
                  user.email
                }
                description="Email tidak diubah dari halaman profile."
              />
            </div>
          </div>

          {/* ACADEMIC FORM */}
          <div
            id="academic-profile"
            className="scroll-mt-28 rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                  Academic Profile
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
                  Student information
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#7a6f84]">
                  Pastikan data akademik
                  sesuai dengan informasi
                  kampus kamu.
                </p>
              </div>

              <div className="rounded-full bg-[#f3eeff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                {profileCompletion}%
                Complete
              </div>
            </div>

            {loading ? (
              <div className="mt-7 animate-pulse space-y-5">
                <div className="h-14 rounded-xl bg-[#f5f2f8]" />
                <div className="h-14 rounded-xl bg-[#f5f2f8]" />
                <div className="h-14 rounded-xl bg-[#f5f2f8]" />

                <div className="ml-auto h-11 w-36 rounded-xl bg-[#f5f2f8]" />
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-7 space-y-5"
              >
                {/* NIM */}
                <div>
                  <label
                    htmlFor="nim"
                    className="text-xs font-semibold text-[#41364b]"
                  >
                    NIM
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#a093aa]">
                      #
                    </div>

                    <input
                      id="nim"
                      type="text"
                      value={nim}
                      onChange={(
                        event,
                      ) =>
                        setNim(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Contoh: 230101001"
                      className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3.5 pl-11 pr-4 text-sm text-[#30283e] outline-none transition placeholder:text-[#b7adbe] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                    />
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                    Nomor Induk Mahasiswa
                    kamu.
                  </p>
                </div>

                {/* PROGRAM */}
                <div>
                  <label
                    htmlFor="study_program"
                    className="text-xs font-semibold text-[#41364b]"
                  >
                    Study Program
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#9c8baa]">
                      ◇
                    </div>

                    <input
                      id="study_program"
                      type="text"
                      value={
                        studyProgram
                      }
                      onChange={(
                        event,
                      ) =>
                        setStudyProgram(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Contoh: Teknik Informatika"
                      className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3.5 pl-11 pr-4 text-sm text-[#30283e] outline-none transition placeholder:text-[#b7adbe] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                    />
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                    Program studi yang
                    sedang kamu jalani.
                  </p>
                </div>

                {/* CAMPUS */}
                <div>
                  <label
                    htmlFor="campus_id"
                    className="text-xs font-semibold text-[#41364b]"
                  >
                    Campus ID
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#9c8baa]">
                      ◈
                    </div>

                    <input
                      id="campus_id"
                      type="number"
                      min="1"
                      value={
                        campusId
                      }
                      onChange={(
                        event,
                      ) =>
                        setCampusId(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Contoh: 1"
                      className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3.5 pl-11 pr-4 text-sm text-[#30283e] outline-none transition placeholder:text-[#b7adbe] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
                    />
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                    Gunakan ID kampus yang
                    sesuai dengan data
                    backend.
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#f0edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[#95889f]">
                      Last updated
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#5f526a]">
                      {formatDate(
                        profile?.updated_at,
                      )}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#6d35e8] px-6 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.16)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.section>

        {/* PROFILE SUMMARY */}
        {!loading && (
          <motion.section
            variants={
              sectionVariants
            }
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Profile Overview
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Your identity at a glance
              </h2>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <ProfileCard
                number="01"
                label="Student"
                value={
                  user.name
                }
                description={
                  user.email
                }
              />

              <ProfileCard
                number="02"
                label="Academic"
                value={
                  studyProgram ||
                  "Not completed"
                }
                description={
                  nim
                    ? `NIM ${nim}`
                    : "NIM belum diisi"
                }
              />

              <ProfileCard
                number="03"
                label="Institution"
                value={
                  campusId
                    ? `Campus #${campusId}`
                    : "Not connected"
                }
                description="Campus association"
              />
            </div>
          </motion.section>
        )}

        {/* WHY PROFILE MATTERS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
              Why it matters
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
              Keep your academic identity accurate.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#7a6f84]">
              Data profile digunakan
              sebagai bagian dari identitas
              mahasiswa saat mengikuti
              aktivitas Volunteer Match.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <FeatureItem
                icon="✓"
                title="Academic Identity"
                description="NIM dan program studi tetap terhubung dengan profile."
              />

              <FeatureItem
                icon="◈"
                title="Campus Association"
                description="Campus ID menghubungkan profile dengan institusi."
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-[#ece7f5] bg-[#f7f3ff] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
              ✦
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8874aa]">
              Profile Status
            </p>

            <h3 className="mt-2 text-lg font-semibold text-[#2b2035]">
              {profileCompletion ===
              100
                ? "Profile is complete."
                : "Complete your profile."}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#78698a]">
              {profileCompletion ===
              100
                ? "Informasi akademik utama sudah terisi."
                : "Lengkapi field akademik yang masih kosong agar profile lebih lengkap."}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#6d35e8]"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />
              </div>

              <span className="text-xs font-bold text-[#6d35e8]">
                {
                  profileCompletion
                }
                %
              </span>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
        >
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Volunteer Match
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Ready for your next opportunity?
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Explore volunteer projects
                and continue building your
                experience.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Explore Projects →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroInfo({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="max-w-[150px] truncate text-sm font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#41364b]">
        {label}
      </p>

      <div className="mt-2 rounded-xl border border-[#eee9f4] bg-[#faf9fc] px-4 py-3.5 text-sm font-medium text-[#665970]">
        {value}
      </div>

      <p className="mt-2 text-[10px] leading-5 text-[#9c90a5]">
        {description}
      </p>
    </div>
  );
}

function ProfileCard({
  number,
  label,
  value,
  description,
}: {
  number: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[20px] border border-[#eeeaf5] bg-white p-5 shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
          {number}
        </div>

        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9e91a8]">
          {label}
        </span>
      </div>

      <p className="mt-5 line-clamp-1 text-sm font-semibold text-[#30283e]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>
    </motion.div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1ebff] text-xs font-bold text-[#6d35e8]">
        {icon}
      </div>

      <p className="mt-3 text-xs font-semibold text-[#3e3248]">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-[#95899f]">
        {description}
      </p>
    </div>
  );
}