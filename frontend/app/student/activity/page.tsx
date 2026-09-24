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
  { label: "Explore", href: "/student" },
  { label: "My Applications", href: "/student/applications" },
  { label: "My Activity", href: "/student/activity" },
  { label: "Credentials", href: "/student/credentials" },
  { label: "Profile", href: "/student/profile" },
];

export default function StudentActivityPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkingInId, setCheckingInId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    async function loadActivities() {
      try {
        const applicationResult =
          await apiFetch<ApplicationsResponse>(
            "/student/applications",
            {
              token: token ?? undefined,
            },
          );

        const results = await Promise.all(
          applicationResult.data.map(async (application) => {
            let attendance: Attendance | null = null;
            let credential: Credential | null = null;

            try {
              const attendanceResult =
                await apiFetch<AttendanceResponse>(
                  `/student/applications/${application.id}/attendance`,
                  {
                    token: token ?? undefined,
                  },
                );

              attendance = attendanceResult.data;
            } catch {
              attendance = null;
            }

            try {
              const credentialResult =
                await apiFetch<CredentialResponse>(
                  `/student/applications/${application.id}/credential`,
                  {
                    token: token ?? undefined,
                  },
                );

              credential = credentialResult.data;
            } catch {
              credential = null;
            }

            return {
              application,
              attendance,
              completion: null,
              credential,
            };
          }),
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

    loadActivities();
  }, [router]);

  async function handleCheckIn(applicationId: number) {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingInId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch<CheckInResponse>(
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
          item.application.id === applicationId
            ? {
                ...item,
                attendance: attendanceResult.data,
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

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan aktivitas...
        </p>
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
            My Activity
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Lihat perjalanan volunteer kamu dari application
            sampai credential.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-700">
              Success
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              {success}
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="h-5 w-1/3 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />

                <div className="mt-7 grid gap-3 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="h-16 rounded-2xl bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-bold">
              Belum ada aktivitas
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Setelah kamu apply kegiatan, progress-nya akan
              muncul di sini.
            </p>

            <button
              onClick={() => router.push("/student")}
              className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Explore Projects
            </button>
          </div>
        )}

        {!loading && activities.length > 0 && (
          <div className="mt-8 space-y-5">
            {activities.map((item) => (
              <ActivityCard
                key={item.application.id}
                item={item}
                checkingIn={
                  checkingInId === item.application.id
                }
                onCheckIn={() =>
                  handleCheckIn(item.application.id)
                }
                onViewProject={() =>
                  router.push(
                    `/student/projects/${item.application.project.id}`,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function ActivityCard({
  item,
  checkingIn,
  onCheckIn,
  onViewProject,
}: {
  item: ActivityItem;
  checkingIn: boolean;
  onCheckIn: () => void;
  onViewProject: () => void;
}) {
  const { application, attendance, credential } = item;

  const isAccepted = application.status === "accepted";

  const isCheckedIn =
    attendance?.status === "checked_in" ||
    attendance?.status === "validated";

  const isValidated =
    attendance?.status === "validated";

  const hasCredential = Boolean(credential);

  const now = new Date();

  const startAt = new Date(
    application.project.start_at,
  );

  const endAt = new Date(
    application.project.end_at,
  );

  const checkInOpensAt = new Date(
    startAt.getTime() - 30 * 60 * 1000,
  );

  const isTooEarly =
    now < checkInOpensAt;

  const isCheckInOpen =
    now >= checkInOpensAt &&
    now <= endAt;

  const isCheckInClosed =
    now > endAt;

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} />

            {attendance && (
              <StatusBadge status={attendance.status} />
            )}

            {credential && (
              <StatusBadge status={credential.status} />
            )}
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight">
            {application.project.title}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {application.project.location ??
              "Flexible location"}{" "}
            ·{" "}
            {startAt.toLocaleDateString("id-ID")}
          </p>
        </div>

        <button
          onClick={onViewProject}
          className="shrink-0 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          View Project
        </button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-4">
        <ProgressStep
          number="01"
          title="Applied"
          active
          subtitle={new Date(
            application.applied_at,
          ).toLocaleDateString("id-ID")}
        />

        <ProgressStep
          number="02"
          title="Accepted"
          active={isAccepted}
          subtitle={
            application.reviewed_at
              ? new Date(
                  application.reviewed_at,
                ).toLocaleDateString("id-ID")
              : "Waiting"
          }
        />

        <ProgressStep
          number="03"
          title="Attendance"
          active={isCheckedIn}
          subtitle={
            attendance
              ? attendance.status.replace("_", " ")
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

      {isAccepted &&
        !attendance &&
        isTooEarly && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-bold text-gray-900">
              Check-in belum dibuka
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Check-in akan dibuka 30 menit sebelum kegiatan
              dimulai.
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Dibuka pada{" "}
              {checkInOpensAt.toLocaleString("id-ID")}
            </p>
          </div>
        )}

      {isAccepted &&
        !attendance &&
        isCheckInOpen && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-blue-900">
                Ready for check-in
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Check-in sedang dibuka. Lakukan check-in untuk
                mencatat kehadiran kamu.
              </p>

              <p className="mt-2 text-xs text-blue-600">
                Check-in tersedia sampai{" "}
                {endAt.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              type="button"
              onClick={onCheckIn}
              disabled={checkingIn}
              className="shrink-0 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingIn
                ? "Checking In..."
                : "Check In"}
            </button>
          </div>
        )}

      {isAccepted &&
        !attendance &&
        isCheckInClosed && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-900">
              Check-in closed
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              Waktu kegiatan sudah selesai sehingga check-in
              tidak lagi tersedia.
            </p>
          </div>
        )}

      {attendance?.status === "checked_in" && (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">
            Check-in recorded
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-700">
            Kehadiran kamu sudah tercatat dan sedang menunggu
            validasi dari NGO.
          </p>

          {attendance.checked_in_at && (
            <p className="mt-2 text-xs text-amber-600">
              Check-in:{" "}
              {new Date(
                attendance.checked_in_at,
              ).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      )}

      {isValidated && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-900">
            Attendance validated
          </p>

          <p className="mt-1 text-sm leading-6 text-emerald-700">
            NGO sudah memvalidasi kehadiran kamu.
          </p>
        </div>
      )}

      {credential && (
        <div className="mt-5 rounded-2xl bg-gray-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Credential
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {credential.credential_number}
              </p>
            </div>

            <button
              onClick={() =>
                window.location.href =
                  `/student/applications/${application.id}/credential`
              }
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              View Credential
            </button>
          </div>
        </div>
      )}
    </article>
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
      className={`rounded-2xl border p-4 ${
        active
          ? "border-black/5 bg-gray-900 text-white"
          : "border-black/5 bg-gray-50 text-gray-400"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">
          {number}
        </span>

        <span
          className={`h-2 w-2 rounded-full ${
            active
              ? "bg-emerald-400"
              : "bg-gray-300"
          }`}
        />
      </div>

      <p className="mt-5 text-sm font-bold">
        {title}
      </p>

      <p
        className={`mt-1 text-xs capitalize ${
          active
            ? "text-white/60"
            : "text-gray-400"
        }`}
      >
        {subtitle}
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
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    withdrawn: "bg-gray-100 text-gray-600",
    checked_in: "bg-blue-50 text-blue-700",
    validated: "bg-emerald-50 text-emerald-700",
    absent: "bg-red-50 text-red-700",
    active: "bg-emerald-50 text-emerald-700",
    revoked: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
        styles[status] ??
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}