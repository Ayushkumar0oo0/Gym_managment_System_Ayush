"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Dumbbell,
  RefreshCw,
  Search,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMemberships = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/memberships", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || "Failed to load memberships."
        );
      }

      setMemberships(
        Array.isArray(data.memberships) ? data.memberships : []
      );
    } catch (err) {
      console.error("FETCH MEMBERSHIPS ERROR:", err);
      setError(err?.message || "Failed to load memberships.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  function formatDate(date) {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDaysRemaining(endDate) {
    if (!endDate) return 0;

    const end = new Date(endDate);

    if (Number.isNaN(end.getTime())) {
      return 0;
    }

    const difference = end.getTime() - Date.now();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );
  }

  function getStatus(membership) {
    if (membership.status === "cancelled") {
      return "Cancelled";
    }

    if (
      membership.status === "expired" ||
      getDaysRemaining(membership.endDate) <= 0
    ) {
      return "Expired";
    }

    return "Active";
  }

  const filteredMemberships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memberships.filter((membership) => {
      const status = getStatus(membership);

      if (
        statusFilter !== "all" &&
        status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const user = membership.user || {};
      const secondaryUser = membership.secondaryUser || {};
      const plan = membership.plan || {};

      const searchable = [
        user.name,
        user.email,
        user.phone,
        secondaryUser.name,
        secondaryUser.email,
        secondaryUser.phone,
        plan.name,
        membership.membershipType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [memberships, search, statusFilter]);

  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let cancelled = 0;
    let revenue = 0;

    memberships.forEach((membership) => {
      const status = getStatus(membership);

      if (status === "Active") {
        active += 1;
      } else if (status === "Expired") {
        expired += 1;
      } else {
        cancelled += 1;
      }

      revenue += Number(membership.priceAtPurchase || 0);
    });

    return {
      total: memberships.length,
      active,
      expired,
      cancelled,
      revenue,
    };
  }, [memberships]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-zinc-900" />
            <div className="mt-3 h-4 w-80 rounded bg-zinc-950" />

            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-white/5 bg-zinc-950"
                />
              ))}
            </div>

            <div className="mt-8 h-20 rounded-2xl bg-zinc-950" />
            <div className="mt-4 h-[500px] rounded-2xl bg-zinc-950" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
              <Dumbbell className="h-4 w-4" />
              Membership Management
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Gym Memberships
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Monitor active memberships, expirations, plans, revenue and
              couple memberships from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMemberships}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {/* ERROR */}
        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load memberships</p>
              <p className="mt-1 text-red-400/70">{error}</p>
            </div>
          </div>
        ) : null}

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Memberships"
            value={stats.total}
          />

          <StatCard
            icon={CheckCircle2}
            label="Active"
            value={stats.active}
            accent="green"
          />

          <StatCard
            icon={Clock3}
            label="Expired"
            value={stats.expired}
            accent="red"
          />

          <StatCard
            icon={DollarSign}
            label="Membership Revenue"
            value={`₹${stats.revenue.toLocaleString("en-IN")}`}
            accent="orange"
          />
        </div>

        {/* FILTER BAR */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-4 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Search memberships
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search member, email, phone or plan..."
                  className="w-full rounded-xl border border-white/[0.08] bg-black py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div className="lg:w-52">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
              >
                <option value="all">All memberships</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
            <p className="text-xs text-zinc-600">
              Showing{" "}
              <span className="font-semibold text-zinc-400">
                {filteredMemberships.length}
              </span>{" "}
              of {memberships.length} memberships
            </p>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-xs font-semibold text-orange-500 transition hover:text-orange-400"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* EMPTY */}
        {filteredMemberships.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Dumbbell className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {memberships.length === 0
                ? "No memberships yet"
                : "No matching memberships"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              {memberships.length === 0
                ? "Memberships will appear here after successful purchases."
                : "Try changing the search term or status filter."}
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="space-y-4 md:hidden">
              {filteredMemberships.map((membership) => (
                <MembershipCard
                  key={membership._id}
                  membership={membership}
                  getStatus={getStatus}
                  getDaysRemaining={getDaysRemaining}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl shadow-black/20 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead className="border-b border-white/[0.08] bg-white/[0.025]">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">Member</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Paid</th>
                      <th className="px-5 py-4">Start</th>
                      <th className="px-5 py-4">End</th>
                      <th className="px-5 py-4">Remaining</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMemberships.map((membership) => {
                      const user = membership.user || {};
                      const secondaryUser =
                        membership.secondaryUser || null;
                      const plan = membership.plan || {};
                      const status = getStatus(membership);
                      const days = getDaysRemaining(
                        membership.endDate
                      );

                      return (
                        <tr
                          key={membership._id}
                          className="border-b border-white/[0.05] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={user.name}
                              />

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">
                                  {user.name || "Unknown Member"}
                                </p>

                                <p className="mt-1 max-w-[230px] truncate text-xs text-zinc-600">
                                  {user.email || "-"}
                                </p>

                                {membership.membershipType ===
                                  "couple" &&
                                secondaryUser ? (
                                  <p className="mt-1 truncate text-xs text-orange-500/70">
                                    Couple:{" "}
                                    {secondaryUser.name || "-"}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-sm text-zinc-400">
                            {user.phone || "-"}
                          </td>

                          <td className="px-5 py-5">
                            <TypeBadge
                              type={membership.membershipType}
                            />
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-semibold text-zinc-200">
                              {plan.name || "Unknown"}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {plan.durationInDays || "-"} days
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <span className="font-bold text-zinc-200">
                              ₹
                              {Number(
                                membership.priceAtPurchase || 0
                              ).toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="px-5 py-5 text-sm text-zinc-400">
                            {formatDate(membership.startDate)}
                          </td>

                          <td className="px-5 py-5 text-sm text-zinc-400">
                            {formatDate(membership.endDate)}
                          </td>

                          <td className="px-5 py-5">
                            {status === "Active" ? (
                              <div>
                                <span className="font-bold text-green-400">
                                  {days}
                                </span>
                                <span className="ml-1 text-xs text-zinc-600">
                                  {days === 1 ? "day" : "days"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-zinc-700">
                                0 days
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <StatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function MembershipCard({
  membership,
  getStatus,
  getDaysRemaining,
  formatDate,
}) {
  const user = membership.user || {};
  const secondaryUser = membership.secondaryUser || null;
  const plan = membership.plan || {};
  const status = getStatus(membership);
  const days = getDaysRemaining(membership.endDate);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-xl shadow-black/20">
      {/* TOP */}
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={user.name} />

            <div className="min-w-0">
              <h3 className="truncate font-bold text-white">
                {user.name || "Unknown Member"}
              </h3>

              <p className="mt-1 truncate text-xs text-zinc-600">
                {user.email || "-"}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                {user.phone || "-"}
              </p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      {/* PLAN */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Membership Plan
            </p>

            <p className="mt-1 font-bold text-white">
              {plan.name || "Unknown"}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {plan.durationInDays || "-"} days
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Paid
            </p>

            <p className="mt-1 text-lg font-black text-orange-500">
              ₹
              {Number(
                membership.priceAtPurchase || 0
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* COUPLE */}
        {membership.membershipType === "couple" &&
        secondaryUser ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <Users className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500/60">
                Couple Member
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-200">
                {secondaryUser.name || "-"}
              </p>
            </div>
          </div>
        ) : null}

        {/* DATES */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <DateBox
            icon={CalendarDays}
            label="Start"
            value={formatDate(membership.startDate)}
          />

          <DateBox
            icon={CalendarDays}
            label="End"
            value={formatDate(membership.endDate)}
          />
        </div>

        {/* REMAINING */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.025] p-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-zinc-600" />

            <span className="text-xs font-medium text-zinc-500">
              Remaining
            </span>
          </div>

          <span
            className={
              status === "Active"
                ? "font-bold text-green-400"
                : "font-medium text-zinc-700"
            }
          >
            {status === "Active"
              ? `${days} ${days === 1 ? "day" : "days"}`
              : "0 days"}
          </span>
        </div>

        {/* ADDONS */}
        {membership.selectedAddOns?.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Add-ons
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {membership.selectedAddOns.map((addOn, index) => (
                <span
                  key={addOn._id || addOn.addOn || index}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400"
                >
                  {addOn.name || "Add-on"}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* EXTENSIONS */}
        {membership.extensions?.length > 0 ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
            <Activity className="h-3.5 w-3.5" />
            {membership.extensions.length} extension
            {membership.extensions.length === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "M";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-black text-orange-500">
      {initial}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "white",
}) {
  const accentClasses = {
    white: "bg-white/[0.04] text-zinc-400",
    green: "bg-green-500/10 text-green-400",
    red: "bg-red-500/10 text-red-400",
    orange: "bg-orange-500/10 text-orange-500",
  };

  const valueClasses = {
    white: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    orange: "text-orange-500",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 transition hover:border-white/[0.14] sm:p-5">
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${accentClasses[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-xs font-medium text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black tracking-tight sm:text-3xl ${valueClasses[accent]}`}
      >
        {value}
      </p>

      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-orange-500/[0.025] blur-2xl transition group-hover:bg-orange-500/[0.06]" />
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    Active: {
      icon: CheckCircle2,
      className:
        "border-green-500/20 bg-green-500/10 text-green-400",
    },
    Expired: {
      icon: Clock3,
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },
    Cancelled: {
      icon: XCircle,
      className:
        "border-zinc-500/20 bg-zinc-500/10 text-zinc-500",
    },
  };

  const current = config[status] || config.Cancelled;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${current.className}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const isCouple = type === "couple";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
        isCouple
          ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
          : "border-orange-500/20 bg-orange-500/10 text-orange-500"
      }`}
    >
      {isCouple ? (
        <Users className="h-3 w-3" />
      ) : (
        <UserRound className="h-3 w-3" />
      )}

      {isCouple ? "Couple" : "Individual"}
    </span>
  );
}

function DateBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.025] p-3">
      <div className="flex items-center gap-1.5 text-zinc-600">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-semibold text-zinc-300">
        {value}
      </p>
    </div>
  );
}