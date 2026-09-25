"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type NotificationResponse = {
  message: string;
  data: NotificationItem[];
  meta: {
    unread_count: number;
  };
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadNotifications(token);
  }, [router]);

  async function loadNotifications(token: string) {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch<NotificationResponse>(
        "/notifications",
        {
          token,
        },
      );

      setNotifications(response.data);
      setUnreadCount(response.meta.unread_count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    const token = localStorage.getItem("auth_token");

    if (!token) return;

    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: "POST",
        token,
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification.",
      );
    }
  }

  async function markAllAsRead() {
    const token = localStorage.getItem("auth_token");

    if (!token) return;

    try {
      await apiFetch("/notifications/read-all", {
        method: "POST",
        token,
      });

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ?? new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notifications.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f1] px-5 py-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Updates
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "You're all caught up."}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white p-10 text-center">
            <p className="font-semibold text-gray-900">
              No notifications yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Updates about applications and credentials will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() =>
                  !notification.is_read &&
                  markAsRead(notification.id)
                }
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  notification.is_read
                    ? "border-black/5 bg-white"
                    : "border-gray-900/10 bg-white shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-gray-950" />
                      )}

                      <h2 className="font-semibold text-gray-950">
                        {notification.title}
                      </h2>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      {new Date(
                        notification.created_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <span className="shrink-0 rounded-full bg-gray-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}