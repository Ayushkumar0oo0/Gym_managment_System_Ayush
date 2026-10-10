"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  Gift,
  Loader2,
  MessageSquareText,
  Play,
  RotateCcw,
  ShieldCheck,
  User,
  Wallet,
  Flame,
} from "lucide-react";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const FULL_DAY_LABELS = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export default function MemberDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [membershipResponse, workoutResponse] = await Promise.all([
        fetch("/api/member/membership/status", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/member/workout-machines", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const membershipData = await membershipResponse.json();
      const workoutResult = await workoutResponse.json();

      if (!membershipResponse.ok) {
        throw new Error(
          membershipData.message || "Failed to load membership."
        );
      }

      if (!workoutResponse.ok) {
        throw new Error(
          workoutResult.message || "Failed to load workout information."
        );
      }

      setMembership(membershipData.membership || null);
      setWorkoutData(workoutResult || null);
    } catch (err) {
      console.error("Member dashboard error:", err);
      setError(err?.message || "Failed to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const active = useMemo(() => {
    if (!membership) return false;

    if (membership.status === "active") {
      return !membership.endDate || new Date(membership.endDate) > new Date();
    }

    return false;
  }, [membership]);

  const daysRemaining = useMemo(
    () => getDaysRemaining(membership?.endDate),
    [membership?.endDate]
  );

  const today = workoutData?.today || null;
  const weeklySchedule = workoutData?.weeklySchedule || [];
  const todayMachines = workoutData?.machines || [];

  const todayLabel = today?.day
    ? FULL_DAY_LABELS[String(today.day).toLowerCase()] || today.day
    : FULL_DAY_LABELS[DAYS[new Date().getDay()]];

  const todayWorkoutTitle = today?.isRestDay
    ? "Recovery Day"
    : today?.muscleGroups?.length
      ? today.muscleGroups.map(formatMuscleGroup).join(" + ")
      : "Today's Workout";

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              <Dumbbell size={12} />
              Member Area
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Train.
              <span className="text-orange-500"> Progress.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">
              Manage your membership, track your training, and stay consistent
              with your fitness goals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/member/profile")}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            <User size={15} />
            My Profile
            <ArrowRight size={14} />
          </button>
        </header>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <div className="flex items-start gap-3">
              <span>⚠</span>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="shrink-0 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-bold transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* MEMBERSHIP OVERVIEW — PRIORITY ONE */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Your Membership"
            title="Membership overview"
            description="Check your current plan and how much time you have left."
          />

          {membership ? (
            <div className="relative mt-5 overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.12] via-zinc-950 to-zinc-950">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-[100px]" />

              <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-8">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      active
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {active ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}
                    {active ? "Membership Active" : "Membership Inactive"}
                  </div>

                  <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                    {membership.planName ||
                      membership.plan?.name ||
                      membership.membershipPlan?.name ||
                      "Gym Membership"}
                  </h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                    {active
                      ? "Keep up the consistency. Your next fitness milestone starts with today's session."
                      : "Your membership is not currently active. Review your available plans to continue training."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/member/membership")}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                    >
                      {active ? "Manage Membership" : "View Membership Plans"}
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/member/membership/status")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
                    >
                      Full Status
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MembershipStat
                    label="Days remaining"
                    value={active ? daysRemaining : 0}
                    highlight
                    icon={<Clock3 size={16} />}
                  />

                  <MembershipStat
                    label="Current status"
                    value={active ? "Active" : "Inactive"}
                    icon={<BadgeCheck size={16} />}
                  />

                  <MembershipStat
                    label="Start date"
                    value={formatDate(membership.startDate)}
                    icon={<CalendarDays size={16} />}
                  />

                  <MembershipStat
                    label="Expiry date"
                    value={formatDate(membership.endDate)}
                    icon={<RotateCcw size={16} />}
                  />
                </div>
              </div>

              {active && daysRemaining <= 7 && (
                <div className="relative flex items-start gap-3 border-t border-orange-500/15 bg-orange-500/[0.05] px-5 py-4 sm:px-7">
                  <Clock3
                    size={17}
                    className="mt-0.5 shrink-0 text-orange-400"
                  />
                  <div>
                    <p className="text-sm font-bold text-orange-300">
                      {daysRemaining === 0
                        ? "Your membership expires today."
                        : `Only ${daysRemaining} ${
                            daysRemaining === 1 ? "day" : "days"
                          } left on your membership.`}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Renew in advance to keep your training routine on track.
                    </p>
                  </div>
                </div>
              )}

              {!active && (
                <div className="relative flex items-start gap-3 border-t border-red-500/15 bg-red-500/[0.04] px-5 py-4 sm:px-7">
                  <Clock3
                    size={17}
                    className="mt-0.5 shrink-0 text-red-400"
                  />
                  <div>
                    <p className="text-sm font-bold text-red-300">
                      Your membership is inactive.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Visit the membership page to view plans and renewal
                      options.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black">
                    No membership information found
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                    Visit the membership page to explore available plans and
                    get started.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/member/membership")}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  Explore Membership
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* QUICK ACTIONS — PRIORITY TWO */}

        <section className="mt-10">
          <SectionHeading
            eyebrow="Member Services"
            title="Quick actions"
            description="Everything you need, available in one place."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              icon={<CreditCard size={19} />}
              title="Payment History"
              description="Review your payments and payment status."
              onClick={() => router.push("/member/payments")}
              featured
            />

            <ActionCard
              icon={<Dumbbell size={19} />}
              title="Workout Library"
              description="Explore workout plans and gym equipment."
              onClick={() => router.push("/member/workouts")}
            />

            <ActionCard
              icon={<Wallet size={19} />}
              title="Membership"
              description="Manage your plan and renewal."
              onClick={() => router.push("/member/membership")}
            />

            <ActionCard
              icon={<Gift size={19} />}
              title="Gym Offers"
              description="Explore current membership promotions."
              onClick={() => router.push("/member/promotions")}
            />

            <ActionCard
              icon={<Flame size={19} />}
              title="Diet Plan"
              description="View your gym's diet and nutrition guidance."
              onClick={() => router.push("/member/diet")}
            />

            <ActionCard
              icon={<MessageSquareText size={19} />}
              title="Feedback & Requests"
              description="Send feedback or share a request."
              onClick={() => router.push("/member/feedback")}
            />
          </div>
        </section>

        {/* TODAY'S WORKOUT — PRIORITY THREE */}

        <section className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Today's Training"
              title={todayLabel}
              description="Your scheduled workout at a glance."
            />

            <button
              type="button"
              onClick={() => router.push("/member/workouts")}
              className="inline-flex w-fit items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-400"
            >
              Full Workout Library
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.10] via-zinc-950 to-zinc-950">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-[100px]" />

            <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:p-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                  <Flame size={15} />
                  Training plan
                </div>

                <h3 className="mt-4 text-2xl font-black sm:text-3xl">
                  {todayWorkoutTitle}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                  {today?.isRestDay
                    ? "Your body needs recovery too. Take a rest day, stay hydrated, and get ready for your next session."
                    : "Follow your scheduled workout, use proper form, and stay consistent with your fitness goals."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs font-bold text-zinc-400">
                    <CalendarDays size={14} className="text-orange-400" />
                    {todayLabel}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs font-bold text-zinc-400">
                    <Dumbbell size={14} className="text-orange-400" />
                    {today?.isRestDay
                      ? "Recovery"
                      : `${todayMachines.length} equipment items`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/member/workouts")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  <Play size={15} />
                  Explore Workouts
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-zinc-200">
                      Today's equipment
                    </h4>
                    <p className="mt-1 text-xs text-zinc-600">
                      Equipment listed for your training.
                    </p>
                  </div>

                  <Dumbbell size={19} className="text-orange-400" />
                </div>

                {today?.isRestDay ? (
                  <div className="mt-5 rounded-xl border border-white/5 bg-zinc-950 p-4 text-sm leading-6 text-zinc-500">
                    It's a recovery day. Rest well and return stronger for your
                    next workout.
                  </div>
                ) : todayMachines.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {todayMachines.slice(0, 4).map((machine, index) => (
                      <MachineMiniCard
                        key={machine._id || machine.id || machine.name || index}
                        machine={machine}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/5 bg-zinc-950 p-4 text-sm leading-6 text-zinc-500">
                    No equipment has been assigned to today's workout yet.
                    Open the workout library to explore available exercises.
                  </div>
                )}

                {todayMachines.length > 4 && (
                  <button
                    type="button"
                    onClick={() => router.push("/member/workouts")}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-orange-400 transition hover:text-orange-300"
                  >
                    View all {todayMachines.length} items
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* WEEKLY SCHEDULE — PRIORITY FOUR */}

        <section className="mt-10">
          <SectionHeading
            eyebrow="Stay Consistent"
            title="Weekly schedule"
            description="See your training split for the week."
          />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {getOrderedWeek(weeklySchedule).map((item, index) => {
              const isToday =
                item.day === DAYS[new Date().getDay()];

              const isRestDay =
                item.isRestDay ||
                item.muscleGroups?.includes("rest");

              const groups = (item.muscleGroups || [])
                .filter((group) => group !== "rest")
                .map(formatMuscleGroup);

              return (
                <button
                  key={item.day || index}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/member/workouts?day=${encodeURIComponent(item.day)}`
                    )
                  }
                  className={`group min-h-36 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                    isToday
                      ? "border-orange-500/40 bg-orange-500/[0.08]"
                      : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isToday ? "text-orange-400" : "text-zinc-500"
                      }`}
                    >
                      {DAY_LABELS[item.day] || item.day}
                    </span>

                    {isToday && (
                      <span className="rounded-md bg-orange-500 px-1.5 py-1 text-[8px] font-black uppercase text-black">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-orange-400 transition group-hover:bg-orange-500/10">
                    {isRestDay ? (
                      <RotateCcw size={17} />
                    ) : (
                      <Dumbbell size={17} />
                    )}
                  </div>

                  <p className="mt-3 text-sm font-black text-zinc-200">
                    {isRestDay
                      ? "Rest Day"
                      : groups.length
                        ? groups.join(", ")
                        : "Workout"}
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    {isRestDay ? "Recovery & rest" : "View workout"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECONDARY LINKS */}

        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <ShieldCheck size={19} />
              </div>

              <div>
                <h3 className="font-black text-zinc-200">
                  Your member account
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Keep your profile details up to date and contact the gym if
                  you need assistance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/member/profile")}
              className="mt-4 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-orange-400 transition hover:text-orange-300 sm:mt-0"
            >
              Open Profile
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-2 pb-5 text-center text-[11px] text-zinc-700">
          <CheckCircle2 size={13} />
          Train hard. Stay consistent. Keep progressing.
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

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

function getDaysRemaining(endDate) {
  if (!endDate) return 0;

  const end = new Date(endDate);

  if (Number.isNaN(end.getTime())) {
    return 0;
  }

  const now = new Date();
  const difference = end.getTime() - now.getTime();

  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

function formatMuscleGroup(value) {
  if (!value) return "";

  const labels = {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    legs: "Legs",
    arms: "Arms",
    biceps: "Biceps",
    triceps: "Triceps",
    core: "Core",
    cardio: "Cardio",
    full_body: "Full Body",
    glutes: "Glutes",
    hamstrings: "Hamstrings",
    forearms: "Forearms",
    abs: "Abs",
  };

  const normalized = String(value).toLowerCase();

  return (
    labels[normalized] ||
    normalized.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
  );
}

function getOrderedWeek(schedule) {
  const map = new Map(
    (Array.isArray(schedule) ? schedule : []).map((item) => [
      String(item.day).toLowerCase(),
      item,
    ])
  );

  const todayIndex = new Date().getDay();

  const orderedDays = Array.from({ length: 7 }, (_, index) => {
    return DAYS[(todayIndex + index) % 7];
  });

  return orderedDays.map(
    (day) =>
      map.get(day) || {
        day,
        muscleGroups: ["rest"],
        isRestDay: true,
      }
  );
}

/* ============================================================
   UI COMPONENTS
============================================================ */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      )}
    </div>
  );
}

function MembershipStat({ label, value, highlight = false, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-zinc-600">
        <span className="text-orange-400">{icon}</span>
        <p className="text-[9px] font-black uppercase tracking-wider">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 break-words text-lg font-black ${
          highlight ? "text-orange-400" : "text-zinc-200"
        }`}
      >
        {value}
        {highlight && (
          <span className="ml-1 text-xs font-bold text-zinc-600">days</span>
        )}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  featured = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-0.5 ${
        featured
          ? "border-orange-500/25 bg-orange-500/[0.07] hover:border-orange-500/40"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl transition group-hover:bg-orange-500/10" />

      <div className="relative">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            featured
              ? "bg-orange-500 text-black"
              : "bg-orange-500/10 text-orange-400"
          }`}
        >
          {icon}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-black text-zinc-200">{title}</p>

          <ArrowRight
            size={15}
            className="shrink-0 text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400"
          />
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>
    </button>
  );
}

function MachineMiniCard({ machine }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 p-3 transition hover:border-orange-500/20">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black">
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name || "Workout equipment"}
              className="h-full w-full object-cover"
            />
          ) : (
            <Dumbbell size={17} className="text-orange-400" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-black text-zinc-200">
            {machine.shortName || machine.name || "Workout equipment"}
          </p>

          <p className="mt-1 truncate text-[10px] capitalize text-zinc-600">
            {machine.category || "Equipment"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
        <span className="font-bold text-zinc-600">
          {machine.defaultSets != null ? `${machine.defaultSets} sets` : "Sets vary"}
        </span>

        <span className="font-bold text-orange-400">
          {machine.defaultReps || "View details"}
        </span>
      </div>
    </div>
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
        <div className="h-4 w-32 rounded bg-zinc-900" />
        <div className="mt-5 h-12 w-72 rounded-xl bg-zinc-900" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 h-64 rounded-3xl bg-zinc-950" />
        <div className="mt-8 h-5 w-40 rounded bg-zinc-900" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl bg-zinc-950" />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-600">
        <Loader2 size={15} className="animate-spin text-orange-400" />
        Loading your dashboard...
      </div>
    </main>
  );
}