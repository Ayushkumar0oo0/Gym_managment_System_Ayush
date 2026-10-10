
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Filter,
  IndianRupee,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (status) => {
  const normalized = String(status || "unknown").toLowerCase();

  if (["paid", "success", "successful", "completed"].includes(normalized)) {
    return {
      label: "Paid",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      Icon: CheckCircle2,
    };
  }

  if (["pending", "processing"].includes(normalized)) {
    return {
      label: "Pending",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      Icon: Clock3,
    };
  }

  if (["failed", "cancelled", "canceled"].includes(normalized)) {
    return {
      label: "Failed",
      className: "border-red-500/20 bg-red-500/10 text-red-400",
      Icon: XCircle,
    };
  }

  if (normalized === "refunded") {
    return {
      label: "Refunded",
      className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
      Icon: ArrowDownLeft,
    };
  }

  return {
    label: normalized === "unknown"
      ? "Unknown"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1),
    className: "border-white/10 bg-white/5 text-gray-400",
    Icon: FileText,
  };
};

const getPaymentDate = (payment) =>
  payment?.paidAt ||
  payment?.createdAt ||
  payment?.updatedAt ||
  payment?.date ||
  null;

const getTransactionId = (payment) =>
  payment?.transactionId ||
  payment?.gatewayPaymentId ||
  payment?.paymentId ||
  payment?.gatewayOrderId ||
  payment?.id ||
  payment?._id ||
  "Not available";

const getPaymentType = (payment) => {
  const type = String(payment?.paymentType || payment?.type || "payment")
    .replace(/[_-]/g, " ")
    .trim();

  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMethod = (payment) => {
  const method = String(payment?.method || "Unknown")
    .replace(/[_-]/g, " ")
    .trim();

  return method.toUpperCase() === "UPI"
    ? "UPI"
    : method.charAt(0).toUpperCase() + method.slice(1);
};

export default function MemberPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/member/membership/status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load payment history.");
      }

      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setMembership(data.membership || null);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const summary = useMemo(() => {
    const successful = payments.filter((payment) =>
      ["paid", "success", "successful", "completed"].includes(
        String(payment?.status || "").toLowerCase()
      )
    );

    const pending = payments.filter((payment) =>
      ["pending", "processing"].includes(
        String(payment?.status || "").toLowerCase()
      )
    );

    const totalPaid = successful.reduce(
      (total, payment) => total + (Number(payment?.amount) || 0),
      0
    );

    return {
      totalPaid,
      successfulCount: successful.length,
      pendingCount: pending.length,
      totalCount: payments.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments
      .filter((payment) => {
        const status = String(payment?.status || "unknown").toLowerCase();
        const type = String(
          payment?.paymentType || payment?.type || "payment"
        ).toLowerCase();

        const transaction = getTransactionId(payment).toLowerCase();
        const method = getMethod(payment).toLowerCase();

        const matchesSearch =
          !query ||
          transaction.includes(query) ||
          method.includes(query) ||
          type.includes(query) ||
          status.includes(query) ||
          String(payment?.notes || "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "paid" &&
            ["paid", "success", "successful", "completed"].includes(status)) ||
          (statusFilter === "pending" &&
            ["pending", "processing"].includes(status)) ||
          (statusFilter === "failed" &&
            ["failed", "cancelled", "canceled"].includes(status)) ||
          (statusFilter === "refunded" && status === "refunded");

        const matchesType =
          typeFilter === "all" ||
          type.includes(typeFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(getPaymentDate(a) || 0).getTime();
        const dateB = new Date(getPaymentDate(b) || 0).getTime();
        return dateB - dateA;
      });
  }, [payments, search, statusFilter, typeFilter]);

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Transaction ID",
      "Payment Type",
      "Method",
      "Amount",
      "Status",
    ];

    const rows = filteredPayments.map((payment) => [
      formatDate(getPaymentDate(payment)),
      getTransactionId(payment),
      getPaymentType(payment),
      getMethod(payment),
      Number(payment?.amount) || 0,
      getStatus(payment?.status).label,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "gym-payment-history.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/member"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-orange-400"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-orange-500" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
                  Member account
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Payment <span className="text-orange-500">History</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Review your gym payments, track transactions, and keep a record
                of your membership expenses.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fetchPayments(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-orange-500/40 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={downloadCSV}
                disabled={filteredPayments.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Membership notice */}
        {membership && (
          <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.10] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Your membership
                </p>
                <p className="mt-1 font-bold text-white">
                  {membership.plan?.name ||
                    membership.plan?.title ||
                    membership.membershipType ||
                    "Gym Membership"}
                </p>
              </div>
            </div>

            <Link
              href="/member/membership/status"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
            >
              View membership status
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total paid"
            value={formatCurrency(summary.totalPaid)}
            subtitle="Successfully completed payments"
            icon={IndianRupee}
            accent
          />

          <SummaryCard
            title="Transactions"
            value={summary.totalCount}
            subtitle="All recorded payments"
            icon={CreditCard}
          />

          <SummaryCard
            title="Successful"
            value={summary.successfulCount}
            subtitle="Payments completed"
            icon={CheckCircle2}
            iconColor="text-emerald-400"
          />

          <SummaryCard
            title="Pending"
            value={summary.pendingCount}
            subtitle="Awaiting confirmation"
            icon={Clock3}
            iconColor="text-amber-400"
          />
        </div>

        {/* Payment records */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">All transactions</h2>
              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? "Loading your records..."
                  : `${filteredPayments.length} ${
                      filteredPayments.length === 1
                        ? "transaction"
                        : "transactions"
                    } found`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/60"
                />
              </div>

              <div className="relative">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by payment status"
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#080808] py-3 pl-9 pr-8 text-sm text-gray-300 outline-none focus:border-orange-500/60 sm:w-40"
                >
                  <option value="all">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by payment type"
                className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-3 text-sm text-gray-300 outline-none focus:border-orange-500/60 sm:w-44"
              >
                <option value="all">All types</option>
                <option value="renewal">Renewal</option>
                <option value="extension">Extension</option>
                <option value="membership">Membership</option>
                <option value="registration">Registration</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="m-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => fetchPayments()}
                className="text-left text-sm font-bold text-orange-400 hover:text-orange-300"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse items-center gap-4 border-b border-white/[0.05] pb-4 last:border-0"
                >
                  <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 rounded bg-white/[0.06]" />
                    <div className="h-3 w-24 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-5 w-20 rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : !error && filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] text-orange-400">
                {payments.length === 0 ? (
                  <Wallet size={28} />
                ) : (
                  <Search size={26} />
                )}
              </div>

              <h3 className="text-lg font-bold">
                {payments.length === 0
                  ? "No payments yet"
                  : "No matching transactions"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {payments.length === 0
                  ? "Your membership payments will appear here once a payment record is available."
                  : "Try changing your search or filters to find the transaction you're looking for."}
              </p>

              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-400"
                >
                  Clear filters
                </button>
              )}

              {payments.length === 0 && (
                <Link
                  href="/member/membership"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
                >
                  View membership plans
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-white/[0.06] md:hidden">
                {filteredPayments.map((payment, index) => (
                  <PaymentMobileCard
                    key={
                      payment?.id ||
                      payment?._id ||
                      `${getTransactionId(payment)}-${index}`
                    }
                    payment={payment}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02] text-[11px] uppercase tracking-[0.15em] text-gray-500">
                      <th className="px-6 py-4 font-semibold">Transaction</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Method</th>
                      <th className="px-6 py-4 font-semibold">Amount</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredPayments.map((payment, index) => (
                      <PaymentTableRow
                        key={
                          payment?.id ||
                          payment?._id ||
                          `${getTransactionId(payment)}-${index}`
                        }
                        payment={payment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && !error && filteredPayments.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing {filteredPayments.length} of {payments.length} records
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Payment records from your member account
              </span>
            </div>
          )}
        </section>

        {/* Help */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-500">
              <FileText size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                Need help with a payment?
              </p>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Keep your transaction ID handy when asking the gym admin about
                a payment.
              </p>
            </div>
          </div>

          <Link
            href="/member/membership/status"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
          >
            Membership details
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = false,
  iconColor = "text-orange-400",
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition hover:border-white/[0.15] ${
        accent
          ? "border-orange-500/25 bg-gradient-to-br from-orange-500/[0.12] to-[#101010]"
          : "border-white/[0.08] bg-[#101010]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent ? "bg-orange-500/15" : "bg-white/[0.04]"
          } ${iconColor}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function PaymentStatus({ status }) {
  const config = getStatus(status);
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function PaymentTableRow({ payment }) {
  return (
    <tr className="transition hover:bg-white/[0.02]">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/[0.08] text-orange-400">
            <CreditCard size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-200">
              {getPaymentType(payment)}
            </p>
            <p
              title={getTransactionId(payment)}
              className="mt-1 max-w-[220px] truncate text-xs text-gray-500"
            >
              ID: {getTransactionId(payment)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5 text-sm text-gray-400">
        {formatDate(getPaymentDate(payment))}
      </td>

      <td className="px-6 py-5 text-sm text-gray-300">
        {getMethod(payment)}
      </td>

      <td className="px-6 py-5">
        <span className="font-bold text-white">
          {formatCurrency(payment?.amount)}
        </span>
      </td>

      <td className="px-6 py-5">
        <PaymentStatus status={payment?.status} />
      </td>
    </tr>
  );
}

function PaymentMobileCard({ payment }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/[0.08] text-orange-400">
            <CreditCard size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-bold text-gray-100">
              {getPaymentType(payment)}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(getPaymentDate(payment))}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-black text-white">
            {formatCurrency(payment?.amount)}
          </p>
          <div className="mt-2">
            <PaymentStatus status={payment?.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Payment method
          </p>
          <p className="mt-1 text-sm font-medium text-gray-300">
            {getMethod(payment)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Transaction ID
          </p>
          <p
            title={getTransactionId(payment)}
            className="mt-1 truncate text-sm font-medium text-gray-300"
          >
            {getTransactionId(payment)}
          </p>
        </div>
      </div>

      {payment?.notes && (
        <p className="mt-3 text-xs leading-5 text-gray-500">
          Note: {payment.notes}
        </p>
      )}
    </article>
  );
}
