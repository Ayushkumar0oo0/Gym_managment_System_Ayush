"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  Gift,
  Loader2,
  User,
  Wallet,
  Flame,
  RotateCcw,
  Play,
  ShieldCheck,
  MessageSquareText,
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

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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
          workoutResult.message || "Failed to load today's workout."
        );
      }

      setMembership(membershipData.membership || null);
      setWorkoutData(workoutResult || null);
    } catch (error) {
      console.error("Member dashboard error:", error);

      setError(error?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

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
    const now = new Date();

    const difference = end.getTime() - now.getTime();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );
  }

  const active = useMemo(() => {
    if (!membership) return false;

    if (membership.status === "active") {
      return true;
    }

    if (membership.endDate) {
      return new Date(membership.endDate) > new Date();
    }

    return false;
  }, [membership]);

  const daysRemaining = getDaysRemaining(membership?.endDate);

  const today = workoutData?.today || null;

  const weeklySchedule =
  workoutData?.weeklySchedule || [];

  const todayMachines = workoutData?.machines || [];

  const todayLabel = today?.day
    ? FULL_DAY_LABELS[today.day] || today.day
    : "Today";

  const todayWorkoutTitle = today?.isRestDay
    ? "Recovery Day"
    : today?.muscleGroups?.length
      ? today.muscleGroups
          .map(formatMuscleGroup)
          .join(" + ")
      : "Today's Workout";

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
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
              Your workout, weekly schedule and membership —
              everything you need for today's training.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/member/profile")}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            <User size={15} />
            My Profile
          </button>
        </header>

        {/* ERROR */}

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

        {/* TODAY'S WORKOUT */}

        <section className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                Today's Training
              </p>

              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                {todayLabel}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/member/workouts")}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-400"
            >
              Full Workout Library
              <ArrowRight size={15} />
            </button>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.13] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
            <div className="absolute right-[-150px] top-[-180px] h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[130px]" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col justify-between gap-8 lg:flex-row">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
                      <Flame size={12} />
                      Today
                    </span>

                    {today?.groupName && (
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        {today.groupName}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-3xl font-black sm:text-4xl">
                    {todayWorkoutTitle}
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                    {today?.isRestDay
                      ? "Take today to recover. Rest is part of getting stronger and keeping your body ready for the next session."
                      : `Your ${todayWorkoutTitle.toLowerCase()} session is ready. Follow the recommended machines and exercise instructions.`}
                  </p>

                  {!today?.isRestDay && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {today?.muscleGroups?.map((group) => (
                        <span
                          key={group}
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold capitalize text-zinc-300"
                        >
                          {formatMuscleGroup(group)}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/member/workouts")
                    }
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
                  >
                    {today?.isRestDay ? (
                      <>
                        View Weekly Schedule
                        <CalendarDays size={16} />
                      </>
                    ) : (
                      <>
                        <Play size={15} fill="currentColor" />
                        Start Today's Workout
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-3 self-start lg:w-[300px]">
                  <StatCard
                    value={
                      today?.isRestDay
                        ? "REST"
                        : todayMachines.length
                    }
                    label={
                      today?.isRestDay
                        ? "Today's Status"
                        : "Exercises"
                    }
                    icon={<Dumbbell size={17} />}
                  />

                  <StatCard
                    value={
                      today?.isRestDay
                        ? "Recovery"
                        : today?.muscleGroups?.length || 0
                    }
                    label={
                      today?.isRestDay
                        ? "Focus"
                        : "Muscle Groups"
                    }
                    icon={<Flame size={17} />}
                  />

                  <StatCard
                    value={weeklySchedule.length || 7}
                    label="Weekly Days"
                    icon={<CalendarDays size={17} />}
                  />

                  <StatCard
                    value={today?.groupId || "—"}
                    label="Workout Group"
                    icon={<BadgeCheck size={17} />}
                  />
                </div>
              </div>

              {!today?.isRestDay &&
                todayMachines.length > 0 && (
                  <div className="mt-8 border-t border-white/10 pt-7">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">
                          Today's Equipment
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Recommended machines for your session
                        </p>
                      </div>

                      <span className="text-xs font-bold text-orange-400">
                        {todayMachines.length} available
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {todayMachines
                        .slice(0, 4)
                        .map((machine) => (
                          <MachineMiniCard
                            key={machine._id || machine.key}
                            machine={machine}
                          />
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </section>
        </section>

        {/* WEEKLY SCHEDULE */}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                Your Rotation
              </p>

              <h2 className="mt-1 text-xl font-black sm:text-2xl">
                Weekly Schedule
              </h2>
            </div>

            <div className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
              <RotateCcw size={13} />
              Group {today?.groupId || "—"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {getOrderedWeek(weeklySchedule).map((item) => {
              const isToday = item.day === today?.day;

              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/member/workouts?day=${item.day}`
                    )
                  }
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 ${
                    isToday
                      ? "border-orange-500/40 bg-orange-500/[0.09] shadow-lg shadow-orange-950/20"
                      : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
                  }`}
                >
                  {isToday && (
                    <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-orange-400 shadow-lg shadow-orange-500/50" />
                  )}

                  <p
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isToday
                        ? "text-orange-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {DAY_LABELS[item.day]}
                  </p>

                  <p className="mt-2 text-sm font-black text-zinc-200">
                    {item.isRestDay
                      ? "Rest Day"
                      : item.muscleGroups
                          ?.map(formatMuscleGroup)
                          .join(" + ")}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold ${
                        isToday
                          ? "text-orange-400"
                          : "text-zinc-700"
                      }`}
                    >
                      {isToday ? "TODAY" : "VIEW"}
                    </span>

                    <ArrowRight
                      size={13}
                      className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* MEMBERSHIP */}

        {membership && (
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                Membership
              </p>

              <h2 className="mt-1 text-xl font-black">
                Your Membership
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
              <div className="grid lg:grid-cols-[1fr_auto]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
                      <BadgeCheck size={12} />
                      {membership.plan?.name ||
                        membership.planName ||
                        "Membership"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                        active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {active ? "Active" : "Expired"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <MembershipStat
                      label="Days Remaining"
                      value={daysRemaining}
                      highlight
                    />

                    <MembershipStat
                      label="Start Date"
                      value={formatDate(
                        membership.startDate
                      )}
                    />

                    <MembershipStat
                      label="End Date"
                      value={formatDate(
                        membership.endDate
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3 border-t border-white/10 p-6 lg:border-l lg:border-t-0 sm:p-8">
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/member/membership")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                  >
                    {active
                      ? "Manage Membership"
                      : "Renew Membership"}
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/member/membership/status"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-6 py-3 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
                  >
                    Full Status
                  </button>
                </div>
              </div>
            </div>

            {active && daysRemaining <= 7 && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <Clock3
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-400"
                />

                <div>
                  <p className="text-sm font-black text-amber-400">
                    Membership expiring soon
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Your membership expires in{" "}
                    {daysRemaining}{" "}
                    {daysRemaining === 1
                      ? "day"
                      : "days"}
                    . Renew to keep your training
                    uninterrupted.
                  </p>
                </div>
              </div>
            )}

            {!active && (
              <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <div>
                    <p className="text-sm font-black text-red-400">
                      Membership expired
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Renew your membership to continue
                      using the gym.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/member/membership")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  Renew Now
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* QUICK ACTIONS */}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              Member Tools
            </p>

            <h2 className="mt-1 text-xl font-black">
              Everything You Need
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <ActionCard
              icon={<Dumbbell size={19} />}
              title="Workouts"
              description="Today's exercises and machine tutorials"
              onClick={() =>
                router.push("/member/workouts")
              }
              featured
            />

            <ActionCard
              icon={<Wallet size={19} />}
              title="Diet Plan"
              description="View your personalized nutrition plan"
              onClick={() =>
                router.push("/member/diet")
              }
            />

            <ActionCard
              icon={<CreditCard size={19} />}
              title="Payments"
              description="View your payment history"
              onClick={() =>
                router.push("/member/payments")
              }
            />

            <ActionCard
              icon={<Gift size={19} />}
              title="Gym Offers"
              description="Check available promotions"
              onClick={() =>
                router.push("/member/promotions")
              }
            />

            <ActionCard
              icon={<User size={19} />}
              title="Profile"
              description="Manage your personal information"
              onClick={() =>
                router.push("/member/profile")
              }
            />

            <ActionCard
              icon={<MessageSquareText size={19} />}
              title="Feedback & Requests"
              description="Report an issue, request equipment, or suggest a product"
              onClick={() =>
                router.push("/member/feedback")
              }
            />
          </div>
        </section>

        {/* FOOTER */}

        <div className="mt-10 flex items-center justify-center gap-2 pb-5 text-[11px] text-zinc-800">
          <CheckCircle2 size={13} />
          Train hard. Stay consistent. Keep progressing.
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   HELPERS
============================================================ */

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

  return (
    labels[value] ||
    String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  );
}

function getOrderedWeek(schedule) {
  const map = new Map(
    schedule.map((item) => [item.day, item])
  );

  const todayIndex = new Date().getDay();

  const orderedDays = [
    ...Array.from({ length: 7 }, (_, index) => {
      return DAYS[(todayIndex + index) % 7];
    }),
  ];

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
   COMPONENTS
============================================================ */

function StatCard({ value, label, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-700">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-black text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function MachineMiniCard({ machine }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 transition hover:border-orange-500/20">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Dumbbell
              size={17}
              className="text-orange-400"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-black text-zinc-200">
            {machine.shortName || machine.name}
          </p>

          <p className="mt-1 truncate text-[10px] capitalize text-zinc-600">
            {machine.category}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px]">
        <span className="font-bold text-zinc-600">
          {machine.defaultSets} sets
        </span>

        <span className="font-bold text-orange-400">
          {machine.defaultReps}
        </span>
      </div>
    </div>
  );
}

function MembershipStat({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-black ${
          highlight
            ? "text-orange-400"
            : "text-zinc-300"
        }`}
      >
        {value}

        {highlight && (
          <span className="ml-1 text-xs text-zinc-700">
            days
          </span>
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
      <div className="absolute right-[-35px] top-[-35px] h-24 w-24 rounded-full bg-orange-500/5 blur-2xl transition group-hover:bg-orange-500/10" />

      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            featured
              ? "bg-orange-500 text-black"
              : "bg-orange-500/10 text-orange-400"
          }`}
        >
          {icon}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-black text-zinc-200">
            {title}
          </p>

          <ArrowRight
            size={15}
            className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400"
          />
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>
    </button>
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

        <div className="mt-8 h-[430px] rounded-3xl bg-zinc-950" />

        <div className="mt-8 h-5 w-40 rounded bg-zinc-900" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-zinc-950"
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}