"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

const EMPTY_DASHBOARD = {
  members: { total: 0, active: 0, inactive: 0 },
  memberships: { total: 0, active: 0, expired: 0 },
  revenue: {
    total: 0,
    today: 0,
    thisMonth: 0,
    month: 0,
    year: 0,
    byMethod: { upi: 0, cash: 0 },
  },
  monthly: [],
};

const EMPTY_ALERTS = {
  expired: [],
  today: [],
  within3Days: [],
  within7Days: [],
  within15Days: [],
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const number = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const dateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

function normalizeDashboard(incoming = {}) {
  return {
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
      byMethod: {
        ...EMPTY_DASHBOARD.revenue.byMethod,
        ...(incoming.revenue?.byMethod || {}),
      },
    },
    monthly: Array.isArray(incoming.monthly)
      ? incoming.monthly
      : [],
  };
}

function normalizeAlerts(raw) {
  if (raw?.alerts) raw = raw.alerts;

  if (Array.isArray(raw)) {
    const result = {
      expired: [],
      today: [],
      within3Days: [],
      within7Days: [],
      within15Days: [],
    };

    raw.forEach((item) => {
      const days =
        typeof item?.daysRemaining === "number"
          ? item.daysRemaining
          : typeof item?.remainingDays === "number"
            ? item.remainingDays
            : item?.endDate
              ? Math.ceil(
                  (new Date(item.endDate).getTime() - Date.now()) /
                    86400000
                )
              : null;

      if (item?.status === "expired" || days < 0) {
        result.expired.push(item);
      } else if (days === 0 || item?.status === "today") {
        result.today.push(item);
      } else if (days !== null && days <= 3) {
        result.within3Days.push(item);
      } else if (days !== null && days <= 7) {
        result.within7Days.push(item);
      } else {
        result.within15Days.push(item);
      }
    });

    return result;
  }

  if (raw && typeof raw === "object") {
    return {
      expired: Array.isArray(raw.expired) ? raw.expired : [],
      today: Array.isArray(raw.today) ? raw.today : [],
      within3Days: Array.isArray(raw.within3Days)
        ? raw.within3Days
        : [],
      within7Days: Array.isArray(raw.within7Days)
        ? raw.within7Days
        : [],
      within15Days: Array.isArray(raw.within15Days)
        ? raw.within15Days
        : [],
    };
  }

  return EMPTY_ALERTS;
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-white/45">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  href,
  color = "orange",
  loading,
}) {
  const colors = {
    orange: "bg-orange-500/10 text-orange-400",
    green: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    red: "bg-red-500/10 text-red-400",
  };

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-[#101010] p-5 transition hover:border-orange-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/55">{title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">
              {value}
            </p>
          )}
          <p className="mt-2 text-xs text-white/40">{detail}</p>
        </div>
        <span className={`rounded-xl p-3 ${colors[color] || colors.orange}`}>
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-orange-400 opacity-80 group-hover:opacity-100">
        Open section <ArrowRight size={13} />
      </div>
    </Link>
  );
}

function TaskLink({ href, title, description, icon: Icon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101010] p-4 transition hover:border-orange-500/35 hover:bg-white/[0.03]"
    >
      <span className="rounded-lg bg-white/[0.06] p-2.5 text-orange-400">
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-white/45">
          {description}
        </span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-white/30" />
    </Link>
  );
}

function MembershipAlert({ item, expired = false }) {
  const name =
    item?.user?.name ||
    item?.member?.name ||
    item?.name ||
    item?.userName ||
    "Unknown member";

  const email =
    item?.user?.email || item?.member?.email || item?.email;

  const endDate = dateLabel(item?.endDate);

  const days =
    typeof item?.daysRemaining === "number"
      ? item.daysRemaining
      : typeof item?.remainingDays === "number"
        ? item.remainingDays
        : null;

  const status = expired
    ? "Expired"
    : days === 0
      ? "Expires today"
      : days !== null
        ? `${days} day${days === 1 ? "" : "s"} left`
        : "Expiring soon";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {name}
        </p>
        {email && (
          <p className="mt-1 truncate text-xs text-white/40">{email}</p>
        )}
        {endDate && (
          <p className="mt-1 text-xs text-white/35">
            Ends {endDate}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          expired
            ? "bg-red-500/10 text-red-400"
            : days === 0
              ? "bg-orange-500/10 text-orange-400"
              : "bg-yellow-500/10 text-yellow-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function AlertCard({ title, items, expired = false }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
        <div className="flex items-center gap-2">
          {expired ? (
            <XCircle size={18} className="text-red-400" />
          ) : (
            <Bell size={18} className="text-orange-400" />
          )}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-white/70">
          {items.length}
        </span>
      </div>

      {items.length ? (
        <>
          {items.slice(0, 5).map((item, index) => (
            <MembershipAlert
              key={item?._id || item?.id || index}
              item={item}
              expired={expired}
            />
          ))}
          {items.length > 5 && (
            <Link
              href="/admin/memberships"
              className="block border-t border-white/[0.07] px-4 py-3 text-center text-sm font-semibold text-orange-400 hover:bg-white/[0.03]"
            >
              View all {items.length} memberships
            </Link>
          )}
        </>
      ) : (
        <div className="px-4 py-7 text-center">
          <CheckCircle2
            size={22}
            className="mx-auto text-emerald-400"
          />
          <p className="mt-2 text-sm text-white/45">
            No memberships need attention here.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [alerts, setAlerts] = useState(EMPTY_ALERTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pendingPayments, setPendingPayments] = useState(null);
  const [pendingPurchaseRequests, setPendingPurchaseRequests] = useState(null);

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
const [
  dashboardResponse,
  alertsResponse,
  paymentsResponse,
  requestsResponse,
] = await Promise.all([
  fetch("/api/admin/dashboard", {
    cache: "no-store",
  }),
  fetch("/api/admin/membership-alerts", {
    cache: "no-store",
  }),
  fetch("/api/admin/payments?page=1&limit=1", {
    cache: "no-store",
  }),
  fetch("/api/admin/purchase-requests", {
    cache: "no-store",
  }),
]);
    
const [
  dashboardData,
  alertsData,
  paymentsData,
  requestsData,
] = await Promise.all([
  dashboardResponse.json(),
  alertsResponse.json(),
  paymentsResponse.json(),
  requestsResponse.json(),
]);

if (!dashboardResponse.ok || !dashboardData?.success) {
  throw new Error(
    dashboardData?.message || "Unable to load dashboard."
  );
}

setDashboard(normalizeDashboard(dashboardData.dashboard));

if (alertsResponse.ok && alertsData?.success !== false) {
  setAlerts(normalizeAlerts(alertsData?.alerts ?? alertsData));
} else {
  setAlerts(EMPTY_ALERTS);
}

// Count all pending payment records
if (paymentsResponse.ok && paymentsData?.success) {
  setPendingPayments(
    Number(paymentsData.stats?.pendingCount ?? 0)
  );
}

// Count pending cash membership purchase requests
if (requestsResponse.ok && requestsData?.success) {
  setPendingPurchaseRequests(
    Array.isArray(requestsData.purchaseOrders)
      ? requestsData.purchaseOrders.length
      : 0
  );
}
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);
      setError(err?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  void loadDashboard();
}, [loadDashboard]);

  const urgentMemberships =
    alerts.expired.length + alerts.today.length;

  const soonMemberships =
    alerts.within3Days.length + alerts.within7Days.length;

  const monthlyRevenue =
    dashboard.revenue.thisMonth || dashboard.revenue.month || 0;

  const maxMonthlyRevenue = Math.max(
    1,
    ...dashboard.monthly.map((item) => Number(item?.revenue || 0))
  );

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-orange-400">
              ADMIN WORKSPACE
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Your gym at a glance. Start with the tasks that need attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <AlertTriangle size={18} />
              {error}
            </div>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="text-sm font-semibold text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Urgent actions */}
        <section className="mt-8">
          <SectionHeading
            title="Needs attention"
            description="Start here to keep daily gym operations running smoothly."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/memberships"
              className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 transition hover:bg-red-500/[0.1]"
            >
              <span className="rounded-lg bg-red-500/10 p-2.5 text-red-400">
                <AlertTriangle size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">
                  Expired / expires today
                </span>
                <span className="mt-1 block text-xs text-white/50">
                  {loading ? "Loading…" : `${number(urgentMemberships)} memberships`}
                </span>
              </span>
              <ArrowRight size={16} className="text-white/35" />
            </Link>

            <Link
              href="/admin/memberships"
              className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] p-4 transition hover:bg-yellow-500/[0.09]"
            >
              <span className="rounded-lg bg-yellow-500/10 p-2.5 text-yellow-400">
                <Bell size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">
                  Expiring soon
                </span>
                <span className="mt-1 block text-xs text-white/50">
                  {loading ? "Loading…" : `${number(soonMemberships)} memberships`}
                </span>
              </span>
              <ArrowRight size={16} className="text-white/35" />
            </Link>

             <TaskLink
  href="/admin/purchase-requests"
  title="Purchase requests"
  description={
    pendingPurchaseRequests === null
      ? "Review new member purchases and cash requests."
      : `${number(pendingPurchaseRequests)} requests awaiting review.`
  }
  icon={CreditCard}
/>
<TaskLink
  href="/admin/payments"
  title="Pending payments"
  description={
    pendingPayments === null
      ? "Check pending payment records."
      : `${number(pendingPayments)} payments awaiting confirmation.`
  }
  icon={IndianRupee}
/>
            <TaskLink
              href="/admin/product-orders"
              title="Product orders"
              description="Review and process customer orders."
              icon={ShoppingBag}
            />
          </div>
        </section>

        {/* Essential numbers */}
        <section className="mt-8">
          <SectionHeading
            title="Gym overview"
            description="The essential numbers for today's operations."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total members"
              value={number(dashboard.members.total)}
              detail={`${number(dashboard.members.active)} active members`}
              icon={Users}
              href="/admin/members"
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Active memberships"
              value={number(dashboard.memberships.active)}
              detail={`${number(dashboard.memberships.expired)} expired memberships`}
              icon={Dumbbell}
              href="/admin/memberships"
              color="green"
              loading={loading}
            />
            <StatCard
              title="Collected today"
              value={currency(dashboard.revenue.today)}
              detail="Recorded revenue today"
              icon={IndianRupee}
              href="/admin/payments"
              color="orange"
              loading={loading}
            />
            <StatCard
              title="Revenue this month"
              value={currency(monthlyRevenue)}
              detail="Current month's recorded revenue"
              icon={TrendingUp}
              href="/admin/revenue"
              color="green"
              loading={loading}
            />
          </div>
        </section>

        {/* Membership alerts */}
        <section className="mt-8">
          <SectionHeading
            title="Membership follow-up"
            description="Contact members whose memberships have expired or are about to end."
            action={
              <Link
                href="/admin/memberships"
                className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                Manage memberships <ArrowRight size={15} />
              </Link>
            }
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <AlertCard
              title="Expired memberships"
              items={alerts.expired}
              expired
            />
            <AlertCard
              title="Expiring today"
              items={alerts.today}
            />
          </div>

          {(alerts.within3Days.length > 0 ||
            alerts.within7Days.length > 0 ||
            alerts.within15Days.length > 0) && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-white">
                Upcoming expirations
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Within 3 days",
                    items: alerts.within3Days,
                  },
                  {
                    title: "Within 7 days",
                    items: alerts.within7Days,
                  },
                  {
                    title: "Within 15 days",
                    items: alerts.within15Days,
                  },
                ].map((group) => (
                  <Link
                    key={group.title}
                    href="/admin/memberships"
                    className="rounded-xl border border-white/[0.07] p-4 hover:border-orange-500/30"
                  >
                    <p className="text-xs text-white/50">{group.title}</p>
                    <p className="mt-2 text-2xl font-bold">
                      {number(group.items.length)}
                    </p>
                    <p className="mt-1 text-xs text-orange-400">
                      View memberships
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="mt-8">
          <SectionHeading
            title="Quick actions"
            description="Common tasks, one click away."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <TaskLink
              href="/admin/members"
              title="Manage members"
              description="Search, add, and update member details."
              icon={UserPlus}
            />
            <TaskLink
              href="/admin/payments"
              title="Manage payments"
              description="Review payments and record cash collections."
              icon={CreditCard}
            />
            <TaskLink
              href="/admin/memberships"
              title="Manage memberships"
              description="Review, renew, or extend memberships."
              icon={Dumbbell}
            />
            <TaskLink
              href="/admin/products"
              title="Manage products"
              description="Add products and update prices or stock."
              icon={Package}
            />
            <TaskLink
              href="/admin/membership-plans"
              title="Membership plans"
              description="Manage durations, prices, and plan features."
              icon={Plus}
            />
            <TaskLink
              href="/admin/promotions"
              title="Manage offers"
              description="Create and update membership promotions."
              icon={Activity}
            />
          </div>
        </section>

        {/* Revenue deliberately placed last */}
        <section className="mt-10 pb-10">
          <SectionHeading
            title="Revenue overview"
            description="A quick look at recorded monthly revenue."
            action={
              <Link
                href="/admin/revenue"
                className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                Full reports <ArrowRight size={15} />
              </Link>
            }
          />

          <div className="rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">Total recorded revenue</p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "Loading…" : currency(dashboard.revenue.total)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <TrendingUp size={21} />
              </div>
            </div>

            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <h3 className="text-sm font-semibold text-white">
                Monthly revenue
              </h3>

              {dashboard.monthly.length === 0 ? (
                <p className="mt-4 text-sm text-white/40">
                  No monthly revenue data is available yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {dashboard.monthly.map((item, index) => {
                    const amount = Number(item?.revenue || 0);
                    const width = Math.max(
                      0,
                      Math.min(100, (amount / maxMonthlyRevenue) * 100)
                    );

                    return (
                      <div key={`${item?.month || item?.label || "month"}-${index}`}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs text-white/55">
                            {item?.label || item?.month || `Month ${index + 1}`}
                          </span>
                          <span className="text-xs font-semibold text-white/80">
                            {currency(amount)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/45">This month</p>
                <p className="mt-2 text-xl font-bold">
                  {currency(monthlyRevenue)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/45">This year</p>
                <p className="mt-2 text-xl font-bold">
                  {currency(dashboard.revenue.year)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}