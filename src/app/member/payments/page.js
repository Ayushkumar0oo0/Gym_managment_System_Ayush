"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Dumbbell,
  FileText,
  Filter,
  History,
  IndianRupee,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
  Clock3,
} from "lucide-react";

export default function MemberPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(limit));

        if (status) {
          params.set("status", status);
        }

        if (method) {
          params.set("method", method);
        }

        if (paymentType) {
          params.set("paymentType", paymentType);
        }

        const response = await fetch(
          `/api/member/payments?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load payment history."
          );
        }

        setPayments(data.payments || []);
        setStats(data.stats || null);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error(
          "MEMBER PAYMENTS PAGE ERROR:",
          error
        );

        setError(
          error?.message ||
            "Unable to load payment history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [page, status, method, paymentType]);

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAmount(amount) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function getStatusStyle(paymentStatus) {
    switch (paymentStatus) {
      case "paid":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

      case "pending":
        return "border-amber-500/20 bg-amber-500/10 text-amber-400";

      case "failed":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "refunded":
        return "border-purple-500/20 bg-purple-500/10 text-purple-400";

      default:
        return "border-zinc-700 bg-zinc-900 text-zinc-400";
    }
  }

  function getPaymentTypeLabel(type) {
    switch (type) {
      case "registration":
        return "Registration";

      case "membership":
        return "Membership";

      case "renewal":
        return "Renewal";

      case "promotion":
        return "Promotion";

      case "product":
        return "Product";

      case "other":
        return "Other";

      default:
        return type || "Payment";
    }
  }

  function getPaymentTypeIcon(type) {
    switch (type) {
      case "registration":
        return <FileText size={17} />;

      case "membership":
        return <Dumbbell size={17} />;

      case "renewal":
        return <RefreshCw size={17} />;

      case "promotion":
        return <CircleDollarSign size={17} />;

      case "product":
        return <Wallet size={17} />;

      default:
        return <Receipt size={17} />;
    }
  }

  function clearFilters() {
    setStatus("");
    setMethod("");
    setPaymentType("");
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleMethodChange(value) {
    setMethod(value);
    setPage(1);
  }

  function handlePaymentTypeChange(value) {
    setPaymentType(value);
    setPage(1);
  }

  const hasFilters =
    Boolean(status || method || paymentType);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <AmbientGlow />

        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-500/20 bg-zinc-950 p-7 shadow-2xl shadow-black/30 sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle size={26} />
            </div>

            <h1 className="mt-5 text-center text-2xl font-black">
              Unable to load payments
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-zinc-500">
              {error}
            </p>

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <section className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                <History size={12} />
                Payment Center
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Payment{" "}
                <span className="text-orange-500">
                  History
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                View your membership, renewal, promotion
                and other gym payments in one place.
              </p>
            </div>

            <Link
              href="/member/membership"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400"
            >
              Membership
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Main Revenue Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<IndianRupee size={18} />}
            label="Total Paid"
            value={formatAmount(stats?.totalPaid)}
            description="All successful payments"
            accent
          />

          <StatCard
            icon={<Clock3 size={18} />}
            label="Pending"
            value={formatAmount(
              stats?.totalPending
            )}
            description="Awaiting confirmation"
            warning
          />

          <StatCard
            icon={<Banknote size={18} />}
            label="Cash Paid"
            value={formatAmount(
              stats?.cashRevenue
            )}
            description="Successful cash payments"
          />

          <StatCard
            icon={<CreditCard size={18} />}
            label="UPI Paid"
            value={formatAmount(
              stats?.upiRevenue
            )}
            description="Successful UPI payments"
          />
        </section>

        {/* Breakdown */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BreakdownCard
            label="Membership"
            value={formatAmount(
              stats?.membershipRevenue
            )}
            icon={<Dumbbell size={15} />}
          />

          <BreakdownCard
            label="Renewals"
            value={formatAmount(
              stats?.renewalRevenue
            )}
            icon={<RefreshCw size={15} />}
          />

          <BreakdownCard
            label="Promotions"
            value={formatAmount(
              stats?.promotionRevenue
            )}
            icon={<CircleDollarSign size={15} />}
          />

          <BreakdownCard
            label="Registration"
            value={formatAmount(
              stats?.registrationRevenue
            )}
            icon={<FileText size={15} />}
          />
        </section>

        {/* Filters */}
        <section className="mt-7 rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Filter size={17} />
              </div>

              <div>
                <h2 className="font-black">
                  Filter Payments
                </h2>

                <p className="mt-1 text-xs text-zinc-700">
                  Narrow down your transaction history.
                </p>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex w-fit items-center gap-2 text-xs font-bold text-zinc-500 transition hover:text-orange-400"
              >
                <XCircle size={14} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <FilterSelect
              value={paymentType}
              onChange={(e) =>
                handlePaymentTypeChange(
                  e.target.value
                )
              }
              options={[
                ["", "All Payment Types"],
                ["registration", "Registration"],
                ["membership", "Membership"],
                ["renewal", "Renewal"],
                ["promotion", "Promotion / Extension"],
                ["product", "Product"],
                ["other", "Other"],
              ]}
            />

            <FilterSelect
              value={method}
              onChange={(e) =>
                handleMethodChange(
                  e.target.value
                )
              }
              options={[
                ["", "All Methods"],
                ["upi", "UPI"],
                ["cash", "Cash"],
              ]}
            />

            <FilterSelect
              value={status}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value
                )
              }
              options={[
                ["", "All Statuses"],
                ["paid", "Paid"],
                ["pending", "Pending"],
                ["failed", "Failed"],
                ["refunded", "Refunded"],
              ]}
            />
          </div>
        </section>

        {/* Transactions */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Receipt size={16} />

                  <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                    Transactions
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-black sm:text-2xl">
                  Payment Activity
                </h2>

                <p className="mt-1 text-xs text-zinc-700">
                  {pagination?.totalPayments || 0}{" "}
                  total payment
                  {pagination?.totalPayments === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 sm:flex">
                <Receipt size={19} />
              </div>
            </div>
          </div>

          {payments.length === 0 ? (
            <EmptyState
              hasFilters={hasFilters}
              clearFilters={clearFilters}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <TableHeading>
                        Payment
                      </TableHeading>

                      <TableHeading>
                        Amount
                      </TableHeading>

                      <TableHeading>
                        Method
                      </TableHeading>

                      <TableHeading>
                        Status
                      </TableHeading>

                      <TableHeading>
                        Date
                      </TableHeading>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-white/5 transition hover:bg-orange-500/[0.025] last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <PaymentIcon
                              type={
                                payment.paymentType
                              }
                            />

                            <div className="min-w-0">
                              <p className="font-bold text-zinc-200">
                                {getPaymentTypeLabel(
                                  payment.paymentType
                                )}
                              </p>

                              {payment.membershipPlan && (
                                <p className="mt-1 text-xs text-zinc-600">
                                  {
                                    payment
                                      .membershipPlan
                                      .name
                                  }
                                </p>
                              )}

                              {payment.promotion && (
                                <p className="mt-1 max-w-[260px] truncate text-xs text-zinc-600">
                                  {
                                    payment
                                      .promotion
                                      .title
                                  }
                                </p>
                              )}

                              {payment.transactionId && (
                                <p className="mt-2 max-w-[240px] truncate font-mono text-[10px] text-zinc-800">
                                  {payment.transactionId}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-black text-zinc-100">
                            {formatAmount(
                              payment.amount
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <PaymentMethodBadge
                            method={payment.method}
                          />
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={
                              payment.status
                            }
                            getStatusStyle={
                              getStatusStyle
                            }
                          />
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-zinc-400">
                            {formatDate(
                              payment.paidAt ||
                                payment.createdAt
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-700">
                            {formatDateTime(
                              payment.paidAt ||
                                payment.createdAt
                            )}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-white/5 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <PaymentIcon
                          type={
                            payment.paymentType
                          }
                        />

                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200">
                            {getPaymentTypeLabel(
                              payment.paymentType
                            )}
                          </p>

                          {payment.membershipPlan && (
                            <p className="mt-1 truncate text-sm text-zinc-600">
                              {
                                payment
                                  .membershipPlan
                                  .name
                              }
                            </p>
                          )}

                          {payment.promotion && (
                            <p className="mt-1 truncate text-sm text-zinc-600">
                              {
                                payment.promotion
                                  .title
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <StatusBadge
                        status={payment.status}
                        getStatusStyle={
                          getStatusStyle
                        }
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MobileInfo
                        label="Amount"
                        value={formatAmount(
                          payment.amount
                        )}
                      />

                      <MobileInfo
                        label="Method"
                        value={
                          payment.method
                        }
                        capitalize
                      />
                    </div>

                    <MobileInfo
                      label="Date"
                      value={formatDateTime(
                        payment.paidAt ||
                          payment.createdAt
                      )}
                      className="mt-3"
                    />

                    {payment.transactionId && (
                      <MobileInfo
                        label="Transaction ID"
                        value={
                          payment.transactionId
                        }
                        mono
                        className="mt-3"
                      />
                    )}

                    {payment.paymentType ===
                      "promotion" &&
                      payment.promotion && (
                        <div className="mt-3 rounded-xl border border-orange-500/10 bg-orange-500/[0.025] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                            Promotion
                          </p>

                          <p className="mt-1 text-sm font-semibold text-zinc-300">
                            {
                              payment
                                .promotion
                                .title
                            }
                          </p>

                          {payment.promotion
                            .extensionDays && (
                            <p className="mt-1 text-xs font-bold text-orange-400">
                              +
                              {
                                payment
                                  .promotion
                                  .extensionDays
                              }{" "}
                              days
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Pagination */}
        {pagination &&
          pagination.totalPages > 1 && (
            <section className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs font-medium text-zinc-700">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-orange-500 px-3 text-sm font-black text-black">
                  {pagination.page}
                </div>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (current) => current + 1
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </section>
          )}

        {/* Privacy */}
        <div className="mt-8 flex items-center justify-center gap-2 pb-5 text-center text-[11px] text-zinc-800">
          <ShieldCheck size={13} />
          Your payment history is private and visible
          only to you.
        </div>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[150px]" />
      <div className="absolute bottom-[-200px] right-[-160px] h-[450px] w-[450px] rounded-full bg-orange-500/5 blur-[130px]" />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  accent,
  warning,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 ${
        accent
          ? "border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-zinc-950"
          : "border-white/10 bg-zinc-950"
      }`}
    >
      {accent && (
        <div className="absolute right-[-50px] top-[-60px] h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
      )}

      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            warning
              ? "bg-amber-500/10 text-amber-400"
              : accent
              ? "bg-orange-500 text-black"
              : "bg-white/[0.04] text-zinc-500"
          }`}
        >
          {icon}
        </div>

        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
          {label}
        </p>

        <p
          className={`mt-2 text-2xl font-black ${
            warning
              ? "text-amber-400"
              : accent
              ? "text-orange-400"
              : "text-zinc-100"
          }`}
        >
          {value}
        </p>

        <p className="mt-1 text-xs text-zinc-700">
          {description}
        </p>
      </div>
    </div>
  );
}

function BreakdownCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
          {label}
        </p>

        <p className="mt-1 font-black text-zinc-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-zinc-300 outline-none transition focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
    >
      {options.map(([optionValue, label]) => (
        <option
          key={optionValue}
          value={optionValue}
          className="bg-zinc-950"
        >
          {label}
        </option>
      ))}
    </select>
  );
}

function TableHeading({ children }) {
  return (
    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
      {children}
    </th>
  );
}

function PaymentIcon({ type }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
      {getTypeIcon(type)}
    </div>
  );
}

function getTypeIcon(type) {
  switch (type) {
    case "registration":
      return <FileText size={17} />;

    case "membership":
      return <Dumbbell size={17} />;

    case "renewal":
      return <RefreshCw size={17} />;

    case "promotion":
      return <CircleDollarSign size={17} />;

    case "product":
      return <Wallet size={17} />;

    default:
      return <Receipt size={17} />;
  }
}

function PaymentMethodBadge({ method }) {
  const isUpi = method === "upi";

  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold capitalize text-zinc-500">
      {isUpi ? (
        <CreditCard
          size={14}
          className="text-orange-400"
        />
      ) : (
        <Banknote
          size={14}
          className="text-orange-400"
        />
      )}

      {method}
    </span>
  );
}

function StatusBadge({
  status,
  getStatusStyle,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusStyle(
        status
      )}`}
    >
      {status === "paid" && (
        <CheckCircle2 size={11} />
      )}

      {status === "pending" && (
        <Clock3 size={11} />
      )}

      {status === "failed" && (
        <XCircle size={11} />
      )}

      {status}
    </span>
  );
}

function MobileInfo({
  label,
  value,
  capitalize,
  mono,
  className = "",
}) {
  return (
    <div
      className={`rounded-xl border border-white/5 bg-[#070707] p-3 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-1 text-sm text-zinc-300 ${
          capitalize ? "capitalize" : ""
        } ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  hasFilters,
  clearFilters,
}) {
  return (
    <div className="p-10 text-center sm:p-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <Receipt size={27} />
      </div>

      <h3 className="mt-5 text-xl font-black">
        No Payments Found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        {hasFilters
          ? "No payments match your current filters."
          : "Your payment history will appear here after you make a gym payment."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
        >
          <XCircle size={15} />
          Clear Filters
        </button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-36 rounded bg-zinc-900" />

        <div className="mt-7 h-12 w-80 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-36 rounded-3xl bg-zinc-950"
              />
            )
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-20 rounded-2xl bg-zinc-950"
              />
            )
          )}
        </div>

        <div className="mt-7 h-36 rounded-3xl bg-zinc-950" />

        <div className="mt-6 h-[500px] rounded-3xl bg-zinc-950" />
      </div>
    </main>
  );
}