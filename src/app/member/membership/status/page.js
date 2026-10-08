"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
  CalendarDays,
  UserRound,
  BadgeIndianRupee,
  ChevronRight,
} from "lucide-react";

export default function MembershipStatusPage() {
  const router = useRouter();

  const [membership, setMembership] = useState(null);
  const [pendingRenewal, setPendingRenewal] = useState(null);
  const [pendingExtension, setPendingExtension] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembershipStatus();
  }, []);

  async function loadMembershipStatus() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/member/membership/status",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load membership status."
        );
      }

      setMembership(data.membership || null);
      setPendingRenewal(data.pendingRenewal || null);
      setPendingExtension(data.pendingExtension || null);
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Membership status error:", err);

      setError(
        err.message || "Failed to load membership status."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusText() {
    if (!membership) {
      return "No Membership";
    }

    return membership.status || "unknown";
  }

  function getStatusClasses() {
    if (!membership) {
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
    }

    if (membership.status === "active") {
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    }

    if (
      membership.status === "expired" ||
      membership.status === "cancelled"
    ) {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }

  function getPaymentStatusClasses(status) {
    if (status === "paid") {
      return "text-emerald-400";
    }

    if (status === "pending") {
      return "text-yellow-400";
    }

    if (status === "failed") {
      return "text-red-400";
    }

    if (status === "refunded") {
      return "text-blue-400";
    }

    return "text-zinc-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-4 w-36 rounded bg-zinc-900" />
          <div className="mt-6 h-12 w-80 rounded-xl bg-zinc-900" />
          <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-zinc-950" />

          <div className="mt-8 h-72 rounded-3xl bg-zinc-950" />

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-3xl bg-zinc-950"
              />
            ))}
          </div>

          <div className="mt-6 h-56 rounded-3xl bg-zinc-950" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[150px]" />
        <div className="absolute bottom-[-240px] right-[-150px] h-[440px] w-[440px] rounded-full bg-orange-500/5 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/member")}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
              >
                <ArrowLeft size={15} />
                Back to Dashboard
              </button>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                <ShieldCheck size={13} />
                Membership
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Membership{" "}
                <span className="text-orange-500">Status</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                View your current membership, remaining days,
                payments and renewal information.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMembershipStatus}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <div className="flex gap-3">
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="font-bold text-red-400">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm leading-6 text-red-300/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadMembershipStatus}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Membership */}
        {!membership && !error && (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center shadow-2xl shadow-black/20 sm:p-14">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Dumbbell size={34} />
            </div>

            <div className="mx-auto mt-6 max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
                Start Your Journey
              </div>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                No Active Membership
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                You currently do not have a membership. Choose a
                membership plan and start your training journey with
                us.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/membership/purchase")
                }
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                Get Membership
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {membership && (
          <>
            {/* Membership Hero Card */}
            <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.10] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
              <div className="absolute right-[-100px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/10 blur-[100px]" />

              <div className="relative p-5 sm:p-7 lg:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20">
                        <Dumbbell size={22} />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">
                          Current Membership
                        </p>

                        <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                          {membership.plan?.name ||
                            "Membership"}
                        </h2>
                      </div>
                    </div>

                    {membership.membershipType && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold capitalize text-zinc-400">
                        <UserRound size={12} />
                        {membership.membershipType} membership
                      </div>
                    )}
                  </div>

                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-black capitalize ${getStatusClasses()}`}
                  >
                    {membership.status === "active" ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    {getStatusText()}
                  </div>
                </div>

                {/* Main stats */}
                <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                  <MembershipStat
                    icon={<CalendarDays size={17} />}
                    label="Start Date"
                    value={formatDate(membership.startDate)}
                  />

                  <MembershipStat
                    icon={<CalendarDays size={17} />}
                    label="End Date"
                    value={formatDate(membership.endDate)}
                  />

                  <MembershipStat
                    icon={<Clock3 size={17} />}
                    label="Remaining Days"
                    value={membership.remainingDays || 0}
                    highlight={
                      Number(membership.remainingDays || 0) > 0
                    }
                  />

                  <MembershipStat
                    icon={<BadgeIndianRupee size={17} />}
                    label="Membership Price"
                    value={`₹${formatPrice(
                      membership.priceAtPurchase ||
                        membership.plan?.price ||
                        0
                    )}`}
                  />
                </div>
              </div>
            </section>

            {/* Features */}
            {membership.plan?.features?.length > 0 && (
              <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20 sm:p-6">
                <SectionHeading
                  icon={<Sparkles size={17} />}
                  eyebrow="Included"
                  title="Plan Features"
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {membership.plan.features.map((feature) => {
                    const labels = {
                      gym: "Gym Access",
                      cardio: "Cardio",
                      personal_trainer: "Personal Trainer",
                    };

                    return (
                      <div
                        key={feature}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-orange-500/20 hover:bg-orange-500/[0.03]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                          <Check size={17} />
                        </span>

                        <span className="text-sm font-bold text-zinc-300">
                          {labels[feature] || feature}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Extensions */}
            {membership.extensions?.length > 0 && (
              <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20 sm:p-6">
                <SectionHeading
                  icon={<Clock3 size={17} />}
                  eyebrow="Membership History"
                  title="Membership Extensions"
                  description="Additional days added to your membership."
                />

                <div className="mt-5 space-y-3">
                  {membership.extensions.map(
                    (extension, index) => (
                      <div
                        key={extension._id || index}
                        className="rounded-2xl border border-white/10 bg-black p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                              <Clock3 size={17} />
                            </div>

                            <div>
                              <p className="font-black text-zinc-200">
                                +{extension.days} Days
                              </p>

                              <p className="mt-1 text-xs text-zinc-600">
                                {formatDate(
                                  extension.createdAt ||
                                    extension.date
                                )}
                              </p>
                            </div>
                          </div>

                          {extension.reason && (
                            <p className="max-w-xl text-sm leading-6 text-zinc-500">
                              {extension.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Pending Renewal */}
            {pendingRenewal && (
              <section className="mt-6 overflow-hidden rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.04] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-yellow-400">
                      <Clock3 size={12} />
                      Payment Pending
                    </div>

                    <h2 className="mt-4 text-xl font-black">
                      {pendingRenewal.plan?.name ||
                        pendingRenewal.membershipPlan?.name ||
                        "Membership Renewal"}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Your membership renewal payment has not
                      been completed yet.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Amount
                    </p>

                    <p className="mt-1 text-2xl font-black text-white">
                      ₹{formatPrice(pendingRenewal.amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniInfo
                    label="Payment Method"
                    value={pendingRenewal.method || "-"}
                    uppercase
                  />

                  <MiniInfo
                    label="Status"
                    value={pendingRenewal.status || "pending"}
                    color="yellow"
                  />

                  <MiniInfo
                    label="Requested"
                    value={formatDate(pendingRenewal.createdAt)}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-yellow-500/10 bg-black p-4">
                  <p className="text-sm leading-6 text-zinc-500">
                    {pendingRenewal.method === "cash"
                      ? "Please pay the renewal amount at the gym. An admin will confirm your cash payment and activate the renewal."
                      : "Your UPI renewal payment is pending. You can return to the renewal page to continue the payment or switch the payment method to cash."}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/member/membership")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                  >
                    Manage Renewal
                    <ChevronRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={loadMembershipStatus}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
                  >
                    <RefreshCw size={14} />
                    Check Payment Status
                  </button>
                </div>
              </section>
            )}

            {/* Pending Extension */}
            {pendingExtension && (
              <section className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/[0.04] p-5 sm:p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">
                  <Clock3 size={12} />
                  Extension Pending
                </div>

                <h2 className="mt-4 text-xl font-black">
                  Membership Extension
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniInfo
                    label="Amount"
                    value={`₹${formatPrice(
                      pendingExtension.amount
                    )}`}
                  />

                  <MiniInfo
                    label="Method"
                    value={pendingExtension.method || "-"}
                    uppercase
                  />

                  <MiniInfo
                    label="Status"
                    value={pendingExtension.status || "pending"}
                    color="yellow"
                  />
                </div>

                <p className="mt-5 text-sm leading-6 text-zinc-500">
                  Your extension request is waiting for payment
                  confirmation.
                </p>
              </section>
            )}

            {/* Payment History */}
            <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20 sm:p-6">
              <SectionHeading
                icon={<History size={17} />}
                eyebrow="Transactions"
                title="Payment History"
                description="Your recent membership payments."
              />

              {payments.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black p-8 text-center">
                  <Wallet
                    size={25}
                    className="mx-auto text-zinc-700"
                  />

                  <p className="mt-3 text-sm font-semibold text-zinc-600">
                    No payment history available.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {payments.map((payment, index) => (
                    <div
                      key={
                        payment._id ||
                        payment.id ||
                        index
                      }
                      className="rounded-2xl border border-white/10 bg-black p-4 transition hover:border-orange-500/15"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-500">
                            <CreditCard size={17} />
                          </div>

                          <div>
                            <p className="font-black capitalize text-zinc-200">
                              {payment.paymentType ||
                                "Payment"}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {formatDateTime(
                                payment.paidAt ||
                                  payment.createdAt
                              )}
                            </p>

                            {payment.method && (
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                                {payment.method}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-black">
                            ₹{formatPrice(payment.amount)}
                          </p>

                          <p
                            className={`mt-1 text-xs font-bold capitalize ${getPaymentStatusClasses(
                              payment.status
                            )}`}
                          >
                            {payment.status || "unknown"}
                          </p>
                        </div>
                      </div>

                      {payment.transactionId && (
                        <div className="mt-4 border-t border-white/5 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                            Transaction ID
                          </p>

                          <p className="mt-1 break-all font-mono text-xs text-zinc-600">
                            {payment.transactionId}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Bottom Actions */}
        <div className="mt-7 flex flex-col gap-3 pb-8 sm:flex-row">
          {membership && (
            <button
              type="button"
              onClick={() =>
                router.push("/member/membership")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400"
            >
              Renew Membership
              <ChevronRight size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/member")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

function MembershipStat({
  icon,
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="bg-zinc-950 p-5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-orange-500/10 text-orange-400"
            : "bg-white/[0.04] text-zinc-600"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-black ${
          highlight ? "text-orange-400" : "text-zinc-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
          {eyebrow}
        </span>
      </div>

      <h2 className="mt-2 text-xl font-black">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-zinc-600">
          {description}
        </p>
      )}
    </div>
  );
}

function MiniInfo({
  label,
  value,
  color = "default",
  uppercase = false,
}) {
  const valueClass =
    color === "yellow"
      ? "text-yellow-400"
      : color === "blue"
        ? "text-blue-400"
        : "text-zinc-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-1 font-black ${valueClass} ${
          uppercase ? "uppercase" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}