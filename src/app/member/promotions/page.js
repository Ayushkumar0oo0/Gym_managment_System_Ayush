"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Dumbbell,
  Gift,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  XCircle,
} from "lucide-react";

export default function MemberPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load promotions."
          );
        }

        setPromotions(data.promotions || []);
      } catch (error) {
        console.error(
          "MEMBER PROMOTIONS PAGE ERROR:",
          error
        );

        setError(
          error?.message ||
            "Unable to load available offers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPromotions();
  }, []);

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

  function formatAmount(amount) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function getDiscount(promotion) {
    if (
      promotion.type !== "membership" ||
      !promotion.membershipPlan
    ) {
      return 0;
    }

    const normalPrice = Number(
      promotion.membershipPlan.price || 0
    );

    const offerPrice = Number(
      promotion.offerPrice || 0
    );

    if (normalPrice <= 0) return 0;

    return Math.max(
      0,
      Math.round(
        ((normalPrice - offerPrice) /
          normalPrice) *
          100
      )
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <AmbientGlow />

        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-500/20 bg-zinc-950 p-8 text-center shadow-2xl shadow-black/30 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle size={28} />
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Unable to load offers
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <section className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                <Sparkles size={12} />
                Exclusive Gym Offers
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Gym{" "}
                <span className="text-orange-500">
                  Offers
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Save more on memberships and extend your
                training with special offers available at
                the gym.
              </p>
            </div>

            <Link
              href="/member/membership"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400"
            >
              Membership
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Offer intro banner */}
        {promotions.length > 0 && (
          <section className="relative mb-7 overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-r from-orange-500/[0.09] via-zinc-950 to-zinc-950 p-5 sm:p-6">
            <div className="absolute right-[-80px] top-[-100px] h-56 w-56 rounded-full bg-orange-500/10 blur-[90px]" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black">
                  <Gift size={22} />
                </div>

                <div>
                  <p className="text-sm font-black">
                    Special offers for members
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Choose an offer and check its validity
                    before purchasing.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-zinc-500">
                <BadgePercent
                  size={14}
                  className="text-orange-400"
                />
                {promotions.length} active{" "}
                {promotions.length === 1
                  ? "offer"
                  : "offers"}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {promotions.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-10 text-center shadow-xl shadow-black/20 sm:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Gift size={28} />
            </div>

            <h2 className="mt-6 text-2xl font-black">
              No Offers Available
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
              There are no active promotions available
              right now. Check back later for new gym
              offers.
            </p>

            <Link
              href="/member"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              Back to Dashboard
              <ArrowRight size={15} />
            </Link>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => {
              const discount =
                getDiscount(promotion);

              const isMembership =
                promotion.type === "membership";

              const isExtension =
                promotion.type === "extension";

              return (
                <article
                  key={promotion._id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-500/20 hover:shadow-orange-500/[0.04]"
                >
                  {/* Poster */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                    {promotion.posterImage ? (
                      <img
                        src={promotion.posterImage}
                        alt={promotion.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/10 to-zinc-950 text-orange-400">
                        <Gift size={42} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Type */}
                    <div className="absolute left-4 top-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur ${
                          isExtension
                            ? "border-emerald-500/20 bg-emerald-950/80 text-emerald-400"
                            : "border-orange-500/20 bg-orange-950/80 text-orange-400"
                        }`}
                      >
                        {isExtension ? (
                          <RefreshCw size={11} />
                        ) : (
                          <Dumbbell size={11} />
                        )}

                        {isExtension
                          ? "Extension"
                          : "Membership Offer"}
                      </span>
                    </div>

                    {/* Discount */}
                    {discount > 0 && (
                      <div className="absolute right-4 top-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black text-black shadow-lg shadow-orange-500/20">
                          <BadgePercent size={12} />
                          {discount}% OFF
                        </span>
                      </div>
                    )}

                    {/* Bottom poster label */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="line-clamp-2 text-xl font-black text-white drop-shadow-lg">
                        {promotion.title}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    {promotion.description && (
                      <p className="line-clamp-3 text-sm leading-6 text-zinc-600">
                        {promotion.description}
                      </p>
                    )}

                    {/* Membership */}
                    {isMembership && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-[#070707] p-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              Offer Price
                            </p>

                            <p className="mt-1 text-2xl font-black text-orange-400">
                              {formatAmount(
                                promotion.offerPrice
                              )}
                            </p>
                          </div>

                          {promotion.membershipPlan
                            ?.price >
                            promotion.offerPrice && (
                            <p className="mb-1 text-sm font-medium text-zinc-700 line-through">
                              {formatAmount(
                                promotion
                                  .membershipPlan
                                  .price
                              )}
                            </p>
                          )}
                        </div>

                        {promotion.membershipPlan
                          ?.name && (
                          <div className="mt-4 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2">
                              <Dumbbell
                                size={13}
                                className="text-orange-400"
                              />

                              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                                Membership Plan
                              </p>
                            </div>

                            <p className="mt-1 text-sm font-bold text-zinc-300">
                              {
                                promotion
                                  .membershipPlan
                                  .name
                              }
                            </p>
                          </div>
                        )}

                        {promotion.registrationFeeWaived && (
                          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5">
                            <CheckCircleIcon />

                            <p className="text-xs font-bold text-emerald-400">
                              Registration fee waived
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extension */}
                    {isExtension && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-[#070707] p-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              Extension
                            </p>

                            <p className="mt-1 text-2xl font-black text-emerald-400">
                              +{promotion.extensionDays}{" "}
                              days
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                              Price
                            </p>

                            <p className="mt-1 text-lg font-black text-zinc-200">
                              {formatAmount(
                                promotion.offerPrice
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validity */}
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={14}
                          className="text-orange-400"
                        />

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-800">
                            Valid until
                          </p>

                          <p className="mt-0.5 text-xs font-bold text-zinc-500">
                            {formatDate(
                              promotion.endDate
                            )}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/promotions/${promotion._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-black transition hover:bg-orange-400"
                      >
                        View Offer
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 pb-4 text-center text-[11px] text-zinc-800">
          <ShieldCheck size={13} />
          Offers are subject to their respective validity
          periods and terms.
        </div>
      </div>
    </main>
  );
}

function CheckCircleIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
      <Check size={11} strokeWidth={3} />
    </span>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[150px]" />

      <div className="absolute bottom-[-220px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-36 rounded bg-zinc-900" />

        <div className="mt-7 h-12 w-72 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-950"
              >
                <div className="aspect-[16/9] bg-zinc-900" />

                <div className="p-6">
                  <div className="h-5 w-40 rounded bg-zinc-900" />

                  <div className="mt-3 h-4 w-full rounded bg-zinc-950" />

                  <div className="mt-2 h-4 w-3/4 rounded bg-zinc-950" />

                  <div className="mt-6 h-20 rounded-2xl bg-zinc-900" />

                  <div className="mt-5 h-10 rounded-xl bg-zinc-900" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}