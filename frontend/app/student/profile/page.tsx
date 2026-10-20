"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import DeleteAccountCard from "@/components/account/DeleteAccountCard";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type Campus = {
  id: number;
  name?: string | null;
};

type Availability = Record<string, string[]>;

type StudentProfile = {
  id?: number;
  user_id?: number;
  campus_id?: number | null;
  nim?: string | null;
  study_program?: string | null;

  bio?: string | null;
  avatar_url?: string | null;

  interests?: string[] | null;
  skills?: string[] | null;
  availability?: Availability | null;
  location?: string | null;

  profile_completion?: number | null;

  campus?: Campus | null;

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

const days = [
  {
    key: "monday",
    label: "Monday",
  },
  {
    key: "tuesday",
    label: "Tuesday",
  },
  {
    key: "wednesday",
    label: "Wednesday",
  },
  {
    key: "thursday",
    label: "Thursday",
  },
  {
    key: "friday",
    label: "Friday",
  },
  {
    key: "saturday",
    label: "Saturday",
  },
  {
    key: "sunday",
    label: "Sunday",
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

const inputClass =
  "w-full rounded-xl border border-[#e8e2ee] bg-white px-4 py-3.5 text-sm text-[#30283e] outline-none transition placeholder:text-[#b7adbe] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5";

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

function availabilityHasValue(
  availability: Availability,
) {
  return Object.values(
    availability,
  ).some(
    (items) =>
      Array.isArray(items) &&
      items.length > 0,
  );
}

export default function StudentProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

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

  const [bio, setBio] =
    useState("");

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    interests,
    setInterests,
  ] = useState<string[]>([]);

  const [skills, setSkills] =
    useState<string[]>([]);

  const [
    availability,
    setAvailability,
  ] = useState<Availability>(
    {},
  );

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
          null;

        if (!profileData) {
          setProfile(null);
          return;
        }

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

        setBio(
          profileData.bio ??
            "",
        );

        setAvatarUrl(
          profileData.avatar_url ??
            "",
        );

        setLocation(
          profileData.location ??
            "",
        );

        setInterests(
          Array.isArray(
            profileData.interests,
          )
            ? profileData.interests
            : [],
        );

        setSkills(
          Array.isArray(
            profileData.skills,
          )
            ? profileData.skills
            : [],
        );

        setAvailability(
          profileData.availability &&
            typeof profileData.availability ===
              "object"
            ? profileData.availability
            : {},
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

    if (!nim.trim()) {
      setError(
        "NIM wajib diisi.",
      );

      return;
    }

    if (!studyProgram.trim()) {
      setError(
        "Study Program wajib diisi.",
      );

      return;
    }

    if (!campusId.trim()) {
      setError(
        "Campus ID wajib diisi.",
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        nim:
          nim.trim(),

        study_program:
          studyProgram.trim(),

        campus_id:
          Number(campusId),

        bio:
          bio.trim() ||
          null,

        avatar_url:
          avatarUrl.trim() ||
          null,

        location:
          location.trim() ||
          null,

        interests,

        skills,

        availability,
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
        {
          ...profile,
          ...payload,
        };

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

      setBio(
        updatedProfile.bio ??
          "",
      );

      setAvatarUrl(
        updatedProfile.avatar_url ??
          "",
      );

      setLocation(
        updatedProfile.location ??
          "",
      );

      setInterests(
        updatedProfile.interests ??
          [],
      );

      setSkills(
        updatedProfile.skills ??
          [],
      );

      setAvailability(
        updatedProfile.availability ??
          {},
      );

      setSuccess(
        response.message ||
          "Profile berhasil diperbarui.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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
        Boolean(
          nim.trim(),
        ),
        Boolean(
          studyProgram.trim(),
        ),
        Boolean(
          campusId.trim(),
        ),
        Boolean(
          bio.trim(),
        ),
        Boolean(
          avatarUrl.trim(),
        ),
        Boolean(
          location.trim(),
        ),
        interests.length >
          0,
        skills.length > 0,
        availabilityHasValue(
          availability,
        ),
      ];

      const completed =
        values.filter(
          Boolean,
        ).length;

      return Math.round(
        (completed /
          values.length) *
          100,
      );
    }, [
      nim,
      studyProgram,
      campusId,
      bio,
      avatarUrl,
      location,
      interests,
      skills,
      availability,
    ]);

  const initials =
    user?.name
      .split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "ST";

  const campusLabel =
    profile?.campus?.name ||
    (campusId
      ? `Campus #${campusId}`
      : "Not connected");

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
      navigation={navigation}
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
          <div className="grid min-h-[410px] lg:grid-cols-[0.95fr_1.05fr]">
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
                Perbarui skill, minat,
                lokasi, dan waktu yang
                tersedia agar Volunteer
                Match bisa memberikan
                opportunity yang lebih
                relevan.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "profile-editor",
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

            {/* RIGHT IMAGE */}
            <div className="relative hidden min-h-[410px] overflow-hidden lg:block">
              <img
                src={
                  avatarUrl.trim() ||
                  profileHeroImage
                }
                alt="Student profile"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f1ebff] px-1 text-[9px] font-bold text-[#6d35e8]">
                  {profileCompletion}%
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
                <div className="flex items-center gap-4">
                  {avatarUrl.trim() ? (
                    <img
                      src={
                        avatarUrl
                      }
                      alt={
                        user.name
                      }
                      className="h-14 w-14 shrink-0 rounded-[18px] object-cover shadow-[0_8px_20px_rgba(109,53,232,0.14)]"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#6d35e8] text-base font-bold text-white shadow-[0_8px_20px_rgba(109,53,232,0.2)]">
                      {initials}
                    </div>
                  )}

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

          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-3">
            <HeroInfo
              label="Academic ID"
              value={
                nim ||
                "Not set"
              }
              description="Student NIM"
            />

            <HeroInfo
              label="Location"
              value={
                location ||
                "Not set"
              }
              description="Preferred location"
            />

            <HeroInfo
              label="Campus"
              value={
                campusLabel
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
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
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
            <p className="text-sm font-semibold text-emerald-800">
              Profile updated
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {success}
            </p>
          </motion.div>
        )}

        <motion.section
          variants={
            sectionVariants
          }
          id="profile-editor"
          className="scroll-mt-28"
        >
          {loading ? (
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-7">
              <div className="animate-pulse space-y-5">
                <div className="h-16 rounded-xl bg-[#f5f2f8]" />
                <div className="h-28 rounded-xl bg-[#f5f2f8]" />
                <div className="h-40 rounded-xl bg-[#f5f2f8]" />
              </div>
            </div>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6"
            >
              {/* PROFILE IDENTITY */}
              <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Identity
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#19131f]">
                    Profile photo
                  </h2>

                  <div className="mt-6 flex items-center gap-4">
                    {avatarUrl.trim() ? (
                      <img
                        src={
                          avatarUrl
                        }
                        alt={
                          user.name
                        }
                        className="h-20 w-20 rounded-[22px] object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#6d35e8] text-xl font-bold text-white">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#30283e]">
                        {user.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#94879f]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-xs font-semibold text-[#41364b]">
                      Profile Photo URL
                    </label>

                    <input
                      type="url"
                      value={
                        avatarUrl
                      }
                      onChange={(
                        event,
                      ) =>
                        setAvatarUrl(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="https://..."
                      className={`${inputClass} mt-2`}
                    />

                    <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                      Untuk sekarang foto menggunakan URL.
                      Upload langsung dari device akan kita buat terpisah.
                    </p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Personal Profile
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#19131f]">
                    Tell us about yourself
                  </h2>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-xs font-semibold text-[#41364b]">
                        Bio
                      </label>

                      <textarea
                        value={
                          bio
                        }
                        onChange={(
                          event,
                        ) =>
                          setBio(
                            event
                              .target
                              .value,
                          )
                        }
                        maxLength={
                          1000
                        }
                        rows={5}
                        placeholder="Ceritakan sedikit tentang diri kamu, pengalaman, atau hal yang ingin kamu kontribusikan..."
                        className={`${inputClass} mt-2 resize-none`}
                      />

                      <p className="mt-2 text-right text-[10px] text-[#9a8da5]">
                        {bio.length}/1000
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#41364b]">
                        Location
                      </label>

                      <input
                        type="text"
                        value={
                          location
                        }
                        onChange={(
                          event,
                        ) =>
                          setLocation(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Contoh: Denpasar"
                        className={`${inputClass} mt-2`}
                      />

                      <p className="mt-2 text-[10px] leading-5 text-[#9a8da5]">
                        Lokasi membantu mencocokkan project volunteer di area kamu.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ACADEMIC */}
              <section className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                    Academic Profile
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#19131f]">
                    Student information
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#7a6f84]">
                    Data akademik digunakan sebagai identitas mahasiswa di Volunteer Match.
                  </p>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-[#41364b]">
                      NIM
                    </label>

                    <input
                      type="text"
                      value={nim}
                      onChange={(
                        event,
                      ) =>
                        setNim(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      placeholder="230101001"
                      className={`${inputClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#41364b]">
                      Study Program
                    </label>

                    <input
                      type="text"
                      value={
                        studyProgram
                      }
                      onChange={(
                        event,
                      ) =>
                        setStudyProgram(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      placeholder="Teknik Informatika"
                      className={`${inputClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#41364b]">
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
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      placeholder="1"
                      className={`${inputClass} mt-2`}
                    />
                  </div>
                </div>
              </section>

              {/* MATCHING */}
              <section className="grid gap-5 lg:grid-cols-2">
                <TagEditor
                  eyebrow="Interests"
                  title="What are you interested in?"
                  description="Minat digunakan untuk mencocokkan kamu dengan kategori project yang relevan."
                  placeholder="Contoh: education"
                  items={
                    interests
                  }
                  setItems={
                    setInterests
                  }
                />

                <TagEditor
                  eyebrow="Skills"
                  title="What can you contribute?"
                  description="Tambahkan skill yang bisa kamu gunakan saat menjadi volunteer."
                  placeholder="Contoh: figma"
                  items={
                    skills
                  }
                  setItems={
                    setSkills
                  }
                />
              </section>

              {/* AVAILABILITY */}
              <section className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                      Availability
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-[#19131f]">
                      When are you available?
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a6f84]">
                      Atur waktu yang biasanya tersedia. Data ini bisa diperbarui kapan saja sesuai jadwal kuliah kamu.
                    </p>
                  </div>

                  <div className="rounded-full bg-[#f3eeff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                    Matching weight 20%
                  </div>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {days.map(
                    (day) => (
                      <AvailabilityDay
                        key={
                          day.key
                        }
                        dayKey={
                          day.key
                        }
                        label={
                          day.label
                        }
                        values={
                          availability[
                            day.key
                          ] ??
                          []
                        }
                        onChange={(
                          values,
                        ) =>
                          setAvailability(
                            (
                              current,
                            ) => ({
                              ...current,
                              [
                                day.key
                              ]:
                                values,
                            }),
                          )
                        }
                      />
                    ),
                  )}
                </div>

                <div className="mt-5 rounded-xl bg-[#faf8ff] px-4 py-3">
                  <p className="text-[10px] leading-5 text-[#887a94]">
                    Contoh format:{" "}
                    <span className="font-semibold text-[#6d35e8]">
                      08:00-12:00
                    </span>
                    . Bisa masukkan lebih dari satu waktu dengan koma, misalnya{" "}
                    <span className="font-semibold text-[#6d35e8]">
                      08:00-12:00, 18:00-20:00
                    </span>
                    .
                  </p>
                </div>
              </section>

              {/* SUMMARY & SAVE */}
              <section className="rounded-[24px] border border-[#e9e3f2] bg-[#f7f3ff] p-6 sm:p-7">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8874aa]">
                      Profile Completion
                    </p>

                    <div className="mt-3 flex items-end gap-3">
                      <p className="text-4xl font-semibold tracking-[-0.04em] text-[#6d35e8]">
                        {profileCompletion}%
                      </p>

                      <p className="pb-1 text-xs text-[#8d8098]">
                        completed
                      </p>
                    </div>

                    <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white">
                      <motion.div
                        animate={{
                          width: `${profileCompletion}%`,
                        }}
                        className="h-full rounded-full bg-[#6d35e8]"
                      />
                    </div>

                    <p className="mt-3 text-xs text-[#85768f]">
                      Last updated:{" "}
                      {formatDate(
                        profile?.updated_at,
                      )}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="rounded-lg bg-[#6d35e8] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving Profile..."
                      : "Save Profile Changes"}
                  </button>
                </div>
              </section>
            </form>
          )}
        </motion.section>

        {/* PROFILE OVERVIEW */}
        {!loading && (
          <motion.section
            variants={
              sectionVariants
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Profile Overview
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Your matching identity
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <ProfileCard
                number="01"
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
                number="02"
                label="Interests"
                value={`${interests.length} interest${interests.length === 1 ? "" : "s"}`}
                description={
                  interests
                    .slice(
                      0,
                      3,
                    )
                    .join(
                      ", ",
                    ) ||
                  "Belum ada minat"
                }
              />

              <ProfileCard
                number="03"
                label="Skills"
                value={`${skills.length} skill${skills.length === 1 ? "" : "s"}`}
                description={
                  skills
                    .slice(
                      0,
                      3,
                    )
                    .join(
                      ", ",
                    ) ||
                  "Belum ada skill"
                }
              />

              <ProfileCard
                number="04"
                label="Location"
                value={
                  location ||
                  "Not set"
                }
                description="Volunteer preference"
              />
            </div>
          </motion.section>
        )}

        {/* MATCHING EXPLANATION */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
              Better Matching
            </p>

            <h2 className="mt-2 text-xl font-semibold text-[#19131f]">
              Keep your profile current.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#7a6f84]">
              Skill, minat,
              availability, dan lokasi
              dapat berubah. Update
              profile setiap kali kondisi
              kamu berubah agar
              recommendation tetap relevan.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <FeatureItem
                icon="40"
                title="Skills"
                description="Bobot utama untuk project matching."
              />

              <FeatureItem
                icon="30"
                title="Interests"
                description="Menyesuaikan project dengan minat kamu."
              />

              <FeatureItem
                icon="20"
                title="Availability"
                description="Mencocokkan jadwal dengan waktu kegiatan."
              />

              <FeatureItem
                icon="10"
                title="Location"
                description="Membantu menemukan project yang lebih dekat."
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-[#ece7f5] bg-[#171321] p-6 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
              ✦
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">
              Current Profile
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              {profileCompletion ===
              100
                ? "Your profile is complete."
                : "A few details are still missing."}
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Semakin lengkap profile,
              semakin banyak data yang
              dapat digunakan dalam
              proses matching.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {skills
                .slice(
                  0,
                  3,
                )
                .map(
                  (
                    skill,
                  ) => (
                    <span
                      key={
                        skill
                      }
                      className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/75"
                    >
                      {skill}
                    </span>
                  ),
                )}

              {skills.length ===
                0 && (
                <span className="text-xs text-white/45">
                  Add skills to improve matching.
                </span>
              )}
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
                Profile sudah diperbarui?
                Cari project yang paling
                cocok dengan skill dan
                jadwal kamu.
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

        {/* DANGER ZONE */}
        <DeleteAccountCard />
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

      <p className="max-w-[170px] truncate text-sm font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function TagEditor({
  eyebrow,
  title,
  description,
  placeholder,
  items,
  setItems,
}: {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  items: string[];
  setItems: (
    items: string[],
  ) => void;
}) {
  const [input, setInput] =
    useState("");

  function addItem() {
    const value =
      input
        .trim()
        .replace(
          /^,+|,+$/g,
          "",
        );

    if (!value) {
      return;
    }

    const exists =
      items.some(
        (item) =>
          item.toLowerCase() ===
          value.toLowerCase(),
      );

    if (
      exists ||
      items.length >= 20
    ) {
      setInput("");
      return;
    }

    setItems([
      ...items,
      value,
    ]);

    setInput("");
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addItem();
    }
  }

  function removeItem(
    target: string,
  ) {
    setItems(
      items.filter(
        (item) =>
          item !== target,
      ),
    );
  }

  return (
    <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-lg font-semibold text-[#19131f]">
        {title}
      </h2>

      <p className="mt-2 text-xs leading-5 text-[#897c93]">
        {description}
      </p>

      <div className="mt-5 flex gap-2">
        <input
          value={input}
          onChange={(event) =>
            setInput(
              event.target.value,
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder={
            placeholder
          }
          className={inputClass}
        />

        <button
          type="button"
          onClick={addItem}
          className="rounded-xl bg-[#6d35e8] px-4 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>

      <p className="mt-2 text-[10px] text-[#a093aa]">
        Press Enter atau tombol Add. Maksimal 20.
      </p>

      <div className="mt-4 flex min-h-[42px] flex-wrap gap-2">
        {items.length >
        0 ? (
          items.map(
            (item) => (
              <span
                key={
                  item
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#f3eeff] px-3 py-2 text-[11px] font-medium text-[#6d35e8]"
              >
                {item}

                <button
                  type="button"
                  onClick={() =>
                    removeItem(
                      item,
                    )
                  }
                  className="text-[#9e88ce] transition hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ),
          )
        ) : (
          <p className="text-xs text-[#aaa0b2]">
            Belum ada data.
          </p>
        )}
      </div>
    </div>
  );
}

function AvailabilityDay({
  dayKey,
  label,
  values,
  onChange,
}: {
  dayKey: string;
  label: string;
  values: string[];
  onChange: (
    values: string[],
  ) => void;
}) {
  const value =
    values.join(", ");

  return (
    <div className="rounded-xl border border-[#eee9f4] bg-[#fbfaff] p-4">
      <label
        htmlFor={`availability-${dayKey}`}
        className="text-xs font-semibold text-[#41364b]"
      >
        {label}
      </label>

      <input
        id={`availability-${dayKey}`}
        type="text"
        value={value}
        onChange={(event) => {
          const parsed =
            event.target.value
              .split(",")
              .map(
                (item) =>
                  item.trim(),
              )
              .filter(
                Boolean,
              );

          onChange(parsed);
        }}
        placeholder="08:00-12:00"
        className={`${inputClass} mt-2`}
      />

      <p className="mt-2 text-[9px] text-[#a093aa]">
        Kosongkan jika tidak tersedia.
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
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