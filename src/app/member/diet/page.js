"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
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
  "h-13 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/60 focus:bg-orange-500/[0.04] focus:ring-4 focus:ring-orange-500/10";

function goalLabel(goal) {
  return (
    GOALS.find((item) => item.value === goal)?.label ||
    "General Fitness"
  );
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
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "0";
}

function bmiLabel(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) return "—";
  if (n < 18.5) return "Underweight";
  if (n < 25) return "Normal";
  if (n < 30) return "Overweight";

  return "High";
}

function recipeHref(recipeId) {
  if (!recipeId) return null;

  return `/member/diet/recipes?recipe=${encodeURIComponent(
    recipeId
  )}`;
}

export default function MemberDietPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  async function loadPlan() {
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
      setError(
        err?.message || "Unable to generate your diet plan."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/member/diet/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load diet profile."
        );
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
        workoutDaysPerWeek:
          current.workoutDaysPerWeek ?? "4",
      });

      await loadPlan();
    } catch (err) {
      setError(
        err?.message || "Unable to load your diet."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

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
      nonVegRestrictedDays:
        current.nonVegRestrictedDays.includes(day)
          ? current.nonVegRestrictedDays.filter(
              (item) => item !== day
            )
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
      setError(
        err?.message || "Unable to save your diet profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-6 w-36 rounded bg-zinc-800" />
          <div className="mt-5 h-12 w-72 rounded-xl bg-zinc-900" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-3xl bg-zinc-900"
              />
            ))}
          </div>

          <div className="mt-6 h-96 rounded-3xl bg-zinc-900" />
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
          if (profile) {
            setEditing(false);
            setError("");
          }
        }}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[-220px] right-[-120px] h-[420px] w-[420px] rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
              >
                <ArrowLeft size={15} />
                Back to Dashboard
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                <Salad size={13} />
                Nutrition & Fitness
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                My{" "}
                <span className="text-orange-500">Diet Plan</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Your personalized 7-day fitness nutrition plan,
                built around your body, goals and training routine.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/member/diet/recipes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                <Utensils size={16} />
                Recipes
              </Link>

              <Link
                href="/member/diet/progress"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                <BarChart3 size={16} />
                Progress
              </Link>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                <Pencil size={15} />
                Update Profile
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {/* Profile overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={<Target size={19} />}
            label="Goal"
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
            icon={<BarChart3 size={19} />}
            label="BMI"
            value={
              plan?.bmi
                ? `${numberLabel(plan.bmi, 1)} · ${bmiLabel(
                    plan.bmi
                  )}`
                : "—"
            }
          />

          <InfoCard
            icon={<Flame size={19} />}
            label="Diet Phase"
            value={`Phase ${
              plan?.phase || profile.currentPhase || 1
            } · ${plan?.phaseName || "Foundation"}`}
          />
        </section>

        {/* Nutrition targets */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NutritionCard
            icon={<Flame size={18} />}
            label="Daily Calories"
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
            icon={<CircleDollarSign size={18} />}
            label="Fats"
            value={plan?.fats}
            unit="g"
          />
        </section>

        {/* Main content */}
        <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_330px]">
          {/* 7-day plan */}
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Dumbbell size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    Weekly Training Fuel
                  </span>
                </div>

                <h2 className="mt-1 text-2xl font-black">
                  7-Day Diet
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Follow the portions shown for each meal.
                </p>
              </div>

              <button
                type="button"
                onClick={loadPlan}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Regenerate Plan
                  </>
                )}
              </button>
            </div>

            {plan?.days?.length ? (
              <div className="space-y-5">
                {plan.days.map((day, index) => (
                  <DayCard
                    key={day.day || index}
                    day={day}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Salad size={28} />
                </div>

                <p className="mt-5 text-sm font-bold text-zinc-300">
                  Your diet plan is not available yet.
                </p>

                <button
                  type="button"
                  onClick={loadPlan}
                  className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                >
                  Generate Diet
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20">
              <div className="flex items-center gap-2 text-orange-400">
                <Scale size={17} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                  Your Profile
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black">
                Your Details
              </h2>

              <div className="mt-5 space-y-3">
                <DetailRow
                  label="Height"
                  value={`${numberLabel(
                    plan?.height ?? profile.heightCm,
                    1
                  )} cm`}
                />

                <DetailRow
                  label="Age"
                  value={`${plan?.age ?? profile.age} years`}
                />

                <DetailRow
                  label="Diet"
                  value={
                    plan?.dietType === "vegetarian"
                      ? "Vegetarian"
                      : "Non-Vegetarian"
                  }
                />

                <DetailRow
                  label="Workout"
                  value={`${plan?.workoutDays ?? profile.workoutDaysPerWeek} days/week`}
                />

                <DetailRow
                  label="Review"
                  value={`${plan?.daysUntilReview ?? "—"} days`}
                />

                <DetailRow
                  label="Generated"
                  value={dateLabel(plan?.generatedAt)}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/20">
              <div className="flex items-center gap-2 text-orange-400">
                {Number(plan?.weightChange || 0) > 0 ? (
                  <TrendingUp size={17} />
                ) : (
                  <TrendingDown size={17} />
                )}

                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                  Progress
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black">
                Weight Change
              </h2>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Current change
                </p>

                <p
                  className={`mt-1 text-3xl font-black ${
                    Number(plan?.weightChange || 0) > 0
                      ? "text-orange-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Number(plan?.weightChange || 0) > 0
                    ? "+"
                    : ""}
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
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                View Full Progress
                <ArrowRight size={15} />
              </Link>
            </section>

            <section className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.04] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Utensils size={20} />
              </div>

              <h2 className="mt-4 text-lg font-black">
                Explore Recipes
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Simple, affordable recipes for meals in your plan.
              </p>

              <Link
                href="/member/diet/recipes"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black transition hover:bg-orange-400"
              >
                Browse Recipes
                <ArrowRight size={15} />
              </Link>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                <Dumbbell size={20} />
              </div>

              <h2 className="mt-4 text-lg font-black">
                Gym Products
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Supplements and gym products are optional and are not
                required to follow your diet.
              </p>

              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
              >
                Browse Products
                <ArrowRight size={15} />
              </Link>
            </section>
          </aside>
        </section>

        {/* Important notes */}
        {Array.isArray(plan?.notes) && plan.notes.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <Zap size={17} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                Plan Guidance
              </span>
            </div>

            <h2 className="mt-2 text-xl font-black">
              Important Notes
            </h2>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plan.notes.map((note, index) => (
                <li
                  key={`${note}-${index}`}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-500"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs leading-5 text-amber-200/60">
          This diet plan is general fitness guidance and is not
          medical advice. If you have a medical condition, allergy,
          eating disorder, or special nutritional requirement,
          consult a qualified healthcare or nutrition professional.
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
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-240px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>

        <div className="mt-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            <Salad size={13} />
            Nutrition Setup
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {profile
              ? "Update Your Diet"
              : "Create Your Diet Plan"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Enter your details and the system will automatically
            generate an affordable 7-day Indian diet plan.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="mt-7 rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Age"
              name="age"
              type="number"
              min="14"
              max="100"
              value={form.age}
              onChange={onChange}
              placeholder="21"
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
              placeholder="180"
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
              placeholder="65"
              suffix="kg"
              required
            />

            <SelectField
              label="Your Goal"
              name="goal"
              value={form.goal}
              onChange={onChange}
              options={GOALS.map((item) => [
                item.value,
                item.label,
              ])}
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

            <div className="md:col-span-2">
              <SelectField
                label="Workout Days Per Week"
                name="workoutDaysPerWeek"
                value={form.workoutDaysPerWeek}
                onChange={onChange}
                options={Array.from({ length: 8 }, (_, i) => [
                  String(i),
                  `${i} ${i === 1 ? "day" : "days"} per week`,
                ])}
              />
            </div>
          </div>

          {form.dietType === "non_vegetarian" && (
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <Utensils size={17} className="text-orange-400" />

                <h2 className="font-black">
                  Non-Veg Restricted Days
                </h2>
              </div>

              <p className="mt-1 text-sm text-zinc-600">
                Select days when you do not want non-vegetarian food.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {DAYS.map((day) => {
                  const selected =
                    form.nonVegRestrictedDays.includes(day);

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => onToggleDay(day)}
                      className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-black shadow-lg shadow-orange-500/15"
                          : "border-white/10 bg-white/[0.02] text-zinc-500 hover:border-orange-500/30 hover:text-white"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {bmiPreview && (
            <div className="mt-7 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-5">
              <div className="flex items-center gap-2 text-orange-400">
                <Scale size={16} />

                <span className="text-xs font-bold uppercase tracking-wider">
                  Estimated BMI
                </span>
              </div>

              <div className="mt-1 text-3xl font-black">
                {numberLabel(bmiPreview, 1)}
              </div>

              <div className="text-sm text-zinc-500">
                {bmiLabel(bmiPreview)}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {profile && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  {profile
                    ? "Save & Update Diet"
                    : "Create My Diet"}
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
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Dumbbell size={18} />
            </div>

            <div>
              <h3 className="text-lg font-black capitalize">
                {day.day}
              </h3>

              {day.isWorkoutDay && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  <Flame size={11} />
                  Workout Day
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <StatPill
            label="Calories"
            value={`${numberLabel(
              day.calories ?? day.totalCalories
            )} kcal`}
          />

          <StatPill
            label="Protein"
            value={`${numberLabel(
              day.protein ?? day.totalProtein
            )} g`}
          />
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {(day.meals || []).map((meal, index) => (
          <MealCard
            key={`${meal.name}-${index}`}
            meal={meal}
          />
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
        <h4 className="flex items-center gap-2 font-black">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          {meal.name}
        </h4>

        <span className="flex items-center gap-1 text-xs font-bold text-zinc-600">
          <Flame size={12} />
          {numberLabel(mealCalories)} kcal
        </span>
      </div>

      <div className="space-y-2">
        {(meal.items || []).map((item, index) => {
          const href = recipeHref(item.recipeId);

          return (
            <div
              key={`${item.foodId || item.id || item.name}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-bold text-zinc-200">
                    {item.name}
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    {item.serving ||
                      item.quantity ||
                      "1 serving"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-black/30 px-2.5 py-1.5 text-zinc-600">
                    {numberLabel(item.calories)} kcal
                  </span>

                  <span className="rounded-lg bg-black/30 px-2.5 py-1.5 text-zinc-600">
                    P {numberLabel(item.protein, 1)}g
                  </span>

                  {href && (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
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
      </div>
    </div>
  );
}

function Field({ label, suffix, ...props }) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-semibold text-zinc-200">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          className={`${inputClass} ${suffix ? "pr-14" : ""}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-zinc-600">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  options,
  ...props
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-semibold text-zinc-200">
        {label}
      </label>

      <div className="relative">
        <select
          {...props}
          className={`${inputClass} appearance-none pr-10`}
        >
          {options.map(([value, text]) => (
            <option
              key={value}
              value={value}
              className="bg-zinc-900 text-white"
            >
              {text}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 ${
        highlight
          ? "border-orange-500/20 bg-orange-500/[0.05]"
          : "border-white/10 bg-zinc-950"
      }`}
    >
      {highlight && (
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
      )}

      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            highlight
              ? "bg-orange-500/10 text-orange-400"
              : "bg-white/[0.04] text-zinc-500"
          }`}
        >
          {icon}
        </div>

        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
          {label}
        </div>

        <div className="mt-1 text-lg font-black text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function NutritionCard({
  icon,
  label,
  value,
  unit,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
          {label}
        </span>
      </div>

      <div className="mt-3 text-2xl font-black">
        {numberLabel(value)}

        <span className="ml-1 text-sm font-bold text-zinc-600">
          {unit}
        </span>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-zinc-500">
      <span className="mr-1 text-zinc-700">{label}:</span>
      <span className="font-bold text-zinc-300">{value}</span>
    </span>
  );
}