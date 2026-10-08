"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag,
  UserPlus,
  XCircle,
} from "lucide-react";

export default function PromotionsPage() {
  const router = useRouter();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/public/promotions",
        {
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

      setPromotions(data.promotions || []);
    } catch (error) {
      console.error(
        "LOAD PROMOTIONS ERROR:",
        error
      );

      setError(
        error?.message ||
          "Unable to load promotions."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price) {
    return `₹${Number(
      price || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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

    return Math.max(
      0,
      normalPrice - offerPrice
    );
  }

  function getDiscountPercentage(promotion) {
    if (
      promotion.type !== "membership" ||
      !promotion.membershipPlan
    ) {
      return 0;
    }

    const normalPrice = Number(
      promotion.membershipPlan.price || 0
    );

    const discount = getDiscount(promotion);

    if (normalPrice <= 0) return 0;

    return Math.round(
      (discount / normalPrice) * 100
    );
  }

  function handleBuyPromotion(promotion) {
    router.push(
      `/promotions/${promotion._id}`
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="mb-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-700 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">
                  Gym Exclusive
                </p>
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Special Offers
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Get exclusive membership discounts
                and extension offers from our gym.
              </p>
            </div>

            {promotions.length > 0 && (
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-zinc-950 px-4 py-2.5">
                <Tag
                  size={13}
                  className="text-orange-500"
                />

                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  {promotions.length}{" "}
                  {promotions.length === 1
                    ? "Offer"
                    : "Offers"}{" "}
                  Available
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Error */}
        {error && (
          <section className="mb-7 rounded-3xl border border-red-500/20 bg-red-500/[0.05] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <XCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <p className="text-sm font-black text-red-300">
                    Unable to load offers
                  </p>

                  <p className="mt-1 text-xs text-red-400/60">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadPromotions}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-500/10"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Empty */}
        {!error && promotions.length === 0 && (
          <section className="rounded-3xl border border-white/10 bg-zinc-950 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Gift size={28} />
            </div>

            <h2 className="mt-6 text-xl font-black">
              No Offers Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-700">
              There are no active promotions at
              the moment. Please check again later.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
            >
              Back to Dashboard
              <ArrowRight size={15} />
            </button>
          </section>
        )}

        {/* Promotions */}
        {promotions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {promotions.map((promotion) => {
              const discount =
                getDiscount(promotion);

              const discountPercentage =
                getDiscountPercentage(
                  promotion
                );

              const isMembership =
                promotion.type ===
                "membership";

              const isExtension =
                promotion.type ===
                "extension";

              return (
                <article
                  key={promotion._id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-500/20"
                >
                  {/* Poster */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    {promotion.posterImage ? (
                      <img
                        src={
                          promotion.posterImage
                        }
                        alt={
                          promotion.title
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Gift
                          size={48}
                          className="text-zinc-800"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Type */}
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-xl">
                        {isMembership ? (
                          <Sparkles
                            size={11}
                            className="text-orange-400"
                          />
                        ) : (
                          <RefreshCw
                            size={11}
                            className="text-orange-400"
                          />
                        )}

                        {isMembership
                          ? "Membership Offer"
                          : "Extension Offer"}
                      </span>
                    </div>

                    {/* Discount */}
                    {discountPercentage >
                      0 && (
                      <div className="absolute right-4 top-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-[10px] font-black text-black shadow-lg shadow-orange-500/20">
                          <BadgePercent
                            size={12}
                          />
                          {discountPercentage}%
                          OFF
                        </span>
                      </div>
                    )}

                    {/* Bottom poster info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      {isExtension && (
                        <span className="inline-flex items-center rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs font-black text-orange-400 backdrop-blur-xl">
                          +{promotion.extensionDays}{" "}
                          days
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-xl font-black leading-tight">
                      {promotion.title}
                    </h2>

                    {promotion.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                        {
                          promotion.description
                        }
                      </p>
                    )}

                    {/* Membership */}
                    {isMembership && (
                      <div className="mt-5 rounded-2xl border border-white/5 bg-black/50 p-4">
                        <div className="flex items-center gap-2">
                          <UserPlus
                            size={13}
                            className="text-orange-500"
                          />

                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-700">
                            Membership Plan
                          </p>
                        </div>

                        <p className="mt-2 font-black text-zinc-300">
                          {
                            promotion
                              .membershipPlan
                              ?.name
                          }
                        </p>

                        <div className="mt-4 flex items-end gap-3">
                          <span className="text-3xl font-black text-orange-400">
                            {formatPrice(
                              promotion.offerPrice
                            )}
                          </span>

                          {Number(
                            promotion
                              .membershipPlan
                              ?.price || 0
                          ) >
                            Number(
                              promotion.offerPrice ||
                                0
                            ) && (
                            <span className="pb-1 text-sm font-bold text-zinc-800 line-through">
                              {formatPrice(
                                promotion
                                  .membershipPlan
                                  ?.price
                              )}
                            </span>
                          )}
                        </div>

                        {promotion
                          .membershipPlan
                          ?.durationInDays && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-700">
                            <CalendarDays
                              size={12}
                            />

                            {
                              promotion
                                .membershipPlan
                                .durationInDays
                            }{" "}
                            days membership
                          </div>
                        )}

                        {promotion.registrationFeeWaived && (
                          <div className="mt-4 rounded-xl border border-orange-500/15 bg-orange-500/[0.06] px-3 py-3">
                            <p className="text-xs font-black text-orange-400">
                              Registration Fee FREE
                            </p>

                            <p className="mt-1 text-[10px] text-zinc-700">
                              Save ₹500 on
                              registration.
                            </p>
                          </div>
                        )}

                        {discount > 0 && (
                          <p className="mt-3 text-xs font-black text-orange-400/70">
                            You save{" "}
                            {formatPrice(
                              discount
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Extension */}
                    {isExtension && (
                      <div className="mt-5 rounded-2xl border border-white/5 bg-black/50 p-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw
                            size={13}
                            className="text-orange-500"
                          />

                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-700">
                            Membership Extension
                          </p>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-3xl font-black text-orange-400">
                              +
                              {
                                promotion.extensionDays
                              }{" "}
                              <span className="text-base text-zinc-600">
                                days
                              </span>
                            </p>

                            <p className="mt-1 text-[10px] text-zinc-800">
                              Added to your
                              current membership
                            </p>
                          </div>

                          <p className="text-2xl font-black">
                            {formatPrice(
                              promotion.offerPrice
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-bold text-zinc-800">
                      <span>
                        Starts{" "}
                        {formatDate(
                          promotion.startDate
                        )}
                      </span>

                      <span>
                        Ends{" "}
                        {formatDate(
                          promotion.endDate
                        )}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() =>
                        handleBuyPromotion(
                          promotion
                        )
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-xs font-black text-black transition hover:bg-orange-400"
                    >
                      {isMembership
                        ? "Buy Membership Offer"
                        : "Get Extension Offer"}

                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Information */}
        {promotions.length > 0 && (
          <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Sparkles size={17} />
              </div>

              <div>
                <h2 className="text-base font-black">
                  Important
                </h2>

                <div className="mt-3 space-y-2 text-xs leading-6 text-zinc-700">
                  <p>
                    • Membership offers are
                    available only during their
                    promotion period.
                  </p>

                  <p>
                    • Extension offers require an
                    existing eligible membership.
                  </p>

                  <p>
                    • The final price and
                    eligibility are verified
                    securely by the server.
                  </p>

                  <p>
                    • Registration fee discounts
                    apply only when the promotion
                    specifically includes them.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-900" />

        <div className="mt-8">
          <div className="h-12 w-64 animate-pulse rounded-xl bg-zinc-900" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-zinc-950" />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-950"
            >
              <div className="aspect-[4/3] animate-pulse bg-zinc-900" />

              <div className="space-y-4 p-5">
                <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-900" />
                <div className="h-16 animate-pulse rounded bg-zinc-950" />
                <div className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
                <div className="h-11 animate-pulse rounded-xl bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={17}
            className="animate-spin text-orange-500"
          />

          <span className="text-xs font-bold text-zinc-500">
            Loading offers...
          </span>
        </div>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-350px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-orange-500/[0.055] blur-[160px]" />

      <div className="absolute bottom-[-300px] right-[-200px] h-[550px] w-[550px] rounded-full bg-orange-500/[0.035] blur-[150px]" />
    </div>
  );
}