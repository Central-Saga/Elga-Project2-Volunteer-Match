"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { type AuthUser } from "@/lib/auth";

type DashboardShellProps = {
  user: AuthUser;
  role: "student" | "ngo" | "campus" | "admin";
  navigation: {
    label: string;
    href: string;
  }[];
  children: ReactNode;
};

export default function DashboardShell({
  user,
  role,
  navigation,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[#f5f5f1] text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar
          role={role}
          items={navigation}
          userName={user.name}
          userEmail={user.email}
        />

        <section className="min-w-0 flex-1">
          <Topbar user={user} />

          <div className="px-5 pb-14 pt-8 lg:px-10 lg:pt-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}