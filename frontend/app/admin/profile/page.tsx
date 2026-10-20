"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DashboardShell from "@/components/layout/DashboardShell";
import { adminNavigation } from "@/lib/admin-navigation";
import DeleteAccountCard from "@/components/account/DeleteAccountCard";
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type AdminUser = AuthUser & {
  status?: string | null;
  email_verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MeResponse = {
  user: AdminUser;
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
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=90";

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getStatusLabel(
  status?: string | null,
) {
  switch (status) {
    case "active":
      return "Active";

    case "suspended":
      return "Suspended";

    case "deleted":
      return "Deleted";

    default:
      return "Active";
  }
}

function getStatusClass(
  status?: string | null,
) {
  switch (status) {
    case "suspended":
      return "bg-amber-50 text-amber-700";

    case "deleted":
      return "bg-red-50 text-red-700";

    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

export default function AdminProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AdminUser | null>(null);

  const [loading, setLoading] =
    useState(true);

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
      router.replace("/login");
      return;
    }

    if (
      storedUser.role !==
      "admin"
    ) {
      router.replace("/");
      return;
    }

    const currentUser: AdminUser = {
      ...storedUser,
    };

    setUser(currentUser);

    async function loadProfile(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<MeResponse>(
            "/auth/me",
            {
              token:
                authToken,
            },
          );

        if (
          response.user.role !==
          "admin"
        ) {
          router.replace("/");
          return;
        }

        setUser(
          response.user,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil admin profile.",
        );

        setUser(
          currentUser,
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile(token);
  }, [router]);

  const initials =
    useMemo(() => {
      return (
        user?.name
          ?.split(" ")
          .map((part) =>
            part.charAt(0),
          )
          .join("")
          .slice(0, 2)
          .toUpperCase() ||
        "AD"
      );
    }, [user]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan admin profile...
        </div>
      </main>
    );
  }

  return (
   <DashboardShell
  user={user}
  role="admin"
  navigation={adminNavigation}
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
          <div className="grid min-h-[400px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4f0ff] px-3 py-1.5 text-[10px] font-semibold text-[#6d35e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d35e8]" />

                ADMIN PROFILE
              </div>

              <p className="mt-5 text-sm font-medium text-[#6f6579]">
                Platform administration
              </p>

              <h1 className="mt-2 max-w-[620px] text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#171321] sm:text-[52px]">
                Manage the platform.

                <span className="block text-[#6d35e8]">
                  Keep everything trusted.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#74687f] sm:text-base">
                Kelola identitas akun
                administrator yang digunakan
                untuk moderation,
                verification, credential
                review, dan operational
                platform.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "admin-account",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-lg bg-[#6d35e8] px-5 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(109,53,232,0.18)] transition-colors hover:bg-[#5d2dca]"
                >
                  View Account
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin",
                    )
                  }
                  className="rounded-lg border border-[#e5deef] bg-white px-5 py-3 text-sm font-semibold text-[#5e536a] transition-colors hover:bg-[#faf8ff]"
                >
                  Admin Dashboard →
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative hidden min-h-[400px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Admin workspace"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              {/* STATUS */}
              <div className="absolute right-7 top-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1ebff] text-[10px] font-bold text-[#6d35e8]">
                  ✓
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a8ca6]">
                    Account
                  </p>

                  <p className="text-xs font-bold text-[#21172b]">
                    Administrator
                  </p>
                </div>
              </div>

              {/* GLASS PROFILE */}
              <div className="absolute bottom-7 left-7 right-7 rounded-[22px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_55px_rgba(35,22,45,0.20)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#6d35e8] text-base font-bold text-white shadow-[0_8px_20px_rgba(109,53,232,0.2)]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8d7d9e]">
                      Administrator
                    </p>

                    <h3 className="mt-1 truncate text-lg font-bold text-[#19131f]">
                      {user.name}
                    </h3>

                    <p className="mt-1 truncate text-[10px] text-[#84778f]">
                      {user.email}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusClass(
                      user.status,
                    )}`}
                  >
                    {getStatusLabel(
                      user.status,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO STRIP */}
          <div className="grid border-t border-[#eeeaf5] bg-white sm:grid-cols-3">
            <HeroInfo
              label="Role"
              value="Administrator"
              description="Platform access"
            />

            <HeroInfo
              label="Status"
              value={getStatusLabel(
                user.status,
              )}
              description="Account status"
            />

            <HeroInfo
              label="User ID"
              value={`#${user.id}`}
              description="Internal account ID"
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

        {/* ACCOUNT DETAILS */}
        <motion.section
          variants={
            sectionVariants
          }
          id="admin-account"
          className="scroll-mt-28"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            {/* MAIN ACCOUNT */}
            <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)] sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
                  Account Information
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#21172a]">
                  Administrator identity
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#786d83]">
                  Informasi utama akun admin
                  yang digunakan untuk login
                  dan mengakses operational
                  tools Volunteer Match.
                </p>
              </div>

              {loading ? (
                <div className="mt-7 animate-pulse space-y-5">
                  <div className="h-16 rounded-xl bg-[#f5f2f8]" />

                  <div className="h-16 rounded-xl bg-[#f5f2f8]" />

                  <div className="h-16 rounded-xl bg-[#f5f2f8]" />
                </div>
              ) : (
                <div className="mt-7 space-y-5">
                  <ReadOnlyField
                    label="Full Name"
                    value={
                      user.name
                    }
                    description="Nama administrator yang terdaftar di platform."
                  />

                  <ReadOnlyField
                    label="Email Address"
                    value={
                      user.email
                    }
                    description="Email utama yang digunakan untuk login."
                  />

                  <ReadOnlyField
                    label="Role"
                    value="Administrator"
                    description="Role akun ditentukan oleh sistem dan tidak dapat diubah dari halaman ini."
                  />
                </div>
              )}
            </div>

            {/* ACCOUNT STATUS */}
            <div className="space-y-6">
              <div className="rounded-[24px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
                  Account Status
                </p>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f3eeff] text-lg font-bold text-[#6d35e8]">
                    {initials}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#30283e]">
                      {user.name}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-[9px] font-semibold ${getStatusClass(
                        user.status,
                      )}`}
                    >
                      {getStatusLabel(
                        user.status,
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4 border-t border-[#f0edf5] pt-5">
                  <StatusRow
                    label="Role"
                    value="Admin"
                  />

                  <StatusRow
                    label="User ID"
                    value={`#${user.id}`}
                  />

                  <StatusRow
                    label="Created"
                    value={formatDate(
                      user.created_at,
                    )}
                  />

                  <StatusRow
                    label="Updated"
                    value={formatDate(
                      user.updated_at,
                    )}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e9e3f2] bg-[#f7f3ff] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#6d35e8] shadow-sm">
                  ✦
                </div>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8874aa]">
                  Admin Access
                </p>

                <h3 className="mt-2 text-lg font-semibold text-[#2b2035]">
                  Platform-wide operations
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#78698a]">
                  Akun administrator memiliki
                  akses untuk moderation,
                  verification, credential
                  management, dan monitoring
                  platform.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* RESPONSIBILITIES */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a75b7]">
              Admin Workspace
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#171321]">
              Platform operations at a glance
            </h2>

            <p className="mt-2 text-sm text-[#786d83]">
              Area utama yang dapat dikelola
              oleh administrator.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <AdminFeatureCard
              number="01"
              title="NGO Verification"
              description="Review dan approve organization verification."
            />

            <AdminFeatureCard
              number="02"
              title="Project Moderation"
              description="Review project sebelum dipublish ke student."
            />

            <AdminFeatureCard
              number="03"
              title="Credentials"
              description="Monitor dan revoke credential jika diperlukan."
            />

            <AdminFeatureCard
              number="04"
              title="Platform Trust"
              description="Menjaga keamanan dan integritas operational platform."
            />
          </div>
        </motion.section>

        {/* SECURITY */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="rounded-[22px] border border-[#ece7f5] bg-white p-6 shadow-[0_8px_28px_rgba(72,45,120,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8b78a6]">
              Security
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#19131f]">
              Keep admin access protected.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#7a6f84]">
              Administrator memiliki akses
              tinggi ke platform. Pastikan
              account credential tetap aman
              dan jangan membagikan session
              atau password.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SecurityItem
                icon="✓"
                title="Authenticated Session"
                description="Akses admin dilindungi oleh authentication token."
              />

              <SecurityItem
                icon="◈"
                title="Role Protection"
                description="Admin routes dibatasi menggunakan role authorization."
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-[#ece7f5] bg-[#171321] p-6 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
              VM
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55">
              Volunteer Match
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Administrator account
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/65">
              Account ini digunakan untuk
              menjaga workflow platform tetap
              terverifikasi, aman, dan
              terkontrol.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin",
                )
              }
              className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6d35e8]"
            >
              Back to Dashboard →
            </button>
          </div>
        </motion.section>

        {/* DANGER ZONE */}
        <DeleteAccountCard
          title="Delete administrator account"
          description="Nonaktifkan akses administrator dari Volunteer Match. Data operational, moderation, verification, dan credential historis tetap dipertahankan sebagai record platform."
        />
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

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-medium text-[#9b8fa3]">
        {label}
      </span>

      <span className="text-xs font-semibold text-[#4c4055]">
        {value}
      </span>
    </div>
  );
}

function AdminFeatureCard({
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
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3eeff] text-[10px] font-bold text-[#6d35e8]">
          {number}
        </div>

        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9e91a8]">
          Admin
        </span>
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

function SecurityItem({
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