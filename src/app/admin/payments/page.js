"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [confirmingPaymentId, setConfirmingPaymentId] =
    useState(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (methodFilter !== "all") {
        params.set("method", methodFilter);
      }

      if (typeFilter !== "all") {
        params.set("paymentType", typeFilter);
      }

      params.set("page", String(page));
      params.set("limit", "50");

      const response = await fetch(
        `/api/admin/payments?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch payments."
        );
      }

      setPayments(data.payments || []);
      setStats(data.stats || null);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Fetch payments error:", error);
      setError(
        error?.message || "Failed to fetch payments."
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    methodFilter,
    typeFilter,
    page,
  ]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const confirmCashPayment = async (payment) => {
    if (payment.method !== "cash") return;
    if (payment.status !== "pending") return;

    const amount = Number(payment.amount || 0).toLocaleString(
      "en-IN"
    );

    const memberName =
      payment.user?.name || "this member";

    let description = "cash payment";

    if (payment.paymentType === "renewal") {
      description = "cash renewal payment";
    } else if (payment.paymentType === "promotion") {
      description = "cash promotion payment";
    }

    const confirmed = window.confirm(
      `Confirm ₹${amount} ${description} from ${memberName}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setConfirmingPaymentId(payment.id);

      let endpoint;

      if (payment.paymentType === "renewal") {
        endpoint = `/api/admin/payments/${payment.id}/confirm-renewal`;
      } else {
        endpoint = `/api/admin/payments/${payment.id}/confirm`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to confirm cash payment."
        );
      }

      await fetchPayments();
    } catch (error) {
      console.error(
        "Confirm cash payment error:",
        error
      );

      setError(
        error?.message ||
          "Failed to confirm cash payment."
      );
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPaymentType = (type) => {
    if (!type) return "—";

    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setTypeFilter("all");
    setPage(1);
  };

  const hasFilters =
    search.trim() ||
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    typeFilter !== "all";

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-8 w-52 rounded-lg bg-zinc-900" />
          <div className="mt-3 h-4 w-80 rounded bg-zinc-950" />

          <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl border border-white/5 bg-zinc-950"
              />
            ))}
          </div>

          <div className="mt-6 h-32 rounded-2xl bg-zinc-950" />
          <div className="mt-4 h-[500px] rounded-2xl bg-zinc-950" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
              <WalletCards className="h-4 w-4" />
              Finance & Payments
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Payments
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
             Monitor gym revenue, online and legacy UPI payments, cash collections,
renewals and membership transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-400">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Payment operation failed
                </p>
                <p className="mt-1 text-red-400/70">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-red-400 transition hover:bg-red-500/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* MAIN STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
          <StatCard
            icon={CreditCard}
            label="Total Payments"
            value={pagination?.totalPayments ?? 0}
          />

          <StatCard
            icon={CheckCircle2}
            label="Paid"
            value={
              (stats?.membershipPaymentCount || 0) +
              (stats?.renewalPaymentCount || 0) +
              (stats?.promotionPaymentCount || 0) +
              (stats?.registrationPaymentCount || 0) +
              (stats?.productPaymentCount || 0) +
              (stats?.otherPaymentCount || 0)
            }
            accent="green"
          />

          <StatCard
            icon={Banknote}
            label="Cash Pending"
            value={stats?.pendingCashCount || 0}
            accent="yellow"
            subtitle={
              (stats?.pendingCashAmount || 0) > 0
                ? `₹${Number(
                    stats.pendingCashAmount
                  ).toLocaleString("en-IN")}`
                : undefined
            }
          />

          <StatCard
            icon={CalendarDays}
            label="Pending Renewals"
            value={
              stats?.pendingRenewalsCount ||
              stats?.pendingRenewals ||
              0
            }
            accent="blue"
            subtitle={
              (stats?.pendingCashRenewals || 0) > 0
                ? `${stats.pendingCashRenewals} cash renewal${
                    stats.pendingCashRenewals !== 1
                      ? "s"
                      : ""
                  }`
                : undefined
            }
          />

          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={`₹${Number(
              stats?.totalRevenue || 0
            ).toLocaleString("en-IN")}`}
            accent="orange"
          />
        </div>

        {/* REVENUE BREAKDOWN */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Revenue Breakdown
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <RevenueCard
              label="Membership Revenue"
              value={stats?.membershipRevenue}
            />

            <RevenueCard
              label="Renewal Revenue"
              value={stats?.renewalRevenue}
            />

            <RevenueCard
              label="Promotion Revenue"
              value={stats?.promotionRevenue}
            />

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 p-4">
              <p className="text-xs font-medium text-zinc-600">
                Payment Channels
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Banknote className="h-3.5 w-3.5" />
                    Cash
                  </span>

                  <span className="font-semibold text-zinc-200">
                    ₹
                    {Number(
                      stats?.cashRevenue || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Smartphone className="h-3.5 w-3.5" />
                  Online / Legacy UPI
                  </span>

                  <span className="font-semibold text-zinc-200">
                    ₹
                    {Number(
                      stats?.upiRevenue || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PENDING CASH RENEWALS */}
        {(stats?.pendingCashRenewals || 0) > 0 && (
          <section className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-blue-300">
                    Pending cash renewals
                  </p>

                  <p className="mt-1 text-xs text-blue-400/60">
                    {stats.pendingCashRenewals} cash renewal
                    {stats.pendingCashRenewals !== 1
                      ? "s are"
                      : " is"}{" "}
                    waiting for admin confirmation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTypeFilter("renewal");
                  setMethodFilter("cash");
                  setStatusFilter("pending");
                  setPage(1);
                }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
              >
                View Cash Renewals
              </button>
            </div>
          </section>
        )}

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 shadow-xl shadow-black/20 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold text-zinc-300">
              Filter Payments
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput
              label="Search"
              icon={Search}
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Name, email, phone, plan..."
            />

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                ["all", "All Status"],
                ["paid", "Paid"],
                ["pending", "Pending"],
                ["failed", "Failed"],
                ["refunded", "Refunded"],
              ]}
            />

            <FilterSelect
              label="Method"
              value={methodFilter}
              onChange={(value) => {
                setMethodFilter(value);
                setPage(1);
              }}
             options={[
  ["all", "All Methods"],
  ["online", "Online"],
  ["upi", "Legacy UPI"],
  ["cash", "Cash"],
]}
            />

            <FilterSelect
              label="Payment Type"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              options={[
                ["all", "All Types"],
                ["registration", "Registration"],
                ["membership", "Membership"],
                ["renewal", "Renewal"],
                ["promotion", "Promotion"],
                ["product", "Product"],
                ["other", "Other"],
              ]}
            />
          </div>

          {hasFilters && (
            <div className="mt-4 flex justify-end border-t border-white/[0.05] pt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition hover:text-orange-400"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* RESULT HEADER */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Showing{" "}
            <span className="font-semibold text-zinc-300">
              {payments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-300">
              {pagination?.totalPayments || 0}
            </span>{" "}
            payments
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {/* EMPTY */}
        {payments.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <WalletCards className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No payments found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              Try changing your search or payment filters.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="space-y-4 md:hidden">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  formatPaymentType={formatPaymentType}
                  confirmCashPayment={confirmCashPayment}
                  confirmingPaymentId={confirmingPaymentId}
                />
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl shadow-black/20 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead className="border-b border-white/[0.08] bg-white/[0.025]">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">Member</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Promotion</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        formatDate={formatDate}
                        formatPaymentType={formatPaymentType}
                        confirmCashPayment={
                          confirmCashPayment
                        }
                        confirmingPaymentId={
                          confirmingPaymentId
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 sm:flex-row">
            <p className="text-sm text-zinc-600">
              Page{" "}
              <span className="font-semibold text-zinc-300">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-zinc-300">
                {pagination.totalPages}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage || loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage || loading
                }
                onClick={() =>
                  setPage((current) => current + 1)
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "white",
  subtitle,
}) {
  const styles = {
    white: {
      icon: "bg-white/[0.05] text-zinc-400",
      value: "text-white",
    },
    green: {
      icon: "bg-green-500/10 text-green-400",
      value: "text-green-400",
    },
    yellow: {
      icon: "bg-yellow-500/10 text-yellow-400",
      value: "text-yellow-400",
    },
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      value: "text-blue-400",
    },
    orange: {
      icon: "bg-orange-500/10 text-orange-500",
      value: "text-orange-500",
    },
  };

  const style = styles[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 transition hover:border-white/[0.14] sm:p-5">
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${style.icon}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-xs font-medium text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black tracking-tight ${style.value}`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-[11px] font-medium text-zinc-600">
          {subtitle}
        </p>
      )}

      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/[0.025] blur-2xl transition group-hover:bg-orange-500/[0.06]" />
    </div>
  );
}

function RevenueCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 p-4">
      <p className="text-xs font-medium text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-zinc-200">
        ₹
        {Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function FilterInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </label>

      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/[0.08] bg-black py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentCard({
  payment,
  formatDate,
  formatDateTime,
  formatPaymentType,
  confirmCashPayment,
  confirmingPaymentId,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-xl shadow-black/20">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <UserRound className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-bold">
                {payment.user?.name ||
                  "Unknown Member"}
              </h3>

              <p className="mt-1 truncate text-xs text-zinc-600">
                {payment.user?.email || "No email"}
              </p>

              {payment.user?.phone && (
                <p className="mt-1 text-xs text-zinc-700">
                  {payment.user.phone}
                </p>
              )}
            </div>
          </div>

          <StatusBadge status={payment.status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Amount
            </p>

            <p className="mt-1 text-2xl font-black text-orange-500">
              ₹
              {Number(payment.amount || 0).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <MethodBadge method={payment.method} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox
            label="Type"
            value={formatPaymentType(
              payment.paymentType
            )}
          />

          <InfoBox
            label="Date"
            value={formatDate(payment.createdAt)}
          />
        </div>

        {payment.membershipPlan && (
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Membership Plan
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-200">
              {payment.membershipPlan.name}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {payment.membershipPlan.durationInDays} days
            </p>
          </div>
        )}

        {payment.paymentType === "renewal" &&
          payment.membershipStartDate && (
            <div className="mt-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.05] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400/60">
                Renewal Start Date
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-200">
                {formatDate(
                  payment.membershipStartDate
                )}
              </p>
            </div>
          )}

        {payment.promotion && (
          <div className="mt-3 rounded-xl border border-purple-500/10 bg-purple-500/[0.05] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400/60">
              Promotion
            </p>

            <p className="mt-1 text-sm font-semibold text-purple-200">
              {payment.promotion.title}
            </p>

            <p className="mt-1 text-xs capitalize text-purple-400/60">
              {payment.promotion.type}

              {payment.promotion.type ===
                "extension" &&
                payment.promotion.extensionDays && (
                  <>
                    {" "}
                    • +
                    {payment.promotion.extensionDays} days
                  </>
                )}
            </p>
          </div>
        )}

        {payment.membership && (
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Membership
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              {formatDate(payment.membership.startDate)}
              {" → "}
              {formatDate(payment.membership.endDate)}
            </p>

            <p className="mt-1 text-xs capitalize text-zinc-600">
              {payment.membership.status}
            </p>
          </div>
        )}

        {payment.method === "cash" &&
          payment.status === "pending" && (
            <button
              type="button"
              onClick={() =>
                confirmCashPayment(payment)
              }
              disabled={
                confirmingPaymentId === payment.id
              }
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                payment.paymentType === "renewal"
                  ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  : payment.paymentType === "promotion"
                    ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
              }`}
            >
              {confirmingPaymentId === payment.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {payment.paymentType === "renewal"
                    ? "Confirm Cash Renewal"
                    : payment.paymentType === "promotion"
                      ? "Confirm Cash Promotion"
                      : "Confirm Cash Payment"}
                </>
              )}
            </button>
          )}

        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <p className="break-all text-[10px] text-zinc-700">
            Transaction:{" "}
            {payment.transactionId || "—"}
          </p>

          <p className="mt-1 text-[10px] text-zinc-700">
            {formatDateTime(payment.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  formatDate,
  formatPaymentType,
  confirmCashPayment,
  confirmingPaymentId,
}) {
  return (
    <tr className="border-b border-white/[0.05] transition hover:bg-white/[0.025]">
      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xs font-black text-orange-500">
            {payment.user?.name
              ?.trim()
              ?.charAt(0)
              ?.toUpperCase() || "M"}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-200">
              {payment.user?.name ||
                "Unknown Member"}
            </p>

            <p className="mt-1 max-w-[210px] truncate text-xs text-zinc-600">
              {payment.user?.email || "—"}
            </p>

            <p className="mt-1 text-xs text-zinc-700">
              {payment.user?.phone || "—"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-5">
        {payment.membershipPlan ? (
          <>
            <p className="font-semibold text-zinc-300">
              {payment.membershipPlan.name}
            </p>

            <p className="mt-1 text-xs text-zinc-700">
              {payment.membershipPlan.durationInDays} days
            </p>
          </>
        ) : (
          <span className="text-zinc-700">—</span>
        )}
      </td>

      <td className="px-5 py-5">
        <p className="font-black text-zinc-200">
          ₹
          {Number(payment.amount || 0).toLocaleString(
            "en-IN"
          )}
        </p>
      </td>

      <td className="px-5 py-5">
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm text-zinc-400">
            {formatPaymentType(
              payment.paymentType
            )}
          </span>

          {payment.paymentType === "renewal" && (
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-400">
              Renewal
            </span>
          )}

          {payment.paymentType === "promotion" && (
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-400">
              Promotion
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-5">
        <MethodBadge method={payment.method} />
      </td>

      <td className="px-5 py-5">
        <StatusBadge status={payment.status} />
      </td>

      <td className="max-w-[220px] px-5 py-5">
        {payment.promotion ? (
          <>
            <p className="truncate text-sm font-medium text-zinc-300">
              {payment.promotion.title}
            </p>

            <p className="mt-1 text-xs capitalize text-zinc-700">
              {payment.promotion.type}

              {payment.promotion.type ===
                "extension" &&
                payment.promotion.extensionDays && (
                  <>
                    {" "}
                    • +
                    {payment.promotion.extensionDays} days
                  </>
                )}
            </p>
          </>
        ) : (
          <span className="text-zinc-700">—</span>
        )}
      </td>

      <td className="whitespace-nowrap px-5 py-5 text-sm text-zinc-500">
        {formatDate(payment.createdAt)}
      </td>

      <td className="px-5 py-5">
        {payment.method === "cash" &&
        payment.status === "pending" ? (
          <button
            type="button"
            onClick={() =>
              confirmCashPayment(payment)
            }
            disabled={
              confirmingPaymentId === payment.id
            }
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              payment.paymentType === "renewal"
                ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : payment.paymentType === "promotion"
                  ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                  : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
            }`}
          >
            {confirmingPaymentId === payment.id
              ? "Confirming..."
              : payment.paymentType === "renewal"
                ? "Confirm Renewal"
                : payment.paymentType === "promotion"
                  ? "Confirm Promotion"
                  : "Confirm Cash"}
          </button>
        ) : payment.status === "paid" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500/70">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        ) : (
          <span className="text-xs text-zinc-700">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }) {
  const config = {
    paid: {
      icon: CheckCircle2,
      className:
        "border-green-500/20 bg-green-500/10 text-green-400",
    },
    pending: {
      icon: Loader2,
      className:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    },
    failed: {
      icon: XCircle,
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },
    refunded: {
      icon: RefreshCw,
      className:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },
  };

  const current = config[status] || {
    icon: CreditCard,
    className:
      "border-white/10 bg-white/[0.03] text-zinc-500",
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${current.className}`}
    >
      <Icon className="h-3 w-3" />
      {status || "Unknown"}
    </span>
  );
}

function MethodBadge({ method }) {
  const isCash = method === "cash";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        isCash
          ? "border-green-500/20 bg-green-500/10 text-green-400"
          : "border-purple-500/20 bg-purple-500/10 text-purple-400"
      }`}
    >
      {isCash ? (
        <Banknote className="h-3 w-3" />
      ) : (
        <Smartphone className="h-3 w-3" />
      )}
      {method || "—"}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.025] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-zinc-300">
        {value}
      </p>
    </div>
  );
}