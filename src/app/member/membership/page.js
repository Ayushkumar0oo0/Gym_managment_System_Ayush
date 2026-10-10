
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Dumbbell,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";

const API = {
  status: "/api/member/membership/status",
  plans: "/api/member/membership/plans",
  renew: "/api/member/membership/renew",
  razorpay: "/api/member/membership/razorpay",
  verify: "/api/member/membership/razorpay/verify",
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();

  const styles = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    expired: "border-red-500/30 bg-red-500/10 text-red-400",
    upcoming: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
        styles[normalized] ||
        "border-white/10 bg-white/5 text-zinc-400"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function Notice({ type = "error", children, onClose }) {
  if (!children) return null;

  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}

      <p className="flex-1 text-sm leading-6">{children}</p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="rounded-lg p-1 opacity-70 hover:opacity-100"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}

function MembershipPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const promotionId = searchParams.get("promotionId");
  const promotionType = searchParams.get("type");

  const isExtensionMode =
    Boolean(promotionId) && promotionType === "extension";

  const [plans, setPlans] = useState([]);
  const [membership, setMembership] = useState(null);
  const [pendingRenewal, setPendingRenewal] = useState(null);
  const [pendingExtension, setPendingExtension] = useState(null);
  const [promotion, setPromotion] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const [loading, setLoading] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMembershipData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const requests = [
        fetch(API.status, {
          cache: "no-store",
        }),
      ];

      if (!isExtensionMode) {
        requests.push(
          fetch(API.plans, {
            cache: "no-store",
          })
        );
      }

      if (isExtensionMode && promotionId) {
        requests.push(
          fetch(`/api/public/promotions/${promotionId}`, {
            cache: "no-store",
          })
        );
      }

      const responses = await Promise.all(requests);

      const statusResponse = responses[0];
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusData.message || "Failed to load membership status."
        );
      }

      setMembership(statusData.membership || null);
      setPendingRenewal(statusData.pendingRenewal || null);
      setPendingExtension(statusData.pendingExtension || null);

      if (!isExtensionMode) {
        const plansResponse = responses[1];
        const plansData = await plansResponse.json();

        if (!plansResponse.ok) {
          throw new Error(
            plansData.message || "Failed to load membership plans."
          );
        }

        const availablePlans = Array.isArray(plansData.plans)
          ? plansData.plans
          : [];

        setPlans(availablePlans);

        // Keep the pending renewal's plan selected when possible.
        const pendingPlanId = getId(
          statusData.pendingRenewal?.plan ||
            statusData.pendingRenewal?.membershipPlan
        );

        const pendingPlan = availablePlans.find(
          (plan) => getId(plan) === pendingPlanId
        );

        if (pendingPlan) {
          setSelectedPlan(pendingPlan);
        } else if (availablePlans.length === 1) {
          setSelectedPlan(availablePlans[0]);
        }
      }

      if (isExtensionMode && promotionId) {
        const promotionResponse = responses[1];
        const promotionData = await promotionResponse.json();

        if (!promotionResponse.ok) {
          throw new Error(
            promotionData.message || "Failed to load this offer."
          );
        }

        setPromotion(
          promotionData.promotion ||
            promotionData.data ||
            promotionData
        );
      }
    } catch (err) {
      console.error("Membership page loading error:", err);
      setError(err.message || "Failed to load membership information.");
    } finally {
      setLoading(false);
    }
  }, [isExtensionMode, promotionId]);

  useEffect(() => {
    loadMembershipData();
  }, [loadMembershipData]);

  function getPendingPlanId() {
    return getId(
      pendingRenewal?.plan || pendingRenewal?.membershipPlan
    );
  }

  function selectPlan(plan) {
    if (loadingPurchase) return;

    const pendingPlanId = getPendingPlanId();

    if (pendingRenewal && pendingPlanId) {
      if (pendingPlanId !== getId(plan)) {
        setError(
          "You already have a pending renewal for another plan. Please continue with that plan or resolve the existing payment first."
        );
        return;
      }
    }

    setSelectedPlan(plan);
    setError("");
    setSuccess("");
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () =>
          resolve(Boolean(window.Razorpay))
        );
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "The request could not be completed.");
    }

    return data;
  }

  async function verifyRazorpayPayment(paymentId, response) {
    try {
      setError("");
      setSuccess("Payment received. Verifying it securely…");

      await postJson(API.verify, {
        paymentId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });

      setLoadingPurchase(false);
      setSuccess("Payment verified successfully!");

      await loadMembershipData();

      setTimeout(() => {
        router.push("/member/membership/status");
      }, 1200);
    } catch (err) {
      console.error("Membership payment verification error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Payment verification failed.");
    }
  }

  async function startRazorpayPayment(paymentId, description) {
    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const orderData = await postJson(API.razorpay, { paymentId });
      const order = orderData.razorpay;

      const key = order?.key;
      const orderId = order?.orderId;
      const amount = Number(order?.amount);
      const currency = order?.currency || "INR";

      if (
        !key ||
        !orderId ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        throw new Error("Razorpay order information is incomplete.");
      }

      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout. Please try again.");
      }

      const checkout = new window.Razorpay({
        key,
        amount,
        currency,
        name: "Gym Management",
        description,
        order_id: orderId,

        handler: async (response) => {
          await verifyRazorpayPayment(paymentId, response);
        },

        modal: {
          ondismiss: () => {
            setLoadingPurchase(false);
            setError(
              "Payment window closed. Your payment remains pending; you can continue it later."
            );
          },
        },

        theme: {
          color: "#f97316",
        },
      });

      checkout.on("payment.failed", (response) => {
        setLoadingPurchase(false);
        setError(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
      });

      checkout.open();
    } catch (err) {
      console.error("Razorpay checkout error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Could not start Razorpay checkout.");
    }
  }

  async function handleRenewal() {
    if (!selectedPlan) {
      setError("Please select a membership plan.");
      return;
    }

    if (!["upi", "cash"].includes(paymentMethod)) {
      setError("Please choose a valid payment method.");
      return;
    }

    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const data = await postJson(API.renew, {
        planId: getId(selectedPlan),
        method: paymentMethod,
      });

      if (!data.payment?.id) {
        throw new Error("Payment information was not returned.");
      }

      if (paymentMethod === "cash") {
        setPendingRenewal(data.payment);
        setLoadingPurchase(false);
        setSuccess(
          data.reusedExistingPayment
            ? "Your existing renewal is now set to cash. Pay at the gym and wait for admin confirmation."
            : "Your cash renewal request has been submitted. Pay at the gym; your membership will be renewed after admin confirmation."
        );

        await loadMembershipData();
        return;
      }

      await startRazorpayPayment(
        data.payment.id,
        `Renew ${selectedPlan.name} Membership`
      );
    } catch (err) {
      console.error("Membership renewal error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Failed to start membership renewal.");
    }
  }

  async function createExtensionPayment() {
    if (!promotionId) {
      throw new Error("Promotion ID is missing.");
    }

    const data = await postJson(
      `/api/member/promotions/${promotionId}/purchase`,
      { method: paymentMethod }
    );

    if (!data.payment?.id) {
      throw new Error("Extension payment information was not returned.");
    }

    return data;
  }

  async function verifyExtensionPayment(paymentId, response) {
    try {
      setError("");
      setSuccess("Payment received. Verifying your extension…");

      await postJson(
        `/api/member/promotions/${promotionId}/razorpay/verify`,
        {
          paymentId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }
      );

      setLoadingPurchase(false);
      setSuccess(
        `Payment successful! Your membership extension has been processed.`
      );

      await loadMembershipData();

      setTimeout(() => {
        router.push("/member/membership/status");
      }, 1400);
    } catch (err) {
      console.error("Extension verification error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Extension payment verification failed.");
    }
  }

  async function startExtensionRazorpay(paymentId) {
    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const data = await postJson(
        `/api/member/promotions/${promotionId}/razorpay`,
        { paymentId }
      );

      const order = data.razorpay || data.order || data;

      const key = order?.key || order?.keyId || data?.keyId;
      const orderId = order?.orderId || order?.id;
      const amount = Number(order?.amount);
      const currency = order?.currency || "INR";

      if (
        !key ||
        !orderId ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        throw new Error("Extension Razorpay order information is incomplete.");
      }

      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout.");
      }

      const checkout = new window.Razorpay({
        key,
        amount,
        currency,
        name: "Gym Management",
        description: promotion?.title || "Membership Extension",
        order_id: orderId,

        handler: async (response) => {
          await verifyExtensionPayment(paymentId, response);
        },

        modal: {
          ondismiss: () => {
            setLoadingPurchase(false);
            setError(
              "Payment window closed. Your extension payment is still pending."
            );
          },
        },

        theme: {
          color: "#f97316",
        },
      });

      checkout.on("payment.failed", (response) => {
        setLoadingPurchase(false);
        setError(
          response?.error?.description || "Extension payment failed."
        );
      });

      checkout.open();
    } catch (err) {
      console.error("Extension Razorpay error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Could not start extension payment.");
    }
  }

  async function handleExtensionPurchase() {
    if (!promotion) {
      setError("This extension offer is not available.");
      return;
    }

    if (!membership || membership.status !== "active") {
      setError("An active membership is required for this extension offer.");
      return;
    }

    if (!["upi", "cash"].includes(paymentMethod)) {
      setError("Please choose a valid payment method.");
      return;
    }

    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const data = await createExtensionPayment();
      setPendingExtension(data.payment);

      if (paymentMethod === "cash") {
        setLoadingPurchase(false);
        setSuccess(
          "Cash extension request submitted. Please pay at the gym. Your membership will be extended after admin confirmation."
        );

        await loadMembershipData();
        return;
      }

      await startExtensionRazorpay(data.payment.id);
    } catch (err) {
      console.error("Extension purchase error:", err);
      setLoadingPurchase(false);
      setError(err.message || "Could not submit the extension request.");
    }
  }

  const isMembershipActive = membership?.status === "active";
  const isCoupleMembership =
    membership?.membershipType === "couple" ||
    Boolean(membership?.secondaryUser);

  const pendingPlanId = getPendingPlanId();

  const currentPlanName =
    membership?.plan?.name || "Gym Membership";

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#080808] px-5 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          </div>
          <p className="text-sm text-zinc-400">
            Loading your membership…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/member")}
          className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b130e] via-[#11100f] to-[#0a0a0a] p-6 sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-orange-500/5 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                <Dumbbell size={14} />
                Member zone
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Your membership.
                <span className="block text-orange-500">
                  Your progress.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                Manage your plan, renew your membership, and keep your
                training journey moving forward.
              </p>
            </div>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-3xl border border-orange-500/20 bg-orange-500/10 md:self-center">
              <Crown className="h-10 w-10 text-orange-400" />
            </div>
          </div>
        </header>

        <Notice type="error" onClose={() => setError("")}>
          {error}
        </Notice>

        <Notice type="success" onClose={() => setSuccess("")}>
          {success}
        </Notice>

        {pendingRenewal && (
          <section className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                  <Clock3 size={22} />
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-white">
                      Renewal awaiting confirmation
                    </h2>
                    <StatusBadge status={pendingRenewal.status} />
                  </div>

                  <p className="text-sm leading-6 text-zinc-400">
                    {pendingRenewal.method === "cash"
                      ? "Your cash request is pending. Pay at the gym and wait for admin confirmation."
                      : "Your online renewal has not been confirmed yet. Continue with the same plan to resume checkout."}
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    Amount:{" "}
                    <strong className="text-white">
                      {money(pendingRenewal.amount)}
                    </strong>
                  </p>
                </div>
              </div>

              {pendingRenewal.method === "upi" && (
                <button
                  type="button"
                  disabled={loadingPurchase}
                  onClick={() => {
                    const id = getId(pendingRenewal);
                    const plan = plans.find(
                      (item) => getId(item) === pendingPlanId
                    );

                    if (plan) setSelectedPlan(plan);

                    if (id) {
                      startRazorpayPayment(
                        id,
                        `Renew ${plan?.name || "Membership"}`
                      );
                    } else {
                      setError(
                        "The pending payment ID is missing. Refresh the page or contact the gym admin."
                      );
                    }
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue payment
                  <ArrowRight size={17} />
                </button>
              )}
            </div>
          </section>
        )}

        {pendingExtension && (
          <section className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-1 text-amber-400" size={21} />
              <div>
                <h2 className="font-bold">Extension request pending</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Your extension payment is awaiting confirmation. If you
                  selected cash, please pay at the gym.
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  Amount:{" "}
                  <strong className="text-white">
                    {money(pendingExtension.amount)}
                  </strong>
                </p>
              </div>
            </div>
          </section>
        )}

        {isExtensionMode ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
              {promotion?.posterImage ? (
                <div className="relative aspect-[16/7] overflow-hidden bg-zinc-900">
                  {/* The image URL comes from the existing public promotion API. */}
                  <img
                    src={promotion.posterImage}
                    alt={promotion.title || "Membership extension offer"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute bottom-4 left-5 rounded-full border border-orange-300/30 bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
                    Extension offer
                  </span>
                </div>
              ) : (
                <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-orange-950/40 to-zinc-950">
                  <Sparkles className="h-14 w-14 text-orange-400" />
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                  <Zap size={15} />
                  Special offer
                </div>

                <h2 className="text-2xl font-black sm:text-3xl">
                  {promotion?.title || "Extend your membership"}
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-400">
                  {promotion?.description ||
                    "Add more time to your current gym membership with this special extension offer."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-xs text-zinc-500">Extension</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {promotion?.extensionDays || "—"}{" "}
                      <span className="text-sm font-medium text-zinc-400">
                        days
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
                    <p className="text-xs text-orange-300/80">
                      Offer price
                    </p>
                    <p className="mt-1 text-xl font-black text-orange-400">
                      {money(promotion?.offerPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
              <h3 className="text-xl font-bold">Your extension checkout</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Review your membership and choose how you want to pay.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-500">
                      Current membership
                    </p>
                    <p className="mt-1 font-semibold">
                      {membership?.plan?.name || "Gym membership"}
                    </p>
                  </div>
                  <StatusBadge status={membership?.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-zinc-500">Days remaining</p>
                    <p className="mt-1 text-lg font-bold">
                      {membership?.remainingDays ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Current end date</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(membership?.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {!isMembershipActive && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300">
                  This offer requires an active membership.
                </p>
              )}

              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                disabled={loadingPurchase}
              />

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs text-zinc-500">Total payable</p>
                  <p className="mt-1 text-2xl font-black">
                    {money(promotion?.offerPrice)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    loadingPurchase ||
                    !promotion ||
                    !isMembershipActive ||
                    Boolean(pendingExtension)
                  }
                  onClick={handleExtensionPurchase}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPurchase ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                  {loadingPurchase ? "Processing…" : "Get extension"}
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Online payments are verified by the server. Cash requests
                take effect after gym admin confirmation.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                    Membership overview
                  </p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    Your current plan
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={loadingPurchase}
                  onClick={loadMembershipData}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  Refresh
                </button>
              </div>

              {membership ? (
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
                  <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.10] to-transparent p-5 sm:p-7">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3.5">
                          <Crown className="h-7 w-7 text-orange-400" />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <StatusBadge status={membership.status} />
                            {isCoupleMembership && (
                              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                                Couple membership
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-black sm:text-2xl">
                            {currentPlanName}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            {membership.plan?.description ||
                              "Your gym membership details"}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm text-zinc-500">
                          Days remaining
                        </p>
                        <p className="mt-1 text-4xl font-black text-orange-400">
                          {membership.remainingDays ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <MembershipStat
                      icon={CalendarDays}
                      label="Start date"
                      value={formatDate(membership.startDate)}
                    />
                    <MembershipStat
                      icon={Clock3}
                      label="Expiry date"
                      value={formatDate(membership.endDate)}
                    />
                    <MembershipStat
                      icon={CreditCard}
                      label="Price at purchase"
                      value={money(membership.priceAtPurchase)}
                    />
                  </div>

                  {Array.isArray(membership.selectedAddOns) &&
                    membership.selectedAddOns.length > 0 && (
                      <div className="border-t border-white/10 p-5 sm:p-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Included add-ons
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {membership.selectedAddOns.map((addon, index) => (
                            <span
                              key={getId(addon) || index}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300"
                            >
                              {typeof addon === "string"
                                ? addon
                                : addon.name || addon.title || "Add-on"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {isCoupleMembership && (
                    <div className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-zinc-400 sm:px-7">
                      Couple memberships require assistance from the gym
                      admin for renewal.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-[#111111] p-7 sm:p-9">
                  <div className="mx-auto max-w-lg text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                      <Dumbbell size={30} />
                    </div>
                    <h3 className="mt-5 text-xl font-bold">
                      No membership found
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      We couldn't find an existing membership for this
                      account. If you have already paid, refresh or contact
                      the gym admin for help.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="mb-10">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                  Choose your next term
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Membership plans
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Choose a plan that fits your training goals. Your renewal
                  starts after your current membership ends, when applicable.
                </p>
              </div>

              {!membership ? (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 text-sm leading-6 text-zinc-400">
                  This page is for renewals. To purchase your first
                  membership, use the membership registration flow.
                </div>
              ) : isCoupleMembership ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm leading-6 text-amber-200">
                  Online renewal is unavailable for couple memberships.
                  Please contact the gym admin.
                </div>
              ) : membership.status === "upcoming" ? (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5 text-sm leading-6 text-blue-200">
                  Your membership has not started yet. Please contact the
                  gym admin if you need to make a change.
                </div>
              ) : (
                <>
                  {plans.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 text-sm text-zinc-400">
                      No eligible membership plans are available right now.
                      Please try again later or contact the gym admin.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {plans.map((plan, index) => {
                        const planId = getId(plan);
                        const isSelected =
                          getId(selectedPlan) === planId;
                        const isPendingPlan =
                          Boolean(pendingRenewal) &&
                          pendingPlanId === planId;
                        const blockedByPending =
                          Boolean(pendingRenewal) &&
                          Boolean(pendingPlanId) &&
                          pendingPlanId !== planId;

                        const features = Array.isArray(plan.features)
                          ? plan.features
                          : [];

                        return (
                          <button
                            type="button"
                            key={planId || index}
                            disabled={
                              loadingPurchase || blockedByPending
                            }
                            onClick={() => selectPlan(plan)}
                            className={`group relative flex h-full flex-col rounded-3xl border p-5 text-left transition sm:p-6 ${
                              isSelected
                                ? "border-orange-500 bg-orange-500/[0.06] shadow-[0_0_0_1px_rgba(249,115,22,0.15)]"
                                : "border-white/10 bg-[#111111] hover:border-white/20 hover:bg-[#141414]"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {isSelected && (
                              <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">
                                <Check size={15} strokeWidth={3} />
                              </span>
                            )}

                            {isPendingPlan && (
                              <span className="absolute right-4 top-4 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">
                                PENDING
                              </span>
                            )}

                            {index === 0 && (
                              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                <Sparkles size={12} />
                                Start here
                              </span>
                            )}

                            <h3 className="pr-9 text-lg font-bold text-white">
                              {plan.name || "Membership plan"}
                            </h3>

                            <p className="mt-2 min-h-10 text-sm leading-6 text-zinc-400">
                              {plan.description ||
                                "Train consistently and keep moving towards your goals."}
                            </p>

                            <div className="mt-5 border-b border-white/10 pb-5">
                              <p className="text-3xl font-black text-white">
                                {money(plan.price)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-500">
                                {plan.durationInDays
                                  ? `${plan.durationInDays} days`
                                  : "Plan duration"}
                              </p>
                            </div>

                            <div className="flex-1 space-y-3 py-5">
                              {features.length > 0 ? (
                                features.map((feature, featureIndex) => (
                                  <div
                                    key={featureIndex}
                                    className="flex items-start gap-2.5 text-sm text-zinc-300"
                                  >
                                    <CheckCircle2
                                      size={17}
                                      className="mt-0.5 shrink-0 text-orange-400"
                                    />
                                    <span>
                                      {typeof feature === "string"
                                        ? feature
                                        : feature.name ||
                                          feature.title ||
                                          feature.label ||
                                          "Included feature"}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                  <CheckCircle2
                                    size={17}
                                    className="text-orange-400"
                                  />
                                  Gym access
                                </div>
                              )}
                            </div>

                            <div
                              className={`mt-auto rounded-xl border px-4 py-3 text-center text-sm font-bold transition ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500 text-white"
                                  : "border-white/10 bg-white/[0.03] text-zinc-300 group-hover:border-orange-500/40"
                              }`}
                            >
                              {blockedByPending
                                ? "Another renewal is pending"
                                : isSelected
                                  ? "Selected plan"
                                  : "Choose this plan"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                    <div className="rounded-3xl border border-white/10 bg-[#111111] p-5 sm:p-7">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                          <Wallet size={21} />
                        </div>
                        <div>
                          <h3 className="font-bold">Choose payment method</h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">
                            Pay online using Razorpay or submit a cash
                            request for payment at the gym.
                          </p>
                        </div>
                      </div>

                      <PaymentMethodSelector
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        disabled={loadingPurchase}
                      />

                      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/20 p-3.5 text-xs leading-5 text-zinc-500">
                        <ShieldCheck
                          size={17}
                          className="mt-0.5 shrink-0 text-emerald-400"
                        />
                        <p>
                          Online payments are verified securely. Cash
                          renewals remain pending until the gym admin
                          confirms payment.
                        </p>
                      </div>
                    </div>

                    <div className="h-fit rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] to-[#111111] p-5 sm:p-7">
                      <div className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                        <BadgeCheck size={18} />
                        Renewal summary
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {selectedPlan?.name || "Select a plan"}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {selectedPlan
                          ? `${selectedPlan.durationInDays || "—"} days of membership`
                          : "Choose one of the plans above to continue."}
                      </p>

                      <div className="my-6 border-t border-white/10" />

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-400">
                          Total payable
                        </span>
                        <span className="text-2xl font-black">
                          {selectedPlan
                            ? money(selectedPlan.price)
                            : "—"}
                        </span>
                      </div>

                      {pendingRenewal && (
                        <p className="mt-3 text-xs leading-5 text-amber-300">
                          An existing renewal is pending. Continue with
                          the same plan or resolve the pending request
                          before choosing another.
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={
                          loadingPurchase ||
                          !selectedPlan ||
                          !membership ||
                          isCoupleMembership ||
                          membership.status === "upcoming" ||
                          (Boolean(pendingRenewal) &&
                            Boolean(pendingPlanId) &&
                            pendingPlanId !== getId(selectedPlan))
                        }
                        onClick={handleRenewal}
                        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingPurchase ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            {paymentMethod === "cash"
                              ? "Request cash renewal"
                              : "Continue to payment"}
                            <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>Train smart. Stay consistent. Keep progressing.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            Secure membership payments
          </div>
        </footer>
      </div>
    </main>
  );
}

function MembershipStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-5 sm:p-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-orange-400">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  disabled,
}) {
  const options = [
    {
      value: "upi",
      title: "Online payment",
      description: "Pay securely with Razorpay",
      icon: CreditCard,
    },
    {
      value: "cash",
      title: "Cash at gym",
      description: "Pay in person; admin confirms",
      icon: Banknote,
    },
  ];

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = paymentMethod === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => setPaymentMethod(option.value)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
              selected
                ? "border-orange-500/60 bg-orange-500/[0.08]"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >
            <div
              className={`rounded-xl p-2.5 ${
                selected
                  ? "bg-orange-500/15 text-orange-400"
                  : "bg-white/5 text-zinc-400"
              }`}
            >
              <Icon size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                {option.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {option.description}
              </p>
            </div>

            <span
              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-zinc-600"
              }`}
            >
              {selected && <Check size={11} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </main>
      }
    >
      <MembershipPageContent />
    </Suspense>
  );
}
