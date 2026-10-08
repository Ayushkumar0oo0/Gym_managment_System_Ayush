"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";

import ProductOrderFinalRazorpayCheckout from "@/components/ProductOrderFinalRazorpayCheckout";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/member/product-orders/${orderId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load order."
        );
      }

      setOrder(data.order);
    } catch (error) {
      console.error("Load order error:", error);

      setError(
        error.message ||
          "Failed to load order."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    loadOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!order) {
    return <OrderNotFound error={error} />;
  }

  const product = order.product;

  const totalAmount =
    Number(order.totalAmount) || 0;

  const totalPaid =
    Number(order.totalPaid) || 0;

  const remainingAmount =
    Number(order.remainingAmount) || 0;

  const initialPaidAmount =
    Number(order.initialPaidAmount) || 0;

  const finalPaidAmount =
    Number(order.finalPaidAmount) || 0;

  const status = getOrderStatus(
    order.orderStatus
  );

  const isReady =
    order.orderStatus ===
    "ready_for_pickup";

  const isDelivered =
    order.orderStatus === "delivered";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AmbientGlow />

      {/* Header */}
      <section className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Product Order
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Order{" "}
                <span className="text-orange-500">
                  Details
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                Track your product order, payment
                and pickup status.
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${status.className}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.label}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-[10px] text-zinc-600">
              Order ID: {order._id}
            </span>

            <button
              type="button"
              onClick={loadOrder}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition hover:border-orange-500/20 hover:text-orange-400"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Ready */}
        {isReady && (
          <StatusBanner
            type="ready"
            title="Your product is ready!"
            description={
              <>
                Your product is waiting at the gym
                office. Pay the remaining{" "}
                <strong className="text-white">
                  ₹
                  {remainingAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>{" "}
                by Cash or UPI and collect it.
              </>
            }
          />
        )}

        {/* Delivered */}
        {isDelivered && (
          <StatusBanner
            type="delivered"
            title="Product Delivered"
            description="Your product has been successfully collected and the order is complete."
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main */}
          <div className="space-y-6">
            {/* Product */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-64 w-full shrink-0 overflow-hidden bg-black sm:h-auto sm:w-64">
                  {product?.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={
                        product?.name ||
                        "Product"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-64 items-center justify-center text-zinc-800">
                      <Dumbbell size={50} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                <div className="flex-1 p-6 sm:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">
                        Gym Store
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {product?.name ||
                          "Product"}
                      </h2>

                      <p className="mt-2 text-sm text-zinc-600">
                        Quantity:{" "}
                        <span className="font-bold text-zinc-400">
                          {order.quantity}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {product?.description && (
                    <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-600">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Price at Order
                      </p>

                      <p className="mt-2 text-xl font-black text-white">
                        ₹
                        {Number(
                          order.priceAtOrder
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        Order Total
                      </p>

                      <p className="mt-2 text-xl font-black text-orange-400">
                        ₹
                        {totalAmount.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment details */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-7">
              <SectionHeading
                icon={<Wallet size={17} />}
                eyebrow="Payments"
                title="Payment Details"
                description="Complete breakdown of your product payment."
              />

              <div className="mt-7 space-y-4">
                <MoneyRow
                  label="Total Amount"
                  value={totalAmount}
                />

                <PaymentRow
                  label="Initial Payment"
                  description={`${order.initialPaymentPercentage || 0}% of total order`}
                  amount={initialPaidAmount}
                  status={
                    order.initialPaymentStatus
                  }
                  positive
                />

                <PaymentRow
                  label="Final Payment"
                  description="Paid at pickup"
                  amount={finalPaidAmount}
                  status={
                    order.finalPaymentStatus
                  }
                />

                <div className="border-t border-white/10 pt-5">
                  <MoneyRow
                    label="Total Paid"
                    value={totalPaid}
                    green
                  />

                  <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-black text-orange-400">
                        Remaining
                      </span>

                      <span className="text-2xl font-black text-orange-400">
                        ₹
                        {remainingAmount.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Remaining payment */}
            {!isDelivered &&
              remainingAmount > 0 && (
                <section className="rounded-3xl border border-orange-500/15 bg-zinc-950 p-6 sm:p-7">
                  <SectionHeading
                    icon={<CreditCard size={17} />}
                    eyebrow="Complete Order"
                    title="Remaining Payment"
                    description="Pay the remaining amount before collecting your product."
                  />

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                        <Banknote size={20} />
                      </div>

                      <h3 className="mt-5 font-black">
                        Cash
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-zinc-700">
                        Visit the gym office and
                        pay the remaining amount
                        in cash.
                      </p>

                      <p className="mt-5 text-lg font-black text-zinc-300">
                        ₹
                        {remainingAmount.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                        <CreditCard size={20} />
                      </div>

                      <h3 className="mt-5 font-black">
                        UPI
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-zinc-700">
                        Pay securely using
                        Razorpay UPI.
                      </p>

                      <div className="mt-5">
                        <ProductOrderFinalRazorpayCheckout
                          orderId={order._id}
                          remainingAmount={
                            remainingAmount
                          }
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}
          </div>

          {/* Sidebar */}
          <aside className="h-fit space-y-6">
            {/* Current status */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <SectionHeading
                icon={<PackageCheck size={17} />}
                eyebrow="Tracking"
                title="Order Status"
              />

              <div className="mt-7">
                <StatusTimeline
                  status={order.orderStatus}
                />
              </div>

              <div className="mt-7 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                  Current Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />

                  <p className="font-black text-zinc-300">
                    {status.label}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick info */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <SectionHeading
                icon={<Sparkles size={17} />}
                eyebrow="Order Summary"
                title="Quick Info"
              />

              <div className="mt-6 space-y-4">
                <InfoRow
                  label="Quantity"
                  value={order.quantity}
                />

                <InfoRow
                  label="Total"
                  value={`₹${totalAmount.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <InfoRow
                  label="Paid"
                  value={`₹${totalPaid.toLocaleString(
                    "en-IN"
                  )}`}
                  green
                />

                <InfoRow
                  label="Remaining"
                  value={`₹${remainingAmount.toLocaleString(
                    "en-IN"
                  )}`}
                  orange
                />
              </div>
            </section>

            <Link
              href="/products"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-sm font-black text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
            >
              Browse More Products
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/member"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-sm font-black text-zinc-500 transition hover:border-orange-500/20 hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-700">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  green = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <span
        className={`font-black ${
          green
            ? "text-emerald-400"
            : "text-zinc-300"
        }`}
      >
        ₹
        {Number(value || 0).toLocaleString(
          "en-IN"
        )}
      </span>
    </div>
  );
}

function PaymentRow({
  label,
  description,
  amount,
  status,
  positive = false,
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div>
        <p className="text-sm font-bold text-zinc-400">
          {label}
        </p>

        <p className="mt-1 text-[11px] text-zinc-700">
          {description}
        </p>
      </div>

      <div className="text-right">
        <p
          className={`font-black ${
            positive
              ? "text-emerald-400"
              : "text-zinc-300"
          }`}
        >
          ₹
          {Number(
            amount || 0
          ).toLocaleString("en-IN")}
        </p>

        <p
          className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
            status === "paid"
              ? "text-emerald-500"
              : "text-yellow-500"
          }`}
        >
          {status === "paid"
            ? "Paid"
            : "Pending"}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  green = false,
  orange = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-zinc-700">
        {label}
      </span>

      <span
        className={`text-sm font-black ${
          green
            ? "text-emerald-400"
            : orange
            ? "text-orange-400"
            : "text-zinc-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusTimeline({ status }) {
  const steps = [
    {
      key: "payment",
      title: "Payment",
      description:
        "Initial payment received.",
      completed:
        status !== "pending_payment",
    },
    {
      key: "ordered",
      title: "Order Placed",
      description:
        "Gym is arranging your product.",
      completed: [
        "ordered",
        "ready_for_pickup",
        "delivered",
      ].includes(status),
    },
    {
      key: "ready",
      title: "Ready for Pickup",
      description:
        "Product is available at the gym.",
      completed: [
        "ready_for_pickup",
        "delivered",
      ].includes(status),
    },
    {
      key: "delivered",
      title: "Delivered",
      description:
        "Payment completed and product collected.",
      completed: status === "delivered",
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className="relative flex gap-4"
        >
          {index !==
            steps.length - 1 && (
            <div
              className={`absolute left-[17px] top-9 h-[calc(100%-10px)] w-px ${
                step.completed
                  ? "bg-orange-500/40"
                  : "bg-white/10"
              }`}
            />
          )}

          <div
            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
              step.completed
                ? "border-orange-500 bg-orange-500 text-black"
                : "border-white/10 bg-zinc-900 text-zinc-700"
            }`}
          >
            {step.completed ? (
              <Check
                size={15}
                strokeWidth={3}
              />
            ) : (
              <span className="text-[10px] font-black">
                {index + 1}
              </span>
            )}
          </div>

          <div className="pb-7">
            <p
              className={`text-sm font-black ${
                step.completed
                  ? "text-zinc-300"
                  : "text-zinc-700"
              }`}
            >
              {step.title}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-zinc-700">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBanner({
  type,
  title,
  description,
}) {
  const ready = type === "ready";

  return (
    <div
      className={`mb-6 overflow-hidden rounded-3xl border p-5 ${
        ready
          ? "border-orange-500/20 bg-orange-500/[0.06]"
          : "border-emerald-500/20 bg-emerald-500/[0.05]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            ready
              ? "bg-orange-500 text-black"
              : "bg-emerald-500 text-black"
          }`}
        >
          {ready ? (
            <PackageCheck size={21} />
          ) : (
            <CheckCircle2 size={21} />
          )}
        </div>

        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.16em] ${
              ready
                ? "text-orange-400"
                : "text-emerald-400"
            }`}
          >
            {ready
              ? "Action Required"
              : "Order Complete"}
          </p>

          <h2 className="mt-1 text-lg font-black">
            {title}
          </h2>

          <p
            className={`mt-2 text-sm leading-6 ${
              ready
                ? "text-orange-200/60"
                : "text-emerald-200/60"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function getOrderStatus(orderStatus) {
  switch (orderStatus) {
    case "pending_payment":
      return {
        label: "Payment Pending",
        className:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      };

    case "ordered":
      return {
        label: "Order Placed",
        className:
          "border-blue-500/20 bg-blue-500/10 text-blue-400",
      };

    case "ready_for_pickup":
      return {
        label: "Ready for Pickup",
        className:
          "border-green-500/20 bg-green-500/10 text-green-400",
      };

    case "delivered":
      return {
        label: "Delivered",
        className:
          "border-green-500/20 bg-green-500/10 text-green-400",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "border-red-500/20 bg-red-500/10 text-red-400",
      };

    default:
      return {
        label: "Unknown",
        className:
          "border-white/10 bg-zinc-900 text-zinc-500",
      };
  }
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-28 rounded bg-zinc-900" />

        <div className="mt-8 h-10 w-72 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="h-64 rounded-3xl bg-zinc-950" />
            <div className="h-72 rounded-3xl bg-zinc-950" />
          </div>

          <div className="h-[500px] rounded-3xl bg-zinc-950" />
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading order...
          </span>
        </div>
      </div>
    </main>
  );
}

function OrderNotFound({ error }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>

        <div className="mt-8 rounded-3xl border border-red-500/15 bg-red-500/[0.04] p-10 text-center sm:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Box size={28} />
          </div>

          <h1 className="mt-6 text-2xl font-black">
            Order Not Found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            {error ||
              "We could not find this order."}
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400"
          >
            Browse Products
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}