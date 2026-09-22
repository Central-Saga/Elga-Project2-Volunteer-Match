"use client";

import { useRouter } from "next/navigation";
import { type AuthUser } from "@/lib/auth";

type TopbarProps = {
  user: AuthUser;
};

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f5f5f1]/90 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4 lg:px-10">
        <button
          onClick={() => router.push("/")}
          className="lg:hidden"
        >
          <p className="text-sm font-bold tracking-tight">
            Volunteer Match
          </p>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-gray-400">
              Welcome back
            </p>

            <p className="text-sm font-semibold text-gray-900">
              {user.name}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}