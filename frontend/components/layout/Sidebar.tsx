"use client";

import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "@/lib/auth";

type SidebarItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  role: "student" | "ngo" | "campus" | "admin";
  items: SidebarItem[];
  userName: string;
  userEmail: string;
};

export default function Sidebar({
  role,
  items,
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col border-r border-black/5 bg-[#f5f5f1] px-5 py-6 lg:flex">
      <button
        onClick={() => router.push(`/${role}`)}
        className="flex items-center gap-3 px-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
          VM
        </div>

        <div className="text-left">
          <p className="text-sm font-bold tracking-tight">
            Volunteer Match
          </p>

          <p className="text-[11px] capitalize text-gray-500">
            {role}
          </p>
        </div>
      </button>

      <nav className="mt-10 space-y-1">
        {items.map((item) => {
          const active =
            item.href === `/${role}`
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          Account
        </p>

        <p className="mt-2 truncate text-sm font-bold text-gray-900">
          {userName}
        </p>

        <p className="mt-1 truncate text-xs text-gray-500">
          {userEmail}
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-xl border border-black/5 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}