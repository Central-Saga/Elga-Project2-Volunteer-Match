"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

import Sidebar from "./Sidebar";

import {
  logoutUser,
  type AuthUser,
} from "@/lib/auth";

import { apiFetch } from "@/lib/api";

type NavigationItem = {
  label: string;
  href: string;
};

type TopbarProps = {
  user: AuthUser;
  role:
    | "student"
    | "ngo"
    | "campus"
    | "admin";
  navigation: NavigationItem[];
};

type NotificationResponse = {
  meta: {
    unread_count: number;
  };
};

function getRoleTitle(
  role: TopbarProps["role"],
) {
  switch (role) {
    case "student":
      return "Student";

    case "ngo":
      return "NGO";

    case "campus":
      return "Campus";

    case "admin":
      return "Admin";
  }
}

export default function Topbar({
  user,
  role,
  navigation,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("auth_token");

    if (!token) {
      return;
    }

    async function loadUnreadCount(
      authToken: string,
    ) {
      try {
        const response =
          await apiFetch<NotificationResponse>(
            "/notifications",
            {
              token: authToken,
            },
          );

        setUnreadCount(
          response.meta.unread_count,
        );
      } catch {
        //
      }
    }

    loadUnreadCount(token);
  }, []);

  function isActive(
    href: string,
  ) {
    if (href === `/${role}`) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`,
      )
    );
  }

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#eeeaf5] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center px-4 sm:px-6 lg:px-8">
          {/* BRAND */}
          <button
            type="button"
            onClick={() =>
              router.push(`/${role}`)
            }
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6d35e8] text-xs font-bold text-white shadow-sm">
              VM
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold tracking-[-0.02em] text-[#171321]">
                Volunteer Match
              </p>

              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#9789ad]">
                {getRoleTitle(role)} Portal
              </p>
            </div>
          </button>

          {/* DESKTOP NAV */}
          <nav className="ml-10 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const active =
                isActive(item.href);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() =>
                    router.push(
                      item.href,
                    )
                  }
                  className={`relative rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors duration-200 ${
                    active
                      ? "text-[#6d35e8]"
                      : "text-[#726781] hover:text-[#352a45]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-nav"
                      transition={{
                        duration: 0.22,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-lg bg-[#f3eeff]"
                    />
                  )}

                  <span className="relative z-10">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* RIGHT */}
          <div className="ml-auto flex items-center gap-2">
            {/* NOTIFICATION */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/notifications",
                )
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#706580] transition-colors duration-200 hover:bg-[#f5f1fc] hover:text-[#6d35e8]"
              aria-label="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ef5f7f] px-1 text-[7px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>

            {/* PROFILE */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (value) =>
                      !value,
                  )
                }
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-[#faf8ff]"
              >
                <div className="hidden text-right xl:block">
                  <p className="max-w-[130px] truncate text-[11px] font-semibold text-[#30283e]">
                    {user.name}
                  </p>

                  <p className="mt-0.5 text-[9px] capitalize text-[#9b8eac]">
                    {role}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ede5ff] text-xs font-bold text-[#6d35e8] ring-1 ring-[#ded2f5]">
                  {user.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`h-3.5 w-3.5 text-[#9789a8] transition-transform duration-200 ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -4,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                      scale: 0.98,
                    }}
                    transition={{
                      duration: 0.15,
                    }}
                    className="absolute right-0 top-[48px] w-[220px] overflow-hidden rounded-2xl border border-[#ece7f5] bg-white p-2 shadow-[0_18px_50px_rgba(65,45,100,0.12)]"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-bold text-[#30283e]">
                        {user.name}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-[#9b8eac]">
                        {user.email}
                      </p>
                    </div>

                    <div className="my-1 h-px bg-[#f0edf5]" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(
                          false,
                        );

                        const profileHref =
                          navigation.find(
                            (item) =>
                              item.label
                                .toLowerCase()
                                .includes(
                                  "profile",
                                ),
                          )?.href;

                        if (
                          profileHref
                        ) {
                          router.push(
                            profileHref,
                          );
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#645872] transition-colors hover:bg-[#faf8ff]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="4"
                        />

                        <path d="M5 21c.8-4.2 3.1-6.3 7-6.3s6.2 2.1 7 6.3" />
                      </svg>

                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M10 4H5v16h5" />
                        <path d="M14 8l4 4-4 4M18 12H9" />
                      </svg>

                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  true,
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#594f66] transition-colors hover:bg-[#f5f1fc] lg:hidden"
              aria-label="Open menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <Sidebar
        role={role}
        items={navigation}
        userName={user.name}
        userEmail={user.email}
        open={mobileMenuOpen}
        onClose={() =>
          setMobileMenuOpen(
            false,
          )
        }
      />
    </>
  );
}