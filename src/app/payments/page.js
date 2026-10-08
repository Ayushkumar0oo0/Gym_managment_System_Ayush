"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/payments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load payments."
        );
      }

      setPayments(data.payments || []);
    } catch (error) {
      console.error(
        "PAYMENTS PAGE ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to load payments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/payments",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load payments."
          );
        }

        if (!cancelled) {
          setPayments(data.payments || []);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "PAYMENTS PAGE ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              "Failed to load payments."
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatDateTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatCurrency(amount) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function getStatus(status) {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          icon: CheckCircle2,
          className:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        };

      case "pending":
        return {
          label: "Pending",
          icon: Clock3,
          className:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
        };

      case "failed":
        return {
          label: "Failed",
          icon: XCircle,
          className:
            "border-red-500/20 bg-red-500/10 text-red-400",
        };

      case "refunded":
        return {
          label: "Refunded",
          icon: RefreshCw,
          className:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",
        };

      default:
        return {
          label: status || "Unknown",
          icon: FileText,
          className:
            "border-white/10 bg-white/5 text-zinc-400",
        };
    }
  }

  function getMethod(method) {
    if (method === "upi") return "UPI";
    if (method === "cash") return "Cash";

    return method || "-";
  }

  function getPaymentType(type) {
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
        return type || "-";
    }
  }

  const paidPayments = payments.filter(
    (payment) =>
      payment.status === "paid"
  );

  const pendingPayments = payments.filter(
    (payment) =>
      payment.status === "pending"
  );

  const totalPaid = paidPayments.reduce(
    (total, payment) =>
      total +
      Number(payment.amount || 0),
    0
  );

  const pendingAmount =
    pendingPayments.reduce(
      (total, payment) =>
        total +
        Number(payment.amount || 0),
      0
    );

  const upiPayments = paidPayments.filter(
    (payment) =>
      payment.method === "upi"
  );

  const cashPayments = paidPayments.filter(
    (payment) =>
      payment.method === "cash"
  );

  const upiAmount = upiPayments.reduce(
    (total, payment) =>
      total +
      Number(payment.amount || 0),
    0
  );

  const cashAmount = cashPayments.reduce(
    (total, payment) =>
      total +
      Number(payment.amount || 0),
    0
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
        <AmbientGlow />

        <div className="relative z-10 mx-auto flex min-h-[600px] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-500/15 bg-red-500/[0.04] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle size={28} />
            </div>

            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
              Payment History
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Unable to Load Payments
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPayments}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-7 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Wallet
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Transactions
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Payment{" "}
                <span className="text-orange-500">
                  History
                </span>
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                View your gym payments and
                transaction details.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPayments}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Receipt size={18} />}
            label="Total Transactions"
            value={payments.length}
          />

          <SummaryCard
            icon={<CheckCircle2 size={18} />}
            label="Total Paid"
            value={formatCurrency(
              totalPaid
            )}
            accent="green"
          />

          <SummaryCard
            icon={<Clock3 size={18} />}
            label="Pending"
            value={pendingPayments.length}
            accent="yellow"
          />

          <SummaryCard
            icon={<Wallet size={18} />}
            label="Pending Amount"
            value={formatCurrency(
              pendingAmount
            )}
            accent="orange"
          />
        </div>

        {/* Payment method breakdown */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <BreakdownCard
            icon={<CreditCard size={18} />}
            title="UPI Payments"
            count={upiPayments.length}
            amount={upiAmount}
          />

          <BreakdownCard
            icon={<Banknote size={18} />}
            title="Cash Payments"
            count={cashPayments.length}
            amount={cashAmount}
          />
        </section>

        {/* Transactions */}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              Transaction History
            </p>

            <h2 className="mt-1 text-2xl font-black">
              All Transactions
            </h2>

            <p className="mt-1 text-sm text-zinc-700">
              Your complete payment history.
            </p>
          </div>

          {payments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-white/10 bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Method
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Date
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Transaction
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {payments.map(
                      (payment) => {
                        const status =
                          getStatus(
                            payment.status
                          );

                        const StatusIcon =
                          status.icon;

                        return (
                          <tr
                            key={payment._id}
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <PaymentTypeIcon
                                  type={
                                    payment.paymentType
                                  }
                                />

                                <div>
                                  <p className="font-bold text-zinc-300">
                                    {getPaymentType(
                                      payment.paymentType
                                    )}
                                  </p>

                                  {payment
                                    .promotion
                                    ?.title && (
                                    <p className="mt-1 max-w-[220px] truncate text-xs text-zinc-700">
                                      {
                                        payment
                                          .promotion
                                          .title
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-black text-white">
                                {formatCurrency(
                                  payment.amount
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <MethodBadge
                                method={
                                  payment.method
                                }
                              />
                            </td>

                            <td className="px-6 py-5 text-sm text-zinc-600">
                              {formatDate(
                                payment.createdAt
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${status.className}`}
                              >
                                <StatusIcon
                                  size={12}
                                />
                                {
                                  status.label
                                }
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <p
                                className="max-w-[180px] truncate font-mono text-[10px] text-zinc-700"
                                title={
                                  payment.transactionId ||
                                  ""
                                }
                              >
                                {payment.transactionId ||
                                  "-"}
                              </p>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-white/5 md:hidden">
                {payments.map(
                  (payment) => {
                    const status =
                      getStatus(
                        payment.status
                      );

                    const StatusIcon =
                      status.icon;

                    return (
                      <div
                        key={payment._id}
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <PaymentTypeIcon
                              type={
                                payment.paymentType
                              }
                            />

                            <div>
                              <p className="font-bold text-zinc-300">
                                {getPaymentType(
                                  payment.paymentType
                                )}
                              </p>

                              {payment
                                .promotion
                                ?.title && (
                                <p className="mt-1 text-xs text-zinc-700">
                                  {
                                    payment
                                      .promotion
                                      .title
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-lg font-black text-white">
                            {formatCurrency(
                              payment.amount
                            )}
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4">
                          <MobileInfo
                            label="Method"
                            value={
                              getMethod(
                                payment.method
                              )
                            }
                          />

                          <MobileInfo
                            label="Date"
                            value={formatDate(
                              payment.createdAt
                            )}
                          />

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              Status
                            </p>

                            <span
                              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${status.className}`}
                            >
                              <StatusIcon
                                size={11}
                              />
                              {status.label}
                            </span>
                          </div>

                          <MobileInfo
                            label="Paid At"
                            value={
                              payment.paidAt
                                ? formatDateTime(
                                    payment.paidAt
                                  )
                                : "-"
                            }
                          />
                        </div>

                        {payment.transactionId && (
                          <div className="mt-5 rounded-2xl border border-white/5 bg-black/30 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              Transaction ID
                            </p>

                            <p className="mt-2 break-all font-mono text-[10px] text-zinc-500">
                              {
                                payment.transactionId
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        <div className="mt-10 border-t border-white/5 py-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-800">
            Gym Management System
          </p>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent = "default",
}) {
  const iconClass =
    accent === "green"
      ? "bg-emerald-500/10 text-emerald-400"
      : accent === "yellow"
      ? "bg-yellow-500/10 text-yellow-400"
      : accent === "orange"
      ? "bg-orange-500/10 text-orange-400"
      : "bg-white/5 text-zinc-500";

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          accent === "green"
            ? "text-emerald-400"
            : accent === "yellow"
            ? "text-yellow-400"
            : accent === "orange"
            ? "text-orange-400"
            : "text-zinc-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BreakdownCard({
  icon,
  title,
  count,
  amount,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            {icon}
          </div>

          <div>
            <p className="text-sm font-black text-zinc-300">
              {title}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              {count} transaction
              {count === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <p className="text-lg font-black text-orange-400">
          {formatMoney(amount)}
        </p>
      </div>
    </div>
  );
}

function PaymentTypeIcon({ type }) {
  const icon =
    type === "product" ? (
      <ShoppingBag size={16} />
    ) : type === "promotion" ? (
      <Sparkles size={16} />
    ) : type === "registration" ? (
      <BadgeIcon />
    ) : type === "renewal" ? (
      <RefreshCw size={16} />
    ) : (
      <Wallet size={16} />
    );

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
      {icon}
    </div>
  );
}

function BadgeIcon() {
  return (
    <span className="text-sm font-black">
      ₹
    </span>
  );
}

function MethodBadge({ method }) {
  const isUpi = method === "upi";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
      {isUpi ? (
        <CreditCard size={11} />
      ) : (
        <Banknote size={11} />
      )}

      {isUpi ? "UPI" : "Cash"}
    </span>
  );
}

function MobileInfo({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950 p-10 text-center sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <Receipt size={28} />
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
        No Transactions
      </p>

      <h3 className="mt-2 text-2xl font-black">
        No Payments Found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-700">
        You do not have any payment
        transactions yet.
      </p>

      <Link
        href="/promotions"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
      >
        View Offers
      </Link>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-28 rounded bg-zinc-900" />

        <div className="mt-8 h-12 w-72 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 rounded-3xl bg-zinc-950"
              />
            )
          )}
        </div>

        <div className="mt-8 h-96 rounded-3xl bg-zinc-950" />
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading payment history...
          </span>
        </div>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}

function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}