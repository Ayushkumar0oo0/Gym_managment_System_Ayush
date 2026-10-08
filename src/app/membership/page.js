"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Dumbbell,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";

export default function MembershipPage() {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembership = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/member/membership",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch membership."
        );
      }

      setMembership(data.membership);
    } catch (error) {
      console.error(
        "Fetch membership error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatFeature = (feature) => {
    if (!feature) return "";

    const featureNames = {
      gym: "Gym Access",
      cardio: "Cardio",
      personal_trainer:
        "Personal Trainer",
    };

    return (
      featureNames[feature] ||
      String(feature)
        .replaceAll("_", " ")
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        )
    );
  };

  const getDaysText = (days) => {
    const numericDays = Number(days || 0);

    if (numericDays <= 0) {
      return "Expired";
    }

    if (numericDays === 1) {
      return "1 day";
    }

    return `${numericDays} days`;
  };

  const formatDuration = (days) => {
    const numericDays = Number(days || 0);

    if (numericDays === 30) {
      return "1 Month";
    }

    if (numericDays === 90) {
      return "3 Months";
    }

    if (numericDays === 180) {
      return "6 Months";
    }

    if (numericDays === 270) {
      return "9 Months";
    }

    if (numericDays === 365) {
      return "12 Months";
    }

    if (
      numericDays > 0 &&
      numericDays % 30 === 0
    ) {
      return `${numericDays / 30} Months`;
    }

    return numericDays
      ? `${numericDays} Days`
      : "—";
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <AmbientGlow />

        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-7 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              !
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Unable to load membership
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchMembership}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!membership) {
    return <NoMembership />;
  }

  const plan = membership.plan;

  const isActive =
    membership.status === "active" &&
    Number(membership.daysRemaining || 0) >
      0;

  const daysRemaining = Math.max(
    0,
    Number(membership.daysRemaining || 0)
  );

  const startTime = new Date(
    membership.startDate
  ).getTime();

  const endTime = new Date(
    membership.endDate
  ).getTime();

  const now = Date.now();

  const totalDuration =
    endTime - startTime;

  const remainingDuration =
    endTime - now;

  const progressPercentage =
    totalDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (remainingDuration /
              totalDuration) *
              100
          )
        )
      : 0;

  const urgency =
    daysRemaining <= 7;

  const extensions =
    Array.isArray(membership.extensions)
      ? membership.extensions
      : [];

  const totalExtensionDays = Number(
    membership.totalExtensionDays || 0
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/member"
              className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
            >
              <ArrowLeft size={14} />
              Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                Member Area
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              My{" "}
              <span className="text-orange-500">
                Membership
              </span>
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              View your plan, validity, features
              and membership extensions.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMembership}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* Main membership hero */}
        <section className="relative mt-8 overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.11] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-160px] h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[130px]" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
                    <Crown size={12} />
                    Current Plan
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      isActive
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />

                    {isActive
                      ? "Active"
                      : "Expired"}
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-black sm:text-4xl">
                  {plan?.name ||
                    "Membership"}
                </h2>

                {plan?.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                    {plan.description}
                  </p>
                )}
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  urgency && isActive
                    ? "border-yellow-500/20 bg-yellow-500/[0.04]"
                    : "border-white/10 bg-black/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Timer
                    size={15}
                    className={
                      urgency && isActive
                        ? "text-yellow-400"
                        : "text-orange-400"
                    }
                  />

                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                    Days Remaining
                  </p>
                </div>

                <p
                  className={`mt-2 text-4xl font-black ${
                    !isActive
                      ? "text-red-400"
                      : urgency
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }`}
                >
                  {getDaysText(
                    daysRemaining
                  )}
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  Ends{" "}
                  {formatDate(
                    membership.endDate
                  )}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                    Membership Progress
                  </p>

                  <p className="mt-1 text-sm font-bold text-zinc-400">
                    {formatDate(
                      membership.startDate
                    )}{" "}
                    →{" "}
                    {formatDate(
                      membership.endDate
                    )}
                  </p>
                </div>

                <p className="text-sm font-black text-orange-400">
                  {Math.round(
                    progressPercentage
                  )}
                  %
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-700"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-zinc-800">
                <span>
                  {formatDate(
                    membership.startDate
                  )}
                </span>

                <span>
                  {formatDate(
                    membership.endDate
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!isActive && (
                <Link
                  href="/membership/purchase"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  Buy Membership
                  <ArrowRight size={15} />
                </Link>
              )}

              {isActive && (
                <Link
                  href="/member/membership"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  Manage Membership
                  <ArrowRight size={15} />
                </Link>
              )}

              <Link
                href="/member/promotions"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-6 py-3.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
              >
                <Gift size={15} />
                View Offers
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<CalendarDays size={17} />}
            label="Start Date"
            value={formatDate(
              membership.startDate
            )}
          />

          <StatCard
            icon={<Clock3 size={17} />}
            label="End Date"
            value={formatDate(
              membership.endDate
            )}
          />

          <StatCard
            icon={<Timer size={17} />}
            label="Duration"
            value={formatDuration(
              plan?.durationInDays
            )}
          />

          <StatCard
            icon={<Wallet size={17} />}
            label="Amount Paid"
            value={`₹${Number(
              membership.priceAtPurchase ||
                0
            ).toLocaleString("en-IN")}`}
          />
        </section>

        {/* Features */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-8">
          <SectionTitle
            icon={<Dumbbell size={17} />}
            eyebrow="Included"
            title="Membership Features"
            description="Everything included with your current plan."
          />

          {plan?.features?.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.features.map(
                (feature) => (
                  <div
                    key={feature}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-orange-500/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 transition group-hover:bg-orange-500 group-hover:text-black">
                      <Check size={17} />
                    </div>

                    <span className="text-sm font-bold text-zinc-300">
                      {formatFeature(
                        feature
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-700">
              No features listed.
            </p>
          )}
        </section>

        {/* Extension summary */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-orange-500/15 bg-orange-500/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Sparkles size={19} />
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-zinc-700">
              Extension Days
            </p>

            <p className="mt-2 text-3xl font-black text-orange-400">
              +{totalExtensionDays}
            </p>

            <p className="mt-1 text-xs text-zinc-700">
              Total days added to this
              membership.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
              <BadgeCheck size={19} />
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-zinc-700">
              Membership ID
            </p>

            <p className="mt-2 break-all font-mono text-xs text-zinc-500">
              {membership.id}
            </p>
          </div>
        </section>

        {/* Extension history */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-8">
          <SectionTitle
            icon={<Sparkles size={17} />}
            eyebrow="History"
            title="Extension History"
            description="Review every extension applied to your membership."
          />

          {extensions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-700">
                <CalendarDays size={20} />
              </div>

              <p className="mt-4 text-sm font-bold text-zinc-600">
                No membership extensions yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {extensions
                .slice()
                .reverse()
                .map((extension) => (
                  <ExtensionCard
                    key={
                      extension.id ||
                      `${extension.createdAt}-${extension.daysAdded}`
                    }
                    extension={extension}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Bottom actions */}
        <div className="mt-6 flex flex-col gap-3 pb-6 sm:flex-row">
          <Link
            href="/member"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-5 py-3 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <Link
            href="/member/payments"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-5 py-3 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
          >
            <Wallet size={15} />
            Payment History
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="bg-[#080808] p-5">
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-black text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-700">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ExtensionCard({
  extension,
  formatDate,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 transition hover:border-orange-500/15">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-400">
              <PlusIcon />
              +{extension.daysAdded} days
            </span>

            {extension.source && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                {extension.source}
              </span>
            )}
          </div>

          {extension.reason && (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {extension.reason}
            </p>
          )}

          {extension.promotion?.title && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-700">
              <Gift size={13} />
              Promotion:{" "}
              <span className="text-zinc-500">
                {extension.promotion.title}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-700">
          {formatDate(
            extension.createdAt
          )}
        </p>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
        <DateValue
          label="Previous End Date"
          value={formatDate(
            extension.oldEndDate
          )}
        />

        <DateValue
          label="New End Date"
          value={formatDate(
            extension.newEndDate
          )}
          highlighted
        />
      </div>

      {extension.approvedBy?.name && (
        <p className="mt-4 text-[11px] text-zinc-700">
          Approved by{" "}
          <span className="text-zinc-500">
            {extension.approvedBy.name}
          </span>
        </p>
      )}
    </div>
  );
}

function DateValue({
  label,
  value,
  highlighted,
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          highlighted
            ? "text-orange-400"
            : "text-zinc-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PlusIcon() {
  return (
    <span className="text-xs font-black">
      +
    </span>
  );
}

function NoMembership() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/member"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        <div className="mt-8 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.09] via-zinc-950 to-zinc-950 p-8 text-center sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20">
            <Dumbbell size={27} />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Member Area
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            No Active Membership
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
            You currently don't have an active
            membership. Choose a plan and start
            your gym journey.
          </p>

          <Link
            href="/membership/purchase"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
          >
            Buy Membership
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-320px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[160px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-24 rounded bg-zinc-900" />

        <div className="mt-8 h-12 w-72 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 h-80 rounded-3xl bg-zinc-950" />

        <div className="mt-6 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 bg-zinc-950"
              />
            )
          )}
        </div>

        <div className="mt-6 h-48 rounded-3xl bg-zinc-950" />
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading membership...
          </span>
        </div>
      </div>
    </main>
  );
}