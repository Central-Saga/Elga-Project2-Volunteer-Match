"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

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

type Attendance = {
  id: number;
  application_id: number;
  status: "checked_in" | "validated" | "absent";
  checked_in_at: string | null;
  checked_out_at: string | null;
  validated_at: string | null;
};

type Completion = {
  id: number;
  application_id: number;
  status: "confirmed" | "cancelled";
  total_hours: string | number | null;
  confirmed_at: string | null;
  notes: string | null;
};

type Credential = {
  id: number;
  application_id: number;
  credential_number: string;
  title: string;
  issued_at: string;
  status: "active" | "revoked";
};

type ActivityItem = {
  application: Application;
  attendance: Attendance | null;
  completion: Completion | null;
  credential: Credential | null;
};

type ApplicationsResponse = {
  message: string;
  data: Application[];
};

type AttendanceResponse = {
  message: string;
  data: Attendance | null;
};

type CredentialResponse = {
  message: string;
  data: Credential;
};

type CheckInResponse = {
  message: string;
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

const activityHeroImage =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=90";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProjectImage(item: ActivityItem) {
  const text =
    `${item.application.project.title} ${item.application.project.description}`.toLowerCase();

  if (
    text.includes("environment") ||
    text.includes("beach") ||
    text.includes("cleanup")
  ) {
    return "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("education") ||
    text.includes("teach") ||
    text.includes("school")
  ) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85";
  }

  if (
    text.includes("technology") ||
    text.includes("digital") ||
    text.includes("tech")
  ) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
  }

  return activityHeroImage;
}

export default function StudentActivityPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [activities, setActivities] =
    useState<ActivityItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [checkingInId, setCheckingInId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

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

    async function loadActivities(
      authToken: string,
    ) {
      try {
        const applicationResult =
          await apiFetch<ApplicationsResponse>(
            "/student/applications",
            {
              token: authToken,
            },
          );

        const results =
          await Promise.all(
            applicationResult.data.map(
              async (application) => {
                let attendance: Attendance | null =
                  null;

                let credential: Credential | null =
                  null;

                try {
                  const attendanceResult =
                    await apiFetch<AttendanceResponse>(
                      `/student/applications/${application.id}/attendance`,
                      {
                        token: authToken,
                      },
                    );

                  attendance =
                    attendanceResult.data;
                } catch {
                  attendance = null;
                }

                try {
                  const credentialResult =
                    await apiFetch<CredentialResponse>(
                      `/student/applications/${application.id}/credential`,
                      {
                        token: authToken,
                      },
                    );

                  credential =
                    credentialResult.data;
                } catch {
                  credential = null;
                }

                return {
                  application,
                  attendance,
                  completion: null,
                  credential,
                };
              },
            ),
          );

        setActivities(results);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil aktivitas.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivities(token);
  }, [router]);

  async function handleCheckIn(
    applicationId: number,
  ) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingInId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<CheckInResponse>(
          `/student/applications/${applicationId}/check-in`,
          {
            method: "POST",
            token,
          },
        );

      const attendanceResult =
        await apiFetch<AttendanceResponse>(
          `/student/applications/${applicationId}/attendance`,
          {
            token,
          },
        );

      setActivities((current) =>
        current.map((item) =>
          item.application.id ===
          applicationId
            ? {
                ...item,
                attendance:
                  attendanceResult.data,
              }
            : item,
        ),
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal melakukan check-in.",
      );
    } finally {
      setCheckingInId(null);
    }
  }

  const stats = useMemo(() => {
    const accepted =
      activities.filter(
        (item) =>
          item.application.status ===
          "accepted",
      ).length;

    const checkedIn =
      activities.filter(
        (item) =>
          item.attendance?.status ===
            "checked_in" ||
          item.attendance?.status ===
            "validated",
      ).length;

    const validated =
      activities.filter(
        (item) =>
          item.attendance?.status ===
          "validated",
      ).length;

    const credentials =
      activities.filter(
        (item) =>
          Boolean(item.credential),
      ).length;

    return {
      total: activities.length,
      accepted,
      checkedIn,
      validated,
      credentials,
    };
  }, [activities]);

  const journeyProgress =
    stats.total > 0
      ? Math.round(
          ((stats.accepted +
            stats.checkedIn +
            stats.validated +
            stats.credentials) /
            (stats.total * 4)) *
            100,
        )
      : 0;

  const featuredActivity =
    useMemo(() => {
      if (activities.length === 0) {
        return null;
      }

      const acceptedWithoutCredential =
        activities.find(
          (item) =>
            item.application.status ===
              "accepted" &&
            !item.credential,
        );

      if (acceptedWithoutCredential) {
        return acceptedWithoutCredential;
      }

      return [...activities].sort(
        (a, b) =>
          new Date(
            b.application.project.start_at,
          ).getTime() -
          new Date(
            a.application.project.start_at,
          ).getTime(),
      )[0];
    }, [activities]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan aktivitas...
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
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* HERO */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[28px] border border-[#ece7f5] bg-white shadow-[0_14px_45px_rgba(72,45,120,0.07)]"
        >
          <div className="grid min-h-[390px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                VOLUNTEER JOURNEY
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Your activity 👋
              </p>

              <h1 className="mt-2 max-w-[600px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                From joining.

                <span className="block text-[#6d35e8]">
                  To making impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Pantau perjalanan volunteer kamu
                mulai dari application, acceptance,
                attendance, sampai credential.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/applications",
                    )
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  My Applications
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/credentials",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Credentials →
                </button>
              </div>
            </div>

            {/* RIGHT PHOTO */}
            <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
              <img
                src={activityHeroImage}
                alt="Volunteer activity"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* JOURNEY STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-xs text-[#6d35e8]">
                  ✦
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Journey Progress
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    {journeyProgress}% complete
                  </p>
                </div>
              </div>

              {/* FLOATING SUMMARY */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d7d9e]">
                        Activity Snapshot
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#c6b9d4]" />

                      <span className="text-[9px] font-semibold text-[#6d35e8]">
                        {stats.credentials} credentials
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-[18px] font-bold tracking-[-0.02em] text-[#19131f]">
                      {featuredActivity
                        ? featuredActivity.application
                            .project.title
                        : "Start your volunteer journey"}
                    </h3>

                    {featuredActivity && (
                      <p className="mt-2 text-[10px] text-[#81748c]">
                        📍{" "}
                        {featuredActivity.application
                          .project.location ??
                          "Flexible location"}{" "}
                        •{" "}
                        {formatDate(
                          featuredActivity.application
                            .project.start_at,
                        )}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <SnapshotItem
                        label="Accepted"
                        value={stats.accepted}
                      />

                      <SnapshotItem
                        label="Attendance"
                        value={stats.checkedIn}
                      />

                      <SnapshotItem
                        label="Credential"
                        value={stats.credentials}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee9f3]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${journeyProgress}%`,
                          }}
                          transition={{
                            duration: 0.7,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-[#6d35e8]"
                        />
                      </div>

                      <span className="shrink-0 text-[9px] font-semibold text-[#8e8299]">
                        Journey
                      </span>
                    </div>
                  </div>

                  {featuredActivity && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/projects/${featuredActivity.application.project.id}`,
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d35e8] text-white shadow-[0_8px_20px_rgba(109,53,232,0.22)] transition-colors hover:bg-[#5d2dca]"
                      aria-label="View activity project"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M5 12h14" />
                        <path d="m14 7 5 5-5 5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Accepted"
              value={stats.accepted}
              description="Ready to participate"
            />

            <HeroStat
              label="Checked In"
              value={stats.checkedIn}
              description="Attendance recorded"
            />

            <HeroStat
              label="Validated"
              value={stats.validated}
              description="Confirmed by NGO"
            />

            <HeroStat
              label="Credentials"
              value={stats.credentials}
              description="Journey completed"
            />
          </div>
        </motion.section>

        {/* ERROR */}
        {error && (
          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* SUCCESS */}
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Success
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVITIES */}
        <motion.section variants={sectionVariants}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Your Journey
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Activity progress
              </h2>

              <p className="mt-2 text-sm text-[#786d83]">
                Lihat progress setiap kegiatan dari
                application sampai credential.
              </p>
            </div>

            {!loading && (
              <span className="text-xs font-semibold text-[#6d35e8]">
                {activities.length} activities
              </span>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 space-y-5">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[390px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                />
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            activities.length === 0 && (
              <div className="mt-6 rounded-[24px] border border-[#eeeaf5] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f0ff] text-xl">
                  ✦
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#19131f]">
                  Belum ada aktivitas
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786d83]">
                  Setelah kamu apply kegiatan,
                  progress volunteer akan muncul
                  di halaman ini.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/student")
                  }
                  className="mt-6 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white"
                >
                  Explore Projects
                </button>
              </div>
            )}

          {/* ACTIVITY CARDS */}
          {!loading &&
            activities.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},

                  show: {
                    transition: {
                      staggerChildren:
                        0.06,
                    },
                  },
                }}
                className="mt-6 space-y-5"
              >
                {activities.map(
                  (item) => (
                    <ActivityCard
                      key={
                        item.application.id
                      }
                      item={item}
                      checkingIn={
                        checkingInId ===
                        item.application.id
                      }
                      onCheckIn={() =>
                        handleCheckIn(
                          item.application.id,
                        )
                      }
                      onViewProject={() =>
                        router.push(
                          `/student/projects/${item.application.project.id}`,
                        )
                      }
                      onViewCredential={() =>
                        router.push(
                          `/student/applications/${item.application.id}/credential`,
                        )
                      }
                    />
                  ),
                )}
              </motion.div>
            )}
        </motion.section>

        {/* CTA */}
        {!loading &&
          activities.length > 0 && (
            <motion.section
              variants={sectionVariants}
              className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#5e2bd0] via-[#7b45eb] to-[#aa78ed] px-7 py-8 text-white"
            >
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/10" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                    Your Volunteer Journey
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Keep building your impact.
                  </h2>

                  <p className="mt-2 text-sm text-white/75">
                    Every completed activity adds
                    verified experience to your journey.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/student/credentials",
                    )
                  }
                  className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
                >
                  View Credentials →
                </button>
              </div>
            </motion.section>
          )}
      </motion.div>
    </DashboardShell>
  );
}

function ActivityCard({
  item,
  checkingIn,
  onCheckIn,
  onViewProject,
  onViewCredential,
}: {
  item: ActivityItem;
  checkingIn: boolean;
  onCheckIn: () => void;
  onViewProject: () => void;
  onViewCredential: () => void;
}) {
  const {
    application,
    attendance,
    credential,
  } = item;

  const image =
    getProjectImage(item);

  const isAccepted =
    application.status ===
    "accepted";

  const isCheckedIn =
    attendance?.status ===
      "checked_in" ||
    attendance?.status ===
      "validated";

  const isValidated =
    attendance?.status ===
    "validated";

  const hasCredential =
    Boolean(credential);

  const now = new Date();

  const startAt =
    new Date(
      application.project.start_at,
    );

  const endAt =
    new Date(
      application.project.end_at,
    );

  const checkInOpensAt =
    new Date(
      startAt.getTime() -
        30 * 60 * 1000,
    );

  const isTooEarly =
    now < checkInOpensAt;

  const isCheckInOpen =
    now >= checkInOpensAt &&
    now <= endAt;

  const isCheckInClosed =
    now > endAt;

  return (
    <motion.article
      variants={{
        hidden: {
          opacity: 0,
          y: 14,
        },

        show: {
          opacity: 1,
          y: 0,

          transition: {
            duration: 0.35,
            ease: "easeOut" as const,
          },
        },
      }}
      className="overflow-hidden rounded-[24px] border border-[#eeeaf5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
    >
      {/* TOP */}
      <div className="grid lg:grid-cols-[220px_1fr]">
        {/* IMAGE */}
        <div className="relative hidden min-h-[210px] overflow-hidden lg:block">
          <img
            src={image}
            alt={
              application.project.title
            }
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
              Volunteer Project
            </p>

            <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">
              {
                application.project
                  .location ??
                "Flexible location"
              }
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={
                    application.status
                  }
                />

                {attendance && (
                  <StatusBadge
                    status={
                      attendance.status
                    }
                  />
                )}

                {credential && (
                  <StatusBadge
                    status={
                      credential.status
                    }
                  />
                )}
              </div>

              <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#21172a]">
                {
                  application.project
                    .title
                }
              </h3>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#8b7e95]">
                <span>
                  📍{" "}
                  {application.project
                    .location ??
                    "Flexible location"}
                </span>

                <span>
                  ◷{" "}
                  {formatDate(
                    application.project
                      .start_at,
                  )}
                </span>

                <span>
                  {formatTime(
                    application.project
                      .start_at,
                  )}{" "}
                  —{" "}
                  {formatTime(
                    application.project
                      .end_at,
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewProject}
              className="shrink-0 rounded-lg border border-[#e6dfef] bg-white px-4 py-2.5 text-xs font-semibold text-[#62556e] transition-colors hover:bg-[#faf8ff]"
            >
              View Project →
            </button>
          </div>

          {/* PROGRESS */}
          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            <ProgressStep
              number="01"
              title="Applied"
              active
              subtitle={formatDate(
                application.applied_at,
              )}
            />

            <ProgressStep
              number="02"
              title="Accepted"
              active={isAccepted}
              subtitle={
                application.reviewed_at
                  ? formatDate(
                      application.reviewed_at,
                    )
                  : "Waiting"
              }
            />

            <ProgressStep
              number="03"
              title="Attendance"
              active={isCheckedIn}
              subtitle={
                attendance
                  ? attendance.status.replace(
                      "_",
                      " ",
                    )
                  : "Not started"
              }
            />

            <ProgressStep
              number="04"
              title="Credential"
              active={hasCredential}
              subtitle={
                credential
                  ? credential.status
                  : "Not issued"
              }
            />
          </div>
        </div>
      </div>

      {/* CHECK IN TOO EARLY */}
      {isAccepted &&
        !attendance &&
        isTooEarly && (
          <div className="border-t border-[#f0edf5] bg-[#fbfaff] px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3eeff] text-[#6d35e8]">
                ◷
              </div>

              <div>
                <p className="text-sm font-semibold text-[#30283e]">
                  Check-in belum dibuka
                </p>

                <p className="mt-1 text-sm leading-6 text-[#7e7189]">
                  Check-in akan dibuka 30
                  menit sebelum kegiatan
                  dimulai.
                </p>

                <p className="mt-2 text-[10px] font-medium text-[#998ca4]">
                  Opens{" "}
                  {formatDateTime(
                    checkInOpensAt.toISOString(),
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* CHECK IN OPEN */}
      {isAccepted &&
        !attendance &&
        isCheckInOpen && (
          <div className="border-t border-[#e8dfff] bg-[#f7f3ff] px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6d35e8] text-white">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#30283e]">
                    Ready for check-in
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#776786]">
                    Check-in sedang dibuka.
                    Catat kehadiran kamu
                    sekarang.
                  </p>

                  <p className="mt-2 text-[10px] font-medium text-[#8d75aa]">
                    Available until{" "}
                    {formatDateTime(
                      application.project
                        .end_at,
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCheckIn}
                disabled={checkingIn}
                className="shrink-0 rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingIn
                  ? "Checking In..."
                  : "Check In"}
              </button>
            </div>
          </div>
        )}

      {/* CHECK IN CLOSED */}
      {isAccepted &&
        !attendance &&
        isCheckInClosed && (
          <div className="border-t border-red-100 bg-red-50 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                ×
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Check-in closed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  Waktu kegiatan sudah
                  selesai sehingga check-in
                  tidak lagi tersedia.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* CHECKED IN */}
      {attendance?.status ===
        "checked_in" && (
        <div className="border-t border-amber-100 bg-amber-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              ◷
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Check-in recorded
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Kehadiran kamu sudah
                tercatat dan sedang
                menunggu validasi dari NGO.
              </p>

              {attendance.checked_in_at && (
                <p className="mt-2 text-[10px] font-medium text-amber-700">
                  Check-in:{" "}
                  {formatDateTime(
                    attendance.checked_in_at,
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VALIDATED */}
      {isValidated && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Attendance validated
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                NGO sudah memvalidasi
                kehadiran kamu.
              </p>

              {attendance?.validated_at && (
                <p className="mt-2 text-[10px] font-medium text-emerald-700">
                  Validated{" "}
                  {formatDateTime(
                    attendance.validated_at,
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIAL */}
      {credential && (
        <div className="border-t border-[#e8dfff] bg-[#fbfaff] px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1ebff] text-[#6d35e8]">
                ◇
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#998ca4]">
                  Credential Issued
                </p>

                <p className="mt-1 text-sm font-semibold text-[#30283e]">
                  {
                    credential.credential_number
                  }
                </p>

                <p className="mt-1 text-[10px] text-[#96899f]">
                  {credential.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewCredential}
              className="rounded-lg bg-[#6d35e8] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d2dca]"
            >
              View Credential →
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}

function ProgressStep({
  number,
  title,
  active,
  subtitle,
}: {
  number: string;
  title: string;
  active: boolean;
  subtitle: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3.5 transition-colors ${
        active
          ? "border-[#ded2f7] bg-[#f5f0ff]"
          : "border-[#eeeaf2] bg-[#faf9fc]"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-[#6d35e8]" />
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-[9px] font-bold ${
            active
              ? "text-[#6d35e8]"
              : "text-[#b0a5b8]"
          }`}
        >
          {number}
        </span>

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active
              ? "bg-[#6d35e8]"
              : "bg-[#d9d2df]"
          }`}
        />
      </div>

      <p
        className={`mt-4 text-[11px] font-semibold ${
          active
            ? "text-[#30283e]"
            : "text-[#978d9f]"
        }`}
      >
        {title}
      </p>

      <p className="mt-1 line-clamp-1 text-[9px] capitalize text-[#a095aa]">
        {subtitle}
      </p>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9587a2]">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-[#24182d]">
        {value}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="text-2xl font-bold tracking-[-0.03em] text-[#23172d]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-700",

    accepted:
      "bg-emerald-50 text-emerald-700",

    rejected:
      "bg-red-50 text-red-700",

    withdrawn:
      "bg-[#f1eef4] text-[#746b7c]",

    checked_in:
      "bg-[#f1ebff] text-[#6d35e8]",

    validated:
      "bg-emerald-50 text-emerald-700",

    absent:
      "bg-red-50 text-red-700",

    active:
      "bg-emerald-50 text-emerald-700",

    revoked:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${
        styles[status] ??
        "bg-[#f1eef4] text-[#746b7c]"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}