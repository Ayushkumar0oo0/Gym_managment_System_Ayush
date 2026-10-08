"use client";

import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Gift,
  ReceiptText,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";

export default function PurchaseSummary({
  selectedPlan,
  selectedPromotion,
  selectedAddOns = [],
  registrationFee = 0,
  membershipPrice = 0,
  addOnsTotal = 0,
  discount = 0,
  totalAmount = 0,
}) {
  const normalMembershipPrice = Number(selectedPlan?.price || 0);
  const finalMembershipPrice = Number(membershipPrice || 0);
  const registration = Number(registrationFee || 0);
  const addOns = Number(addOnsTotal || 0);
  const total = Number(totalAmount || 0);

  const promotionApplied = Boolean(selectedPromotion);
  const hasDiscount = Number(discount) > 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.08] via-transparent to-transparent p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
              <ReceiptText size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Order Summary
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Review your membership before payment.
              </p>
            </div>
          </div>

          {promotionApplied && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400">
              <Sparkles size={13} />
              <span className="hidden sm:inline">Offer Applied</span>
              <span className="sm:hidden">Offer</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-7">
        {/* Membership */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-orange-400 ring-1 ring-white/10">
                <Dumbbell size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold text-white">
                  {selectedPlan?.name || "Membership"}
                </p>

                {selectedPlan?.durationInDays && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalendarDays size={13} />
                    {formatDuration(selectedPlan.durationInDays)}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              {hasDiscount && (
                <p className="text-xs text-zinc-600 line-through">
                  ₹{normalMembershipPrice.toLocaleString("en-IN")}
                </p>
              )}

              <p className="font-bold text-white">
                ₹{finalMembershipPrice.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Promotion */}
        {promotionApplied && (
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <Gift size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-orange-400">
                      {selectedPromotion.title || "Special Offer"}
                    </p>

                    {selectedPromotion.description && (
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {selectedPromotion.description}
                      </p>
                    )}
                  </div>

                  {hasDiscount && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-bold text-green-400">
                      Save ₹{Number(discount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {selectedPromotion.registrationFeeWaived && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-green-400">
                    <CheckCircle2 size={14} />
                    Registration fee waived
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Tag size={15} className="text-orange-400" />

              <p className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Add-ons
              </p>
            </div>

            <div className="space-y-3">
              {selectedAddOns.map((addOn) => (
                <div
                  key={addOn._id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.02] px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />

                    <span className="truncate text-sm text-zinc-400">
                      {addOn.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-white">
                    ₹{Number(addOn.price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Wallet size={15} className="text-orange-400" />

            <p className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Price Breakdown
            </p>
          </div>

          <div className="space-y-3.5">
            <PriceRow
              label="Membership"
              value={normalMembershipPrice}
            />

            {hasDiscount && (
              <PriceRow
                label="Promotion Discount"
                value={-Number(discount)}
                negative
              />
            )}

            {hasDiscount && (
              <PriceRow
                label="Membership After Offer"
                value={finalMembershipPrice}
              />
            )}

            {addOns > 0 && (
              <PriceRow
                label="Add-ons"
                value={addOns}
              />
            )}

            <PriceRow
              label="Registration Fee"
              value={registration}
            />

            {registration === 0 &&
              selectedPromotion?.registrationFeeWaived && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/[0.06] px-3 py-2 text-xs text-green-400">
                  <CheckCircle2 size={14} />
                  Registration fee waived by this promotion.
                </div>
              )}
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] to-transparent p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-300">
                  Total Amount
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  Final amount will be verified by the server.
                </p>
              </div>

              <p className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Secure checkout */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <CheckCircle2 size={13} />
          Secure membership checkout
        </div>
      </div>
    </section>
  );
}

function PriceRow({ label, value, negative = false }) {
  const numericValue = Number(value || 0);

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>

      <span
        className={
          negative || numericValue < 0
            ? "font-semibold text-green-400"
            : "font-medium text-zinc-200"
        }
      >
        {numericValue < 0 ? "-" : ""}₹
        {Math.abs(numericValue).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function formatDuration(days) {
  const numericDays = Number(days);

  if (!numericDays) return "Membership";

  if (numericDays === 30) return "1 Month";
  if (numericDays === 90) return "3 Months";
  if (numericDays === 180) return "6 Months";
  if (numericDays === 270) return "9 Months";
  if (numericDays === 365) return "12 Months";

  if (numericDays % 30 === 0) {
    return `${numericDays / 30} Months`;
  }

  return `${numericDays} Days`;
}