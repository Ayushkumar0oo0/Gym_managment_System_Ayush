"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

const EMPTY_DATA = {
  overview: {
    selected: 0,
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    allTime: 0,
    transactions: 0,
    averageTransaction: 0,
  },

  breakdown: {
    byType: {
      registration: 0,
      membership: 0,
      renewal: 0,
      promotion: 0,
      product: 0,
      other: 0,
    },

    byMethod: {
      upi: 0,
      cash: 0,
    },

    membership: 0,
    renewal: 0,
    registration: 0,
    promotion: 0,
    product: 0,
    other: 0,
  },

  trend: {
    year: new Date().getFullYear(),
    monthly: [],
    daily: [],
  },

  comparison: null,

  paymentStats: {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  },

  recentTransactions: [],
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

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentTypeLabel(type) {
  const labels = {
    registration: "Registration",
    membership: "Membership",
    renewal: "Renewal",
    promotion: "Promotion",
    product: "Product",
    other: "Other",
  };

  return labels[type] || "Other";
}

function getPaymentTypeIcon(type) {
  switch (type) {
    case "membership":
      return <CreditCard size={16} />;

    case "renewal":
      return <RefreshCw size={16} />;

    case "promotion":
      return <TrendingUp size={16} />;

    case "product":
      return <ShoppingBag size={16} />;

    case "registration":
      return <CheckCircle2 size={16} />;

    default:
      return <Wallet size={16} />;
  }
}

function getMethodLabel(method) {
  if (method === "upi") return "UPI";
  if (method === "cash") return "Cash";

  return method || "—";
}

function getStatusStyle(status) {
  switch (status) {
    case "paid":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "refunded":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    default:
      return "border-white/10 bg-white/5 text-white/40";
  }
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "orange",
}) {
  const accents = {
    orange: "bg-orange-500/10 text-orange-400",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-emerald-500/10 text-emerald-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 transition hover:-translate-y-0.5 hover:border-orange-500/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            {title}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 truncate text-xs text-white/30">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            accents[accent] || accents.orange
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
  icon,
  accent = "orange",
}) {
  const percentage =
    total > 0
      ? Math.round((Number(value || 0) / total) * 100)
      : 0;

  const accentStyles = {
    orange: "bg-orange-500/10 text-orange-400",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-emerald-500/10 text-emerald-400",
    purple: "bg-purple-500/10 text-purple-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            accentStyles[accent] || accentStyles.orange
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-bold text-white">
              {label}
            </span>

            <span className="text-xs font-black text-white">
              {formatCurrency(value)}
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-700"
              style={{
                width: `${Math.min(100, percentage)}%`,
              }}
            />
          </div>

          <p className="mt-1.5 text-[10px] text-white/25">
            {percentage}% of selected revenue
          </p>
        </div>
      </div>
    </div>
  );
}

function RevenueBar({
  label,
  value,
  maxValue,
  transactions,
}) {
  const percentage =
    maxValue > 0
      ? Math.max(
          value > 0 ? 4 : 0,
          Math.round((value / maxValue) * 100)
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-white/45">
          {label}
        </span>

        <div className="text-right">
          <span className="text-xs font-black text-white">
            {formatCurrency(value)}
          </span>

          {transactions !== undefined && (
            <span className="ml-2 text-[10px] text-white/20">
              {transactions} txns
            </span>
          )}
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function PeriodButton({
  value,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
        active
          ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
          : "border-white/[0.07] bg-white/[0.02] text-white/35 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminRevenuePage() {
  const [data, setData] = useState(EMPTY_DATA);

  const [range, setRange] = useState("month");

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRevenue = useCallback(
    async (
      selectedRange = range,
      selectedYear = year
    ) => {
      try {
        setError("");

        const params = new URLSearchParams();

        params.set("range", selectedRange);
        params.set("year", String(selectedYear));
        params.set("limit", "30");

        if (selectedRange === "custom") {
          if (!customFrom || !customTo) {
            setError(
              "Please select both start and end dates."
            );
            return;
          }

          params.set("from", customFrom);
          params.set("to", customTo);
        }

        const response = await fetch(
          `/api/admin/revenue?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
              "Unable to load revenue analytics."
          );
        }

        setData({
          ...EMPTY_DATA,
          ...result,
          overview: {
            ...EMPTY_DATA.overview,
            ...(result.overview || {}),
          },
          breakdown: {
            ...EMPTY_DATA.breakdown,
            ...(result.breakdown || {}),
            byType: {
              ...EMPTY_DATA.breakdown.byType,
              ...(result.breakdown?.byType || {}),
            },
            byMethod: {
              ...EMPTY_DATA.breakdown.byMethod,
              ...(result.breakdown?.byMethod || {}),
            },
          },
          trend: {
            ...EMPTY_DATA.trend,
            ...(result.trend || {}),
            monthly: Array.isArray(
              result.trend?.monthly
            )
              ? result.trend.monthly
              : [],
            daily: Array.isArray(
              result.trend?.daily
            )
              ? result.trend.daily
              : [],
          },
          paymentStats: {
            ...EMPTY_DATA.paymentStats,
            ...(result.paymentStats || {}),
          },
          recentTransactions:
            Array.isArray(
              result.recentTransactions
            )
              ? result.recentTransactions
              : [],
        });
      } catch (err) {
        console.error(
          "ADMIN REVENUE ERROR:",
          err
        );

        setError(
          err?.message ||
            "Failed to load revenue analytics."
        );
      } finally {
        setLoading(false);
      }
    },
    [range, year, customFrom, customTo]
  );

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const overview = data.overview;

  const byType = data.breakdown.byType;

  const byMethod = data.breakdown.byMethod;

  const monthly = data.trend.monthly || [];

  const daily = data.trend.daily || [];

  const maxMonthlyRevenue = useMemo(
    () =>
      Math.max(
        ...monthly.map(
          (item) => Number(item.revenue) || 0
        ),
        1
      ),
    [monthly]
  );

  const maxDailyRevenue = useMemo(
    () =>
      Math.max(
        ...daily.map(
          (item) => Number(item.revenue) || 0
        ),
        1
      ),
    [daily]
  );

  const byTypeTotal = Object.values(byType).reduce(
    (sum, item) =>
      sum +
      Number(
        typeof item === "object"
          ? item?.revenue
          : item || 0
      ),
    0
  );

  const byMethodTotal =
    Number(
      typeof byMethod.upi === "object"
        ? byMethod.upi?.revenue
        : byMethod.upi || 0
    ) +
    Number(
      typeof byMethod.cash === "object"
        ? byMethod.cash?.revenue
        : byMethod.cash || 0
    );

  const comparisonGrowth =
    data.comparison?.growth ?? null;

  const handleRangeChange = (value) => {
    setRange(value);

    if (value !== "custom") {
      setLoading(true);
      loadRevenue(value, year);
    }
  };

  const handleYearChange = (value) => {
    const nextYear = Number(value);

    setYear(nextYear);
    setLoading(true);

    loadRevenue(range, nextYear);
  };

  const handleCustomSearch = () => {
    if (!customFrom || !customTo) {
      setError(
        "Please select both start and end dates."
      );
      return;
    }

    setLoading(true);
    loadRevenue("custom", year);
  };

  const refresh = () => {
    setLoading(true);
    loadRevenue(range, year);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-white/35 transition hover:text-orange-400"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </Link>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <BarChart3
                  size={15}
                  className="text-orange-400"
                />
              </div>

              <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                Financial Analytics
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Revenue & Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/35">
              A simple financial overview of your gym.
              Track collections, revenue sources and
              payment performance from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading ? "animate-spin" : ""
              }
            />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* PERIOD FILTER */}
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-white/30">
                Revenue Period
              </p>

              <p className="mt-1 text-sm text-white/50">
                Choose the period you want to analyse.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <PeriodButton
                value="today"
                label="Today"
                active={range === "today"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="7d"
                label="7 Days"
                active={range === "7d"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="30d"
                label="30 Days"
                active={range === "30d"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="month"
                label="This Month"
                active={range === "month"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="year"
                label="This Year"
                active={range === "year"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="all"
                label="All Time"
                active={range === "all"}
                onClick={handleRangeChange}
              />

              <PeriodButton
                value="custom"
                label="Custom"
                active={range === "custom"}
                onClick={handleRangeChange}
              />
            </div>
          </div>

          {range === "custom" && (
            <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">
                  From
                </label>

                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) =>
                    setCustomFrom(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">
                  To
                </label>

                <input
                  type="date"
                  value={customTo}
                  onChange={(e) =>
                    setCustomTo(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500/40"
                />
              </div>

              <button
                type="button"
                onClick={handleCustomSearch}
                className="self-end rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-orange-400"
              >
                Apply
              </button>
            </div>
          )}
        </section>

        {/* MAIN METRICS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Selected Revenue"
            value={formatCurrency(
              overview.selected
            )}
            subtitle={`${formatNumber(
              overview.transactions
            )} transactions`}
            icon={IndianRupee}
            accent="orange"
          />

          <MetricCard
            title="Today"
            value={formatCurrency(
              overview.today
            )}
            subtitle="Collected today"
            icon={Wallet}
            accent="blue"
          />

          <MetricCard
            title="This Week"
            value={formatCurrency(
              overview.week
            )}
            subtitle="Current week"
            icon={CalendarDays}
            accent="green"
          />

          <MetricCard
            title="This Month"
            value={formatCurrency(
              overview.month
            )}
            subtitle="Current month"
            icon={TrendingUp}
            accent="purple"
          />

          <MetricCard
            title="All Time"
            value={formatCurrency(
              overview.allTime
            )}
            subtitle="Total collected"
            icon={IndianRupee}
            accent="orange"
          />
        </section>

        {/* PERFORMANCE */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="This Year"
            value={formatCurrency(
              overview.year
            )}
            subtitle="Year-to-date revenue"
            icon={CalendarDays}
            accent="green"
          />

          <MetricCard
            title="Average Payment"
            value={formatCurrency(
              overview.averageTransaction
            )}
            subtitle="Average transaction value"
            icon={CreditCard}
            accent="blue"
          />

          <MetricCard
            title="Paid Payments"
            value={formatNumber(
              data.paymentStats.paid
            )}
            subtitle="Successful payment records"
            icon={CheckCircle2}
            accent="green"
          />

          <MetricCard
            title="Pending"
            value={formatNumber(
              data.paymentStats.pending
            )}
            subtitle="Payments awaiting completion"
            icon={RefreshCw}
            accent="orange"
          />
        </section>

        {/* COMPARISON */}
        {comparisonGrowth !== null && (
          <section className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">
                  Period Performance
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Compared with the previous equivalent
                  period.
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${
                  comparisonGrowth >= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {comparisonGrowth >= 0 ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}

                {comparisonGrowth >= 0
                  ? "+"
                  : ""}
                {Number(
                  comparisonGrowth
                ).toFixed(1)}
                %
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Current
                </p>

                <p className="mt-2 text-lg font-black">
                  {formatCurrency(
                    data.comparison.current
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Previous
                </p>

                <p className="mt-2 text-lg font-black">
                  {formatCurrency(
                    data.comparison.previous
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Difference
                </p>

                <p className="mt-2 text-lg font-black">
                  {formatCurrency(
                    Number(
                      data.comparison.current
                    ) -
                      Number(
                        data.comparison.previous
                      )
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MONTHLY TREND */}
        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                  <BarChart3 size={17} />
                </div>

                <div>
                  <h2 className="font-black">
                    Revenue Trend
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Monthly collection performance
                  </p>
                </div>
              </div>
            </div>

            <select
              value={year}
              onChange={(e) =>
                handleYearChange(e.target.value)
              }
              className="rounded-lg border border-white/[0.08] bg-black px-3 py-2 text-xs font-bold text-white outline-none"
            >
              {Array.from({ length: 6 }).map(
                (_, index) => {
                  const optionYear =
                    new Date().getFullYear() -
                    index;

                  return (
                    <option
                      key={optionYear}
                      value={optionYear}
                      className="bg-black"
                    >
                      {optionYear}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          <div className="mt-7 space-y-5">
            {monthly.length > 0 ? (
              monthly.map((item, index) => (
                <RevenueBar
                  key={`${item.month}-${index}`}
                  label={item.label}
                  value={Number(
                    item.revenue || 0
                  )}
                  transactions={
                    item.transactions
                  }
                  maxValue={
                    maxMonthlyRevenue
                  }
                />
              ))
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-xs text-white/25">
                  No revenue data available.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* DAILY TREND */}
        {daily.length > 0 && (
          <section className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
            <div>
              <h2 className="font-black">
                Daily Revenue
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Daily collection for the selected period
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {daily.map((item) => {
                const percentage =
                  maxDailyRevenue > 0
                    ? Math.max(
                        item.revenue > 0 ? 3 : 0,
                        Math.round(
                          (item.revenue /
                            maxDailyRevenue) *
                            100
                        )
                      )
                    : 0;

                return (
                  <div
                    key={item.date}
                    className="grid grid-cols-[65px_1fr_85px] items-center gap-3"
                  >
                    <span className="text-[10px] text-white/30">
                      {new Date(
                        item.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                        }
                      )}
                    </span>

                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-[10px] font-black text-white">
                      {formatCurrency(
                        item.revenue
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* BREAKDOWNS */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* TYPE */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black">
                  Revenue by Type
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Understand where gym income comes
                  from.
                </p>
              </div>

              <TrendingUp
                size={17}
                className="text-orange-400"
              />
            </div>

            <div className="mt-5 space-y-3">
              <BreakdownRow
                label="Memberships"
                value={
                  byType.membership?.revenue ??
                  byType.membership ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "membership"
                )}
                accent="blue"
              />

              <BreakdownRow
                label="Renewals"
                value={
                  byType.renewal?.revenue ??
                  byType.renewal ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "renewal"
                )}
                accent="green"
              />

              <BreakdownRow
                label="Registration"
                value={
                  byType.registration?.revenue ??
                  byType.registration ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "registration"
                )}
                accent="orange"
              />

              <BreakdownRow
                label="Promotions"
                value={
                  byType.promotion?.revenue ??
                  byType.promotion ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "promotion"
                )}
                accent="purple"
              />

              <BreakdownRow
                label="Products"
                value={
                  byType.product?.revenue ??
                  byType.product ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "product"
                )}
                accent="yellow"
              />

              <BreakdownRow
                label="Other"
                value={
                  byType.other?.revenue ??
                  byType.other ??
                  0
                }
                total={byTypeTotal}
                icon={getPaymentTypeIcon(
                  "other"
                )}
                accent="orange"
              />
            </div>
          </div>

          {/* METHOD */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black">
                  Payment Methods
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Cash versus UPI collection.
                </p>
              </div>

              <Wallet
                size={17}
                className="text-orange-400"
              />
            </div>

            <div className="mt-6 space-y-4">
              <BreakdownRow
                label="UPI"
                value={
                  byMethod.upi?.revenue ??
                  byMethod.upi ??
                  0
                }
                total={byMethodTotal}
                icon={
                  <CreditCard size={16} />
                }
                accent="blue"
              />

              <BreakdownRow
                label="Cash"
                value={
                  byMethod.cash?.revenue ??
                  byMethod.cash ??
                  0
                }
                total={byMethodTotal}
                icon={
                  <Banknote size={16} />
                }
                accent="green"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  UPI
                </p>

                <p className="mt-2 text-lg font-black">
                  {formatCurrency(
                    byMethod.upi?.revenue ??
                      byMethod.upi ??
                      0
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/25">
                  Cash
                </p>

                <p className="mt-2 text-lg font-black">
                  {formatCurrency(
                    byMethod.cash?.revenue ??
                      byMethod.cash ??
                      0
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT STATUS */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Payment Status
            </h2>

            <p className="mt-1 text-xs text-white/30">
              Overview of all payment records.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              title="Paid"
              value={data.paymentStats.paid}
              icon={CheckCircle2}
              color="green"
            />

            <StatusCard
              title="Pending"
              value={data.paymentStats.pending}
              icon={RefreshCw}
              color="yellow"
            />

            <StatusCard
              title="Failed"
              value={data.paymentStats.failed}
              icon={XCircle}
              color="red"
            />

            <StatusCard
              title="Refunded"
              value={data.paymentStats.refunded}
              icon={ArrowDownRight}
              color="purple"
            />
          </div>
        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="mt-8 pb-10">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-black">
                Recent Transactions
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Latest successful payments recorded by
                the gym.
              </p>
            </div>

            <Link
              href="/admin/payments"
              className="inline-flex w-fit items-center gap-1 rounded-lg border border-white/[0.07] px-3 py-2 text-[11px] font-bold text-orange-400 transition hover:bg-white/[0.04]"
            >
              All Payments
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0d]">
            <div className="hidden border-b border-white/[0.06] px-5 py-4 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:gap-4">
              <TableHeader text="Member" />
              <TableHeader text="Type" />
              <TableHeader text="Method" />
              <TableHeader text="Amount" />
              <TableHeader text="Date" align="right" />
            </div>

            {data.recentTransactions.length > 0 ? (
              <div>
                {data.recentTransactions
                  .slice(0, 15)
                  .map(
                    (payment, index) => (
                      <div
                        key={
                          payment.id ||
                          index
                        }
                        className="border-b border-white/[0.05] px-5 py-4 last:border-b-0"
                      >
                        <div className="md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:items-center md:gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                              {getPaymentTypeIcon(
                                payment.paymentType
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {payment.user
                                  ?.name ||
                                  "Member"}
                              </p>

                              <p className="truncate text-[10px] text-white/25">
                                {payment.user
                                  ?.email ||
                                  payment.user
                                    ?.phone ||
                                  "—"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 md:mt-0">
                            <span className="text-xs font-semibold text-white/50">
                              {getPaymentTypeLabel(
                                payment.paymentType
                              )}
                            </span>
                          </div>

                          <div className="mt-2 md:mt-0">
                            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase text-white/40">
                              {getMethodLabel(
                                payment.method
                              )}
                            </span>
                          </div>

                          <div className="mt-3 md:mt-0">
                            <p className="text-sm font-black text-white">
                              {formatCurrency(
                                payment.amount
                              )}
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getStatusStyle(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </div>

                          <div className="mt-3 text-left md:mt-0 md:text-right">
                            <p className="text-xs font-semibold text-white/45">
                              {formatDate(
                                payment.paidAt
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-white/20">
                              {formatDateTime(
                                payment.paidAt
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            ) : (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-white/20">
                  <IndianRupee size={20} />
                </div>

                <p className="mt-4 text-sm font-bold text-white/50">
                  No transactions found
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Successful payments will appear
                  here.
                </p>
              </div>
            )}

            {data.recentTransactions.length >
              15 && (
              <Link
                href="/admin/payments"
                className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-5 py-4 text-xs font-bold text-orange-400 transition hover:bg-white/[0.02]"
              >
                View all payments
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  const styles = {
    green: {
      box: "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-400",
    },
    yellow: {
      box: "bg-yellow-500/10 text-yellow-400",
      value: "text-yellow-400",
    },
    red: {
      box: "bg-red-500/10 text-red-400",
      value: "text-red-400",
    },
    purple: {
      box: "bg-purple-500/10 text-purple-400",
      value: "text-purple-400",
    },
  };

  const style = styles[color] || styles.green;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.box}`}
        >
          <Icon size={18} />
        </div>

        <div>
          <p className="text-xs text-white/30">
            {title}
          </p>

          <p
            className={`mt-1 text-xl font-black ${style.value}`}
          >
            {formatNumber(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TableHeader({ text, align }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider text-white/25 ${
        align === "right"
          ? "text-right"
          : ""
      }`}
    >
      {text}
    </span>
  );
}