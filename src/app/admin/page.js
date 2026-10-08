"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  IndianRupee,
  Megaphone,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

const EMPTY_ALERTS = {
  expired: [],
  today: [],
  within3Days: [],
  within7Days: [],
  within15Days: [],
};

const EMPTY_DASHBOARD = {
  members: {
    total: 0,
    active: 0,
    inactive: 0,
  },

  memberships: {
    total: 0,
    active: 0,
    expired: 0,
  },

  revenue: {
    total: 0,
    today: 0,
    thisMonth: 0,
    month: 0,
    year: 0,
    byMethod: {
      upi: 0,
      cash: 0,
    },
  },

  monthly: [],
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMemberName(item) {
  return (
    item?.user?.name ||
    item?.member?.name ||
    item?.name ||
    item?.userName ||
    "Unknown member"
  );
}

function getMemberEmail(item) {
  return (
    item?.user?.email ||
    item?.member?.email ||
    item?.email ||
    ""
  );
}

function getDaysRemaining(item) {
  if (typeof item?.daysRemaining === "number") {
    return item.daysRemaining;
  }

  if (typeof item?.remainingDays === "number") {
    return item.remainingDays;
  }

  if (item?.endDate) {
    const end = new Date(item.endDate);
    const now = new Date();

    if (!Number.isNaN(end.getTime())) {
      return Math.ceil(
        (end.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }
  }

  return null;
}

function normalizeAlerts(raw) {
  if (!raw) return EMPTY_ALERTS;

  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Array.isArray(raw.alerts)
  ) {
    raw = raw.alerts;
  }

  if (Array.isArray(raw)) {
    const result = {
      expired: [],
      today: [],
      within3Days: [],
      within7Days: [],
      within15Days: [],
    };

    raw.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const days = getDaysRemaining(item);
      const status = String(
        item.status || ""
      ).toLowerCase();

      if (
        status === "expired" ||
        (typeof days === "number" && days < 0)
      ) {
        result.expired.push(item);
      } else if (
        status === "today" ||
        days === 0
      ) {
        result.today.push(item);
      } else if (
        typeof days === "number" &&
        days <= 3
      ) {
        result.within3Days.push(item);
      } else if (
        typeof days === "number" &&
        days <= 7
      ) {
        result.within7Days.push(item);
      } else {
        result.within15Days.push(item);
      }
    });

    return result;
  }

  if (typeof raw === "object") {
    return {
      expired: Array.isArray(raw.expired)
        ? raw.expired
        : [],
      today: Array.isArray(raw.today)
        ? raw.today
        : [],
      within3Days: Array.isArray(
        raw.within3Days
      )
        ? raw.within3Days
        : [],
      within7Days: Array.isArray(
        raw.within7Days
      )
        ? raw.within7Days
        : [],
      within15Days: Array.isArray(
        raw.within15Days
      )
        ? raw.within15Days
        : [],
    };
  }

  return EMPTY_ALERTS;
}

/* ============================================================
   KPI CARD
============================================================ */

function StatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  accent = "orange",
  loading = false,
}) {
  const styles = {
    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      hover: "hover:border-orange-500/30",
    },
    green: {
      icon: "bg-emerald-500/10 text-emerald-400",
      hover: "hover:border-emerald-500/30",
    },
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      hover: "hover:border-blue-500/30",
    },
    purple: {
      icon: "bg-purple-500/10 text-purple-400",
      hover: "hover:border-purple-500/30",
    },
    red: {
      icon: "bg-red-500/10 text-red-400",
      hover: "hover:border-red-500/30",
    },
  };

  const style =
    styles[accent] || styles.orange;

  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 transition duration-200 hover:-translate-y-0.5 ${style.hover}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
            {title}
          </p>

          <div className="mt-3">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <p className="text-3xl font-black tracking-tight text-white">
                {value}
              </p>
            )}
          </div>

          <p className="mt-2 truncate text-xs text-white/30">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   ALERT MEMBER
============================================================ */

function AlertMember({ item, type }) {
  const days = getDaysRemaining(item);

  let label = "Expiring soon";

  if (type === "expired") {
    label =
      days !== null
        ? `${Math.abs(days)} day${
            Math.abs(days) === 1
              ? ""
              : "s"
          } ago`
        : "Expired";
  } else if (days === 0) {
    label = "Expires today";
  } else if (days !== null) {
    label = `${days} day${
      days === 1 ? "" : "s"
    } left`;
  }

  const badge =
    type === "expired"
      ? "border-red-500/20 bg-red-500/10 text-red-400"
      : days === 0
        ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">
          {getMemberName(item)}
        </p>

        {getMemberEmail(item) && (
          <p className="mt-0.5 truncate text-[11px] text-white/30">
            {getMemberEmail(item)}
          </p>
        )}

        {item?.endDate && (
          <p className="mt-1 text-[10px] text-white/20">
            Ends {formatDate(item.endDate)}
          </p>
        )}
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black ${badge}`}
      >
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   ATTENTION PANEL
============================================================ */

function AttentionPanel({
  title,
  description,
  items,
  type,
  icon: Icon,
  emptyText,
}) {
  const colors = {
    expired:
      "bg-red-500/10 text-red-400",
    today:
      "bg-orange-500/10 text-orange-400",
    soon:
      "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              colors[type] || colors.soon
            }`}
          >
            <Icon size={17} />
          </div>

          <div>
            <h3 className="text-sm font-black text-white">
              {title}
            </h3>

            <p className="mt-0.5 text-[10px] text-white/30">
              {description}
            </p>
          </div>
        </div>

        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/[0.05] px-2 text-xs font-black text-white/60">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <>
          {items
            .slice(0, 5)
            .map((item, index) => (
              <AlertMember
                key={
                  item?._id ||
                  item?.membershipId ||
                  item?.id ||
                  index
                }
                item={item}
                type={
                  type === "soon"
                    ? "soon"
                    : type
                }
              />
            ))}

          {items.length > 5 && (
            <Link
              href="/admin/memberships"
              className="block border-t border-white/[0.06] px-4 py-3 text-center text-xs font-bold text-orange-400 transition hover:bg-white/[0.03]"
            >
              View all {items.length} →
            </Link>
          )}
        </>
      ) : (
        <div className="px-5 py-8 text-center">
          <CheckCircle2
            size={18}
            className="mx-auto text-emerald-400/60"
          />

          <p className="mt-2 text-xs text-white/25">
            {emptyText}
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
  featured = false,
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 ${
        featured
          ? "border-orange-500/25 bg-orange-500/[0.07] hover:border-orange-500/40"
          : "border-white/[0.08] bg-[#0d0d0d] hover:border-orange-500/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          featured
            ? "bg-orange-500 text-black"
            : "bg-white/[0.05] text-white/60 group-hover:bg-orange-500/10 group-hover:text-orange-400"
        }`}
      >
        <Icon size={18} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">
          {title}
        </p>

        <ArrowRight
          size={14}
          className="text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-400"
        />
      </div>

      <p className="mt-1 text-xs leading-5 text-white/30">
        {description}
      </p>
    </Link>
  );
}

/* ============================================================
   HEALTH ROW
============================================================ */

function HealthRow({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-white/45">
          {label}
        </span>

        <span className="text-xs font-black text-white">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function AdminDashboard() {
  const [dashboard, setDashboard] =
    useState(EMPTY_DASHBOARD);

  const [alerts, setAlerts] =
    useState(EMPTY_ALERTS);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [loadingAlerts, setLoadingAlerts] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  const [alertsError, setAlertsError] =
    useState("");

  async function loadDashboard() {
    try {
      setLoadingDashboard(true);
      setDashboardError("");

      const response = await fetch(
        "/api/admin/dashboard",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load dashboard."
        );
      }

      const incoming =
        data.dashboard || {};

      setDashboard({
        ...EMPTY_DASHBOARD,
        ...incoming,

        members: {
          ...EMPTY_DASHBOARD.members,
          ...(incoming.members || {}),
        },

        memberships: {
          ...EMPTY_DASHBOARD.memberships,
          ...(incoming.memberships || {}),
        },

        revenue: {
          ...EMPTY_DASHBOARD.revenue,
          ...(incoming.revenue || {}),
        },

        monthly: Array.isArray(
          incoming.monthly
        )
          ? incoming.monthly
          : [],
      });
    } catch (error) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      setDashboardError(
        error?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function loadAlerts() {
    try {
      setLoadingAlerts(true);
      setAlertsError("");

      const response = await fetch(
        "/api/admin/membership-alerts",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        data?.success === false
      ) {
        throw new Error(
          data?.message ||
            "Unable to load membership alerts."
        );
      }

      setAlerts(
        normalizeAlerts(data?.alerts)
      );
    } catch (error) {
      console.error(
        "ADMIN MEMBERSHIP ALERT ERROR:",
        error
      );

      setAlertsError(
        error?.message ||
          "Failed to load membership alerts."
      );

      setAlerts(EMPTY_ALERTS);
    } finally {
      setLoadingAlerts(false);
    }
  }

  function refreshAll() {
    loadDashboard();
    loadAlerts();
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const totalMembers =
    dashboard.members.total || 0;

  const activeMembers =
    dashboard.members.active || 0;

  const inactiveMembers =
    dashboard.members.inactive || 0;

  const activeMemberships =
    dashboard.memberships.active || 0;

  const expiredMemberships =
    dashboard.memberships.expired || 0;

  const totalMemberships =
    dashboard.memberships.total || 0;

  const totalRevenue =
    dashboard.revenue.total || 0;

  const todayRevenue =
    dashboard.revenue.today || 0;

  const monthlyRevenue =
    dashboard.revenue.thisMonth ||
    dashboard.revenue.month ||
    0;

  const yearlyRevenue =
    dashboard.revenue.year || 0;

  const urgentAlerts = useMemo(
    () =>
      alerts.expired.length +
      alerts.today.length +
      alerts.within3Days.length,
    [alerts]
  );

  const totalAlerts = useMemo(
    () =>
      alerts.expired.length +
      alerts.today.length +
      alerts.within3Days.length +
      alerts.within7Days.length +
      alerts.within15Days.length,
    [alerts]
  );

  const activeMembershipPercentage =
    totalMemberships > 0
      ? Math.round(
          (activeMemberships /
            totalMemberships) *
            100
        )
      : 0;

  const memberActivePercentage =
    totalMembers > 0
      ? Math.round(
          (activeMembers /
            totalMembers) *
            100
        )
      : 0;

  const latestMonthly =
    dashboard.monthly?.slice(-3) || [];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <Dumbbell
                  size={15}
                  className="text-orange-400"
                />
              </div>

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                Gym Operations
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/35">
              Your daily control center for members,
              memberships, payments, orders and gym
              operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-black transition hover:bg-orange-400"
            >
              <UserPlus size={14} />
              Add Member
            </Link>

            <button
              type="button"
              onClick={refreshAll}
              disabled={
                loadingDashboard ||
                loadingAlerts
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loadingDashboard ||
                  loadingAlerts
                    ? "animate-spin"
                    : ""
                }
              />

              {loadingDashboard ||
              loadingAlerts
                ? "Refreshing"
                : "Refresh"}
            </button>
          </div>
        </header>

        {/* ==================================================
            ERROR
        ================================================== */}

        {(dashboardError || alertsError) && (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={17}
                className="shrink-0 text-red-400"
              />

              <p className="text-xs text-red-400">
                {dashboardError ||
                  alertsError}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              className="text-left text-xs font-black text-red-400 hover:text-red-300 sm:text-right"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            KPI
        ================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Members"
            value={formatNumber(
              totalMembers
            )}
            subtitle={`${formatNumber(
              activeMembers
            )} active · ${formatNumber(
              inactiveMembers
            )} inactive`}
            href="/admin/members"
            icon={Users}
            accent="orange"
            loading={loadingDashboard}
          />

          <StatCard
            title="Active Memberships"
            value={formatNumber(
              activeMemberships
            )}
            subtitle={`${formatNumber(
              expiredMemberships
            )} expired`}
            href="/admin/memberships"
            icon={Dumbbell}
            accent="green"
            loading={loadingDashboard}
          />

          <StatCard
            title="Today's Revenue"
            value={formatCurrency(
              todayRevenue
            )}
            subtitle="Payments received today"
            href="/admin/payments"
            icon={IndianRupee}
            accent="blue"
            loading={loadingDashboard}
          />

          <StatCard
            title="This Month"
            value={formatCurrency(
              monthlyRevenue
            )}
            subtitle={`All time: ${formatCurrency(
              totalRevenue
            )}`}
            href="/admin/revenue"
            icon={TrendingUp}
            accent="purple"
            loading={loadingDashboard}
          />
        </section>

        {/* ==================================================
            TODAY AT A GLANCE
        ================================================== */}

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.09] via-[#0d0d0d] to-[#0d0d0d] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    className="text-orange-400"
                  />

                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">
                    Today at a glance
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-black">
                  Keep the gym moving.
                </h2>

                <p className="mt-1 max-w-lg text-xs leading-5 text-white/35">
                  Check membership alerts first,
                  handle payments, then take care of
                  orders and daily management.
                </p>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-black sm:flex">
                <Activity size={21} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25">
                  Members
                </p>

                <p className="mt-1 text-lg font-black">
                  {formatNumber(totalMembers)}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25">
                  Active
                </p>

                <p className="mt-1 text-lg font-black text-emerald-400">
                  {formatNumber(
                    activeMemberships
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25">
                  Attention
                </p>

                <p
                  className={`mt-1 text-lg font-black ${
                    urgentAlerts > 0
                      ? "text-orange-400"
                      : "text-emerald-400"
                  }`}
                >
                  {formatNumber(
                    urgentAlerts
                  )}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/revenue"
            className="group rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 transition hover:border-orange-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <IndianRupee size={17} />
              </div>

              <ArrowRight
                size={15}
                className="text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-400"
              />
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-white/25">
              Year to date
            </p>

            <p className="mt-2 text-2xl font-black">
              {formatCurrency(yearlyRevenue)}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Open Revenue Analytics
            </p>
          </Link>

          <Link
            href="/admin/memberships"
            className="group rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 transition hover:border-orange-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Dumbbell size={17} />
              </div>

              <ArrowRight
                size={15}
                className="text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-400"
              />
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-white/25">
              Membership health
            </p>

            <p className="mt-2 text-2xl font-black">
              {activeMembershipPercentage}%
            </p>

            <p className="mt-1 text-xs text-white/30">
              Memberships currently active
            </p>
          </Link>
        </section>

        {/* ==================================================
            ATTENTION
        ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Bell
                  size={17}
                  className="text-orange-400"
                />

                <h2 className="text-xl font-black">
                  What needs attention?
                </h2>
              </div>

              <p className="mt-1 text-xs text-white/30">
                Memberships that need action today or
                soon.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {urgentAlerts > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-orange-400">
                  <AlertTriangle size={11} />
                  {urgentAlerts} urgent
                </span>
              )}

              {totalAlerts > 0 && (
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[9px] font-black text-white/40">
                  {totalAlerts} total
                </span>
              )}
            </div>
          </div>

          {loadingAlerts ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <AttentionPanel
                title="Expired"
                description="Members who need renewal"
                items={alerts.expired}
                type="expired"
                icon={XCircle}
                emptyText="No expired memberships."
              />

              <AttentionPanel
                title="Expires today"
                description="Action required today"
                items={alerts.today}
                type="today"
                icon={AlertTriangle}
                emptyText="Nothing expires today."
              />

              <AttentionPanel
                title="Expiring soon"
                description="Next 3 days"
                items={alerts.within3Days}
                type="soon"
                icon={CalendarDays}
                emptyText="No urgent expiries."
              />
            </div>
          )}

          {alertsError && (
            <p className="mt-3 text-[11px] text-yellow-400">
              {alertsError}
            </p>
          )}
        </section>

        {/* ==================================================
            MEMBERSHIP HEALTH + REVENUE SNAPSHOT
        ================================================== */}

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* MEMBERSHIP HEALTH */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black">
                  Membership Health
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Quick view of your current membership
                  base.
                </p>
              </div>

              <Link
                href="/admin/memberships"
                className="text-[10px] font-black text-orange-400"
              >
                Manage →
              </Link>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
              <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#22c55e_0deg,#22c55e_var(--active),#ef4444_var(--active),#ef4444_360deg)]">
                <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-[#0d0d0d]">
                  <span className="text-2xl font-black">
                    {formatNumber(
                      totalMemberships
                    )}
                  </span>

                  <span className="text-[9px] uppercase tracking-wider text-white/25">
                    Total
                  </span>
                </div>

                <style jsx>{`
                  div {
                    --active: ${activeMembershipPercentage * 3.6}deg;
                  }
                `}</style>
              </div>

              <div className="space-y-4">
                <HealthRow
                  label="Active"
                  value={activeMemberships}
                  total={totalMemberships}
                  color="bg-emerald-500"
                />

                <HealthRow
                  label="Expired"
                  value={expiredMemberships}
                  total={totalMemberships}
                  color="bg-red-500"
                />

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/25">
                    Active rate
                  </p>

                  <p className="mt-1 text-lg font-black text-emerald-400">
                    {activeMembershipPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* REVENUE SNAPSHOT */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black">
                  Revenue Snapshot
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Keep the dashboard simple. Open Revenue
                  for detailed analytics.
                </p>
              </div>

              <Link
                href="/admin/revenue"
                className="text-[10px] font-black text-orange-400"
              >
                Full analytics →
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Today
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatCurrency(
                    todayRevenue
                  )}
                </p>

                <p className="mt-1 text-[10px] text-white/25">
                  Collected today
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  This month
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatCurrency(
                    monthlyRevenue
                  )}
                </p>

                <p className="mt-1 text-[10px] text-white/25">
                  Current month
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/[0.04] p-4">
              <div className="flex items-center gap-3">
                <TrendingUp
                  size={17}
                  className="text-orange-400"
                />

                <div>
                  <p className="text-xs font-black text-white">
                    Total collected
                  </p>

                  <p className="mt-0.5 text-[10px] text-white/30">
                    All successful recorded payments
                  </p>
                </div>

                <span className="ml-auto text-sm font-black text-orange-400">
                  {formatCurrency(
                    totalRevenue
                  )}
                </span>
              </div>
            </div>

            {latestMonthly.length > 0 && (
              <div className="mt-5 space-y-3">
                {latestMonthly.map(
                  (item, index) => {
                    const max = Math.max(
                      ...latestMonthly.map(
                        (month) =>
                          Number(
                            month.revenue ||
                              0
                          )
                      ),
                      1
                    );

                    const width =
                      Number(
                        item.revenue || 0
                      ) > 0
                        ? Math.max(
                            4,
                            Math.round(
                              (Number(
                                item.revenue ||
                                  0
                              ) /
                                max) *
                                100
                            )
                          )
                        : 0;

                    return (
                      <div
                        key={`${item.month}-${index}`}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/35">
                            {item.label}
                          </span>

                          <span className="text-[10px] font-black text-white/60">
                            {formatCurrency(
                              item.revenue
                            )}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Sparkles
                size={17}
                className="text-orange-400"
              />

              <h2 className="text-xl font-black">
                Quick Actions
              </h2>
            </div>

            <p className="mt-1 text-xs text-white/30">
              The most common admin tasks, one click away.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              href="/admin/members"
              title="Manage Members"
              description="Search, add, edit and manage gym members."
              icon={Users}
              featured
            />

            <QuickAction
              href="/admin/memberships"
              title="Manage Memberships"
              description="Renew, extend and manage active memberships."
              icon={Dumbbell}
            />

            <QuickAction
              href="/admin/payments"
              title="Payments"
              description="Review payments and record offline cash collections."
              icon={IndianRupee}
            />

            <QuickAction
              href="/admin/purchase-requests"
              title="Purchase Requests"
              description="Handle pending membership and purchase requests."
              icon={CreditCard}
            />

            <QuickAction
              href="/admin/product-orders"
              title="Product Orders"
              description="Manage supplement and gym product orders."
              icon={ShoppingBag}
            />

            <QuickAction
              href="/admin/products"
              title="Products"
              description="Add and manage products available to members."
              icon={Package}
            />
          </div>
        </section>

        {/* ==================================================
            MANAGEMENT CENTER
        ================================================== */}

        <section className="mt-8 pb-10">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Management Center
            </h2>

            <p className="mt-1 text-xs text-white/30">
              Everything else your admin team may need.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ManagementLink
              href="/admin/membership-plans"
              icon={CreditCard}
              title="Membership Plans"
            />

            <ManagementLink
              href="/admin/promotions"
              icon={TrendingUp}
              title="Promotions"
            />

            <ManagementLink
              href="/admin/add-ons"
              icon={Plus}
              title="Add-ons"
            />

            <ManagementLink
              href="/admin/gym-announcements"
              icon={Megaphone}
              title="Announcements"
            />

            <ManagementLink
              href="/admin/gym-settings"
              icon={Settings}
              title="Gym Settings"
            />

            <ManagementLink
              href="/admin/admin-accounts"
              icon={Users}
              title="Admin Accounts"
            />

            <ManagementLink
              href="/admin/activity"
              icon={Activity}
              title="Admin Activity"
            />

            <ManagementLink
              href="/admin/revenue"
              icon={TrendingUp}
              title="Revenue Analytics"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   MANAGEMENT LINK
============================================================ */

function ManagementLink({
  href,
  icon: Icon,
  title,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0d0d0d] px-4 py-4 transition hover:border-orange-500/20 hover:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 transition group-hover:bg-orange-500/10 group-hover:text-orange-400">
          <Icon size={16} />
        </div>

        <span className="text-xs font-bold text-white/60 transition group-hover:text-white">
          {title}
        </span>
      </div>

      <ArrowRight
        size={14}
        className="text-white/15 transition group-hover:translate-x-1 group-hover:text-orange-400"
      />
    </Link>
  );
}