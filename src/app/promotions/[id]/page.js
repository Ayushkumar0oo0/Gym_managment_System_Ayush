"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Loader2,
  ShieldCheck,
  Sparkles,
  Tag,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const promotionId = params?.id;

  const [promotion, setPromotion] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPromotion() {
    try {
      setLoading(true);
      setError("");

      if (!promotionId) {
        throw new Error(
          "Promotion ID is missing."
        );
      }

      const response = await fetch(
        `/api/public/promotions/${promotionId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load promotion."
        );
      }

      setPromotion(data.promotion);
    } catch (err) {
      console.error(
        "Promotion detail error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load promotion."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!promotionId) return;

    loadPromotion();
  }, [promotionId]);

  const normalPrice = useMemo(() => {
    if (!promotion?.membershipPlan) {
      return 0;
    }

    return Number(
      promotion.membershipPlan.price || 0
    );
  }, [promotion]);

  const offerPrice = useMemo(() => {
    return Number(
      promotion?.offerPrice || 0
    );
  }, [promotion]);

  const discount = useMemo(() => {
    if (promotion?.type !== "membership") {
      return 0;
    }

    return Math.max(
      0,
      normalPrice - offerPrice
    );
  }, [
    promotion,
    normalPrice,
    offerPrice,
  ]);

  const discountPercentage = useMemo(() => {
    if (
      promotion?.type !== "membership" ||
      normalPrice <= 0
    ) {
      return 0;
    }

    return Math.round(
      (discount / normalPrice) * 100
    );
  }, [
    promotion,
    normalPrice,
    discount,
  ]);

  function handleBuyNow() {
    if (!promotion) return;

    if (promotion.type === "membership") {
      const planId =
        promotion.membershipPlan?._id;

      if (!planId) {
        setError(
          "This promotion is missing its membership plan."
        );

        return;
      }

      router.push(
        `/membership/purchase?promotionId=${promotion._id}`
      );

      return;
    }

    if (promotion.type === "extension") {
      router.push(
        `/member/membership?promotionId=${promotion._id}&type=extension`
      );
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !promotion) {
    return (
      <ErrorState
        error={error}
        onBack={() =>
          router.push("/promotions")
        }
      />
    );
  }

  const isMembership =
    promotion.type === "membership";

  const isExtension =
    promotion.type === "extension";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AmbientGlow />

      {/* Header */}
      <section className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              router.push("/promotions")
            }
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Promotions
          </button>
        </div>
      </section>

      {/* Main */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-start">
          {/* Poster */}
          <div className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/30">
              <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[5/4]">
                {promotion.posterImage ? (
                  <img
                    src={promotion.posterImage}
                    alt={promotion.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gift
                      size={60}
                      className="text-zinc-800"
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute left-5 top-5">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                      isMembership
                        ? "bg-orange-500 text-black"
                        : "bg-white text-black"
                    }`}
                  >
                    {isMembership ? (
                      <Sparkles size={12} />
                    ) : (
                      <RefreshIcon />
                    )}

                    {isMembership
                      ? "Membership Offer"
                      : "Extension Offer"}
                  </span>
                </div>

                {isMembership &&
                  discountPercentage > 0 && (
                    <div className="absolute bottom-5 left-5">
                      <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
                          You Save
                        </p>

                        <p className="mt-1 text-2xl font-black text-orange-400">
                          {discountPercentage}%
                        </p>
                      </div>
                    </div>
                  )}

                {isExtension && (
                  <div className="absolute bottom-5 left-5">
                    <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
                      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
                        Extension
                      </p>

                      <p className="mt-1 text-2xl font-black text-orange-400">
                        +{promotion.extensionDays}{" "}
                        days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2">
              <Tag
                size={14}
                className="text-orange-500"
              />

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                Limited Time Offer
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {promotion.title}
            </h1>

            {promotion.description && (
              <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
                {promotion.description}
              </p>
            )}

            {/* Membership */}
            {isMembership && (
              <div className="mt-7 space-y-4">
                {/* Plan */}
                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">
                        Membership Plan
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {promotion
                          .membershipPlan
                          ?.name ||
                          "Membership"}
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      <BadgeCheck size={20} />
                    </div>
                  </div>

                  {promotion.membershipPlan
                    ?.description && (
                    <p className="mt-3 text-xs leading-6 text-zinc-700">
                      {
                        promotion
                          .membershipPlan
                          .description
                      }
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {promotion.membershipPlan
                      ?.durationInDays && (
                      <InfoPill
                        icon={
                          <CalendarDays
                            size={14}
                          />
                        }
                        label="Duration"
                        value={`${promotion.membershipPlan.durationInDays} days`}
                      />
                    )}

                    {promotion.membershipPlan
                      ?.eligibility && (
                      <InfoPill
                        icon={
                          <UserPlus
                            size={14}
                          />
                        }
                        label="Eligibility"
                        value={
                          promotion
                            .membershipPlan
                            .eligibility ===
                          "both"
                            ? "Men & Women"
                            : promotion
                                .membershipPlan
                                .eligibility
                        }
                        capitalize
                      />
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.05] p-5 sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Special Offer Price
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span className="text-4xl font-black text-orange-400 sm:text-5xl">
                      ₹
                      {offerPrice.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                    {normalPrice >
                      offerPrice && (
                      <span className="mb-1 text-lg font-bold text-zinc-700 line-through">
                        ₹
                        {normalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}

                    {discountPercentage >
                      0 && (
                      <span className="mb-1 rounded-lg bg-orange-500 px-2.5 py-1 text-[10px] font-black text-black">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>

                  {discount > 0 && (
                    <p className="mt-3 text-xs font-bold text-orange-400/70">
                      You save ₹
                      {discount.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                </div>

                {/* Registration */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-600">
                      <UserPlus size={15} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-zinc-300">
                        Registration Fee
                      </p>

                      <p className="mt-0.5 text-[10px] text-zinc-700">
                        New member registration
                      </p>
                    </div>
                  </div>

                  {promotion.registrationFeeWaived ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      FREE
                    </span>
                  ) : (
                    <span className="font-black text-zinc-300">
                      ₹500
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Extension */}
            {isExtension && (
              <div className="mt-7 space-y-4">
                <div className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.05] p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Membership Extension
                  </p>

                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-5xl font-black text-orange-400">
                      +{promotion.extensionDays}
                    </span>

                    <span className="mb-2 text-sm font-bold text-zinc-600">
                      days
                    </span>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                      Offer Price
                    </p>

                    <p className="mt-1 text-3xl font-black text-white">
                      ₹
                      {offerPrice.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-orange-400"
                    />

                    <p className="text-xs leading-6 text-zinc-600">
                      This offer is available
                      only to members with an
                      existing membership. Your
                      membership will be extended
                      after successful payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validity */}
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4">
              <div className="flex items-center gap-3">
                <Clock3
                  size={16}
                  className="text-zinc-700"
                />

                <span className="text-xs font-bold text-zinc-600">
                  Offer valid until
                </span>
              </div>

              <span className="text-right text-xs font-black text-zinc-400 sm:text-sm">
                {new Date(
                  promotion.endDate
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-black shadow-xl shadow-orange-500/10 transition hover:bg-orange-400"
            >
              {isMembership
                ? "Get This Membership Offer"
                : "Extend My Membership"}

              <ArrowRight size={17} />
            </button>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <ShieldCheck
                size={13}
                className="text-zinc-800"
              />

              <p className="text-center text-[10px] leading-5 text-zinc-800">
                Final pricing and promotion
                eligibility are securely verified
                by the server.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoPill({
  icon,
  label,
  value,
  capitalize = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-2 text-zinc-700">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p
        className={`mt-2 text-sm font-black text-zinc-300 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-900" />

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <div className="h-[550px] animate-pulse rounded-3xl bg-zinc-950" />

          <div className="space-y-5">
            <div className="h-16 w-3/4 animate-pulse rounded bg-zinc-950" />
            <div className="h-20 animate-pulse rounded-3xl bg-zinc-950" />
            <div className="h-36 animate-pulse rounded-3xl bg-zinc-950" />
            <div className="h-16 animate-pulse rounded-2xl bg-zinc-950" />
            <div className="h-14 animate-pulse rounded-2xl bg-zinc-950" />
          </div>
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading promotion...
          </span>
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  error,
  onBack,
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 text-white">
      <AmbientGlow />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <XCircle size={28} />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
          Promotion
        </p>

        <h1 className="mt-2 text-2xl font-black">
          Promotion Unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {error ||
            "This promotion could not be found or is no longer available."}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
        >
          View All Promotions
          <ArrowRight size={15} />
        </button>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}