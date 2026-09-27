"use client";

import {
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

type StudentProfile = {
  nim?: string | null;
  study_program?: string | null;
};

type Project = {
  id: number;
  title: string;
  location?: string | null;
};

type Application = {
  id: number;
  project?: Project | null;
  student_profile?: StudentProfile | null;
};

type Credential = {
  id: number;
  credential_number: string;
  title?: string | null;
  issued_at?: string | null;
  status: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  application?: Application | null;
};

type CredentialResponse = {
  message: string;
  data: Credential[];
};

type FilterMode =
  | "all"
  | "active"
  | "revoked";

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
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function statusClass(
  status: string,
) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-700";
}

export default function CampusCredentialsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    credentials,
    setCredentials,
  ] = useState<Credential[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    filterMode,
    setFilterMode,
  ] = useState<FilterMode>(
    "all",
  );

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

    async function loadCredentials(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<CredentialResponse>(
            "/campus/credentials",
            {
              token:
                authToken,
            },
          );

        setCredentials(
          response.data,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data credentials.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCredentials(token);
  }, [router]);

  const stats =
    useMemo(() => {
      const active =
        credentials.filter(
          (credential) =>
            credential.status ===
            "active",
        ).length;

      const revoked =
        credentials.filter(
          (credential) =>
            credential.status ===
            "revoked",
        ).length;

      const total =
        credentials.length;

      const activeRate =
        total === 0
          ? 100
          : Math.round(
              (active / total) *
                100,
            );

      return {
        total,
        active,
        revoked,
        activeRate,
      };
    }, [credentials]);

  const filteredCredentials =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return credentials.filter(
        (credential) => {
          const student =
            credential.application
              ?.student_profile;

          const project =
            credential.application
              ?.project;

          const matchesSearch =
            !keyword ||
            credential.credential_number
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              credential.title ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              student?.nim ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              student?.study_program ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              project?.title ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            (
              project?.location ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword,
              );

          const matchesFilter =
            filterMode ===
              "all" ||
            credential.status ===
              filterMode;

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      credentials,
      search,
      filterMode,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan credentials...
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

                CAMPUS CREDENTIALS
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Student achievement records
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Monitor achievement.

                <span className="block text-[#6d35e8]">
                  Verify with confidence.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Pantau credential volunteer
                mahasiswa yang terhubung
                dengan kampus, lihat status
                aktif atau revoked, dan
                lakukan verification saat
                diperlukan.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "credentials",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  View Credentials
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/campus/verify",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Verify Credential →
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Campus volunteer credentials"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[9px] font-bold text-[#6d35e8]">
                  {stats.activeRate}%
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Active Ratio
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Credential Health
                  </p>
                </div>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Campus Registry
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  Credential overview
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-[#81748c]">
                  Track issued credential
                  status for students
                  connected to your campus.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <HeroStat
                    label="Total"
                    value={
                      stats.total
                    }
                  />

                  <HeroStat
                    label="Active"
                    value={
                      stats.active
                    }
                  />

                  <HeroStat
                    label="Revoked"
                    value={
                      stats.revoked
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-2 lg:grid-cols-4">
            <InfoStrip
              label="Total Credentials"
              value={`${stats.total}`}
              description="Campus records"
            />

            <InfoStrip
              label="Active"
              value={`${stats.active}`}
              description="Currently valid"
            />

            <InfoStrip
              label="Revoked"
              value={`${stats.revoked}`}
              description="No longer active"
            />

            <InfoStrip
              label="Active Ratio"
              value={`${stats.activeRate}%`}
              description="Credential health"
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
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* HEADER */}
        <motion.section
          variants={
            sectionVariants
          }
          id="credentials"
          className="scroll-mt-28"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Credential Registry
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Student credentials
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                Cari credential berdasarkan
                credential number, NIM,
                study program, project, atau
                lokasi.
              </p>
            </div>

            <div className="relative min-w-[290px]">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-[#a095aa]">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search credential..."
                className="w-full rounded-xl border border-[#e8e2ee] bg-white py-3 pl-10 pr-4 text-xs text-[#43364c] outline-none transition placeholder:text-[#aea3b6] focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterButton
              label={`All (${stats.total})`}
              active={
                filterMode ===
                "all"
              }
              onClick={() =>
                setFilterMode(
                  "all",
                )
              }
            />

            <FilterButton
              label={`Active (${stats.active})`}
              active={
                filterMode ===
                "active"
              }
              onClick={() =>
                setFilterMode(
                  "active",
                )
              }
            />

            <FilterButton
              label={`Revoked (${stats.revoked})`}
              active={
                filterMode ===
                "revoked"
              }
              onClick={() =>
                setFilterMode(
                  "revoked",
                )
              }
            />
          </div>
        </motion.section>

        {/* LIST */}
        {loading ? (
          <motion.div
            variants={
              sectionVariants
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-[390px] animate-pulse rounded-[24px] border border-[#eeeaf5] bg-white"
                />
              ),
            )}
          </motion.div>
        ) : filteredCredentials.length ===
          0 ? (
          <motion.section
            variants={
              sectionVariants
            }
            className="rounded-[26px] border border-[#ece7f5] bg-white px-6 py-16 text-center shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eeff] text-lg text-[#6d35e8]">
              ◇
            </div>

            <h2 className="mt-4 text-xl font-semibold text-[#24192d]">
              No credentials found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#84788e]">
              {credentials.length ===
              0
                ? "Belum ada credential mahasiswa yang terhubung dengan kampus."
                : "Tidak ada credential yang cocok dengan pencarian atau filter."}
            </p>
          </motion.section>
        ) : (
          <motion.section
            variants={
              sectionVariants
            }
            className="grid gap-5 xl:grid-cols-2"
          >
            {filteredCredentials.map(
              (
                credential,
              ) => {
                const application =
                  credential.application;

                const student =
                  application?.student_profile;

                const project =
                  application?.project;

                const isRevoked =
                  credential.status ===
                  "revoked";

                return (
                  <motion.article
                    key={
                      credential.id
                    }
                    whileHover={{
                      y: -2,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="overflow-hidden rounded-[24px] border border-[#ece7f5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
                  >
                    {/* TOP */}
                    <div
                      className={`relative overflow-hidden p-6 ${
                        isRevoked
                          ? "bg-[#fff9f9]"
                          : "bg-[#fbfaff]"
                      }`}
                    >
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[16px] border-[#6d35e8]/5" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9889a4]">
                            Credential #
                            {
                              credential.id
                            }
                          </p>

                          <h3 className="mt-2 line-clamp-2 text-xl font-semibold tracking-[-0.025em] text-[#21172a]">
                            {credential.title ??
                              "Volunteer Credential"}
                          </h3>

                          <p className="mt-2 break-all font-mono text-[10px] font-semibold text-[#81728d]">
                            {
                              credential.credential_number
                            }
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold capitalize ${statusClass(
                            credential.status,
                          )}`}
                        >
                          {
                            credential.status
                          }
                        </span>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailBox
                          label="NIM"
                          value={
                            student?.nim ??
                            "-"
                          }
                        />

                        <DetailBox
                          label="Study Program"
                          value={
                            student?.study_program ??
                            "-"
                          }
                        />

                        <DetailBox
                          label="Project"
                          value={
                            project?.title ??
                            "-"
                          }
                        />

                        <DetailBox
                          label="Issued Date"
                          value={formatDate(
                            credential.issued_at,
                          )}
                        />
                      </div>

                      {project?.location && (
                        <div className="mt-4 rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
                          <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8da5]">
                            Project Location
                          </p>

                          <p className="mt-2 text-xs font-semibold text-[#4e4258]">
                            {
                              project.location
                            }
                          </p>
                        </div>
                      )}

                      {/* REVOKED INFO */}
                      {isRevoked &&
                        credential.revocation_reason && (
                          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                                !
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-red-800">
                                  Credential Revoked
                                </p>

                                <p className="mt-2 text-xs leading-6 text-red-700">
                                  {
                                    credential.revocation_reason
                                  }
                                </p>

                                {credential.revoked_at && (
                                  <p className="mt-2 text-[9px] font-medium text-red-500">
                                    Revoked{" "}
                                    {formatDate(
                                      credential.revoked_at,
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* ACTION */}
                      <div className="mt-6 flex flex-col gap-3 border-t border-[#f0edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                            Credential Verification
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[#93869e]">
                            Open the public
                            verification result.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/credentials/verify/${encodeURIComponent(
                                credential.credential_number,
                              )}`,
                            )
                          }
                          className="w-fit rounded-lg bg-[#f3eeff] px-4 py-2.5 text-xs font-semibold text-[#6d35e8] transition hover:bg-[#eae1ff]"
                        >
                          Verify Credential →
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              },
            )}
          </motion.section>
        )}

        {/* CAMPUS TOOLS */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Campus Tools
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              More than credential monitoring
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <ToolCard
              number="01"
              title="Verify Credential"
              description="Periksa credential secara langsung menggunakan credential number."
              action="Open Verify"
              onClick={() =>
                router.push(
                  "/campus/verify",
                )
              }
            />

            <ToolCard
              number="02"
              title="Volunteer Reports"
              description="Pantau aktivitas volunteer, jumlah record, dan total volunteer hours."
              action="View Reports"
              onClick={() =>
                router.push(
                  "/campus/reports",
                )
              }
            />

            <ToolCard
              number="03"
              title="Campus Profile"
              description="Kelola informasi profil dan identitas kampus yang terhubung."
              action="Manage Profile"
              onClick={() =>
                router.push(
                  "/campus/profile",
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
                Campus Monitoring
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Turn volunteer activity into measurable records.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Lanjut ke volunteer reports
                untuk melihat aktivitas dan
                total jam mahasiswa.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/campus/reports",
                )
              }
              className="w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              View Reports →
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

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-4 py-2.5 text-[10px] font-semibold transition ${
        active
          ? "bg-[#6d35e8] text-white shadow-[0_6px_15px_rgba(109,53,232,0.14)]"
          : "border border-[#e9e3ef] bg-white text-[#7a6e84] hover:bg-[#faf8ff]"
      }`}
    >
      {label}
    </button>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8da5]">
        {label}
      </p>

      <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#4e4258]">
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