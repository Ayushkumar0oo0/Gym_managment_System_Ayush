"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  ExternalLink,
  Flame,
  HeartPulse,
  Info,
  Loader2,
  Play,
  Search,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const CATEGORY_LABELS = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  legs: "Legs",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
  functional: "Functional",
};

function formatGroup(value) {
  if (!value) return "";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatRest(seconds) {
  if (!seconds) return "—";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (!remaining) {
    return `${minutes} min`;
  }

  return `${minutes}m ${remaining}s`;
}

function getTutorialLabel(platform) {
  if (platform === "youtube") {
    return "Watch on YouTube";
  }

  if (platform === "instagram") {
    return "Watch on Instagram";
  }

  if (platform === "google_drive") {
    return "Open Tutorial";
  }

  return "Watch Tutorial";
}

function formatDifficulty(value) {
  if (!value) return "Beginner";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function MemberWorkoutsPage() {
  const [machines, setMachines] = useState([]);
  const [today, setToday] = useState(null);
  const [weeklySchedule, setWeeklySchedule] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedMachine, setSelectedMachine] =
    useState(null);

  const [selectedDay, setSelectedDay] =
    useState("today");

  async function loadWorkout() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/member/workout-machines?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load today's workout."
        );
      }

      setMachines(data.machines || []);
      setToday(data.today || null);
      setWeeklySchedule(
        data.weeklySchedule || []
      );
    } catch (err) {
      console.error(
        "Member workout error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load workout."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadWorkout();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  const selectedDayData = useMemo(() => {
    if (selectedDay === "today") {
      return today;
    }

    return weeklySchedule.find(
      (item) => item.day === selectedDay
    );
  }, [
    selectedDay,
    today,
    weeklySchedule,
  ]);

  const visibleMachines = useMemo(() => {
    if (!selectedDayData) {
      return machines;
    }

    if (selectedDay === "today") {
      return machines;
    }

    const groups =
      selectedDayData.muscleGroups || [];

    if (
      !groups.length ||
      groups.includes("rest")
    ) {
      return [];
    }

    return machines.filter((machine) => {
      const machineParts = [
        ...(machine.bodyParts || []),
        machine.category,
      ].map((value) =>
        String(value).toLowerCase()
      );

      return groups.some((group) => {
        const normalized =
          String(group).toLowerCase();

        if (normalized === "arms") {
          return (
            machineParts.includes("arms") ||
            machineParts.includes("biceps") ||
            machineParts.includes("triceps") ||
            machineParts.includes("forearms")
          );
        }

        if (normalized === "core") {
          return (
            machineParts.includes("core") ||
            machineParts.includes("abs")
          );
        }

        if (normalized === "legs") {
          return (
            machineParts.includes("legs") ||
            machineParts.includes("glutes") ||
            machineParts.includes("hamstrings") ||
            machineParts.includes("calves")
          );
        }

        return machineParts.includes(normalized);
      });
    });
  }, [
    machines,
    selectedDay,
    selectedDayData,
  ]);

  const isRestDay =
    selectedDayData?.isRestDay ||
    selectedDayData?.muscleGroups?.includes(
      "rest"
    );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-56 -top-56 h-[650px] w-[650px] rounded-full bg-orange-500/[0.07] blur-[150px]" />
        <div className="absolute -bottom-64 -left-64 h-[650px] w-[650px] rounded-full bg-orange-600/[0.035] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-orange-500/15 bg-gradient-to-br from-[#17120d] via-[#0f0f0f] to-[#090909]">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.16),transparent_55%)]" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                <Sparkles size={13} />
                Your Workout
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Train with a{" "}
                <span className="text-orange-500">
                  plan.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Your workout changes by day. Follow
                today's muscle groups and use the
                recommended machines available in
                your gym.
              </p>

              {today && (
                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] px-5 py-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
                      Today
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {DAY_LABELS[today.day] ||
                        formatGroup(today.day)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                      Workout
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {today.isRestDay
                        ? "Recovery"
                        : today.muscleGroups
                            ?.map(formatGroup)
                            .join(" + ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* WEEKLY PLAN */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              Weekly Rotation
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Your training week
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {DAYS.map((day) => {
              const data =
                weeklySchedule.find(
                  (item) => item.day === day
                );

              const isToday =
                today?.day === day;

              const isSelected =
                selectedDay === day ||
                (selectedDay === "today" &&
                  isToday);

              const rest =
                data?.isRestDay ||
                data?.muscleGroups?.includes(
                  "rest"
                );

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setSelectedDay(day)
                  }
                  className={`group rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-black shadow-xl shadow-orange-500/10"
                      : "border-white/[0.07] bg-[#101010] text-white hover:border-orange-500/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isSelected
                          ? "text-black/60"
                          : "text-zinc-600"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </span>

                    {isToday && (
                      <span
                        className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${
                          isSelected
                            ? "bg-black/10"
                            : "bg-orange-500/10 text-orange-400"
                        }`}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm font-black">
                    {rest
                      ? "Recovery"
                      : data?.muscleGroups
                          ?.map(formatGroup)
                          .join(" + ") ||
                        "Workout"}
                  </p>

                  <div
                    className={`mt-3 flex items-center gap-1 text-[10px] font-bold ${
                      isSelected
                        ? "text-black/60"
                        : "text-zinc-600"
                    }`}
                  >
                    View workout
                    <ChevronRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-8">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search today's machines..."
              className="h-14 w-full rounded-2xl border border-white/[0.08] bg-[#101010] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/[0.05]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </section>

        {/* WORKOUT HEADER */}
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                {selectedDay === "today"
                  ? "Today's Workout"
                  : DAY_LABELS[selectedDay]}
              </p>

              <h2 className="mt-1 text-3xl font-black">
                {isRestDay
                  ? "Recovery Day"
                  : selectedDayData?.muscleGroups
                      ?.map(formatGroup)
                      .join(" + ") ||
                    "Workout"}
              </h2>

              {!isRestDay && (
                <p className="mt-2 text-sm text-zinc-600">
                  {visibleMachines.length} equipment
                  options available
                </p>
              )}
            </div>

            {selectedDayData?.groupName && (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#101010] px-4 py-3 text-xs font-bold text-zinc-400">
                <Target
                  size={15}
                  className="text-orange-400"
                />
                {selectedDayData.groupName}
              </div>
            )}
          </div>
        </section>

        {/* CONTENT */}
        <section className="mt-6">
          {loading ? (
            <LoadingGrid />
          ) : error ? (
            <ErrorState
              message={error}
              retry={loadWorkout}
            />
          ) : isRestDay ? (
            <RestDay />
          ) : visibleMachines.length === 0 ? (
            <EmptyState
              search={search}
              clear={() => setSearch("")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMachines.map((machine) => (
                <WorkoutCard
                  key={machine.key}
                  machine={machine}
                  onClick={() =>
                    setSelectedMachine(machine)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL */}
      {selectedMachine && (
        <WorkoutModal
          machine={selectedMachine}
          allMachines={machines}
          onClose={() =>
            setSelectedMachine(null)
          }
          onSelectMachine={(machine) =>
            setSelectedMachine(machine)
          }
        />
      )}
    </main>
  );
}

/* =========================================================
   WORKOUT CARD
========================================================= */

function WorkoutCard({ machine, onClick }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101010] shadow-xl transition duration-300 hover:-translate-y-1 hover:border-orange-500/25">
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[#151515]">
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-500/[0.14] via-[#151515] to-[#090909]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/15 bg-orange-500/[0.06] text-orange-500/60">
                <Dumbbell size={28} />
              </div>
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-orange-400 backdrop-blur">
            {CATEGORY_LABELS[
              machine.category
            ] || formatGroup(machine.category)}
          </div>

          {machine.tutorialUrl && (
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-black shadow-lg shadow-orange-500/20">
              <Play
                size={14}
                fill="currentColor"
              />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 pt-16">
            <h3 className="text-lg font-black">
              {machine.name}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {machine.equipmentType}
            </p>
          </div>
        </div>
      </button>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {(machine.muscleGroups || [])
            .slice(0, 3)
            .map((muscle) => (
              <span
                key={muscle}
                className="rounded-lg bg-orange-500/[0.06] px-2 py-1 text-[9px] font-bold capitalize text-orange-300"
              >
                {muscle}
              </span>
            ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat
            label="Sets"
            value={machine.defaultSets}
          />

          <MiniStat
            label="Reps"
            value={machine.defaultReps}
          />

          <MiniStat
            label="Rest"
            value={formatRest(
              machine.defaultRestSeconds
            )}
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600">
            <Activity size={12} />
            {formatDifficulty(
              machine.difficulty
            )}
          </span>

          <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1.5 text-xs font-black text-orange-400 hover:text-orange-300"
          >
            View details
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-zinc-300">
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   REST DAY
========================================================= */

function RestDay() {
  return (
    <div className="overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.08] via-[#101010] to-[#090909] p-8 text-center sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <HeartPulse size={30} />
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
        Recovery
      </p>

      <h3 className="mt-2 text-3xl font-black">
        Rest and recover.
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-500">
        Today is your recovery day. Give your
        muscles time to repair and come back
        stronger for your next workout.
      </p>

      <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-black/30 p-4">
        <CheckCircle2
          size={18}
          className="text-orange-400"
        />

        <span className="text-xs font-bold text-zinc-400">
          Recovery is part of your training.
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function WorkoutModal({
  machine,
  allMachines,
  onClose,
  onSelectMachine,
}) {
  const recommended =
    (machine.recommendedMachineKeys || [])
      .map((key) =>
        allMachines.find(
          (item) => item.key === key
        )
      )
      .filter(Boolean)
      .slice(0, 4);

  const alternatives =
    (machine.alternativeMachineKeys || [])
      .map((key) =>
        allMachines.find(
          (item) => item.key === key
        )
      )
      .filter(Boolean)
      .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close workout"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-white/[0.08] bg-[#0b0b0b] shadow-2xl lg:inset-y-6 lg:bottom-auto lg:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
              Exercise Guide
            </p>

            <h2 className="mt-1 text-lg font-black">
              {machine.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative aspect-[16/10] bg-[#141414] lg:aspect-auto lg:min-h-[370px]">
              {machine.imageUrl ? (
                <img
                  src={machine.imageUrl}
                  alt={machine.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center bg-gradient-to-br from-orange-500/15 to-[#111]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-orange-500/60">
                    <Dumbbell size={42} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                {CATEGORY_LABELS[
                  machine.category
                ] || formatGroup(machine.category)}
              </p>

              <h3 className="mt-2 text-3xl font-black">
                {machine.name}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {machine.description ||
                  "Follow the recommended technique and use controlled movement."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <InfoTile
                  icon={<Dumbbell size={16} />}
                  label="Equipment"
                  value={machine.equipmentType}
                />

                <InfoTile
                  icon={<Activity size={16} />}
                  label="Difficulty"
                  value={formatDifficulty(
                    machine.difficulty
                  )}
                />

                <InfoTile
                  icon={<Target size={16} />}
                  label="Sets"
                  value={machine.defaultSets}
                />

                <InfoTile
                  icon={<Timer size={16} />}
                  label="Reps"
                  value={machine.defaultReps}
                />

                <InfoTile
                  icon={<Clock3 size={16} />}
                  label="Rest"
                  value={formatRest(
                    machine.defaultRestSeconds
                  )}
                />
              </div>

              {machine.tutorialUrl && (
                <a
                  href={machine.tutorialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-black shadow-xl shadow-orange-500/10 hover:bg-orange-400"
                >
                  <Play
                    size={16}
                    fill="currentColor"
                  />

                  {getTutorialLabel(
                    machine.tutorialPlatform
                  )}

                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          <ModalSection
            title="Muscles worked"
            eyebrow="Target"
          >
            <div className="flex flex-wrap gap-2">
              {(machine.muscleGroups || []).map(
                (muscle) => (
                  <span
                    key={muscle}
                    className="rounded-xl border border-orange-500/10 bg-orange-500/[0.05] px-3 py-2 text-xs font-bold capitalize text-orange-300"
                  >
                    {muscle}
                  </span>
                )
              )}
            </div>
          </ModalSection>

          {machine.instructions?.length > 0 && (
            <ModalSection
              title="How to perform"
              eyebrow="Technique"
            >
              <div className="space-y-3">
                {machine.instructions.map(
                  (instruction, index) => (
                    <div
                      key={`${instruction}-${index}`}
                      className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-[10px] font-black text-black">
                        {index + 1}
                      </div>

                      <p className="pt-1 text-sm leading-6 text-zinc-400">
                        {instruction}
                      </p>
                    </div>
                  )
                )}
              </div>
            </ModalSection>
          )}

          <div className="grid gap-4 border-t border-white/[0.06] px-5 py-6 sm:grid-cols-2 sm:px-7">
            {machine.tips?.length > 0 && (
              <TipBox
                title="Trainer tips"
                items={machine.tips}
                positive
              />
            )}

            {machine.commonMistakes?.length >
              0 && (
              <TipBox
                title="Avoid these mistakes"
                items={machine.commonMistakes}
              />
            )}
          </div>

          {recommended.length > 0 && (
            <MachineLinks
              title="Recommended next"
              eyebrow="Build your workout"
              machines={recommended}
              onSelect={onSelectMachine}
            />
          )}

          {alternatives.length > 0 && (
            <MachineLinks
              title="Alternative equipment"
              eyebrow="If this machine is busy"
              machines={alternatives}
              onSelect={onSelectMachine}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-black capitalize text-zinc-200">
        {String(value || "—").replaceAll(
          "_",
          " "
        )}
      </p>
    </div>
  );
}

function ModalSection({
  eyebrow,
  title,
  children,
}) {
  return (
    <section className="border-t border-white/[0.06] px-5 py-6 sm:px-7">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-black">
        {title}
      </h3>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function TipBox({
  title,
  items,
  positive = false,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            positive
              ? "bg-orange-500/10 text-orange-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <Info size={15} />
        </div>

        <h4 className="text-sm font-black">
          {title}
        </h4>
      </div>

      <ul className="mt-4 space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-2 text-xs leading-5 text-zinc-500"
          >
            <span
              className={`mt-2 h-1 w-1 shrink-0 rounded-full ${
                positive
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
            />

            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MachineLinks({
  title,
  eyebrow,
  machines,
  onSelect,
}) {
  return (
    <section className="border-t border-white/[0.06] px-5 py-6 sm:px-7">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-black">
        {title}
      </h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {machines.map((machine) => (
          <button
            type="button"
            key={machine.key}
            onClick={() =>
              onSelect(machine)
            }
            className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#101010] p-3 text-left hover:border-orange-500/20"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#181818]">
              {machine.imageUrl ? (
                <img
                  src={machine.imageUrl}
                  alt={machine.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-orange-500/50">
                  <Dumbbell size={21} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-zinc-200">
                {machine.name}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                {CATEGORY_LABELS[
                  machine.category
                ] || formatGroup(machine.category)}
              </p>
            </div>

            <ChevronRight
              size={15}
              className="shrink-0 text-zinc-700 group-hover:text-orange-400"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   STATES
========================================================= */

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]"
          >
            <div className="aspect-[16/10] animate-pulse bg-white/[0.04]" />

            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.05]" />

              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />

              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-12 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-12 animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ErrorState({ message, retry }) {
  return (
    <div className="rounded-3xl border border-red-500/10 bg-red-500/[0.03] px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <Activity size={24} />
      </div>

      <h3 className="mt-4 text-lg font-black">
        Workout unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {message}
      </p>

      <button
        type="button"
        onClick={retry}
        className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-black hover:bg-orange-400"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ search, clear }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#101010] px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Search size={27} />
      </div>

      <h3 className="mt-5 text-xl font-black">
        No equipment found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {search
          ? "Try another machine or muscle group."
          : "No equipment is available for this workout yet."}
      </p>

      {search && (
        <button
          type="button"
          onClick={clear}
          className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-black hover:bg-orange-400"
        >
          Clear Search
        </button>
      )}
    </div>
  );
}