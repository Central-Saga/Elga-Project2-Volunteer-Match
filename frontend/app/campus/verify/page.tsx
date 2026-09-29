"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import { campusNavigation } from "@/lib/campus-navigation";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";


type Student = {
  nim?: string | null;
  study_program?: string | null;
  campus_id?: number | null;
};

type Project = {
  id?: number;
  title?: string | null;
  location?: string | null;
};

type CredentialData = {
  credential_number?: string;
  title?: string | null;
  issued_at?: string | null;
  status?: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  student?: Student | null;
  project?: Project | null;
};

type VerifyResponse = {
  valid: boolean;
  message: string;
  data?: CredentialData;
};

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

export default function CampusVerifyPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    credentialNumber,
    setCredentialNumber,
  ] = useState("");

  const [result, setResult] =
    useState<VerifyResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

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
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

    if (
      !credentialNumber.trim()
    ) {
      setError(
        "Credential number wajib diisi.",
      );

      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await apiFetch<VerifyResponse>(
          `/campus/credentials/verify/${encodeURIComponent(
            credentialNumber.trim(),
          )}`,
          {
            token,
          },
        );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi credential.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearVerification() {
    setCredentialNumber(
      "",
    );

    setResult(null);
    setError("");
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan halaman verifikasi...
        </div>
      </main>
    );
  }

  const credential =
    result?.data;

  const isRevoked =
    credential?.status ===
      "revoked" ||
    result?.valid === false;

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

                CREDENTIAL VERIFICATION
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Campus verification tool
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Verify records.

                <span className="block text-[#6d35e8]">
                  Trust the result.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Masukkan credential number
                mahasiswa untuk memeriksa
                validitas, status credential,
                project volunteer, dan
                informasi akademik yang
                terkait.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "verify-form",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  Verify Now
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/campus/credentials",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Student Credentials →
                </button>
              </div>
            </div>

            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Campus credential verification"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute right-7 top-7 rounded-full border border-white/70 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                  Secure Lookup
                </p>

                <p className="mt-0.5 text-xs font-bold text-[#21172b]">
                  Campus Access
                </p>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d7d9e]">
                  Verification Flow
                </p>

                <h3 className="mt-2 text-lg font-bold text-[#19131f]">
                  Check credential authenticity
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-[#81748c]">
                  Lookup returns credential
                  status together with student
                  and volunteer project context.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <HeroItem
                    number="01"
                    label="Enter"
                  />

                  <HeroItem
                    number="02"
                    label="Verify"
                  />

                  <HeroItem
                    number="03"
                    label="Review"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FORM */}
        <motion.section
          id="verify-form"
          variants={
            sectionVariants
          }
          className="scroll-mt-28"
        >
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                Credential Lookup
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
                Enter credential number
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                Gunakan credential number
                lengkap untuk mendapatkan
                hasil verification dari
                sistem.
              </p>

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-7"
              >
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                  Credential Number
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={
                      credentialNumber
                    }
                    onChange={(
                      event,
                    ) =>
                      setCredentialNumber(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Contoh: VM-20260924-ABC12345"
                    className="min-w-0 flex-1 rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3.5 text-sm font-medium text-[#413548] outline-none transition placeholder:text-[#b1a6b8] focus:border-[#9c79ee] focus:bg-white focus:ring-4 focus:ring-[#6d35e8]/5"
                  />

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="rounded-xl bg-[#6d35e8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.16)] transition hover:bg-[#5d2dca] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify Credential"}
                  </button>
                </div>
              </form>

              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                      ×
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Verification failed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* HELP */}
            <div className="rounded-[24px] border border-[#e6dcfb] bg-[#f7f3ff] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
                ?
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#2e2437]">
                How verification works
              </h3>

              <div className="mt-5 space-y-4">
                <HelpItem
                  number="01"
                  title="Enter ID"
                  text="Masukkan credential number lengkap."
                />

                <HelpItem
                  number="02"
                  title="System Check"
                  text="Campus API memeriksa credential record."
                />

                <HelpItem
                  number="03"
                  title="Review Result"
                  text="Lihat status, student, dan project."
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* RESULT */}
        {result && (
          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
            }}
            className={`overflow-hidden rounded-[26px] border shadow-[0_12px_35px_rgba(72,45,120,0.06)] ${
              isRevoked
                ? "border-red-100 bg-white"
                : "border-emerald-100 bg-white"
            }`}
          >
            {/* RESULT HEADER */}
            <div
              className={`p-7 ${
                isRevoked
                  ? "bg-red-50"
                  : "bg-emerald-50"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                      isRevoked
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isRevoked
                      ? "!"
                      : "✓"}
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        isRevoked
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {isRevoked
                        ? "Credential Revoked"
                        : "Credential Valid"}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#21172a]">
                      {credential?.title ??
                        "Volunteer Credential"}
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                      {
                        result.message
                      }
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${
                    isRevoked
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {credential?.status ??
                    (result.valid
                      ? "active"
                      : "invalid")}
                </span>
              </div>
            </div>

            {/* DETAILS */}
            <div className="p-7">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultBox
                  label="Credential Number"
                  value={
                    credential?.credential_number ??
                    "-"
                  }
                  mono
                />

                <ResultBox
                  label="NIM"
                  value={
                    credential?.student?.nim ??
                    "-"
                  }
                />

                <ResultBox
                  label="Study Program"
                  value={
                    credential?.student
                      ?.study_program ??
                    "-"
                  }
                />

                <ResultBox
                  label="Project"
                  value={
                    credential?.project?.title ??
                    "-"
                  }
                />

                <ResultBox
                  label="Location"
                  value={
                    credential?.project
                      ?.location ??
                    "-"
                  }
                />

                <ResultBox
                  label="Issued Date"
                  value={formatDate(
                    credential?.issued_at,
                  )}
                />
              </div>

              {/* REVOCATION */}
              {isRevoked &&
                credential?.revocation_reason && (
                  <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-500">
                      Revocation Reason
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      {
                        credential.revocation_reason
                      }
                    </p>

                    <p className="mt-3 text-[10px] font-medium text-red-500">
                      Revoked at{" "}
                      {formatDate(
                        credential.revoked_at,
                      )}
                    </p>
                  </div>
                )}

              {/* ACTIONS */}
              <div className="mt-7 flex flex-col gap-3 border-t border-[#f0edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9a8da4]">
                    Verification Complete
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#93869e]">
                    Credential result has
                    been retrieved from the
                    campus verification API.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      clearVerification
                    }
                    className="rounded-lg border border-[#e5deef] bg-white px-4 py-2.5 text-xs font-semibold text-[#675c70] transition hover:bg-[#faf8ff]"
                  >
                    Verify Another
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/campus/credentials",
                      )
                    }
                    className="rounded-lg bg-[#f3eeff] px-4 py-2.5 text-xs font-semibold text-[#6d35e8] transition hover:bg-[#eae1ff]"
                  >
                    Student Credentials →
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* FEATURES */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
            Campus Trust
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
            Verification with context
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <FeatureCard
              number="01"
              title="Credential Status"
              description="Lihat apakah credential masih active atau sudah revoked."
            />

            <FeatureCard
              number="02"
              title="Student Context"
              description="Hubungkan credential dengan NIM dan study program mahasiswa."
            />

            <FeatureCard
              number="03"
              title="Project Context"
              description="Lihat project volunteer dan lokasi yang terkait dengan credential."
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
                Volunteer Reports
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                See the bigger picture.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/75">
                Setelah verification,
                lanjut ke reports untuk
                melihat aktivitas volunteer
                dan total hours mahasiswa.
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

function HeroItem({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-[#f7f3fc] px-3 py-2.5">
      <p className="text-[8px] font-semibold text-[#6d35e8]">
        {number}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-[#46394f]">
        {label}
      </p>
    </div>
  );
}

function HelpItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-[#6d35e8] shadow-sm">
        {number}
      </div>

      <div>
        <p className="text-xs font-semibold text-[#42364b]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#8b7d96]">
          {text}
        </p>
      </div>
    </div>
  );
}

function ResultBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#eeeaf5] bg-[#fbfaff] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8da5]">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-xs font-semibold leading-5 text-[#4e4258] ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
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
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
        {number}
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