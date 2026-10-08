"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Inbox,
} from "lucide-react";

export default function NotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  async function fetchNotifications(showLoading = false) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load notifications."
        );
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("FETCH NOTIFICATIONS ERROR:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  // Initial notification fetch
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Automatically check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function markAsRead(notificationId) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to mark notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "MARK ALL NOTIFICATIONS READ ERROR:",
        error
      );
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);

          if (!open) {
            fetchNotifications(false);
          }
        }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open
            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-orange-500/20 hover:bg-orange-500/[0.06] hover:text-orange-400"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell
          size={19}
          strokeWidth={1.9}
          className={
            unreadCount > 0
              ? "animate-[pulse_2s_ease-in-out_infinite]"
              : ""
          }
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-black" />

            <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-black shadow-lg shadow-orange-500/20">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.07] via-transparent to-transparent px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Bell size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount === 1 ? "" : "s"
                        }`
                      : "You're all caught up"}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-500/10 hover:text-orange-300"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">
                    Mark all read
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <LoadingState />
            ) : notifications.length === 0 ? (
              <EmptyState />
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                />
              ))
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="border-t border-white/10 bg-white/[0.015] px-4 py-2.5">
              <p className="text-center text-[10px] text-zinc-700">
                Notifications refresh automatically
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick }) {
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full border-b border-white/[0.06] px-4 py-4 text-left transition last:border-b-0 ${
        unread
          ? "bg-orange-500/[0.035] hover:bg-orange-500/[0.07]"
          : "hover:bg-white/[0.035]"
      }`}
    >
      <div className="flex gap-3">
        {/* Status indicator */}
        <div className="pt-1.5">
          <span
            className={`block h-2.5 w-2.5 rounded-full ${
              unread ? "bg-orange-500" : "bg-zinc-700"
            } ${unread ? "shadow-sm shadow-orange-500/50" : ""}`}
          />
        </div>

        {/* Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            unread
              ? "bg-orange-500/10 text-orange-400"
              : "bg-white/[0.04] text-zinc-600"
          }`}
        >
          {unread ? (
            <Bell size={16} />
          ) : (
            <Check size={16} />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`line-clamp-1 text-sm ${
                unread
                  ? "font-bold text-white"
                  : "font-medium text-zinc-500"
              }`}
            >
              {notification.title}
            </h4>

            {unread && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-orange-500">
                New
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {notification.message}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-700">
            <Clock3 size={11} />
            {formatNotificationDate(notification.createdAt)}
          </div>
        </div>
      </div>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
        <Bell
          size={21}
          className="animate-pulse text-orange-400"
        />
      </div>

      <p className="text-sm font-medium text-zinc-300">
        Loading notifications...
      </p>

      <p className="mt-1 text-xs text-zinc-700">
        Please wait a moment
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-600">
        <Inbox size={24} />
      </div>

      <p className="text-sm font-semibold text-zinc-300">
        No notifications
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        You're all caught up.
      </p>
    </div>
  );
}

function formatNotificationDate(date) {
  if (!date) {
    return "";
  }

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) {
    return "";
  }

  return notificationDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}