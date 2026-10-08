"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Dumbbell,
  Flame,
  Search,
  X,
  ChefHat,
  CircleDollarSign,
  Utensils,
  Lightbulb,
} from "lucide-react";
import recipes from "@/lib/diet/recipes";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snacks" },
];

export default function DietRecipesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const filteredRecipes = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesCategory =
        category === "all" || recipe.category === category;

      if (!matchesCategory) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const searchableText = [
        recipe.name,
        recipe.description,
        recipe.category,
        recipe.budget,
        ...(recipe.ingredients || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchText);
    });
  }, [search, category]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" />
        <div className="absolute bottom-[-200px] right-[-120px] h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Back */}
        <Link
          href="/member/diet"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} />
          Back to My Diet
        </Link>

        {/* Header */}
        <header className="mt-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                <Dumbbell size={13} />
                Diet & Nutrition
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Food &{" "}
                <span className="text-orange-500">Recipes</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Simple, affordable Indian meals to support your
                training. Find a recipe, check the ingredients and
                start cooking.
              </p>
            </div>

            <Link
              href="/member/diet/progress"
              className="group inline-flex w-fit items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-400 transition hover:border-orange-500/40 hover:bg-orange-500/15"
            >
              <Flame size={17} />
              Track Progress
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </header>

        {/* Search + filters */}
        <section className="mt-8">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chicken, dal, poha, oats..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-zinc-950 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50 focus:bg-orange-500/[0.03] focus:ring-4 focus:ring-orange-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-orange-400"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((item) => {
              const active = category === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-bold transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                      : "border-white/10 bg-zinc-950 text-zinc-500 hover:border-orange-500/30 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results heading */}
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
              <Utensils size={13} />
              Recipes
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "Recipe" : "Recipes"}
            </h2>
          </div>

          {(search || category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
              className="text-xs font-semibold text-zinc-600 transition hover:text-orange-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Recipe grid */}
        {filteredRecipes.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Search size={28} />
            </div>

            <h3 className="mt-5 text-lg font-black">
              No recipes found
            </h3>

            <p className="mt-2 text-sm text-zinc-600">
              Try another food name or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              Show All Recipes
            </button>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 pb-6 text-center">
          <p className="mx-auto max-w-3xl text-xs leading-6 text-zinc-700">
            Recipe portions should be adjusted according to your
            personalized diet plan. Nutritional values are approximate
            and may vary depending on ingredients and preparation method.
          </p>
        </div>
      </div>

      {/* Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </main>
  );
}

function RecipeCard({ recipe, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-left shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-orange-500/5"
    >
      {/* Visual */}
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-[#090909] to-orange-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.10),transparent_60%)]" />

        <span className="relative text-6xl transition duration-300 group-hover:scale-110">
          {getRecipeIcon(recipe.category, recipe.name)}
        </span>

        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-400 backdrop-blur">
          {recipe.category}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-bold text-zinc-400 backdrop-blur">
          <CircleDollarSign size={11} />
          {recipe.budget}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-black leading-5 text-white">
          {recipe.name}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600">
          {recipe.description}
        </p>

        <div className="mt-4 flex items-center gap-3 text-[10px] font-medium text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock3 size={12} />
            {recipe.prepTime}
          </span>

          <span className="h-1 w-1 rounded-full bg-zinc-700" />

          <span>{recipe.difficulty}</span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs font-bold text-zinc-500 transition group-hover:text-orange-400">
            View Recipe
          </span>

          <ArrowRight
            size={15}
            className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400"
          />
        </div>
      </div>
    </button>
  );
}

function RecipeModal({ recipe, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#080808] shadow-2xl shadow-orange-500/5 sm:rounded-3xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#080808]/95 px-5 py-5 backdrop-blur-xl sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-3xl">
                {getRecipeIcon(recipe.category, recipe.name)}
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                    {recipe.category}
                  </span>

                  <span className="text-[10px] text-zinc-600">
                    {recipe.budget} budget
                  </span>
                </div>

                <h2 className="truncate text-xl font-black sm:text-2xl">
                  {recipe.name}
                </h2>

                <p className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                  <Clock3 size={12} />
                  {recipe.prepTime}
                  <span>•</span>
                  {recipe.difficulty}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-orange-500/30 hover:text-orange-400"
              aria-label="Close recipe"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7">
          <div className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="text-sm leading-6 text-zinc-400">
              {recipe.description}
            </p>
          </div>

          {/* Ingredients */}
          <section className="mt-8">
            <SectionHeading
              icon={<ChefHat size={16} />}
              eyebrow="Ingredients"
              title="What You Need"
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(recipe.ingredients || []).map(
                (ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 transition hover:border-orange-500/20"
                  >
                    <span className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    {ingredient}
                  </div>
                )
              )}
            </div>
          </section>

          {/* Steps */}
          <section className="mt-9">
            <SectionHeading
              icon={<Utensils size={16} />}
              eyebrow="Preparation"
              title="How to Make It"
            />

            <div className="mt-4 space-y-3">
              {(recipe.steps || []).map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-950 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-black">
                    {index + 1}
                  </div>

                  <p className="pt-1 text-sm leading-6 text-zinc-400">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Tips */}
          {recipe.tips?.length > 0 && (
            <section className="mt-9">
              <SectionHeading
                icon={<Lightbulb size={16} />}
                eyebrow="Helpful Tips"
                title="Keep In Mind"
              />

              <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 p-5">
                <div className="space-y-4">
                  {recipe.tips.map((tip, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                        <Lightbulb size={14} />
                      </div>

                      <p className="text-sm leading-6 text-zinc-500">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Diet note */}
          <div className="mt-9 rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
              Diet Note
            </p>

            <p className="mt-2 text-xs leading-6 text-zinc-600">
              Follow the quantity from your personalized diet plan.
              This recipe describes preparation, while your diet plan
              determines how much you should eat.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
          >
            Done
            <CheckIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, eyebrow, title }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-orange-400">
        {icon}

        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
          {eyebrow}
        </p>
      </div>

      <h3 className="mt-1 text-xl font-black">{title}</h3>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function getRecipeIcon(category, name) {
  const text = `${category} ${name}`.toLowerCase();

  if (text.includes("chicken")) return "🍗";
  if (text.includes("fish")) return "🐟";
  if (text.includes("egg") || text.includes("omelette")) {
    return "🥚";
  }

  if (text.includes("rice") || text.includes("khichdi")) {
    return "🍚";
  }

  if (text.includes("dal") || text.includes("rajma")) {
    return "🥣";
  }

  if (
    text.includes("roti") ||
    text.includes("poha") ||
    text.includes("oats") ||
    text.includes("chilla")
  ) {
    return "🍽️";
  }

  if (text.includes("sattu")) return "🥤";
  if (text.includes("paneer")) return "🧀";

  if (
    text.includes("fruit") ||
    text.includes("banana") ||
    text.includes("apple")
  ) {
    return "🍎";
  }

  if (text.includes("peanut")) return "🥜";

  return "🥗";
}