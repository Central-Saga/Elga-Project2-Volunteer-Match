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
import {
  API_URL,
  apiFetch,
} from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";
import { campusNavigation } from "@/lib/campus-navigation";

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
;

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

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function statusClass(
  status?: string | null,
) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-700";
}

export default function CampusReportsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [reports, setReports] =
    useState<ReportItem[]>(
      [],
    );

  const [meta, setMeta] =
    useState<ReportMeta>({
      total_records: 0,
      total_hours: 0,
      filters: {},
    });

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [error, setError] =
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
      const params =
        new URLSearchParams();

      if (filters?.from) {
        params.set(
          "from",
          filters.from,
        );
      }

      if (filters?.to) {
        params.set(
          "to",
          filters.to,
        );
      }

      if (filters?.status) {
        params.set(
          "credential_status",
          filters.status,
        );
      }

      const query =
        params.toString();

      const response =
        await apiFetch<ReportResponse>(
          `/campus/reports/volunteer-activities${
            query
              ? `?${query}`
              : ""
          }`,
          {
            token,
          },
        );

      setReports(
        response.data,
      );

      setMeta(
        response.meta,
      );
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

    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    if (
      from &&
      to &&
      from > to
    ) {
      setError(
        "Tanggal awal tidak boleh melewati tanggal akhir.",
      );

      return;
    }

    await loadReports(
      token,
      {
        from,
        to,
        status,
      },
    );
  }

  async function handleReset() {
    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    setFrom("");
    setTo("");
    setStatus("");

    await loadReports(token);
  }

  async function handleExport() {
    const token =
      getStoredToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    setExporting(true);
    setError("");

    try {
      const params =
        new URLSearchParams();

      if (from) {
        params.set(
          "from",
          from,
        );
      }

      if (to) {
        params.set(
          "to",
          to,
        );
      }

      if (status) {
        params.set(
          "credential_status",
          status,
        );
      }

      const query =
        params.toString();

      const response =
        await fetch(
          `${API_URL}/campus/reports/volunteer-activities/export${
            query
              ? `?${query}`
              : ""
          }`,
          {
            headers: {
              Accept:
                "text/csv",

              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (
        !response.ok
      ) {
        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        throw new Error(
          data?.message ||
            `Export failed with status ${response.status}`,
        );
      }

      const blob =
        await response.blob();

      const disposition =
        response.headers.get(
          "Content-Disposition",
        );

      const filenameMatch =
        disposition?.match(
          /filename="?([^"]+)"?/,
        );

      const filename =
        filenameMatch?.[1] ??
        `volunteer-activities-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      const url =
        window.URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href = url;
      link.download =
        filename;

      document.body.appendChild(
        link,
      );

      link.click();
      link.remove();

      window.URL.revokeObjectURL(
        url,
      );
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

  const summary =
    useMemo(() => {
      const active =
        reports.filter(
          (item) =>
            item.credential_status ===
            "active",
        ).length;

      const revoked =
        reports.filter(
          (item) =>
            item.credential_status ===
            "revoked",
        ).length;

      const averageHours =
        meta.total_records > 0
          ? Number(
              meta.total_hours ??
                0,
            ) /
            meta.total_records
          : 0;

      return {
        active,
        revoked,
        averageHours,
      };
    }, [
      reports,
      meta,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan reports...
        </div>
      </main>
    );
  }

  return (
   <DashboardShell
  user={user}
  role="campus"
  navigation={campusNavigation}
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

                CAMPUS REPORTING
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Volunteer activity insights
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Track participation.

                <span className="block text-[#6d35e8]">
                  Measure real impact.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Pantau aktivitas volunteer
                mahasiswa, total jam
                kegiatan, project yang
                diikuti, serta status
                credential dalam satu
                reporting workspace.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "report-records",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  View Activity
                </button>

                <button
                  type="button"
                  disabled={
                    exporting ||
                    loading
                  }
                  onClick={
                    handleExport
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff] disabled:opacity-50"
                >
                  {exporting
                    ? "Exporting..."
                    : "Export CSV ↓"}
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Campus volunteer reports"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[9px] font-bold text-[#6d35e8]">
                  {meta.total_records}
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Activity Records
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Campus Overview
                  </p>
                </div>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Volunteer Snapshot
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  Activity performance
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <HeroStat
                    label="Records"
                    value={
                      meta.total_records
                    }
                  />

                  <HeroStat
                    label="Hours"
                    value={Number(
                      meta.total_hours ??
                        0,
                    ).toFixed(
                      1,
                    )}
                  />

                  <HeroStat
                    label="Average"
                    value={summary.averageHours.toFixed(
                      1,
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <InfoStrip
              label="Total Records"
              value={`${meta.total_records}`}
              description="Volunteer activities"
            />

            <InfoStrip
              label="Volunteer Hours"
              value={Number(
                meta.total_hours ??
                  0,
              ).toFixed(
                1,
              )}
              description="Accumulated hours"
            />

            <InfoStrip
              label="Active Credentials"
              value={`${summary.active}`}
              description="Currently valid"
            />

            <InfoStrip
              label="Revoked"
              value={`${summary.revoked}`}
              description="Revoked records"
            />
          </div>
        </motion.section>

        {/* ERROR */}
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
                  Report error
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* FILTERS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Report Filters
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#21172a]">
                Refine activity data
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                Filter berdasarkan tanggal
                penerbitan credential dan
                status credential.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleExport
              }
              disabled={
                exporting ||
                loading
              }
              className="w-fit rounded-lg bg-[#f3eeff] px-4 py-2.5 text-xs font-semibold text-[#6d35e8] transition hover:bg-[#eae1ff] disabled:opacity-50"
            >
              {exporting
                ? "Exporting..."
                : "Export CSV ↓"}
            </button>
          </div>

          <form
            onSubmit={
              handleFilter
            }
            className="mt-6 grid gap-4 lg:grid-cols-4"
          >
            <FilterField
              label="From"
            >
              <input
                type="date"
                value={from}
                onChange={(
                  event,
                ) =>
                  setFrom(
                    event.target
                      .value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-xs text-[#514458] outline-none focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
              />
            </FilterField>

            <FilterField
              label="To"
            >
              <input
                type="date"
                value={to}
                onChange={(
                  event,
                ) =>
                  setTo(
                    event.target
                      .value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-xs text-[#514458] outline-none focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
              />
            </FilterField>

            <FilterField
              label="Credential Status"
            >
              <select
                value={status}
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-xs text-[#514458] outline-none focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
              >
                <option value="">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="revoked">
                  Revoked
                </option>
              </select>
            </FilterField>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={
                  loading
                }
                className="flex-1 rounded-xl bg-[#6d35e8] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#5d2dca] disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Apply Filter"}
              </button>

              <button
                type="button"
                onClick={
                  handleReset
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-[#e4ddeb] px-4 py-3 text-xs font-semibold text-[#6f6378] transition hover:bg-[#faf8ff] disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>
        </motion.section>

        {/* REPORT */}
        <motion.section
          variants={
            sectionVariants
          }
          id="report-records"
          className="scroll-mt-28 rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Activity Records
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#21172a]">
                Volunteer participation
              </h2>

              <p className="mt-1 text-sm text-[#83788d]">
                {
                  meta.total_records
                }{" "}
                volunteer activity record
                ditemukan.
              </p>
            </div>

            {(meta.filters.from ||
              meta.filters.to ||
              meta.filters
                .credential_status) && (
              <div className="flex flex-wrap gap-2">
                {meta.filters
                  .from && (
                  <FilterPill
                    text={`From ${formatDate(
                      meta.filters
                        .from,
                    )}`}
                  />
                )}

                {meta.filters
                  .to && (
                  <FilterPill
                    text={`To ${formatDate(
                      meta.filters
                        .to,
                    )}`}
                  />
                )}

                {meta.filters
                  .credential_status && (
                  <FilterPill
                    text={
                      meta.filters
                        .credential_status
                    }
                  />
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-[#f7f4fa]"
                  />
                ),
              )}
            </div>
          ) : reports.length ===
            0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#e4ddeb] px-6 py-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3eeff] text-[#6d35e8]">
                ◇
              </div>

              <p className="mt-4 text-sm font-semibold text-[#403448]">
                Belum ada aktivitas volunteer.
              </p>

              <p className="mt-1 text-xs text-[#95899e]">
                Coba ubah filter atau
                tunggu credential mahasiswa
                diterbitkan.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#eeeaf5] text-left">
                    <TableHead>
                      Student
                    </TableHead>

                    <TableHead>
                      Project
                    </TableHead>

                    <TableHead>
                      Period
                    </TableHead>

                    <TableHead>
                      Hours
                    </TableHead>

                    <TableHead>
                      Credential
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>
                  </tr>
                </thead>

                <tbody>
                  {reports.map(
                    (
                      item,
                    ) => (
                      <tr
                        key={
                          item.credential_number
                        }
                        className="border-b border-[#f3eff7] last:border-b-0"
                      >
                        <td className="px-4 py-5">
                          <p className="text-xs font-semibold text-[#382d41]">
                            {item.student
                              ?.nim ??
                              "-"}
                          </p>

                          <p className="mt-1 text-[10px] text-[#978b9f]">
                            {item.student
                              ?.study_program ??
                              "-"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="max-w-[210px] text-xs font-semibold text-[#382d41]">
                            {item.volunteer_activity
                              ?.title ??
                              "-"}
                          </p>

                          <p className="mt-1 max-w-[210px] text-[10px] text-[#978b9f]">
                            {item.volunteer_activity
                              ?.location ??
                              "-"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-xs font-medium text-[#615369]">
                            {formatDate(
                              item.volunteer_activity
                                ?.start_at,
                            )}
                          </p>

                          <p className="mt-1 text-[9px] text-[#aaa0b2]">
                            to{" "}
                            {formatDate(
                              item.volunteer_activity
                                ?.end_at,
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm font-bold text-[#382d41]">
                            {Number(
                              item.completion
                                ?.total_hours ??
                                0,
                            ).toFixed(
                              1,
                            )}
                          </p>

                          <p className="mt-1 text-[9px] text-[#aaa0b2]">
                            hours
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="max-w-[190px] break-all font-mono text-[10px] font-semibold text-[#615369]">
                            {
                              item.credential_number
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/credentials/verify/${encodeURIComponent(
                                  item.credential_number,
                                )}`,
                              )
                            }
                            className="mt-2 text-[9px] font-semibold text-[#6d35e8]"
                          >
                            Verify →
                          </button>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize ${statusClass(
                              item.credential_status,
                            )}`}
                          >
                            {
                              item.credential_status
                            }
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* INSIGHT */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
            Campus Insights
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
            Understand participation at a glance
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <InsightCard
              number="01"
              title="Participation"
              value={`${meta.total_records}`}
              description="Volunteer activity records currently returned."
            />

            <InsightCard
              number="02"
              title="Volunteer Hours"
              value={Number(
                meta.total_hours ??
                  0,
              ).toFixed(
                1,
              )}
              description="Accumulated confirmed volunteer hours."
            />

            <InsightCard
              number="03"
              title="Average Hours"
              value={summary.averageHours.toFixed(
                1,
              )}
              description="Average hours per activity record."
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
                Credential Registry
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Need to inspect a student record?
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Buka daftar credential
                mahasiswa untuk melihat
                record dan verification
                status secara individual.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/campus/credentials",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Student Credentials →
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function HeroStat({
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

      <p className="mt-1 text-lg font-bold text-[#24182d]">
        {value}
      </p>
    </div>
  );
}

function InfoStrip({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0edf5] px-6 py-5 last:border-b-0 sm:border-r sm:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-[#aaa0b3]">
          {description}
        </p>
      </div>

      <p className="text-xl font-bold text-[#30283e]">
        {value}
      </p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9789a2]">
        {label}
      </label>

      {children}
    </div>
  );
}

function FilterPill({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-[#f3eeff] px-3 py-1.5 text-[9px] font-semibold capitalize text-[#6d35e8]">
      {text}
    </span>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a8da5]">
      {children}
    </th>
  );
}

function InsightCard({
  number,
  title,
  value,
  description,
}: {
  number: string;
  title: string;
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
          {number}
        </div>

        <p className="text-2xl font-bold tracking-[-0.04em] text-[#30283e]">
          {value}
        </p>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#30283e]">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-[#93869e]">
        {description}
      </p>
    </motion.div>
  );
}