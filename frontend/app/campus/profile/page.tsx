"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
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
  {
    label: "Dashboard",
    href: "/campus",
  },
  {
    label: "Credentials",
    href: "/campus/credentials",
  },
  {
    label: "Verify Credential",
    href: "/campus/verify",
  },
  {
    label: "Reports",
    href: "/campus/reports",
  },
  {
    label: "Profile",
    href: "/campus/profile",
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
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

export default function CampusProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    profile,
    setProfile,
  ] =
    useState<CampusProfile | null>(
      null,
    );

  const [
    campusId,
    setCampusId,
  ] = useState("");

  const [
    position,
    setPosition,
  ] = useState("");

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
      "campus"
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
            "/campus/profile",
            {
              token:
                authToken,
            },
          );

        setProfile(
          response.profile,
        );

        if (
          response.profile
        ) {
          setCampusId(
            String(
              response.profile
                .campus_id,
            ),
          );

          setPosition(
            response.profile
              .position ?? "",
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

    loadProfile(token);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (!campusId) {
      setError(
        "Campus ID wajib diisi.",
      );

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

            body: JSON.stringify(
              {
                campus_id:
                  Number(
                    campusId,
                  ),

                position:
                  position.trim() ||
                  null,
              },
            ),
          },
        );

      setProfile(
        response.profile,
      );

      setCampusId(
        String(
          response.profile
            .campus_id,
        ),
      );

      setPosition(
        response.profile
          .position ?? "",
      );

      setSuccess(
        response.message,
      );
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

  const completion =
    useMemo(() => {
      let completed = 0;

      if (
        campusId.trim()
      ) {
        completed += 1;
      }

      if (
        position.trim()
      ) {
        completed += 1;
      }

      return Math.round(
        (completed / 2) *
          100,
      );
    }, [
      campusId,
      position,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan campus profile...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={user}
      role="campus"
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
        className="space-y-9"
      >
        {/* HERO */}
        <motion.section
          variants={
            sectionVariants
          }
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[400px] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                CAMPUS PROFILE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Campus account identity
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Stay connected.

                <span className="block text-[#6d35e8]">
                  Keep campus identity clear.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Kelola campus ID dan
                position akun institusi
                yang digunakan untuk
                mengakses student
                credentials, verification,
                dan volunteer reports.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "profile-form",
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
                      "/campus",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Campus Dashboard →
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Campus volunteer community"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[9px] font-bold text-[#6d35e8]">
                  {completion}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Profile
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Completion
                  </p>
                </div>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Connected Campus
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  {profile?.campus
                    ?.name ??
                    "Campus connection"}
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-[#81748c]">
                  Profile information
                  determines the campus
                  context used across
                  monitoring features.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <HeroInfo
                    label="Campus ID"
                    value={
                      profile?.campus_id ??
                      "-"
                    }
                  />

                  <HeroInfo
                    label="Position"
                    value={
                      profile?.position ??
                      "-"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ALERT */}
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
                  Profile saved
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN CONTENT */}
        {loading ? (
          <motion.div
            variants={
              sectionVariants
            }
            className="grid gap-6 lg:grid-cols-[1fr_0.7fr]"
          >
            <div className="h-[390px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white" />

            <div className="h-[390px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white" />
          </motion.div>
        ) : (
          <motion.section
            variants={
              sectionVariants
            }
            id="profile-form"
            className="scroll-mt-28"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
              {/* FORM */}
              <form
                onSubmit={
                  handleSubmit
                }
                className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                    Profile Information
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#21172a]">
                    Campus connection
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                    Update informasi yang
                    menghubungkan akun ini
                    dengan campus record.
                  </p>
                </div>

                {/* CAMPUS ID */}
                <div className="mt-7">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                    Campus ID
                  </label>

                  <input
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
                    className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3.5 text-sm text-[#413548] outline-none transition placeholder:text-[#b1a6b8] focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
                  />

                  <p className="mt-2 text-[10px] leading-5 text-[#978b9f]">
                    Gunakan ID campus yang
                    tersedia di database.
                  </p>
                </div>

                {/* POSITION */}
                <div className="mt-6">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                    Position
                  </label>

                  <input
                    type="text"
                    maxLength={
                      255
                    }
                    value={
                      position
                    }
                    onChange={(
                      event,
                    ) =>
                      setPosition(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Contoh: Student Affairs"
                    className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3.5 text-sm text-[#413548] outline-none transition placeholder:text-[#b1a6b8] focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] leading-5 text-[#978b9f]">
                      Role atau posisi
                      perwakilan campus.
                    </p>

                    <p className="text-[9px] text-[#aaa0b2]">
                      {
                        position.length
                      }
                      /255
                    </p>
                  </div>
                </div>

                {/* BUTTON */}
                <div className="mt-8 flex justify-end border-t border-[#f0edf5] pt-5">
                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="rounded-xl bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.16)] transition hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Profile"}
                  </button>
                </div>
              </form>

              {/* PREVIEW */}
              <div className="space-y-5">
                <div className="rounded-[24px] border border-[#e8e0f5] bg-[#f7f3ff] p-6">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                    Connected Campus
                  </p>

                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-[15px] bg-white text-lg font-bold text-[#6d35e8] shadow-sm">
                    {(
                      profile?.campus
                        ?.name ??
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-[#2d2335]">
                    {profile?.campus
                      ?.name ??
                      "Belum terhubung"}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-[#84768f]">
                    Campus identity yang
                    saat ini terhubung ke
                    account.
                  </p>

                  <div className="mt-6 space-y-3">
                    <PreviewRow
                      label="Campus ID"
                      value={
                        profile?.campus_id ??
                        "-"
                      }
                    />

                    <PreviewRow
                      label="Position"
                      value={
                        profile?.position ??
                        "-"
                      }
                    />
                  </div>
                </div>

                {/* ACCOUNT */}
                <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_6px_22px_rgba(72,45,120,0.04)]">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9789a2]">
                    Account Information
                  </p>

                  <div className="mt-5 space-y-4">
                    <PreviewRow
                      label="Name"
                      value={
                        user.name
                      }
                    />

                    <PreviewRow
                      label="Email"
                      value={
                        user.email
                      }
                    />

                    <PreviewRow
                      label="Role"
                      value="Campus"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* CAMPUS TOOLS */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
            Campus Workspace
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
            Your monitoring tools
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <ToolCard
              number="01"
              title="Student Credentials"
              description="Lihat credential volunteer mahasiswa yang terhubung dengan campus."
              action="View Credentials"
              onClick={() =>
                router.push(
                  "/campus/credentials",
                )
              }
            />

            <ToolCard
              number="02"
              title="Verify Credential"
              description="Periksa status dan validitas credential mahasiswa secara langsung."
              action="Verify Now"
              onClick={() =>
                router.push(
                  "/campus/verify",
                )
              }
            />

            <ToolCard
              number="03"
              title="Volunteer Reports"
              description="Pantau aktivitas volunteer dan total jam mahasiswa."
              action="View Reports"
              onClick={() =>
                router.push(
                  "/campus/reports",
                )
              }
            />
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
                Campus Dashboard
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Your campus workspace is connected.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Kembali ke dashboard untuk
                melihat ringkasan
                credential dan volunteer
                activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/campus",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Back to Dashboard →
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
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9587a2]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-[#24182d]">
        {value}
      </p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eeeaf5] pb-3 last:border-b-0 last:pb-0">
      <p className="text-[10px] text-[#94889d]">
        {label}
      </p>

      <p className="max-w-[65%] break-words text-right text-[11px] font-semibold text-[#4a3e53]">
        {value}
      </p>
    </div>
  );
}

function ToolCard({
  number,
  title,
  description,
  action,
  onClick,
}: {
  number: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-[20px] border border-[#eeeaf5] bg-white p-5 text-left shadow-[0_6px_22px_rgba(72,45,120,0.04)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
        {number}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#30283e]">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>

      <p className="mt-4 text-[10px] font-semibold text-[#6d35e8]">
        {action} →
      </p>
    </motion.button>
  );
}