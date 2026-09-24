"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { API_URL, apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type Student = {
  nim?: string | null;
  study_program?: string | null;
};

type VolunteerActivity = {
  project_id?: number;
  title?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

type Completion = {
  status?: string | null;
  total_hours?: string | number | null;
  confirmed_at?: string | null;
};

type ReportItem = {
  credential_number: string;
  credential_status: string;
  student?: Student | null;
  volunteer_activity?: VolunteerActivity | null;
  completion?: Completion | null;
};

type ReportMeta = {
  total_records: number;
  total_hours: number;
  filters: {
    from?: string | null;
    to?: string | null;
    credential_status?: string | null;
  };
};

type ReportResponse = {
  message: string;
  data: ReportItem[];
  meta: ReportMeta;
};

const navigation = [
  { label: "Dashboard", href: "/campus" },
  { label: "Credentials", href: "/campus/credentials" },
  { label: "Verify Credential", href: "/campus/verify" },
  { label: "Reports", href: "/campus/reports" },
  { label: "Profile", href: "/campus/profile" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CampusReportsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [meta, setMeta] = useState<ReportMeta>({
    total_records: 0,
    total_hours: 0,
    filters: {},
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

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

    loadReports(token);
  }, [router]);

  async function loadReports(
    token: string,
    filters?: {
      from?: string;
      to?: string;
      status?: string;
    },
  ) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (filters?.from) {
        params.set("from", filters.from);
      }

      if (filters?.to) {
        params.set("to", filters.to);
      }

      if (filters?.status) {
        params.set(
          "credential_status",
          filters.status,
        );
      }

      const query = params.toString();

      const response =
        await apiFetch<ReportResponse>(
          `/campus/reports/volunteer-activities${
            query ? `?${query}` : ""
          }`,
          {
            token,
          },
        );

      setReports(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan volunteer.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (from && to && from > to) {
      setError(
        "Tanggal awal tidak boleh melewati tanggal akhir.",
      );
      return;
    }

    await loadReports(token, {
      from,
      to,
      status,
    });
  }

  async function handleReset() {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setFrom("");
    setTo("");
    setStatus("");

    await loadReports(token);
  }

  async function handleExport() {
  const token = getStoredToken();

  if (!token) {
    router.replace("/login");
    return;
  }

  setExporting(true);
  setError("");

  try {
    const params = new URLSearchParams();

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    if (status) {
      params.set("credential_status", status);
    }

    const query = params.toString();

    const response = await fetch(
      `${API_URL}/campus/reports/volunteer-activities/export${
        query ? `?${query}` : ""
      }`,
      {
        headers: {
          Accept: "text/csv",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      throw new Error(
        data?.message ||
          `Export failed with status ${response.status}`,
      );
    }

    const blob = await response.blob();

    const disposition =
      response.headers.get("Content-Disposition");

    const filenameMatch =
      disposition?.match(/filename="?([^"]+)"?/);

    const filename =
      filenameMatch?.[1] ??
      `volunteer-activities-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal export laporan.",
    );
  } finally {
    setExporting(false);
  }
}

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f1]">
        <p className="text-sm text-gray-500">
          Menyiapkan reports...
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
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Campus Reporting
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Volunteer Activity Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Pantau aktivitas volunteer mahasiswa,
            credential, dan total jam kegiatan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">
              Total Records
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {meta.total_records}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">
              Total Volunteer Hours
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {Number(meta.total_hours ?? 0).toFixed(1)}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
  <div>
    <h2 className="text-lg font-bold text-gray-900">
      Report Filters
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Filter laporan berdasarkan tanggal penerbitan credential
      dan status credential.
    </p>
  </div>

  <button
    type="button"
    onClick={handleExport}
    disabled={exporting || loading}
    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
  >
    {exporting ? "Exporting..." : "Export CSV"}
  </button>
</div>
          <form
            onSubmit={handleFilter}
            className="mt-6 grid gap-4 lg:grid-cols-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Credential Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              >
                <option value="">All Status</option>
                <option value="active">
                  Active
                </option>
                <option value="revoked">
                  Revoked
                </option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Apply Filter"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Activity Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {meta.total_records} volunteer activity record
              ditemukan.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : reports.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-700">
                Belum ada aktivitas volunteer.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Coba ubah filter atau tunggu credential mahasiswa
                diterbitkan.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Student
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Project
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Period
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Hours
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Credential
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((item) => (
                    <tr
                      key={item.credential_number}
                      className="border-b border-gray-50"
                    >
                      <td className="px-4 py-5">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.student?.nim ?? "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.student?.study_program ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.volunteer_activity?.title ?? "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.volunteer_activity?.location ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-5 text-sm text-gray-600">
                        <p>
                          {formatDate(
                            item.volunteer_activity?.start_at,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          to{" "}
                          {formatDate(
                            item.volunteer_activity?.end_at,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-sm font-bold text-gray-900">
                          {Number(
                            item.completion?.total_hours ?? 0,
                          ).toFixed(1)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          hours
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-sm font-medium text-gray-700">
                          {item.credential_number}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.credential_status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {item.credential_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}