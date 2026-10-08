"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

export default function PurchaseRequestsPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchPurchaseRequests({ showLoader = true } = {}) {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      setError("");

      const response = await fetch("/api/admin/purchase-requests", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load purchase requests."
        );
      }

      setPurchaseOrders(data.purchaseOrders || []);
    } catch (error) {
      console.error("FETCH PURCHASE REQUESTS ERROR:", error);
      setError(
        error?.message || "Unable to load purchase requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  async function confirmCashPayment(purchaseOrder) {
    if (!purchaseOrder?._id) return;

    if (isExpired(purchaseOrder.expiresAt)) {
      setError(
        "This purchase request has expired. It cannot be confirmed."
      );
      return;
    }

    const totalAmount = Number(purchaseOrder.totalAmount || 0);

    const confirmed = window.confirm(
      `Confirm that you received ₹${totalAmount.toLocaleString(
        "en-IN"
      )} cash from ${purchaseOrder.name}?\n\nThis will create the member account, activate the membership, and record the payment.`
    );

    if (!confirmed) return;

    try {
      setConfirmingId(purchaseOrder._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/purchase-requests/${purchaseOrder._id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to confirm cash payment."
        );
      }

      setSuccess(
        `${purchaseOrder.name}'s cash payment has been confirmed. The account and membership are now active.`
      );

      setPurchaseOrders((current) =>
        current.filter(
          (item) => item._id !== purchaseOrder._id
        )
      );
    } catch (error) {
      console.error("CONFIRM CASH PAYMENT ERROR:", error);
      setError(
        error?.message || "Unable to confirm cash payment."
      );
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleRefresh() {
    setSuccess("");
    await fetchPurchaseRequests({ showLoader: false });
  }

  function formatDate(date) {
    if (!date) return "—";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) return "—";

    return value.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function isExpired(date) {
    if (!date) return false;
    return new Date(date).getTime() <= Date.now();
  }

  function getRegularMembershipPrice(purchaseOrder, plan) {
    const planPrice = Number(plan?.price);

    if (Number.isFinite(planPrice) && planPrice >= 0) {
      return planPrice;
    }

    return (
      Number(purchaseOrder.membershipPrice || 0) +
      Number(purchaseOrder.discount || 0)
    );
  }

  const pendingAmount = useMemo(
    () =>
      purchaseOrders.reduce(
        (total, order) =>
          total + Number(order.totalAmount || 0),
        0
      ),
    [purchaseOrders]
  );

  const expiredCount = useMemo(
    () =>
      purchaseOrders.filter((order) =>
        isExpired(order.expiresAt)
      ).length,
    [purchaseOrders]
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="animate-pulse">
            <div className="h-4 w-36 rounded bg-zinc-900" />
            <div className="mt-4 h-10 w-72 rounded bg-zinc-900" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-white/5 bg-zinc-950"
                />
              ))}
            </div>

            <div className="mt-6 h-72 rounded-2xl bg-zinc-950" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">
              <Banknote className="h-4 w-4" />
              Cash Desk
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Purchase Requests
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Review pending cash memberships, verify customer
              details, and activate memberships after receiving
              payment.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {refreshing ? "Refreshing..." : "Refresh Requests"}
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Clock3}
            label="Pending Requests"
            value={purchaseOrders.length}
            accent="orange"
            description="Awaiting cash confirmation"
          />

          <StatCard
            icon={DollarSign}
            label="Pending Amount"
            value={`₹${pendingAmount.toLocaleString("en-IN")}`}
            accent="green"
            description="Total cash to collect"
          />

          <StatCard
            icon={XCircle}
            label="Expired Requests"
            value={expiredCount}
            accent="red"
            description="Cannot be confirmed"
          />
        </div>

        {/* EMPTY */}
        {purchaseOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 px-6 py-16 text-center shadow-2xl shadow-black/20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-black">
              All caught up
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              There are no pending cash purchase requests at
              the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {purchaseOrders.map((purchaseOrder) => {
              const plan = purchaseOrder.membershipPlan;
              const promotion = purchaseOrder.promotion;
              const expired = isExpired(
                purchaseOrder.expiresAt
              );
              const isConfirming =
                confirmingId === purchaseOrder._id;

              const regularMembershipPrice =
                getRegularMembershipPrice(
                  purchaseOrder,
                  plan
                );

              const membershipPrice = Number(
                purchaseOrder.membershipPrice || 0
              );

              const discount = Number(
                purchaseOrder.discount || 0
              );

              return (
                <PurchaseRequestCard
                  key={purchaseOrder._id}
                  purchaseOrder={purchaseOrder}
                  plan={plan}
                  promotion={promotion}
                  expired={expired}
                  isConfirming={isConfirming}
                  regularMembershipPrice={
                    regularMembershipPrice
                  }
                  membershipPrice={membershipPrice}
                  discount={discount}
                  formatDate={formatDate}
                  onConfirm={confirmCashPayment}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PurchaseRequestCard({
  purchaseOrder,
  plan,
  promotion,
  expired,
  isConfirming,
  regularMembershipPrice,
  membershipPrice,
  discount,
  formatDate,
  onConfirm,
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-zinc-950 shadow-2xl shadow-black/20 ${
        expired
          ? "border-red-500/20"
          : "border-orange-500/10"
      }`}
    >
      {/* TOP BAR */}
      <div className="border-b border-white/[0.07] bg-white/[0.015] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  {purchaseOrder.name}
                </h2>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    expired
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {expired ? "Expired" : "Cash Pending"}
                </span>

                {purchaseOrder.membershipType ===
                  "couple" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                    <Users className="h-3 w-3" />
                    Couple
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                <span>
                  Order #{purchaseOrder.orderNumber}
                </span>

                <span>
                  Requested{" "}
                  {formatDate(purchaseOrder.createdAt)}
                </span>
              </div>

              {purchaseOrder.expiresAt && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-xs ${
                    expired
                      ? "text-red-400"
                      : "text-zinc-600"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  {expired
                    ? `Expired ${formatDate(
                        purchaseOrder.expiresAt
                      )}`
                    : `Expires ${formatDate(
                        purchaseOrder.expiresAt
                      )}`}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] px-5 py-4 xl:min-w-[190px] xl:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
              Total Amount
            </p>

            <p className="mt-1 text-3xl font-black text-orange-500">
              ₹
              {Number(
                purchaseOrder.totalAmount || 0
              ).toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
              Cash payment
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">

        {/* CUSTOMER */}
        <Section title="Customer Details" icon={UserRound}>
          <InfoItem
            label="Phone"
            value={purchaseOrder.phone}
            icon={Phone}
          />

          <InfoItem
            label="Email"
            value={purchaseOrder.email}
            icon={Mail}
          />

          <InfoItem
            label="Gender"
            value={capitalize(purchaseOrder.gender)}
          />

          <InfoItem
            label="Membership Type"
            value={capitalize(
              purchaseOrder.membershipType
            )}
          />
        </Section>

        {/* COUPLE */}
        {purchaseOrder.membershipType === "couple" &&
          purchaseOrder.partner && (
            <div className="mt-5 rounded-2xl border border-purple-500/15 bg-purple-500/[0.035] p-5">
              <SectionTitle
                title="Partner"
                icon={Users}
                color="purple"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Name"
                  value={purchaseOrder.partner.name}
                />

                <InfoItem
                  label="Phone"
                  value={purchaseOrder.partner.phone}
                  icon={Phone}
                />

                <InfoItem
                  label="Email"
                  value={purchaseOrder.partner.email}
                  icon={Mail}
                />
              </div>
            </div>
          )}

        {/* EMERGENCY */}
        {(purchaseOrder.emergencyContactName ||
          purchaseOrder.emergencyContactPhone) && (
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/40 p-5">
            <SectionTitle
              title="Emergency Contact"
              icon={ShieldCheck}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoItem
                label="Name"
                value={purchaseOrder.emergencyContactName}
              />

              <InfoItem
                label="Phone"
                value={
                  purchaseOrder.emergencyContactPhone
                }
                icon={Phone}
              />

              <InfoItem
                label="Relation"
                value={
                  purchaseOrder.emergencyContactRelation
                }
              />
            </div>
          </div>
        )}

        {/* MEMBERSHIP */}
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/40 p-5">
          <SectionTitle
            title="Membership"
            icon={Zap}
            color="orange"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Plan"
              value={plan?.name || "Unknown plan"}
            />

            <InfoItem
              label="Duration"
              value={
                plan?.durationInDays
                  ? formatDuration(plan.durationInDays)
                  : "—"
              }
            />

            <InfoItem
              label="Regular Price"
              value={`₹${regularMembershipPrice.toLocaleString(
                "en-IN"
              )}`}
            />

            <InfoItem
              label="Final Price"
              value={`₹${membershipPrice.toLocaleString(
                "en-IN"
              )}`}
              highlight
            />
          </div>

          {/* ADDONS */}
          {purchaseOrder.selectedAddOns?.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                Selected Add-ons
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {purchaseOrder.selectedAddOns.map(
                  (addOn, index) => (
                    <span
                      key={`${addOn.addOn}-${index}`}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs font-medium text-zinc-400"
                    >
                      {addOn.name}{" "}
                      <span className="text-orange-400">
                        ₹
                        {Number(
                          addOn.priceAtPurchase || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROMOTION */}
        {promotion && (
          <div className="mt-5 rounded-2xl border border-green-500/15 bg-green-500/[0.035] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                <Zap className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-500">
                  Promotion Applied
                </p>

                <h3 className="mt-1 font-bold text-white">
                  {promotion.title}
                </h3>

                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="text-zinc-500">
                    Offer:{" "}
                    <strong className="text-white">
                      ₹
                      {Number(
                        promotion.offerPrice ||
                          membershipPrice
                      ).toLocaleString("en-IN")}
                    </strong>
                  </span>

                  {discount > 0 && (
                    <span className="font-semibold text-green-400">
                      Saved ₹
                      {discount.toLocaleString("en-IN")}
                    </span>
                  )}

                  {promotion.registrationFeeWaived && (
                    <span className="font-semibold text-green-400">
                      Registration fee waived
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRICE BREAKDOWN */}
        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/40 p-5">
          <div className="ml-auto max-w-md space-y-3">
            <PriceLine
              label="Regular Membership"
              value={regularMembershipPrice}
            />

            {discount > 0 && (
              <PriceLine
                label="Discount"
                value={-discount}
                green
              />
            )}

            <PriceLine
              label="Membership After Offer"
              value={membershipPrice}
            />

            <PriceLine
              label="Add-ons"
              value={Number(
                purchaseOrder.addOnsTotal || 0
              )}
            />

            <PriceLine
              label="Registration"
              value={Number(
                purchaseOrder.registrationFee || 0
              )}
            />

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="font-bold text-white">
                Total
              </span>

              <span className="text-2xl font-black text-orange-500">
                ₹
                {Number(
                  purchaseOrder.totalAmount || 0
                ).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
          <a
            href={`tel:${purchaseOrder.phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <Phone className="h-4 w-4" />
            Call Customer
          </a>

          <button
            type="button"
            onClick={() => onConfirm(purchaseOrder)}
            disabled={isConfirming || expired}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {isConfirming ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : expired ? (
              <>
                <XCircle className="h-4 w-4" />
                Request Expired
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Cash Payment
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) {
  const colors = {
    orange: "bg-orange-500/10 text-orange-500",
    green: "bg-green-500/10 text-green-400",
    red: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-5 transition hover:border-white/[0.14]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-xs font-medium text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-700">
        {description}
      </p>

      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/[0.025] blur-2xl transition group-hover:bg-orange-500/[0.06]" />
    </div>
  );
}

function Alert({ type, message, onClose }) {
  const success = type === "success";

  return (
    <div
      className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border p-4 ${
        success
          ? "border-green-500/20 bg-green-500/[0.05] text-green-400"
          : "border-red-500/20 bg-red-500/[0.05] text-red-400"
      }`}
    >
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        )}

        <p className="text-sm leading-6">{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-current opacity-50 transition hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <SectionTitle title={title} icon={Icon} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  icon: Icon,
  color = "orange",
}) {
  const colorClass =
    color === "purple"
      ? "text-purple-400 bg-purple-500/10"
      : "text-orange-500 bg-orange-500/10";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
  highlight = false,
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-700">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
        )}

        <p
          className={`break-words text-sm ${
            highlight
              ? "font-bold text-orange-400"
              : "text-zinc-300"
          }`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function PriceLine({ label, value, green = false }) {
  const numericValue = Number(value || 0);
  const negative = numericValue < 0;

  return (
    <div className="flex items-center justify-between gap-5 text-sm">
      <span className="text-zinc-600">{label}</span>

      <span
        className={
          green || negative
            ? "font-semibold text-green-400"
            : "font-medium text-zinc-300"
        }
      >
        {numericValue < 0 ? "-₹" : "₹"}
        {Math.abs(numericValue).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function formatDuration(days) {
  if (!days) return "—";

  if (days === 30) return "1 Month";
  if (days === 90) return "3 Months";
  if (days === 180) return "6 Months";
  if (days === 270) return "9 Months";
  if (days === 365) return "12 Months";

  if (days % 30 === 0) {
    return `${days / 30} Months`;
  }

  return `${days} Days`;
}

function capitalize(value) {
  if (!value) return "—";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}