"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Gift,
  Sparkles,
  Users,
} from "lucide-react";

export default function PromotionBanner() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPromotions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/public/promotions",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load promotions."
          );
        }

        if (!cancelled) {
          setPromotions(data.promotions || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "PROMOTION BANNER ERROR:",
            error
          );

          setError(
            error.message ||
              "Failed to load promotions."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPromotions();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-zinc-900/70" />
        </div>
      </section>
    );
  }

  if (error || promotions.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={15}
                className="text-orange-500"
              />

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                Limited Time
              </p>
            </div>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Current Gym Offers
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Get more from your membership with our latest
              offers and exclusive deals.
            </p>
          </div>

          <Link
            href="/promotions"
            className="group inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400 sm:self-auto"
          >
            View all offers
            <ChevronRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Promotions */}
        <div className="grid gap-6 md:grid-cols-2">
          {promotions.map((promotion) => {
            const plan = promotion.membershipPlan;

            const offerPrice = Number(
              promotion.offerPrice || 0
            );

            const regularPrice =
              promotion.type === "membership" &&
              plan
                ? Number(plan.price || 0)
                : 0;

            const savings =
              regularPrice > offerPrice
                ? regularPrice - offerPrice
                : 0;

            return (
              <article
                key={promotion._id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-500/20"
              >
                {/* Poster */}
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  <img
                    src={promotion.posterImage}
                    alt={promotion.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

                  {/* Offer type */}
                  <div className="absolute left-4 top-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400 backdrop-blur-md">
                      {promotion.type === "membership" ? (
                        <Dumbbell size={12} />
                      ) : (
                        <Clock3 size={12} />
                      )}

                      {promotion.type === "membership"
                        ? "Membership Offer"
                        : "Extension Offer"}
                    </span>
                  </div>

                  {/* Savings badge */}
                  {savings > 0 && (
                    <div className="absolute bottom-4 right-4">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black shadow-lg shadow-orange-500/20">
                        <BadgePercent size={14} />
                        Save ₹
                        {savings.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                    {promotion.title}
                  </h3>

                  {promotion.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                      {promotion.description}
                    </p>
                  )}

                  {/* Membership details */}
                  {promotion.type === "membership" &&
                    plan && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                              <Dumbbell size={17} />
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                Membership Plan
                              </p>

                              <p className="mt-1 text-sm font-bold text-white">
                                {plan.name}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                              Duration
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-300">
                              {formatDuration(
                                plan.durationInDays
                              )}
                            </p>
                          </div>
                        </div>

                        {plan.features?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {plan.features.map(
                              (feature) => (
                                <span
                                  key={feature}
                                  className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-medium capitalize text-zinc-500"
                                >
                                  {feature.replace(
                                    /_/g,
                                    " "
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Extension details */}
                  {promotion.type === "extension" && (
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                        <CalendarDays size={18} />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          Membership Extension
                        </p>

                        <p className="mt-1 text-lg font-black text-white">
                          +{promotion.extensionDays}{" "}
                          Days
                        </p>

                        <p className="text-xs text-zinc-600">
                          Added to your existing membership.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Offer Price
                      </p>

                      <p className="mt-1 text-3xl font-black tracking-tight text-orange-400">
                        ₹
                        {offerPrice.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    {regularPrice > offerPrice && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          Regular
                        </p>

                        <p className="mt-1 text-sm text-zinc-600 line-through">
                          ₹
                          {regularPrice.toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Registration fee */}
                  {promotion.type === "membership" &&
                    promotion.registrationFeeWaived && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-500/15 bg-green-500/[0.05] px-4 py-3">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-green-400"
                        />

                        <div>
                          <p className="text-xs font-bold text-green-400">
                            Registration fee waived
                          </p>

                          <p className="mt-0.5 text-[11px] text-green-400/60">
                            Save ₹500 on registration.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Validity */}
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <CalendarDays size={12} />

                    Valid until{" "}
                    {new Date(
                      promotion.endDate
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Button */}
                  <Link
                    href="/promotions"
                    className="group/button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-black transition hover:bg-orange-400"
                  >
                    <Gift size={16} />
                    View Offer
                    <ChevronRight
                      size={15}
                      className="transition-transform group-hover/button:translate-x-0.5"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatDuration(days) {
  const numericDays = Number(days || 0);

  if (numericDays === 30) return "1 Month";
  if (numericDays === 90) return "3 Months";
  if (numericDays === 180) return "6 Months";
  if (numericDays === 270) return "9 Months";
  if (numericDays === 365) return "12 Months";

  if (numericDays > 0 && numericDays % 30 === 0) {
    return `${numericDays / 30} Months`;
  }

  return `${numericDays} Days`;
}