"use client";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  logoutUser,
} from "@/lib/auth";

type SidebarItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  role:
    | "student"
    | "ngo"
    | "campus"
    | "admin";

  items: SidebarItem[];

  userName: string;
  userEmail: string;

  open: boolean;
  onClose: () => void;
};

function NavigationIcon({
  label,
}: {
  label: string;
}) {
  const value =
    label.toLowerCase();

  if (
    value.includes("dashboard") ||
    value.includes("explore")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
      </svg>
    );
  }

  if (
    value.includes("project")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="M8 5V3h8v2" />
      </svg>
    );
  }

  if (
    value.includes("application")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
        />

        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (
    value.includes("activity")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    );
  }

  if (
    value.includes("credential")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3l7 3v5c0 4-2.6 7.5-7 10-4.4-2.5-7-6-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }

  if (
    value.includes("verification") ||
    value.includes("verify")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />

        <path d="M8.5 12l2.2 2.2 4.8-4.8" />
      </svg>
    );
  }

  if (
    value.includes("report")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[17px] w-[17px]"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px]"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4.5 21c.7-4.3 3.2-6.5 7.5-6.5s6.8 2.2 7.5 6.5" />
    </svg>
  );
}

export default function Sidebar({
  role,
  items,
  userName,
  userEmail,
  open,
  onClose,
}: SidebarProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  function handleNavigation(
    href: string,
  ) {
    onClose();
    router.push(href);
  }

  function handleLogout() {
    onClose();
    logoutUser();
    router.replace("/login");
  }

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

  return (
    <>
      {/* BACKDROP */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* DRAWER */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[290px] max-w-[85vw] flex-col border-l border-[#ebe5f4] bg-white p-5 shadow-[-15px_0_50px_rgba(55,35,85,0.12)] transition-transform duration-300 lg:hidden ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                `/${role}`,
              )
            }
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d35e8] to-[#9b6cf2] text-xs font-bold text-white">
              VM
            </div>

            <div>
              <p className="text-sm font-bold text-[#171321]">
                Volunteer Match
              </p>

              <p className="mt-0.5 text-[9px] capitalize text-[#9a8cac]">
                {role} portal
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#71647f] transition hover:bg-[#f7f3fc]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* NAV */}
        <nav className="mt-8 space-y-1.5">
          {items.map((item) => {
            const active =
              isActive(item.href);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  handleNavigation(
                    item.href,
                  )
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold transition ${
                  active
                    ? "bg-[#f3eeff] text-[#6d35e8]"
                    : "text-[#6c6177] hover:bg-[#faf8ff] hover:text-[#30283e]"
                }`}
              >
                <span
                  className={
                    active
                      ? "text-[#6d35e8]"
                      : "text-[#9c8eaa]"
                  }
                >
                  <NavigationIcon
                    label={
                      item.label
                    }
                  />
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ACCOUNT */}
        <div className="mt-auto">
          <div className="mb-4 h-px bg-[#eeeaf5]" />

          <div className="rounded-2xl bg-[#faf8ff] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ebe2ff] text-xs font-bold text-[#6d35e8]">
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#30283e]">
                  {userName}
                </p>

                <p className="mt-1 truncate text-[9px] text-[#9a8cac]">
                  {userEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="mt-4 w-full rounded-lg border border-[#e8e1f1] bg-white px-3 py-2.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}