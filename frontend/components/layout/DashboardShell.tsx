"use client";

import { ReactNode } from "react";

import Topbar from "./Topbar";
import { type AuthUser } from "@/lib/auth";

type NavigationItem = {
  label: string;
  href: string;
};

type DashboardShellProps = {
  user: AuthUser;
  role: "student" | "ngo" | "campus" | "admin";
  navigation: NavigationItem[];
  children: ReactNode;
};

export default function DashboardShell({
  user,
  role,
  navigation,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[#fbfaff] text-[#171321]">
      <Topbar
        user={user}
        role={role}
        navigation={navigation}
      />

      <section className="px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          {children}
        </div>
      </section>
    </main>
  );
}