
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Dumbbell,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

const STATUS_API = "/api/member/membership/status";

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyles(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
    case "paid":
    case "success":
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "expired":
    case "failed":
    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "upcoming":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    default:
      return "border-white/10 bg-white/5 text-zinc-400";
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(
        status
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-400">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-black text-white">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="px-5 py-10 text-center sm:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-400">
        <Icon size={25} />
      </div>

      <h3 className="mt-4 font-bold text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function PaymentRow({ payment }) {
  const status = String(payment.status || "unknown").toLowerCase();

  const StatusIcon =
    status === "paid" || status === "success"
      ? CheckCircle2
      : status === "failed"
        ? XCircle
        : Clock3;

  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-zinc-300">
          <CreditCard size={19} />
        </div>

        <div className="min-w-0">
          <p className="font-semibold capitalize text-white">
            {String(payment.paymentType || "Payment").replaceAll("_", " ")}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {formatDateTime(payment.createdAt)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-zinc-400">
              Method: {payment.method || "—"}
            </span>

            {payment.transactionId && (
              <span className="max-w-48 truncate rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-500">
                Ref: {payment.transactionId}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-lg font-black text-white">
          {money(payment.amount)}
        </p>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyles(
            payment.status
          )}`}
        >
          <StatusIcon size={13} />
          {payment.status || "Unknown"}
        </span>
      </div>
    </div>
  );
}

function ExtensionRow({ extension, index }) {
  const days =
    extension.daysAdded ??
    extension.extensionDays ??
    extension.days ??
    null;

  return (
    <div className="flex items-start gap-3 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
        <CalendarDays size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">
          Membership extension
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {formatDate(
            extension.createdAt ||
              extension.extendedAt ||
              extension.date
          )}
        </p>

        {extension.reason && (
          <p className="mt-1 text-sm leading-5 text-zinc-400">
            {extension.reason}
          </p>
        )}

        {extension.notes && (
          <p className="mt-1 text-sm leading-5 text-zinc-400">
            {extension.notes}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {days !== null && days !== undefined && (
          <p className="font-bold text-orange-400">
            +{days} days
          </p>
        )}

        {extension.endDate && (
          <p className="mt-1 text-xs text-zinc-500">
            Ends {formatDate(extension.endDate)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MembershipStatusPage() {
  const router = useRouter();

  const [membership, setMembership] = useState(null);
  const [pendingRenewal, setPendingRenewal] = useState(null);
  const [pendingExtension, setPendingExtension] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(STATUS_API, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load membership status."
        );
      }

      setMembership(data.membership || null);
      setPendingRenewal(data.pendingRenewal || null);
      setPendingExtension(data.pendingExtension || null);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error("Membership status error:", err);
      setError(
        err.message || "Something went wrong while loading your status."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          </div>

          <p className="text-sm text-zinc-400">
            Loading membership status…
          </p>
        </div>
      </main>
    );
  }

  const isActive = membership?.status === "active";
  const isExpired = membership?.status === "expired";
  const isUpcoming = membership?.status === "upcoming";

  const remainingDays = Number(membership?.remainingDays);
  const hasRemainingDays = Number.isFinite(remainingDays);

  const progress =
    hasRemainingDays && Number(membership?.plan?.durationInDays) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (remainingDays / Number(membership.plan.durationInDays)) *
              100
          )
        )
      : null;

  const extensions = Array.isArray(membership?.extensions)
    ? membership.extensions
    : [];

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/member")}
          className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#20140d] via-[#121110] to-[#0a0a0a] p-6 sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                <ShieldCheck size={14} />
                Membership center
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Membership
                <span className="block text-orange-500">status</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                Check your membership validity, track extensions, and
                review your payment history in one place.
              </p>
            </div>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-3xl border border-orange-500/20 bg-orange-500/10 sm:self-center">
              <Crown className="h-10 w-10 text-orange-400" />
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 text-sm leading-6 text-red-300">
              <XCircle size={19} className="mt-0.5 shrink-0" />
              {error}
            </div>

            <button
              type="button"
              onClick={() => loadStatus(true)}
              className="shrink-0 rounded-xl border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Overview</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your current membership details
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStatus(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh status
          </button>
        </div>

        {membership ? (
          <>
            <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
              <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.08] to-transparent p-5 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3.5">
                      <Dumbbell className="h-7 w-7 text-orange-400" />
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={membership.status} />

                        {membership.membershipType === "couple" && (
                          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                            Couple membership
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black">
                        {membership.plan?.name || "Gym Membership"}
                      </h2>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                        {membership.plan?.description ||
                          "Your membership details and validity."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:min-w-40 sm:text-center">
                    <p className="text-xs text-zinc-500">
                      Membership ID
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-zinc-200">
                      {String(membership.id || "—")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={CalendarDays}
                  label="Start date"
                  value={formatDate(membership.startDate)}
                  description="Membership start"
                />

                <StatCard
                  icon={Clock3}
                  label="Expiry date"
                  value={formatDate(membership.endDate)}
                  description="Current membership end date"
                />

                <StatCard
                  icon={Wallet}
                  label="Amount paid at purchase"
                  value={money(membership.priceAtPurchase)}
                  description="Recorded membership price"
                />

                <StatCard
                  icon={BadgeCheck}
                  label="Days remaining"
                  value={
                    hasRemainingDays
                      ? Math.max(0, remainingDays)
                      : "—"
                  }
                  description={
                    isActive
                      ? "Keep training consistently"
                      : isExpired
                        ? "Your membership has expired"
                        : isUpcoming
                          ? "Your membership is upcoming"
                          : "Remaining membership duration"
                  }
                />
              </div>

              {progress !== null && (
                <div className="border-t border-white/10 p-5 sm:p-7">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      Remaining duration
                    </p>
                    <p className="text-xs text-zinc-500">
                      {Math.round(progress)}% of plan duration remaining
                    </p>
                  </div>

                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Remaining membership duration"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {(isExpired || isUpcoming) && (
              <section
                className={`mb-8 rounded-2xl border p-5 sm:p-6 ${
                  isExpired
                    ? "border-red-500/20 bg-red-500/[0.06]"
                    : "border-blue-500/20 bg-blue-500/[0.06]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isExpired ? (
                    <XCircle
                      size={22}
                      className="mt-0.5 shrink-0 text-red-400"
                    />
                  ) : (
                    <Clock3
                      size={22}
                      className="mt-0.5 shrink-0 text-blue-400"
                    />
                  )}

                  <div>
                    <h3 className="font-bold">
                      {isExpired
                        ? "Your membership has expired"
                        : "Your membership has not started yet"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {isExpired
                        ? "Visit the membership page to review the available renewal options."
                        : "Your membership is scheduled for a future date. Contact the gym admin if you need help."}
                    </p>

                    {isExpired && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push("/member/membership")
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"
                      >
                        View renewal plans
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="mb-8 rounded-3xl border border-white/10 bg-[#111111]">
            <EmptyState
              icon={Dumbbell}
              title="No membership found"
              description="There is no membership linked to your account yet. If you have already paid, refresh this page or contact the gym admin."
            />

            <div className="border-t border-white/10 p-5 text-center">
              <button
                type="button"
                onClick={() => loadStatus(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Check again
              </button>
            </div>
          </section>
        )}

        {(pendingRenewal || pendingExtension) && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Pending requests</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Requests that still need payment or confirmation
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {pendingRenewal && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                        <CreditCard size={20} />
                      </div>

                      <div>
                        <h3 className="font-bold">
                          Membership renewal
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {pendingRenewal.plan?.name ||
                            pendingRenewal.membershipPlan?.name ||
                            "Renewal request"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={pendingRenewal.status} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm text-zinc-400">
                      Amount
                    </span>
                    <span className="text-xl font-black">
                      {money(pendingRenewal.amount)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Method: {pendingRenewal.method || "—"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/member/membership")
                    }
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
                  >
                    View renewal
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {pendingExtension && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                        <CalendarDays size={20} />
                      </div>

                      <div>
                        <h3 className="font-bold">
                          Membership extension
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {pendingExtension.promotion?.title ||
                            "Extension request"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={pendingExtension.status} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm text-zinc-400">
                      Amount
                    </span>
                    <span className="text-xl font-black">
                      {money(pendingExtension.amount)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Your extension is applied after the payment is
                    confirmed.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-orange-400">
                <History size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.16em]">
                  Your records
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-black">
                Extension history
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Membership extensions recorded for your plan
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111111] px-5 sm:px-6">
            {extensions.length > 0 ? (
              <div className="divide-y divide-white/[0.07]">
                {extensions.map((extension, index) => (
                  <ExtensionRow
                    key={extension._id || extension.id || index}
                    extension={extension}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No extensions recorded"
                description="Any membership extensions recorded for your account will appear here."
              />
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-5">
            <div className="flex items-center gap-2 text-orange-400">
              <CreditCard size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">
                Payment activity
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Recent payments
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Review payment amounts, methods, and confirmation status
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
            {payments.length > 0 ? (
              <>
                {payments.map((payment, index) => (
                  <PaymentRow
                    key={payment.id || payment._id || index}
                    payment={payment}
                  />
                ))}

                <div className="border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-500 sm:px-6">
                  Showing {payments.length} payment
                  {payments.length === 1 ? "" : "s"} returned by your
                  membership status endpoint.
                </div>
              </>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No payment records found"
                description="Your payment history will appear here when records are available."
              />
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] to-[#111111] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                <Dumbbell size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Ready for your next training phase?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  Review your renewal plans and keep your fitness routine
                  on track.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/member/membership")
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
            >
              View membership plans
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>Your membership information is loaded from your account.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            Membership status
          </div>
        </footer>
      </div>
    </main>
  );
}
