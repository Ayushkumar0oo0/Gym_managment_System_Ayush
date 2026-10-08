"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import ProductOrderRazorpayCheckout from "@/components/ProductOrderRazorpayCheckout";

const PAYMENT_PERCENTAGES = [
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
];

export default function ProductOrderPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params?.id;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentPercentage, setPaymentPercentage] =
    useState(30);
  const [paymentMethod, setPaymentMethod] =
    useState("upi");
  const [memberNotes, setMemberNotes] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdOrderId, setCreatedOrderId] =
    useState(null);
  const [showRazorpay, setShowRazorpay] =
    useState(false);

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/products",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load products."
          );
        }

        const foundProduct =
          data.products?.find(
            (item) =>
              item._id === productId
          );

        if (!foundProduct) {
          throw new Error(
            "Product not found or is no longer available."
          );
        }

        if (!cancelled) {
          setProduct(foundProduct);
        }
      } catch (error) {
        console.error(
          "Load product error:",
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              "Failed to load product."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const price =
    Number(product?.price) || 0;

  const originalPrice =
    Number(
      product?.originalPrice ??
        product?.price
    ) || 0;

  const totalAmount =
    price * quantity;

  const initialPaymentAmount =
    Math.round(
      (totalAmount *
        paymentPercentage) /
        100
    );

  const remainingAmount =
    totalAmount -
    initialPaymentAmount;

  const savingsPerItem =
    originalPrice > price
      ? originalPrice - price
      : 0;

  const discountPercentage =
    originalPrice > 0 &&
    price < originalPrice
      ? Math.round(
          ((originalPrice - price) /
            originalPrice) *
            100
        )
      : 0;

  const increaseQuantity = () => {
    setQuantity(
      (previous) => previous + 1
    );
  };

  const decreaseQuantity = () => {
    setQuantity((previous) =>
      Math.max(1, previous - 1)
    );
  };

  const handleOrder = async () => {
    try {
      setOrdering(true);
      setError("");
      setSuccess("");

      if (!productId) {
        throw new Error(
          "Product ID is missing."
        );
      }

      const response = await fetch(
        "/api/member/product-orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId,
            quantity,
            initialPaymentPercentage:
              paymentPercentage,
            initialPaymentMethod:
              paymentMethod,
            memberNotes:
              memberNotes.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create order."
        );
      }

      const newOrderId =
        data.order?._id;

      if (!newOrderId) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      if (paymentMethod === "cash") {
        setSuccess(
          "Order created successfully. Please pay the initial amount at the gym office."
        );

        setTimeout(() => {
          router.push(
            `/orders/${newOrderId}`
          );
        }, 1000);

        return;
      }

      if (paymentMethod === "upi") {
        setCreatedOrderId(
          newOrderId
        );

        setShowRazorpay(true);

        setSuccess(
          "Order created. Complete your UPI payment."
        );
      }
    } catch (error) {
      console.error(
        "Create product order error:",
        error
      );

      setError(
        error.message ||
          "Failed to create order."
      );
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <ProductUnavailable
        error={error}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AmbientGlow />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-400">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {success && !showRazorpay && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-sm text-emerald-400">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          {/* Product */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
              <div className="relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-[340px] w-full object-cover sm:h-[520px]"
                  />
                ) : (
                  <div className="flex h-[340px] items-center justify-center bg-zinc-900 sm:h-[520px]">
                    <Dumbbell
                      size={64}
                      className="text-zinc-800"
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {discountPercentage > 0 && (
                  <div className="absolute left-5 top-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-orange-500/20">
                      <Sparkles size={13} />
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                    Gym Store
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {product.name}
                  </h1>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                {product.description && (
                  <p className="text-sm leading-7 text-zinc-600">
                    {product.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-end gap-3">
                  {discountPercentage > 0 && (
                    <span className="text-lg font-bold text-zinc-700 line-through">
                      ₹
                      {originalPrice.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  )}

                  <span className="text-3xl font-black text-white">
                    ₹
                    {price.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                {savingsPerItem > 0 && (
                  <p className="mt-2 text-sm font-bold text-emerald-400">
                    You save ₹
                    {savingsPerItem.toLocaleString(
                      "en-IN"
                    )}{" "}
                    per item
                  </p>
                )}

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <Feature
                    icon={<ShieldCheck size={16} />}
                    title="Secure"
                    text="Protected payment"
                  />

                  <Feature
                    icon={<Package size={16} />}
                    title="Gym Pickup"
                    text="Collect at gym"
                  />

                  <Feature
                    icon={<Wallet size={16} />}
                    title="Flexible"
                    text="Choose payment"
                  />
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6 rounded-3xl border border-orange-500/15 bg-orange-500/[0.04] p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <ShoppingBag size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Gym Store
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    How product payment works
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <HowStep
                  number="01"
                  text="Choose the quantity you want."
                />

                <HowStep
                  number="02"
                  text="Choose how much you want to pay initially."
                />

                <HowStep
                  number="03"
                  text="Pay the initial amount by UPI or Cash."
                />

                <HowStep
                  number="04"
                  text="The gym arranges your product."
                />

                <HowStep
                  number="05"
                  text="When ready, pay the remaining amount and collect it."
                />
              </div>
            </div>
          </div>

          {/* Order */}
          <div className="h-fit rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                  Checkout
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Place Your Order
                </h2>

                <p className="mt-1 text-sm text-zinc-700">
                  Choose quantity and initial
                  payment.
                </p>
              </div>

              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 sm:flex">
                <ShoppingBag size={18} />
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-7">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-wider text-zinc-600">
                Quantity
              </label>

              <div className="flex w-fit items-center overflow-hidden rounded-2xl border border-white/10 bg-black">
                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={quantity <= 1}
                  className="flex h-12 w-12 items-center justify-center text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>

                <div className="flex h-12 min-w-16 items-center justify-center border-x border-white/10 px-4 text-lg font-black">
                  {quantity}
                </div>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  className="flex h-12 w-12 items-center justify-center text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Initial payment */}
            <div className="mt-7">
              <div className="mb-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-600">
                  Initial Payment
                </label>

                <p className="mt-1 text-xs text-zinc-800">
                  Choose how much you want to
                  pay now.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PAYMENT_PERCENTAGES.map(
                  (percentage) => {
                    const amount =
                      Math.round(
                        (totalAmount *
                          percentage) /
                          100
                      );

                    const selected =
                      paymentPercentage ===
                      percentage;

                    return (
                      <button
                        key={percentage}
                        type="button"
                        onClick={() =>
                          setPaymentPercentage(
                            percentage
                          )
                        }
                        className={`rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/5"
                            : "border-white/10 bg-black hover:border-orange-500/20"
                        }`}
                      >
                        <div
                          className={`text-sm font-black ${
                            selected
                              ? "text-orange-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {percentage}%
                        </div>

                        <div className="mt-1 text-xs text-zinc-700">
                          ₹
                          {amount.toLocaleString(
                            "en-IN"
                          )}
                        </div>

                        {selected && (
                          <div className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-orange-400">
                            <Check size={10} />
                            Selected
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-7">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-wider text-zinc-600">
                Payment Method
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentMethod
                  active={
                    paymentMethod ===
                    "upi"
                  }
                  onClick={() =>
                    setPaymentMethod("upi")
                  }
                  icon={
                    <CreditCard size={18} />
                  }
                  title="UPI"
                  description="Pay securely online"
                />

                <PaymentMethod
                  active={
                    paymentMethod ===
                    "cash"
                  }
                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                  icon={
                    <Banknote size={18} />
                  }
                  title="Cash"
                  description="Pay at gym office"
                />
              </div>

              {paymentMethod ===
                "cash" && (
                <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.04] p-4">
                  <p className="text-xs leading-5 text-yellow-400/80">
                    Your order will remain
                    pending until the admin
                    confirms that the cash was
                    received.
                  </p>
                </div>
              )}

              {paymentMethod ===
                "upi" && (
                <div className="mt-3 rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                  <p className="text-xs leading-5 text-blue-400/80">
                    Razorpay UPI checkout will
                    open after your order is
                    created.
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mt-7">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-600">
                Note{" "}
                <span className="text-zinc-800">
                  (Optional)
                </span>
              </label>

              <textarea
                value={memberNotes}
                onChange={(event) =>
                  setMemberNotes(
                    event.target.value
                  )
                }
                rows={3}
                maxLength={500}
                placeholder="Any note for the gym..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-800 transition focus:border-orange-500"
              />
            </div>

            {/* Summary */}
            <div className="mt-7 rounded-2xl border border-white/10 bg-black p-5">
              <div className="flex items-center gap-2">
                <Wallet
                  size={15}
                  className="text-orange-400"
                />

                <h3 className="text-sm font-black">
                  Order Summary
                </h3>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow
                  label="Price per item"
                  value={`₹${price.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <SummaryRow
                  label="Quantity"
                  value={quantity}
                />

                <div className="border-t border-white/10 pt-4">
                  <SummaryRow
                    label="Total"
                    value={`₹${totalAmount.toLocaleString(
                      "en-IN"
                    )}`}
                    strong
                  />
                </div>

                <SummaryRow
                  label={`Initial payment (${paymentPercentage}%)`}
                  value={`₹${initialPaymentAmount.toLocaleString(
                    "en-IN"
                  )}`}
                  orange
                />

                <SummaryRow
                  label="Remaining at pickup"
                  value={`₹${remainingAmount.toLocaleString(
                    "en-IN"
                  )}`}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleOrder}
              disabled={
                ordering ||
                showRazorpay
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-black shadow-xl shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ordering ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Creating Order...
                </>
              ) : (
                <>
                  Continue — Pay ₹
                  {initialPaymentAmount.toLocaleString(
                    "en-IN"
                  )}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="mt-4 flex items-start gap-2 text-center">
              <ShieldCheck
                size={14}
                className="mx-auto mt-0.5 shrink-0 text-zinc-800"
              />

              <p className="text-xs leading-5 text-zinc-800">
                Remaining ₹
                {remainingAmount.toLocaleString(
                  "en-IN"
                )}{" "}
                must be paid before collecting
                your product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Razorpay modal */}
      {showRazorpay &&
        createdOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-orange-500/5">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                      UPI Payment
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                      Complete Your Payment
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Complete the initial
                      payment through Razorpay.
                      Your order will be confirmed
                      after the payment is verified.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowRazorpay(false)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-600 transition hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-5 rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                    Amount to Pay
                  </p>

                  <p className="mt-1 text-2xl font-black text-orange-400">
                    ₹
                    {initialPaymentAmount.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <ProductOrderRazorpayCheckout
                  orderId={createdOrderId}
                  buttonText={`Pay ₹${initialPaymentAmount.toLocaleString(
                    "en-IN"
                  )} with UPI`}
                  onSuccess={() => {
                    setShowRazorpay(false);

                    router.push(
                      `/orders/${createdOrderId}`
                    );
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowRazorpay(false);

                    router.push(
                      `/orders/${createdOrderId}`
                    );
                  }}
                  className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  Pay Later
                </button>

                <p className="mt-4 text-center text-[10px] leading-5 text-zinc-800">
                  You can complete the payment
                  later from your order page.
                </p>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <p className="mt-3 text-xs font-black text-zinc-300">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-zinc-700">
        {text}
      </p>
    </div>
  );
}

function HowStep({
  number,
  text,
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-[10px] font-black text-orange-400">
        {number}
      </span>

      <p className="text-xs leading-5 text-zinc-600">
        {text}
      </p>
    </div>
  );
}

function PaymentMethod({
  active,
  onClick,
  icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/5"
          : "border-white/10 bg-black hover:border-orange-500/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          active
            ? "bg-orange-500 text-black"
            : "bg-white/5 text-zinc-600"
        }`}
      >
        {icon}
      </div>

      <div
        className={`mt-4 font-black ${
          active
            ? "text-orange-400"
            : "text-zinc-300"
        }`}
      >
        {title}
      </div>

      <p className="mt-1 text-xs text-zinc-700">
        {description}
      </p>

      {active && (
        <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-orange-400">
          <Check size={10} />
          Selected
        </div>
      )}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  orange = false,
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        strong ? "font-black" : ""
      } ${
        orange
          ? "text-orange-400"
          : strong
          ? "text-zinc-200"
          : "text-zinc-600"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-28 rounded bg-zinc-900" />

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <div className="h-[650px] rounded-3xl bg-zinc-950" />

          <div className="h-[700px] rounded-3xl bg-zinc-950" />
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading product...
          </span>
        </div>
      </div>
    </main>
  );
}

function ProductUnavailable({
  error,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>

        <div className="mt-8 rounded-3xl border border-red-500/15 bg-red-500/[0.04] p-10 text-center sm:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Package size={28} />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
            Product Store
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Product Unavailable
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
            {error ||
              "This product could not be found."}
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

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}