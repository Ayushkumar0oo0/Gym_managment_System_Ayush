"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flame,
  Loader2,
  Scale,
  Target,
  TrendingUp,
  Activity,
  Ruler,
  Save,
  Sparkles,
  Info,
  XCircle,
} from "lucide-react";

const ENERGY_LEVELS = [
  {
    value: "low",
    label: "Low",
    description: "Feeling tired most of the time",
    icon: "😴",
  },
  {
    value: "below_average",
    label: "Below Average",
    description: "A little tired or low on energy",
    icon: "😕",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Feeling okay and balanced",
    icon: "🙂",
  },
  {
    value: "good",
    label: "Good",
    description: "Feeling energetic",
    icon: "💪",
  },
  {
    value: "excellent",
    label: "Excellent",
    description: "Feeling very energetic",
    icon: "🔥",
  },
];

const GOAL_PROGRESS = [
  {
    value: "not_sure",
    label: "Not sure",
    description: "I'm not sure about my progress",
    icon: "🤔",
  },
  {
    value: "too_slow",
    label: "Too slow",
    description: "Progress is slower than expected",
    icon: "🐢",
  },
  {
    value: "on_track",
    label: "On track",
    description: "Progress feels right",
    icon: "🎯",
  },
  {
    value: "too_fast",
    label: "Too fast",
    description: "Changes are happening too quickly",
    icon: "⚡",
  },
];

const INITIAL_FORM = {
  weightKg: "",
  workoutDaysPerWeek: "4",
  energyLevel: "normal",
  goalProgress: "not_sure",
  notes: "",
};

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return "—";

  return number.toFixed(decimals);
}

function getEnergyLabel(value) {
  return (
    ENERGY_LEVELS.find((item) => item.value === value)?.label || "Normal"
  );
}

function getGoalLabel(value) {
  return (
    GOAL_PROGRESS.find((item) => item.value === value)?.label || "Not sure"
  );
}

function getGoalIcon(value) {
  return GOAL_PROGRESS.find((item) => item.value === value)?.icon || "🤔";
}

function getGoalTone(value) {
  switch (value) {
    case "on_track":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "too_slow":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "too_fast":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    default:
      return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function getWeightDifference(current, previous) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return null;
  }

  const difference = Number(current) - Number(previous);

  if (Number.isNaN(difference)) return null;

  return difference;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  iconClassName = "bg-orange-500/10 text-orange-500",
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-400">{label}</p>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-white">
              {value}
            </span>

            {suffix && (
              <span className="text-sm font-semibold text-zinc-500">
                {suffix}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs text-zinc-500">{description}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function DietProgressPage() {
  const [form, setForm] = useState(INITIAL_FORM);

  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dietProfile, setDietProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/member/diet/progress", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load progress.");
      }

      setProgress(Array.isArray(data.progress) ? data.progress : []);
      setSummary(data.summary || null);
      setDietProfile(data.dietProfile || null);

      const latest = data.progress?.[0];

      if (latest) {
        setForm({
          weightKg:
            latest.weightKg !== null && latest.weightKg !== undefined
              ? String(latest.weightKg)
              : "",
          workoutDaysPerWeek:
            latest.workoutDaysPerWeek !== null &&
            latest.workoutDaysPerWeek !== undefined
              ? String(latest.workoutDaysPerWeek)
              : "4",
          energyLevel: latest.energyLevel || "normal",
          goalProgress: latest.goalProgress || "not_sure",
          notes: latest.notes || "",
        });
      }
    } catch (err) {
      console.error("LOAD DIET PROGRESS ERROR:", err);
      setError(err.message || "Failed to load progress.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function selectEnergy(value) {
    setForm((previous) => ({
      ...previous,
      energyLevel: value,
    }));

    setError("");
    setSuccess("");
  }

  function selectGoal(value) {
    setForm((previous) => ({
      ...previous,
      goalProgress: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const weight = Number(form.weightKg);
    const workoutDays = Number(form.workoutDaysPerWeek);

    if (!form.weightKg || Number.isNaN(weight)) {
      setError("Please enter your current weight.");
      return;
    }

    if (weight < 30 || weight > 300) {
      setError("Weight must be between 30 kg and 300 kg.");
      return;
    }

    if (
      form.workoutDaysPerWeek === "" ||
      Number.isNaN(workoutDays) ||
      workoutDays < 0 ||
      workoutDays > 7
    ) {
      setError("Workout days must be between 0 and 7.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/member/diet/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weightKg: weight,
          workoutDaysPerWeek: workoutDays,
          energyLevel: form.energyLevel,
          goalProgress: form.goalProgress,
          notes: form.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to record progress.");
      }

      setSuccess("Your progress has been recorded successfully.");

      await loadProgress();
    } catch (err) {
      console.error("SAVE DIET PROGRESS ERROR:", err);
      setError(err.message || "Failed to record progress.");
    } finally {
      setSaving(false);
    }
  }

  const latestProgress = progress?.[0] || null;
  const previousProgress = progress?.[1] || null;

  const weightDifference = useMemo(() => {
    return getWeightDifference(
      latestProgress?.weightKg,
      previousProgress?.weightKg
    );
  }, [latestProgress, previousProgress]);

  const visibleProgress = showAll ? progress : progress.slice(0, 6);

  const progressCount = progress.length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b]">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500">
              <Loader2 className="animate-spin" size={26} />
            </div>

            <h2 className="mt-4 text-lg font-black text-white">
              Loading your progress
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Please wait a moment...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] pb-16 text-white">
      {/* Header */}
      <section className="border-b border-zinc-800 bg-[#0c0c0f]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/member/diet"
                className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
              >
                <ArrowLeft size={16} />
                Back to Diet
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
                  <Activity size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Diet Progress
                  </h1>

                  <p className="mt-1 text-sm text-zinc-500">
                    Track your body changes and how your diet is working.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/member/diet"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-500"
            >
              Diet Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            <XCircle className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-bold">Progress saved</p>
              <p className="mt-1 text-sm text-emerald-300">{success}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Scale}
            label="Current Weight"
            value={
              latestProgress?.weightKg
                ? formatNumber(latestProgress.weightKg)
                : "—"
            }
            suffix={latestProgress?.weightKg ? "kg" : ""}
            description={
              latestProgress
                ? `Updated ${formatDate(latestProgress.recordedAt)}`
                : "No progress recorded yet"
            }
          />

          <MetricCard
            icon={TrendingUp}
            label="Weight Change"
            value={
              weightDifference === null
                ? "—"
                : `${weightDifference > 0 ? "+" : ""}${formatNumber(
                    weightDifference
                  )}`
            }
            suffix={weightDifference === null ? "" : "kg"}
            description={
              previousProgress
                ? "Compared with previous entry"
                : "Add another entry to compare"
            }
            iconClassName={
              weightDifference === null
                ? "bg-zinc-800 text-zinc-400"
                : weightDifference > 0
                ? "bg-blue-500/10 text-blue-400"
                : "bg-emerald-500/10 text-emerald-400"
            }
          />

          <MetricCard
            icon={Dumbbell}
            label="Workout Days"
            value={
              latestProgress?.workoutDaysPerWeek !== null &&
              latestProgress?.workoutDaysPerWeek !== undefined
                ? latestProgress.workoutDaysPerWeek
                : "—"
            }
            suffix={
              latestProgress?.workoutDaysPerWeek !== null &&
              latestProgress?.workoutDaysPerWeek !== undefined
                ? "/ week"
                : ""
            }
            description="Your latest weekly average"
            iconClassName="bg-purple-500/10 text-purple-400"
          />

          <MetricCard
            icon={Target}
            label="Goal Progress"
            value={
              latestProgress
                ? getGoalLabel(latestProgress.goalProgress)
                : "—"
            }
            description={
              latestProgress
                ? `${getGoalIcon(latestProgress.goalProgress)} Latest update`
                : "Submit your first update"
            }
            iconClassName="bg-amber-500/10 text-amber-400"
          />
        </section>

        {/* Diet profile */}
        {dietProfile && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
            <div className="border-b border-zinc-800 bg-zinc-900/80 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />

                <h2 className="font-black text-white">Your Diet Goal</h2>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
              {[
                ["Goal", dietProfile.goal || "—"],
                [
                  "Target Weight",
                  dietProfile.targetWeightKg
                    ? `${formatNumber(dietProfile.targetWeightKg)} kg`
                    : "—",
                ],
                [
                  "Daily Calories",
                  dietProfile.dailyCalories
                    ? `${Math.round(dietProfile.dailyCalories)} kcal`
                    : "—",
                ],
                ["Progress Entries", progressCount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-800 bg-[#141416] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>

                  <p className="mt-2 font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Record progress */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
          <div className="border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
                <Activity size={20} />
              </div>

              <div>
                <h2 className="text-lg font-black text-white">
                  Record Today&apos;s Progress
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Keep your entries consistent so you can understand your
                  progress over time.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Weight */}
              <div>
                <label
                  htmlFor="weightKg"
                  className="mb-2 block text-sm font-bold text-zinc-200"
                >
                  Current Weight
                </label>

                <div className="relative">
                  <Scale
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    value={form.weightKg}
                    onChange={handleChange}
                    placeholder="e.g. 68.5"
                    className="w-full rounded-xl border border-zinc-700 bg-[#141416] py-3 pl-10 pr-14 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    kg
                  </span>
                </div>
              </div>

              {/* Workout */}
              <div>
                <label
                  htmlFor="workoutDaysPerWeek"
                  className="mb-2 block text-sm font-bold text-zinc-200"
                >
                  Workout Days Per Week
                </label>

                <div className="relative">
                  <Dumbbell
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <select
                    id="workoutDaysPerWeek"
                    name="workoutDaysPerWeek"
                    value={form.workoutDaysPerWeek}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#141416] py-3 pl-10 pr-10 text-sm font-semibold text-white outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  >
                    <option value="0">0 days</option>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                    <option value="7">7 days</option>
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Energy */}
            <div className="mt-7">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white">
                  How is your energy level?
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Choose the option that best describes how you have been
                  feeling.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {ENERGY_LEVELS.map((item) => {
                  const selected = form.energyLevel === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectEnergy(item.value)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                          : "border-zinc-800 bg-[#141416] hover:border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="text-xl">{item.icon}</div>

                      <p
                        className={`mt-2 text-sm font-black ${
                          selected ? "text-orange-400" : "text-zinc-200"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal */}
            <div className="mt-7">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white">
                  How is your goal progressing?
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  This helps you and your trainer understand whether your
                  current plan is working.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {GOAL_PROGRESS.map((item) => {
                  const selected = form.goalProgress === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectGoal(item.value)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                          : "border-zinc-800 bg-[#141416] hover:border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="text-xl">{item.icon}</div>

                      <p
                        className={`mt-2 text-sm font-black ${
                          selected ? "text-orange-400" : "text-zinc-200"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-7">
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-bold text-zinc-200"
              >
                Notes
                <span className="ml-2 font-medium text-zinc-600">
                  Optional
                </span>
              </label>

              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                maxLength={100}
                rows={4}
                placeholder="Anything important about your diet, workout, energy, sleep, or progress..."
                className="w-full resize-none rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-zinc-600">
                  {form.notes.length}/500
                </span>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <Info size={15} className="mt-0.5 shrink-0" />

                <span>
                  Record your progress regularly for better tracking.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Progress
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Latest status */}
        {latestProgress && (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Latest Check-in
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    {formatDate(latestProgress.recordedAt)}
                  </h2>
                </div>

                <div
                  className={`rounded-full border px-3 py-1.5 text-xs font-black ${getGoalTone(
                    latestProgress.goalProgress
                  )}`}
                >
                  {getGoalIcon(latestProgress.goalProgress)}{" "}
                  {getGoalLabel(latestProgress.goalProgress)}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  [
                    "Weight",
                    `${formatNumber(latestProgress.weightKg)} kg`,
                  ],
                  [
                    "Workout",
                    `${latestProgress.workoutDaysPerWeek ?? "—"} days/week`,
                  ],
                  [
                    "Energy",
                    getEnergyLabel(latestProgress.energyLevel),
                  ],
                  ["Check-ins", progressCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-zinc-800 bg-[#141416] p-4"
                  >
                    <p className="text-xs font-semibold text-zinc-500">
                      {label}
                    </p>

                    <p className="mt-1 text-lg font-black text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {latestProgress.notes && (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-[#141416] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Notes
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {latestProgress.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10 sm:p-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-orange-500" />

                <h2 className="font-black text-white">
                  Progress Overview
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: Scale,
                    title: "Current Weight",
                    description: "Latest recorded weight",
                    value: `${formatNumber(latestProgress.weightKg)} kg`,
                    className: "bg-orange-500/10 text-orange-500",
                  },
                  {
                    icon: Dumbbell,
                    title: "Training Frequency",
                    description: "Average workouts per week",
                    value: `${latestProgress.workoutDaysPerWeek ?? "—"}/7`,
                    className: "bg-purple-500/10 text-purple-400",
                  },
                  {
                    icon: Flame,
                    title: "Energy Level",
                    description: "How you have been feeling",
                    value: getEnergyLabel(latestProgress.energyLevel),
                    className: "bg-amber-500/10 text-amber-400",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#141416] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.className}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-zinc-200">
                            {item.title}
                          </p>

                          <p className="text-xs text-zinc-600">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <p className="font-black text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* History */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-black text-white">
                Progress History
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Your previous diet progress entries.
              </p>
            </div>

            {progress.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAll((previous) => !previous)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-500"
              >
                {showAll ? "Show Less" : "View All"}
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          {visibleProgress.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-800 text-zinc-500">
                <Activity size={25} />
              </div>

              <h3 className="mt-4 font-black text-white">
                No progress recorded yet
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
                Add your first progress entry above to start tracking your
                journey.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {visibleProgress.map((item, index) => {
                const previous = visibleProgress[index + 1];

                const change = getWeightDifference(
                  item.weightKg,
                  previous?.weightKg
                );

                return (
                  <div
                    key={item._id || `${item.recordedAt}-${index}`}
                    className="p-5 transition hover:bg-zinc-800/30 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                          <CalendarDays size={19} />
                        </div>

                        <div>
                          <p className="font-black text-white">
                            {formatDate(item.recordedAt)}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                            <span>
                              Energy:{" "}
                              <strong className="text-zinc-300">
                                {getEnergyLabel(item.energyLevel)}
                              </strong>
                            </span>

                            <span className="hidden sm:inline">•</span>

                            <span>
                              Workout:{" "}
                              <strong className="text-zinc-300">
                                {item.workoutDaysPerWeek ?? "—"}/7
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[500px]">
                        <div className="rounded-xl border border-zinc-800 bg-[#141416] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                            Weight
                          </p>

                          <p className="mt-1 text-sm font-black text-white">
                            {formatNumber(item.weightKg)} kg
                          </p>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-[#141416] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                            Change
                          </p>

                          <p
                            className={`mt-1 text-sm font-black ${
                              change === null
                                ? "text-zinc-500"
                                : change > 0
                                ? "text-blue-400"
                                : change < 0
                                ? "text-emerald-400"
                                : "text-zinc-300"
                            }`}
                          >
                            {change === null
                              ? "—"
                              : `${change > 0 ? "+" : ""}${formatNumber(
                                  change
                                )} kg`}
                          </p>
                        </div>

                        <div
                          className={`col-span-2 rounded-xl border px-4 py-3 sm:col-span-1 ${getGoalTone(
                            item.goalProgress
                          )}`}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                            Goal
                          </p>

                          <p className="mt-1 text-sm font-black">
                            {getGoalIcon(item.goalProgress)}{" "}
                            {getGoalLabel(item.goalProgress)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-[#141416] p-4">
                        <p className="text-xs leading-5 text-zinc-400">
                          <span className="font-black text-zinc-300">
                            Note:
                          </span>{" "}
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
          <Ruler className="mt-0.5 shrink-0 text-orange-500" size={19} />

          <div>
            <p className="text-sm font-black text-orange-300">
              Track consistently
            </p>

            <p className="mt-1 text-xs leading-5 text-orange-200/70">
              Try to record your weight under similar conditions each time,
              preferably at the same time of day. This makes your progress
              easier to understand.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}