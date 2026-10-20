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
import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type UserStatus =
  | "active"
  | "suspended"
  | "deleted";

type UserRole =
  | "student"
  | "ngo"
  | "campus"
  | "admin";

type StudentProfile = {
  id?: number;
  nim?: string | null;
  study_program?: string | null;
};

type NgoProfile = {
  id?: number;
  organization_name?: string | null;
  verification_status?: string | null;
};

type CampusProfile = {
  id?: number;
  position?: string | null;
};

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string | null;

  student_profile?: StudentProfile | null;
  ngo_profile?: NgoProfile | null;
  campus_profile?: CampusProfile | null;
};

type UsersResponse = {
  message: string;
  data: ManagedUser[];
};

type UserActionResponse = {
  message: string;
  data?: ManagedUser;
};

const pageVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

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

export default function AdminUsersPage() {
  const router = useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<AuthUser | null>(
    null,
  );

  const [users, setUsers] =
    useState<ManagedUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState<number | null>(
    null,
  );

  const [search, setSearch] =
    useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState<
    "all" | UserRole
  >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | UserStatus
  >("all");

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
      "admin"
    ) {
      router.replace("/");
      return;
    }

    setCurrentUser(
      storedUser,
    );

    async function loadUsers(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<UsersResponse>(
            "/admin/users",
            {
              token:
                authToken,
            },
          );

        setUsers(
          response.data ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data user.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers(token);
  }, [router]);

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const matchesSearch =
            !keyword ||
            user.name
              .toLowerCase()
              .includes(
                keyword,
              ) ||
            user.email
              .toLowerCase()
              .includes(
                keyword,
              );

          const matchesRole =
            roleFilter ===
              "all" ||
            user.role ===
              roleFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            user.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        },
      );
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    return {
      total:
        users.length,

      active:
        users.filter(
          (user) =>
            user.status ===
            "active",
        ).length,

      suspended:
        users.filter(
          (user) =>
            user.status ===
            "suspended",
        ).length,

      deleted:
        users.filter(
          (user) =>
            user.status ===
            "deleted",
        ).length,
    };
  }, [users]);

  function updateLocalUser(
    updatedUser: ManagedUser,
  ) {
    setUsers(
      (current) =>
        current.map(
          (user) =>
            user.id ===
            updatedUser.id
              ? {
                  ...user,
                  ...updatedUser,
                }
              : user,
        ),
    );
  }

  async function handleSuspend(
    user: ManagedUser,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      setError(
        "Session tidak ditemukan.",
      );

      return;
    }

    if (
      user.id ===
      currentUser?.id
    ) {
      setError(
        "Admin tidak dapat suspend akun sendiri dari User Management.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Suspend akun ${user.name}? Semua session user akan langsung dicabut.`,
      );

    if (!confirmed) {
      return;
    }

    setActionLoading(
      user.id,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<UserActionResponse>(
          `/admin/users/${user.id}/suspend`,
          {
            method: "POST",
            token,
          },
        );

      if (response.data) {
        updateLocalUser(
          response.data,
        );
      }

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal suspend user.",
      );
    } finally {
      setActionLoading(
        null,
      );
    }
  }

  async function handleActivate(
    user: ManagedUser,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      setError(
        "Session tidak ditemukan.",
      );

      return;
    }

    setActionLoading(
      user.id,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<UserActionResponse>(
          `/admin/users/${user.id}/activate`,
          {
            method: "POST",
            token,
          },
        );

      if (response.data) {
        updateLocalUser(
          response.data,
        );
      }

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengaktifkan user.",
      );
    } finally {
      setActionLoading(
        null,
      );
    }
  }

  async function handleDelete(
    user: ManagedUser,
  ) {
    const token =
      getStoredToken();

    if (!token) {
      setError(
        "Session tidak ditemukan.",
      );

      return;
    }

    if (
      user.id ===
      currentUser?.id
    ) {
      setError(
        "Admin tidak dapat menghapus akun sendiri dari User Management.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete akun ${user.name}? Data historis tetap disimpan, tetapi akun tidak bisa login lagi.`,
      );

    if (!confirmed) {
      return;
    }

    setActionLoading(
      user.id,
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await apiFetch<UserActionResponse>(
          `/admin/users/${user.id}`,
          {
            method:
              "DELETE",
            token,
          },
        );

      if (response.data) {
        updateLocalUser(
          response.data,
        );
      }

      setSuccess(
        response.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus user.",
      );
    } finally {
      setActionLoading(
        null,
      );
    }
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="flex items-center gap-3 text-sm text-[#83768f]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#6d35e8]" />

          Menyiapkan User Management...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      user={currentUser}
      role="admin"
      navigation={
        adminNavigation
      }
    >
      <motion.div
        variants={
          pageVariants
        }
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* HEADER */}
        <motion.section
          variants={
            sectionVariants
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a75b7]">
            Administration
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#171321] sm:text-4xl">
                User Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#776b82]">
                Kelola status akun Student,
                NGO, Campus, dan Admin dari
                satu tempat.
              </p>
            </div>

            <div className="rounded-full bg-[#f3eeff] px-4 py-2 text-xs font-semibold text-[#6d35e8]">
              {filteredUsers.length} users
            </div>
          </div>
        </motion.section>

        {/* STATS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Total Users"
            value={
              stats.total
            }
            description="All registered accounts"
          />

          <StatCard
            label="Active"
            value={
              stats.active
            }
            description="Can access platform"
          />

          <StatCard
            label="Suspended"
            value={
              stats.suspended
            }
            description="Temporarily blocked"
          />

          <StatCard
            label="Deleted"
            value={
              stats.deleted
            }
            description="Soft deleted accounts"
          />
        </motion.section>

        {/* ALERTS */}
        {error && (
          <motion.div
            variants={
              sectionVariants
            }
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>
          </motion.div>
        )}

        {success && (
          <motion.div
            variants={
              sectionVariants
            }
            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-emerald-700">
              {success}
            </p>
          </motion.div>
        )}

        {/* FILTERS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="rounded-[22px] border border-[#ece7f5] bg-white p-5 shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                Search
              </label>

              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Search name or email..."
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-sm outline-none transition focus:border-[#9c79ee] focus:ring-4 focus:ring-[#6d35e8]/5"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                Role
              </label>

              <select
                value={
                  roleFilter
                }
                onChange={(
                  event,
                ) =>
                  setRoleFilter(
                    event
                      .target
                      .value as
                      | "all"
                      | UserRole,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-sm outline-none"
              >
                <option value="all">
                  All Roles
                </option>

                <option value="student">
                  Student
                </option>

                <option value="ngo">
                  NGO
                </option>

                <option value="campus">
                  Campus
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f8199]">
                Status
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value as
                      | "all"
                      | UserStatus,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#e8e2ee] bg-[#fbfaff] px-4 py-3 text-sm outline-none"
              >
                <option value="all">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="suspended">
                  Suspended
                </option>

                <option value="deleted">
                  Deleted
                </option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* USERS */}
        <motion.section
          variants={
            sectionVariants
          }
          className="overflow-hidden rounded-[22px] border border-[#ece7f5] bg-white shadow-[0_8px_28px_rgba(72,45,120,0.05)]"
        >
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={
                      item
                    }
                    className="h-20 animate-pulse rounded-xl bg-[#f5f2f8]"
                  />
                ),
              )}
            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-semibold text-[#4e4357]">
                No users found
              </p>

              <p className="mt-2 text-xs text-[#9a8da4]">
                Coba ubah search atau filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0edf5]">
              {filteredUsers.map(
                (user) => (
                  <UserRow
                    key={
                      user.id
                    }
                    user={
                      user
                    }
                    isSelf={
                      user.id ===
                      currentUser.id
                    }
                    loading={
                      actionLoading ===
                      user.id
                    }
                    onSuspend={() =>
                      handleSuspend(
                        user,
                      )
                    }
                    onActivate={() =>
                      handleActivate(
                        user,
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        user,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}

function UserRow({
  user,
  isSelf,
  loading,
  onSuspend,
  onActivate,
  onDelete,
}: {
  user: ManagedUser;
  isSelf: boolean;
  loading: boolean;
  onSuspend: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const initials =
    user.name
      .split(" ")
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3eeff] text-xs font-bold text-[#6d35e8]">
          {initials}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#30283e]">
              {user.name}
            </p>

            {isSelf && (
              <span className="rounded-full bg-[#f3eeff] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#6d35e8]">
                You
              </span>
            )}

            <RoleBadge
              role={
                user.role
              }
            />

            <StatusBadge
              status={
                user.status
              }
            />
          </div>

          <p className="mt-1 truncate text-xs text-[#8d8196]">
            {user.email}
          </p>

          <p className="mt-2 text-[10px] text-[#aaa0b2]">
            Joined{" "}
            {formatDate(
              user.created_at,
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {user.status ===
          "active" && (
          <button
            type="button"
            disabled={
              loading ||
              isSelf
            }
            onClick={
              onSuspend
            }
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Processing..."
              : "Suspend"}
          </button>
        )}

        {user.status ===
          "suspended" && (
          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              onActivate
            }
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Processing..."
              : "Activate"}
          </button>
        )}

        {user.status !==
          "deleted" && (
          <button
            type="button"
            disabled={
              loading ||
              isSelf
            }
            onClick={
              onDelete
            }
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        )}

        {user.status ===
          "deleted" && (
          <span className="rounded-lg bg-[#f5f2f7] px-4 py-2.5 text-xs font-medium text-[#9b8fa4]">
            No actions
          </span>
        )}
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  const labels: Record<
    UserRole,
    string
  > = {
    student: "Student",
    ngo: "NGO",
    campus: "Campus",
    admin: "Admin",
  };

  return (
    <span className="rounded-full bg-[#f7f4fb] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#75687f]">
      {labels[role]}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: UserStatus;
}) {
  const classes: Record<
    UserStatus,
    string
  > = {
    active:
      "bg-emerald-50 text-emerald-700",

    suspended:
      "bg-amber-50 text-amber-700",

    deleted:
      "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#ece7f5] bg-white p-5 shadow-[0_6px_22px_rgba(72,45,120,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d7d9e]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#171321]">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-[#9b8ea5]">
        {description}
      </p>
    </div>
  );
}