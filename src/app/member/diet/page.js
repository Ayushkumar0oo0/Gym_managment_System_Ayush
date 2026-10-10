"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  Dumbbell,
  Flame,
  Loader2,
  Pencil,
  Salad,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Utensils,
  X,
  Zap,
  CalendarDays,
  Clock3,
  HeartPulse,
  RefreshCw,
} from "lucide-react";

const GOALS = [
  { value: "weight_gain", label: "Weight Gain" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "fat_loss", label: "Fat Loss" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general_fitness", label: "General Fitness" },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10";

function goalLabel(goal) {
  return GOALS.find((item) => item.value === goal)?.label || "General Fitness";
}

function dateLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function numberLabel(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "0";
}

function bmiLabel(value) {
  const bmi = Number(value);

  if (!Number.isFinite(bmi)) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";

  return "High";
}

function recipeHref(recipeId) {
  if (!recipeId) return null;

  return `/member/diet/recipes?recipe=${encodeURIComponent(recipeId)}`;
}

export default function MemberDietPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    age: "",
    gender: "male",
    heightCm: "",
    currentWeightKg: "",
    goal: "general_fitness",
    dietType: "non_vegetarian",
    nonVegRestrictedDays: [],
    workoutDaysPerWeek: "4",
  });

  const bmiPreview = useMemo(() => {
    const height = Number(form.heightCm);
    const weight = Number(form.currentWeightKg);

    if (!height || !weight) return null;

    return weight / (height / 100) ** 2;
  }, [form.heightCm, form.currentWeightKg]);

  const loadPlan = useCallback(async () => {
    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/member/diet", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to generate your diet plan."
        );
      }

      setPlan(data?.dietPlan || null);

      if (data?.dietProfile) {
        setProfile(data.dietProfile);
      }
    } catch (err) {
      setError(err?.message || "Unable to generate your diet plan.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/member/diet/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load diet profile.");
      }

      const current = data?.dietProfile || null;

      setProfile(current);

      if (!current) {
        setPlan(null);
        return;
      }

      setForm({
        age: current.age ?? "",
        gender: current.gender ?? "male",
        heightCm: current.heightCm ?? "",
        currentWeightKg: current.currentWeightKg ?? "",
        goal: current.goal ?? "general_fitness",
        dietType: current.dietType ?? "non_vegetarian",
        nonVegRestrictedDays: Array.isArray(
          current.nonVegRestrictedDays
        )
          ? current.nonVegRestrictedDays
          : Array.isArray(current.restrictedDays)
            ? current.restrictedDays
            : [],
        workoutDaysPerWeek: current.workoutDaysPerWeek ?? "4",
      });

      await loadPlan();
    } catch (err) {
      setError(err?.message || "Unable to load your diet.");
    } finally {
      setLoading(false);
    }
  }, [loadPlan]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function changeField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      nonVegRestrictedDays: current.nonVegRestrictedDays.includes(day)
        ? current.nonVegRestrictedDays.filter((item) => item !== day)
        : [...current.nonVegRestrictedDays, day],
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        age: Number(form.age),
        gender: form.gender,
        heightCm: Number(form.heightCm),
        currentWeightKg: Number(form.currentWeightKg),
        goal: form.goal,
        dietType: form.dietType,
        nonVegRestrictedDays:
          form.dietType === "non_vegetarian"
            ? form.nonVegRestrictedDays
            : [],
        workoutDaysPerWeek: Number(form.workoutDaysPerWeek),
      };

      const response = await fetch("/api/member/diet/profile", {
        method: profile ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to save your diet profile."
        );
      }

      setProfile(data?.dietProfile || data?.profile || null);
      setEditing(false);
      setMessage("Your diet profile has been saved.");

      await loadPlan();
    } catch (err) {
      setError(err?.message || "Unable to save your diet profile.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadDietPlan() {
    setDownloading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/member/diet/pdf", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "Unable to download your diet plan."
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");

      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || "my-diet-plan.pdf";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setMessage("Your diet plan PDF has been downloaded.");
    } catch (err) {
      setError(err?.message || "Unable to download your diet plan.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-4 w-36 rounded bg-zinc-800" />
          <div className="mt-6 h-12 max-w-md rounded-xl bg-zinc-900" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 rounded-3xl bg-zinc-900" />
            ))}
          </div>

          <div className="mt-6 h-64 rounded-3xl bg-zinc-900" />
        </div>
      </main>
    );
  }

  if (!profile || editing) {
    return (
      <DietProfileForm
        profile={profile}
        form={form}
        bmiPreview={bmiPreview}
        saving={saving}
        error={error}
        onChange={changeField}
        onToggleDay={toggleDay}
        onSubmit={saveProfile}
        onCancel={() => {
          setEditing(false);
          setError("");
        }}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/[0.09] blur-[140px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
                <Salad size={14} />
                Nutrition & Fitness
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                My Diet <span className="text-orange-500">Plan.</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                Your personalized nutrition guide to support your workouts,
                recovery, and fitness goals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/member/diet/recipes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-3.5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/40 hover:text-orange-400"
              >
                <Utensils size={16} />
                Recipes
              </Link>

              <Link
                href="/member/diet/progress"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-3.5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/40 hover:text-orange-400"
              >
                <BarChart3 size={16} />
                Progress
              </Link>

              <button
                type="button"
                onClick={downloadDietPlan}
                disabled={downloading || generating || !plan}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {downloading ? "Preparing PDF..." : "Download PDF"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setEditing(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400"
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
          >
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Hero banner */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#211309] via-[#130e0a] to-[#101010] p-6 sm:p-8">
          <div className="pointer-events-none absolute right-[-30px] top-[-50px] h-60 w-60 rounded-full bg-orange-500/10 blur-[70px]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-orange-400">
                <Sparkles size={17} />
                <span className="text-xs font-bold uppercase tracking-[0.17em]">
                  Your weekly nutrition guide
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                Eat better. Train harder. Recover smarter.
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Follow your daily meals, check your nutrition targets, and
                keep a copy of your diet plan on your device.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <CalendarDays size={23} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">
                  Plan duration
                </p>
                <p className="mt-1 text-lg font-black">
                  {plan?.days?.length || 7} days
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Personal overview */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={<Target size={19} />}
            label="Your Goal"
            value={goalLabel(plan?.goal || profile.goal)}
            highlight
          />

          <InfoCard
            icon={<Scale size={19} />}
            label="Current Weight"
            value={`${numberLabel(
              plan?.currentWeight ?? profile.currentWeightKg,
              1
            )} kg`}
          />

          <InfoCard
            icon={<HeartPulse size={19} />}
            label="BMI"
            value={
              plan?.bmi
                ? `${numberLabel(plan.bmi, 1)} · ${bmiLabel(plan.bmi)}`
                : "Not available"
            }
          />

          <InfoCard
            icon={<Flame size={19} />}
            label="Diet Phase"
            value={`Phase ${plan?.phase || profile.currentPhase || 1}`}
            subtitle={plan?.phaseName || "Foundation"}
          />
        </section>

        {/* Daily nutrition */}
        <section className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Zap size={19} />
            </div>
            <div>
              <h2 className="text-lg font-black">Daily Nutrition Targets</h2>
              <p className="text-xs text-zinc-500">
                Your estimated daily nutrition goals
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NutritionCard
              icon={<Flame size={18} />}
              label="Calories"
              value={plan?.calories}
              unit="kcal"
            />
            <NutritionCard
              icon={<Dumbbell size={18} />}
              label="Protein"
              value={plan?.protein}
              unit="g"
            />
            <NutritionCard
              icon={<Zap size={18} />}
              label="Carbohydrates"
              value={plan?.carbs}
              unit="g"
            />
            <NutritionCard
              icon={<Scale size={18} />}
              label="Fats"
              value={plan?.fats}
              unit="g"
            />
          </div>
        </section>

        {/* Diet plan and sidebar */}
        <section className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Utensils size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    Your meal schedule
                  </span>
                </div>

                <h2 className="mt-2 text-2xl font-black">Weekly Diet Plan</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Meal suggestions and portions for each day.
                </p>
              </div>

              <button
                type="button"
                onClick={loadPlan}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111113] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                {generating ? "Refreshing..." : "Refresh Plan"}
              </button>
            </div>

            {plan?.days?.length ? (
              <div className="space-y-4">
                {plan.days.map((day, index) => (
                  <DayCard key={day.day || index} day={day} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-[#101010] px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Salad size={28} />
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Your diet plan is not available
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Try generating your plan again. If the problem continues,
                  check your diet profile.
                </p>

                <button
                  type="button"
                  onClick={loadPlan}
                  disabled={generating}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:opacity-50"
                >
                  {generating && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Generate Diet Plan
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-3xl border border-white/10 bg-[#101010] p-5">
              <div className="flex items-center gap-2 text-orange-400">
                <Scale size={17} />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  Personal information
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black">Your Profile</h2>

              <div className="mt-5 space-y-4">
                <DetailRow
                  label="Height"
                  value={`${numberLabel(
                    plan?.height ?? profile.heightCm,
                    1
                  )} cm`}
                />
                <DetailRow
                  label="Age"
                  value={`${plan?.age ?? profile.age ?? "—"} years`}
                />
                <DetailRow
                  label="Diet type"
                  value={
                    (plan?.dietType || profile.dietType) === "vegetarian"
                      ? "Vegetarian"
                      : "Non-vegetarian"
                  }
                />
                <DetailRow
                  label="Workout"
                  value={`${plan?.workoutDays ?? profile.workoutDaysPerWeek ?? "—"} days/week`}
                />
                <DetailRow
                  label="Review in"
                  value={
                    plan?.daysUntilReview != null
                      ? `${plan.daysUntilReview} days`
                      : "—"
                  }
                />
                <DetailRow
                  label="Plan generated"
                  value={dateLabel(plan?.generatedAt)}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setEditing(true);
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                <Pencil size={15} />
                Update My Details
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#101010] p-5">
              <div className="flex items-center gap-2 text-orange-400">
                {Number(plan?.weightChange || 0) > 0 ? (
                  <TrendingUp size={17} />
                ) : (
                  <TrendingDown size={17} />
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  Progress overview
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black">Weight Change</h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold text-zinc-500">
                  Recorded change
                </p>

                <p
                  className={`mt-2 text-3xl font-black ${
                    Number(plan?.weightChange || 0) > 0
                      ? "text-orange-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Number(plan?.weightChange || 0) > 0 ? "+" : ""}
                  {numberLabel(plan?.weightChange || 0, 1)} kg
                </p>
              </div>

              {plan?.progressRecommendation && (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  {plan.progressRecommendation}
                </p>
              )}

              <Link
                href="/member/diet/progress"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                View Full Progress
                <ArrowRight size={15} />
              </Link>
            </section>

            <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] to-[#101010] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Download size={20} />
              </div>

              <h2 className="mt-4 text-lg font-black">Keep Your Plan Handy</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Save your diet plan as a PDF so you can refer to your meals
                whenever you need them.
              </p>

              <button
                type="button"
                onClick={downloadDietPlan}
                disabled={downloading || !plan}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Preparing PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Diet PDF
                  </>
                )}
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#101010] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-orange-400">
                <Utensils size={20} />
              </div>

              <h2 className="mt-4 text-lg font-black">Explore Recipes</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Find recipe ideas for meals in your diet plan.
              </p>

              <Link
                href="/member/diet/recipes"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-400 transition hover:text-orange-300"
              >
                Browse Recipes
                <ArrowRight size={15} />
              </Link>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#101010] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-300">
                <Dumbbell size={20} />
              </div>

              <h2 className="mt-4 text-lg font-black">Gym Products</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Supplements and gym products are optional, not a requirement
                for following your diet.
              </p>

              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-400 transition hover:text-orange-300"
              >
                Browse Products
                <ArrowRight size={15} />
              </Link>
            </section>
          </aside>
        </section>

        {/* Important notes */}
        {Array.isArray(plan?.notes) && plan.notes.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#101010] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <Zap size={17} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                Plan guidance
              </span>
            </div>

            <h2 className="mt-2 text-xl font-black">Important Notes</h2>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plan.notes.map((note, index) => (
                <li
                  key={`${note}-${index}`}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-400"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-4 text-xs leading-5 text-amber-100/60">
          This diet plan provides general fitness guidance and is not medical
          advice. If you have a medical condition, food allergy, or special
          nutritional requirement, consult a qualified healthcare or nutrition
          professional.
        </div>
      </div>
    </main>
  );
}

function DietProfileForm({
  profile,
  form,
  bmiPreview,
  saving,
  error,
  onChange,
  onToggleDay,
  onSubmit,
  onCancel,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] px-4 py-7 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-230px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            <Salad size={14} />
            Nutrition Setup
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {profile ? "Update Your Diet" : "Create Your Diet Plan"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Tell us about your body, food preferences, and workout routine to
            generate your personalized diet plan.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="mt-7 rounded-3xl border border-white/10 bg-[#101010] p-5 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-lg font-black">Personal Details</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter accurate details for more relevant targets.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Age"
              name="age"
              type="number"
              min="14"
              max="100"
              value={form.age}
              onChange={onChange}
              placeholder="e.g. 22"
              required
            />

            <SelectField
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={onChange}
              options={[
                ["male", "Male"],
                ["female", "Female"],
              ]}
            />

            <Field
              label="Height"
              name="heightCm"
              type="number"
              min="100"
              max="250"
              step="0.1"
              value={form.heightCm}
              onChange={onChange}
              placeholder="e.g. 175"
              suffix="cm"
              required
            />

            <Field
              label="Current Weight"
              name="currentWeightKg"
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={form.currentWeightKg}
              onChange={onChange}
              placeholder="e.g. 65"
              suffix="kg"
              required
            />

            <SelectField
              label="Your Goal"
              name="goal"
              value={form.goal}
              onChange={onChange}
              options={GOALS.map((item) => [item.value, item.label])}
            />

            <SelectField
              label="Diet Type"
              name="dietType"
              value={form.dietType}
              onChange={onChange}
              options={[
                ["non_vegetarian", "Non-Vegetarian"],
                ["vegetarian", "Vegetarian"],
              ]}
            />

            <div className="sm:col-span-2">
              <SelectField
                label="Workout Days Per Week"
                name="workoutDaysPerWeek"
                value={form.workoutDaysPerWeek}
                onChange={onChange}
                options={Array.from({ length: 8 }, (_, index) => [
                  String(index),
                  `${index} ${index === 1 ? "day" : "days"} per week`,
                ])}
              />
            </div>
          </div>

          {form.dietType === "non_vegetarian" && (
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <Utensils size={17} className="text-orange-400" />
                <h2 className="font-black">Non-Veg Restricted Days</h2>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Select days when you prefer not to eat non-vegetarian food.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {DAYS.map((day) => {
                  const selected = form.nonVegRestrictedDays.includes(day);

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => onToggleDay(day)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-black"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-orange-500/40 hover:text-white"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {bmiPreview != null && Number.isFinite(bmiPreview) && (
            <div className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-5">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Scale size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Estimated BMI
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {bmiLabel(bmiPreview)}
                </p>
              </div>

              <div className="text-3xl font-black">
                {numberLabel(bmiPreview, 1)}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {profile && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  {profile ? "Save & Update Diet" : "Create My Diet"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function DayCard({ day }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] transition hover:border-white/15">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <CalendarDays size={19} />
          </div>

          <div>
            <h3 className="text-lg font-black capitalize">
              {day.day || "Daily Meals"}
            </h3>

            {day.isWorkoutDay && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                <Flame size={11} />
                Workout Day
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatPill
            label="Calories"
            value={`${numberLabel(day.calories ?? day.totalCalories)} kcal`}
          />
          <StatPill
            label="Protein"
            value={`${numberLabel(day.protein ?? day.totalProtein)} g`}
          />
        </div>
      </div>

      <div className="divide-y divide-white/[0.07]">
        {(day.meals || []).map((meal, index) => (
          <MealCard key={`${meal.name || "meal"}-${index}`} meal={meal} />
        ))}
      </div>
    </article>
  );
}

function MealCard({ meal }) {
  const mealCalories =
    meal.calories ??
    (meal.items || []).reduce(
      (sum, item) => sum + Number(item.calories || 0),
      0
    );

  return (
    <div className="p-5 transition hover:bg-white/[0.01]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 font-black text-zinc-100">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          {meal.name || "Meal"}
        </h4>

        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-zinc-500">
          <Flame size={13} className="text-orange-400" />
          {numberLabel(mealCalories)} kcal
        </span>
      </div>

      <div className="space-y-2">
        {(meal.items || []).map((item, index) => {
          const href = recipeHref(item.recipeId);

          return (
            <div
              key={`${item.foodId || item.id || item.name || "food"}-${index}`}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-200">
                    {item.name || "Food item"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.serving || item.quantity || "1 serving"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-black/30 px-2.5 py-2 text-zinc-400">
                    {numberLabel(item.calories)} kcal
                  </span>

                  <span className="rounded-lg bg-black/30 px-2.5 py-2 text-zinc-400">
                    P {numberLabel(item.protein, 1)}g
                  </span>

                  {href && (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
                    >
                      Recipe
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {(!meal.items || meal.items.length === 0) && (
          <p className="text-sm text-zinc-500">
            No food items are listed for this meal.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, suffix, ...props }) {
  return (
    <div>
      <label
        htmlFor={props.name}
        className="mb-2 block text-sm font-semibold text-zinc-200"
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          id={props.name}
          className={`${inputClass} ${suffix ? "pr-14" : ""}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-zinc-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, options, ...props }) {
  return (
    <div>
      <label
        htmlFor={props.name}
        className="mb-2 block text-sm font-semibold text-zinc-200"
      >
        {label}
      </label>

      <div className="relative">
        <select
          {...props}
          id={props.name}
          className={`${inputClass} appearance-none pr-10`}
        >
          {options.map(([value, text]) => (
            <option key={value} value={value} className="bg-zinc-900 text-white">
              {text}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, subtitle, highlight = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        highlight
          ? "border-orange-500/20 bg-orange-500/[0.05]"
          : "border-white/[0.08] bg-[#101010]"
      }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
      )}

      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            highlight
              ? "bg-orange-500/10 text-orange-400"
              : "bg-white/[0.04] text-zinc-400"
          }`}
        >
          {icon}
        </div>

        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>

        <p className="mt-1 break-words text-lg font-black text-white">
          {value}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function NutritionCard({ icon, label, value, unit }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#101010] p-5 transition hover:border-orange-500/20">
      <div className="flex items-center gap-2 text-orange-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-black">
        {numberLabel(value)}
        <span className="ml-1.5 text-sm font-bold text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-bold text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <span className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-xs text-zinc-400">
      <span className="mr-1 text-zinc-500">{label}:</span>
      <span className="font-bold text-zinc-200">{value}</span>
    </span>
  );
}