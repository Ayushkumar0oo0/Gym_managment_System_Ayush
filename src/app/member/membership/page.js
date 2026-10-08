"use client";

import { Suspense, useEffect, useState } from "react";
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
  const [promotion, setPromotion] = useState(null);
  const [pendingExtension, setPendingExtension] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const [loading, setLoading] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadMembershipData();
  }, [promotionId, promotionType]);

  async function loadMembershipData() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const requests = [
        fetch("/api/member/membership/status", {
          cache: "no-store",
        }),
      ];

      if (!isExtensionMode) {
        requests.push(
          fetch("/api/member/membership/plans", {
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
          statusData.message ||
            "Failed to load membership status."
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
            plansData.message ||
              "Failed to load membership plans."
          );
        }

        const availablePlans = plansData.plans || [];

        setPlans(availablePlans);

        if (availablePlans.length > 0) {
          const pendingPlanId =
            statusData.pendingRenewal?.membershipPlan?._id?.toString() ||
            statusData.pendingRenewal?.membershipPlan?.toString() ||
            statusData.pendingRenewal?.plan?._id?.toString() ||
            statusData.pendingRenewal?.plan?._id ||
            statusData.pendingRenewal?.planId?.toString();

          const pendingPlan = pendingPlanId
            ? availablePlans.find(
                (plan) =>
                  plan._id?.toString() === pendingPlanId
              )
            : null;

          setSelectedPlan(
            pendingPlan || availablePlans[0]
          );
        }
      }

      if (isExtensionMode) {
        const promotionResponse = responses[1];
        const promotionData =
          await promotionResponse.json();

        if (
          !promotionResponse.ok ||
          !promotionData.success
        ) {
          throw new Error(
            promotionData.message ||
              "Unable to load extension promotion."
          );
        }

        if (
          promotionData.promotion?.type !==
          "extension"
        ) {
          throw new Error(
            "This promotion is not an extension offer."
          );
        }

        setPromotion(promotionData.promotion);
      }
    } catch (err) {
      console.error(
        "Load membership data error:",
        err
      );

      setError(
        err.message ||
          "Failed to load membership information."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getFeatureLabel(feature) {
    const labels = {
      gym: "Gym Access",
      cardio: "Cardio",
      personal_trainer: "Personal Trainer",
    };

    return labels[feature] || feature;
  }

  function getPendingPlanId() {
    if (!pendingRenewal) return null;

    return (
      pendingRenewal.membershipPlan?._id?.toString() ||
      pendingRenewal.membershipPlan?.toString() ||
      pendingRenewal.plan?._id?.toString() ||
      pendingRenewal.plan?._id ||
      pendingRenewal.planId?.toString() ||
      null
    );
  }

  function handleSelectPlan(plan) {
    if (pendingRenewal) {
      const pendingPlanId = getPendingPlanId();

      if (
        pendingPlanId &&
        pendingPlanId !== plan._id.toString()
      ) {
        setError(
          "You already have a pending renewal for another plan. Please continue with that plan or complete the existing payment."
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
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function startRazorpayPayment(paymentId) {
    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const orderResponse = await fetch(
        "/api/member/membership/razorpay",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Failed to create Razorpay order."
        );
      }

      const razorpayData = orderData.razorpay;

      const razorpayKey = razorpayData?.key;
      const razorpayOrderId = razorpayData?.orderId;
      const razorpayAmount = Number(
        razorpayData?.amount
      );
      const razorpayCurrency =
        razorpayData?.currency || "INR";

      if (
        !razorpayKey ||
        !razorpayOrderId ||
        !Number.isFinite(razorpayAmount) ||
        razorpayAmount <= 0
      ) {
        throw new Error(
          "Razorpay order information is incomplete."
        );
      }

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Failed to load Razorpay checkout."
        );
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: razorpayAmount,
        currency: razorpayCurrency,
        name: "Gym Management",
        description: selectedPlan
          ? `Renew ${selectedPlan.name} Membership`
          : "Membership Renewal",
        order_id: razorpayOrderId,

        handler: async function (response) {
          await verifyRazorpayPayment(
            paymentId,
            response
          );
        },

        modal: {
          ondismiss: function () {
            setLoadingPurchase(false);
            setError(
              "Payment window was closed. Your renewal payment is still pending. You can choose Cash below if you prefer."
            );
          },
        },

        theme: {
          color: "#f97316",
        },
      });

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setLoadingPurchase(false);
          setError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.error(
        "Razorpay payment error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Failed to start payment."
      );
    }
  }

  async function verifyRazorpayPayment(
    paymentId,
    response
  ) {
    try {
      setError("");
      setSuccess(
        "Payment successful. Verifying payment..."
      );

      const verifyResponse = await fetch(
        "/api/member/membership/razorpay/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
            razorpayOrderId:
              response.razorpay_order_id,
            razorpayPaymentId:
              response.razorpay_payment_id,
            razorpaySignature:
              response.razorpay_signature,
          }),
        }
      );

      const verifyData =
        await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.message ||
            "Payment verification failed."
        );
      }

      setLoadingPurchase(false);
      setSuccess(
        "Payment successful. Your membership has been renewed."
      );

      setTimeout(() => {
        router.push(
          "/member/membership/status"
        );
      }, 1200);
    } catch (err) {
      console.error(
        "Payment verification error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Payment verification failed."
      );
    }
  }

  async function handleRenewal() {
    if (!selectedPlan) {
      setError(
        "Please select a membership plan."
      );
      return;
    }

    if (
      paymentMethod !== "upi" &&
      paymentMethod !== "cash"
    ) {
      setError(
        "Please select a valid payment method."
      );
      return;
    }

    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/member/membership/renew",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            planId: selectedPlan._id,
            method: paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create membership renewal."
        );
      }

      if (!data.payment?.id) {
        throw new Error(
          "Payment information was not returned."
        );
      }

      if (paymentMethod === "cash") {
        setLoadingPurchase(false);

        setSuccess(
          data.reusedExistingPayment
            ? "Your existing renewal has been switched to cash. Please pay at the gym and wait for admin confirmation."
            : "Cash renewal request created. Please pay at the gym. Your membership will be renewed after admin confirmation."
        );

        setPendingRenewal(data.payment);

        setTimeout(() => {
          router.push(
            "/member/membership/status"
          );
        }, 1800);

        return;
      }

      await startRazorpayPayment(
        data.payment.id
      );
    } catch (err) {
      console.error(
        "Membership renewal error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Failed to renew membership."
      );
    }
  }

  async function createExtensionPayment() {
    if (!promotionId) {
      throw new Error(
        "Promotion ID is missing."
      );
    }

    const response = await fetch(
      `/api/member/promotions/${promotionId}/purchase`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          method: paymentMethod,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to create extension payment."
      );
    }

    if (!data.payment?.id) {
      throw new Error(
        "Extension payment information was not returned."
      );
    }

    return data;
  }

  async function startExtensionRazorpay(
    paymentId
  ) {
    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/member/promotions/${promotionId}/razorpay`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            paymentId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create extension Razorpay order."
        );
      }

      const order =
        data.razorpay ||
        data.order ||
        data;

      const razorpayKey =
        order?.key ||
        order?.keyId ||
        data?.keyId;

      const razorpayOrderId =
        order?.orderId ||
        order?.id;

      const razorpayAmount = Number(
        order?.amount
      );

      const razorpayCurrency =
        order?.currency || "INR";

      if (
        !razorpayKey ||
        !razorpayOrderId ||
        !Number.isFinite(razorpayAmount) ||
        razorpayAmount <= 0
      ) {
        throw new Error(
          "Extension Razorpay order information is incomplete."
        );
      }

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Failed to load Razorpay checkout."
        );
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: razorpayAmount,
        currency: razorpayCurrency,
        name: "Gym Management",
        description:
          promotion?.title ||
          "Membership Extension",
        order_id: razorpayOrderId,

        handler: async function (
          razorpayResponse
        ) {
          await verifyExtensionPayment(
            paymentId,
            razorpayResponse
          );
        },

        modal: {
          ondismiss: function () {
            setLoadingPurchase(false);

            setError(
              "Payment window was closed. Your extension payment is still pending."
            );
          },
        },

        theme: {
          color: "#f97316",
        },
      });

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "EXTENSION RAZORPAY PAYMENT FAILED:",
            response
          );

          setLoadingPurchase(false);
          setError(
            response?.error?.description ||
              "Extension payment failed."
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.error(
        "Extension Razorpay error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Failed to start extension payment."
      );
    }
  }

  async function verifyExtensionPayment(
    paymentId,
    response
  ) {
    try {
      setError("");
      setSuccess(
        "Payment successful. Verifying extension..."
      );

      const verifyResponse =
        await fetch(
          `/api/member/promotions/${promotionId}/razorpay/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              paymentId,
              razorpayOrderId:
                response.razorpay_order_id,
              razorpayPaymentId:
                response.razorpay_payment_id,
              razorpaySignature:
                response.razorpay_signature,
            }),
          }
        );

      const data =
        await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          data.message ||
            "Extension payment verification failed."
        );
      }

      setLoadingPurchase(false);

      setSuccess(
        `Payment successful! ${
          promotion?.extensionDays || ""
        } days have been added to your membership.`
      );

      setTimeout(() => {
        router.push(
          "/member/membership/status"
        );
      }, 1500);
    } catch (err) {
      console.error(
        "Extension verification error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Extension payment verification failed."
      );
    }
  }

  async function handleExtensionPurchase() {
    if (!promotion) {
      setError(
        "Extension promotion is not available."
      );
      return;
    }

    if (!membership) {
      setError(
        "You need an active membership to use this extension offer."
      );
      return;
    }

    if (membership.status !== "active") {
      setError(
        "This extension offer requires an active membership."
      );
      return;
    }

    if (
      paymentMethod !== "upi" &&
      paymentMethod !== "cash"
    ) {
      setError(
        "Please select a valid payment method."
      );
      return;
    }

    try {
      setLoadingPurchase(true);
      setError("");
      setSuccess("");

      const data =
        await createExtensionPayment();

      setPendingExtension(data.payment);

      if (paymentMethod === "cash") {
        setLoadingPurchase(false);

        setSuccess(
          "Cash extension request submitted. Please pay at the gym. Your membership will be extended after admin confirmation."
        );

        setTimeout(() => {
          router.push(
            "/member/membership/status"
          );
        }, 1800);

        return;
      }

      await startExtensionRazorpay(
        data.payment.id
      );
    } catch (err) {
      console.error(
        "Extension purchase error:",
        err
      );

      setLoadingPurchase(false);
      setError(
        err.message ||
          "Failed to create extension payment."
      );
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (isExtensionMode) {
    return (
      <ExtensionView
        router={router}
        membership={membership}
        promotion={promotion}
        pendingExtension={pendingExtension}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        loadingPurchase={loadingPurchase}
        error={error}
        success={success}
        formatPrice={formatPrice}
        formatDate={formatDate}
        handleExtensionPurchase={
          handleExtensionPurchase
        }
        promotionId={promotionId}
      />
    );
  }

  const pendingPlanId = getPendingPlanId();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-7xl">
        <PageHeader
          title="Renew Membership"
          description="Choose a membership plan and keep your training journey going."
          router={router}
        />

        {membership && (
          <CurrentMembership
            membership={membership}
            formatDate={formatDate}
          />
        )}

        <Messages
          error={error}
          success={success}
        />

        {pendingRenewal && (
          <PendingRenewal
            pendingRenewal={pendingRenewal}
            selectedPlan={selectedPlan}
            formatPrice={formatPrice}
          />
        )}

        <section className="mt-8">
          <div className="mb-5">
            <div className="flex items-center gap-2 text-orange-400">
              <Crown size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                Membership Plans
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Choose Your Plan
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Select the plan that fits your training goals.
            </p>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-12 text-center">
              <Dumbbell
                size={30}
                className="mx-auto text-zinc-700"
              />
              <p className="mt-4 text-sm font-semibold text-zinc-500">
                No membership plans are currently
                available.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const selected =
                  selectedPlan?._id === plan._id;

                const isPendingPlan =
                  Boolean(
                    pendingPlanId &&
                      pendingPlanId ===
                        plan._id.toString()
                  );

                const isDifferentPendingPlan =
                  Boolean(
                    pendingPlanId &&
                      pendingPlanId !==
                        plan._id.toString()
                  );

                return (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    selected={selected}
                    isPendingPlan={isPendingPlan}
                    disabled={
                      isDifferentPendingPlan
                    }
                    formatPrice={formatPrice}
                    getFeatureLabel={
                      getFeatureLabel
                    }
                    onSelect={() =>
                      handleSelectPlan(plan)
                    }
                  />
                );
              })}
            </div>
          )}
        </section>

        {selectedPlan && (
          <RenewalCheckout
            selectedPlan={selectedPlan}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            pendingRenewal={pendingRenewal}
            loadingPurchase={loadingPurchase}
            formatPrice={formatPrice}
            handleRenewal={handleRenewal}
          />
        )}

        <BottomActions router={router} />
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-280px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[150px]" />
      <div className="absolute bottom-[-220px] right-[-140px] h-[420px] w-[420px] rounded-full bg-orange-500/5 blur-[130px]" />
    </div>
  );
}

function PageHeader({
  title,
  description,
  router,
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <button
            type="button"
            onClick={() => router.push("/member")}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </button>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            <Crown size={12} />
            Membership
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {title.split(" ")[0]}{" "}
            <span className="text-orange-500">
              {title.split(" ").slice(1).join(" ")}
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/member/membership/status"
            )
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
        >
          <BadgeCheck size={15} />
          Membership Status
        </button>
      </div>
    </header>
  );
}

function CurrentMembership({
  membership,
  formatDate,
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
      <div className="absolute right-[-100px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/10 blur-[100px]" />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20">
              <Dumbbell size={22} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                Current Membership
              </p>

              <h2 className="mt-1 text-xl font-black sm:text-2xl">
                {membership.plan?.name ||
                  "Membership"}
              </h2>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-black capitalize text-orange-400">
            <CheckCircle2 size={14} />
            {membership.status}
          </span>
        </div>

        <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          <CurrentStat
            label="Current End Date"
            value={formatDate(
              membership.endDate
            )}
            icon={<CalendarDays size={16} />}
          />

          <CurrentStat
            label="Remaining Days"
            value={membership.remainingDays || 0}
            icon={<Clock3 size={16} />}
            highlight
          />

          <CurrentStat
            label="Current Plan"
            value={
              membership.plan?.name || "-"
            }
            icon={<Crown size={16} />}
          />
        </div>
      </div>
    </section>
  );
}

function CurrentStat({
  label,
  value,
  icon,
  highlight,
}) {
  return (
    <div className="bg-zinc-950 p-4 sm:p-5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-orange-500/10 text-orange-400"
            : "bg-white/[0.04] text-zinc-600"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-1 font-black ${
          highlight
            ? "text-xl text-orange-400"
            : "text-zinc-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Messages({ error, success }) {
  return (
    <>
      {error && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{success}</span>
        </div>
      )}
    </>
  );
}

function PendingRenewal({
  pendingRenewal,
  selectedPlan,
  formatPrice,
}) {
  return (
    <section className="mt-6 rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
          <Clock3 size={18} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-400">
            Renewal Payment Pending
          </p>

          <h2 className="mt-1 text-lg font-black">
            Payment already in progress
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            You can continue with UPI or switch the
            existing request to cash.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniBox
          label="Plan"
          value={
            pendingRenewal.plan?.name ||
            pendingRenewal.membershipPlan?.name ||
            selectedPlan?.name ||
            "Membership Renewal"
          }
        />

        <MiniBox
          label="Amount"
          value={`₹${formatPrice(
            pendingRenewal.amount
          )}`}
        />

        <MiniBox
          label="Current Method"
          value={
            pendingRenewal.method || "-"
          }
          uppercase
        />
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  selected,
  isPendingPlan,
  disabled,
  formatPrice,
  getFeatureLabel,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${
        selected
          ? "border-orange-500/50 bg-orange-500/[0.06] shadow-xl shadow-orange-500/5"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/25 hover:bg-orange-500/[0.025]"
      } ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : ""
      }`}
    >
      {selected && (
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Dumbbell size={18} />
            </div>

            <h2 className="mt-4 text-xl font-black">
              {plan.name}
            </h2>

            {plan.description && (
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {plan.description}
              </p>
            )}
          </div>

          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black">
              <Check size={11} />
              {isPendingPlan
                ? "Pending"
                : "Selected"}
            </span>
          )}
        </div>

        <div className="mt-7">
          <span className="text-4xl font-black">
            ₹{formatPrice(plan.price)}
          </span>

          <span className="ml-2 text-xs font-bold text-zinc-700">
            / {plan.durationInDays} days
          </span>
        </div>

        <div className="mt-6 space-y-3 border-t border-white/5 pt-5">
          {plan.features?.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 text-sm text-zinc-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <Check size={13} />
              </span>

              {getFeatureLabel(feature)}
            </div>
          ))}
        </div>

        <div
          className={`mt-6 flex items-center gap-2 text-xs font-bold transition ${
            selected
              ? "text-orange-400"
              : "text-zinc-700 group-hover:text-orange-400"
          }`}
        >
          {selected
            ? "Plan selected"
            : "Select this plan"}

          <ArrowRight size={13} />
        </div>
      </div>
    </button>
  );
}

function RenewalCheckout({
  selectedPlan,
  paymentMethod,
  setPaymentMethod,
  pendingRenewal,
  loadingPurchase,
  formatPrice,
  handleRenewal,
}) {
  const pendingPlanId =
    pendingRenewal?.membershipPlan?._id?.toString() ||
    pendingRenewal?.membershipPlan?.toString() ||
    pendingRenewal?.plan?._id?.toString() ||
    pendingRenewal?.plan?._id ||
    pendingRenewal?.planId?.toString();

  const isPendingSelected =
    pendingPlanId ===
    selectedPlan._id.toString();

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 bg-white/[0.02] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <CreditCard size={19} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              Checkout
            </p>

            <h2 className="mt-1 text-xl font-black">
              Complete Your Renewal
            </h2>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-2xl border border-white/10 bg-black p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                    Selected Plan
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {selectedPlan.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Duration:{" "}
                    {selectedPlan.durationInDays} days
                  </p>
                </div>

                <p className="text-2xl font-black text-orange-400">
                  ₹{formatPrice(selectedPlan.price)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-sm font-black">
                Payment Method
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentMethod
                  active={paymentMethod === "upi"}
                  icon={<CreditCard size={18} />}
                  title="UPI"
                  description="Pay securely using Razorpay."
                  onClick={() =>
                    setPaymentMethod("upi")
                  }
                />

                <PaymentMethod
                  active={paymentMethod === "cash"}
                  icon={<Banknote size={18} />}
                  title="Cash"
                  description="Pay directly at the gym."
                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-orange-400"
                />

                <div>
                  <p className="text-sm font-black text-orange-300">
                    How renewal works
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    If your current membership is still
                    active, the new plan starts after your
                    current end date. If expired, renewal
                    starts from today.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-white/10 bg-black p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                Payment Summary
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">
                    {selectedPlan.name}
                  </span>

                  <span className="font-bold">
                    ₹{formatPrice(selectedPlan.price)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">
                    Registration Fee
                  </span>

                  <span className="font-bold text-emerald-400">
                    Already Paid
                  </span>
                </div>

                <div className="my-4 border-t border-white/10" />

                <div className="flex items-center justify-between gap-4">
                  <span className="font-black">
                    Total
                  </span>

                  <span className="text-2xl font-black text-orange-400">
                    ₹{formatPrice(selectedPlan.price)}
                  </span>
                </div>
              </div>
            </div>

            {pendingRenewal && isPendingSelected && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-4">
                <p className="text-sm font-black text-yellow-400">
                  Existing renewal payment found
                </p>

                <p className="mt-1 text-xs leading-5 text-yellow-300/60">
                  Current payment: ₹
                  {formatPrice(
                    pendingRenewal.amount
                  )}{" "}
                  via{" "}
                  {(
                    pendingRenewal.method || ""
                  ).toUpperCase()}
                  .
                </p>

                <p className="mt-1 text-xs leading-5 text-yellow-300/60">
                  Choose UPI to continue or Cash to
                  switch the existing request.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleRenewal}
              disabled={loadingPurchase}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPurchase ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : paymentMethod === "upi" ? (
                <>
                  Pay ₹
                  {formatPrice(selectedPlan.price)}
                  <ArrowRight size={16} />
                </>
              ) : pendingRenewal ? (
                <>
                  Switch to Cash
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Request Cash Renewal
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {paymentMethod === "cash" && (
              <p className="mt-3 text-center text-xs leading-5 text-zinc-700">
                {pendingRenewal
                  ? "Your existing pending renewal will be switched to cash. Pay at the gym and wait for admin confirmation."
                  : "Your membership will be renewed after an admin confirms your cash payment."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentMethod({
  active,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-orange-500/50 bg-orange-500/[0.06]"
          : "border-white/10 bg-black hover:border-orange-500/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          active
            ? "bg-orange-500 text-black"
            : "bg-white/[0.04] text-zinc-600"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 font-black">{title}</p>

      <p className="mt-1 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </button>
  );
}

function ExtensionView({
  router,
  membership,
  promotion,
  pendingExtension,
  paymentMethod,
  setPaymentMethod,
  loadingPurchase,
  error,
  success,
  formatPrice,
  formatDate,
  handleExtensionPurchase,
  promotionId,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/promotions/${promotionId}`
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft size={15} />
          Back to Offer
        </button>

        <div className="mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            <Zap size={12} />
            Extension Offer
          </div>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl lg:text-5xl">
            Extend Your{" "}
            <span className="text-orange-500">
              Membership
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Add extra days to your existing active
            membership using this special offer.
          </p>
        </div>

        <Messages
          error={error}
          success={success}
        />

        {membership && (
          <section className="mt-7 rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <Dumbbell size={17} />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                Current Membership
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniBox
                label="Plan"
                value={
                  membership.plan?.name ||
                  "Membership"
                }
              />

              <MiniBox
                label="Current End Date"
                value={formatDate(
                  membership.endDate
                )}
              />

              <MiniBox
                label="Remaining Days"
                value={`${membership.remainingDays || 0} days`}
              />
            </div>
          </section>
        )}

        {!membership && (
          <section className="mt-7 rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
            <div className="flex gap-3">
              <XCircle
                size={20}
                className="text-red-400"
              />

              <div>
                <h2 className="font-black text-red-300">
                  Active Membership Required
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-300/60">
                  You need an active membership to
                  purchase this extension offer.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/member/membership/status"
                    )
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black"
                >
                  View Membership
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>
        )}

        {membership &&
          membership.status === "active" &&
          promotion && (
            <section className="mt-7 overflow-hidden rounded-3xl border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/20">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="rounded-3xl border border-orange-500/15 bg-orange-500/[0.04] p-5 sm:p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Special Offer
                  </p>

                  <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                    {promotion.title}
                  </h2>

                  {promotion.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                      {promotion.description}
                    </p>
                  )}

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <OfferStat
                      label="Extra Membership"
                      value={`+${promotion.extensionDays}`}
                      suffix="days"
                    />

                    <OfferStat
                      label="Offer Price"
                      value={`₹${formatPrice(
                        promotion.offerPrice
                      )}`}
                    />
                  </div>
                </div>

                <div className="mt-7">
                  <p className="mb-3 text-sm font-black">
                    Payment Method
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <PaymentMethod
                      active={
                        paymentMethod === "upi"
                      }
                      icon={<CreditCard size={18} />}
                      title="UPI"
                      description="Pay securely using Razorpay."
                      onClick={() =>
                        setPaymentMethod("upi")
                      }
                    />

                    <PaymentMethod
                      active={
                        paymentMethod === "cash"
                      }
                      icon={<Banknote size={18} />}
                      title="Cash"
                      description="Pay directly at the gym."
                      onClick={() =>
                        setPaymentMethod("cash")
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-zinc-600">
                      Extension
                    </span>

                    <span className="font-bold">
                      +{promotion.extensionDays} days
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between gap-4 text-sm">
                    <span className="text-zinc-600">
                      Price
                    </span>

                    <span className="font-bold">
                      ₹
                      {formatPrice(
                        promotion.offerPrice
                      )}
                    </span>
                  </div>

                  <div className="my-4 border-t border-white/10" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-black">
                      Total
                    </span>

                    <span className="text-2xl font-black text-orange-400">
                      ₹
                      {formatPrice(
                        promotion.offerPrice
                      )}
                    </span>
                  </div>
                </div>

                {pendingExtension && (
                  <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-4 text-sm text-yellow-300">
                    Your extension payment request has
                    been created. Please complete the
                    payment or wait for admin confirmation.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExtensionPurchase}
                  disabled={loadingPurchase}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPurchase ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : paymentMethod === "upi" ? (
                    <>
                      Pay ₹
                      {formatPrice(
                        promotion.offerPrice
                      )}
                      <ArrowRight size={17} />
                    </>
                  ) : (
                    <>
                      Request Cash Payment
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {paymentMethod === "cash" && (
                  <p className="mt-3 text-center text-xs leading-5 text-zinc-700">
                    Your membership will be extended
                    after an admin confirms your cash
                    payment.
                  </p>
                )}
              </div>
            </section>
          )}

        <div className="mt-7 flex flex-col gap-3 pb-8 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/member/membership/status"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            Membership Status
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/promotions")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            All Promotions
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </main>
  );
}

function OfferStat({
  label,
  value,
  suffix,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-orange-400">
        {value}
      </p>

      {suffix && (
        <p className="mt-1 text-xs text-zinc-700">
          {suffix}
        </p>
      )}
    </div>
  );
}

function MiniBox({
  label,
  value,
  uppercase = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-1 font-black text-zinc-300 ${
          uppercase ? "uppercase" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BottomActions({ router }) {
  return (
    <div className="mt-7 flex flex-col gap-3 pb-8 sm:flex-row">
      <button
        type="button"
        onClick={() => router.push("/member")}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </button>

      <button
        type="button"
        onClick={() =>
          router.push(
            "/member/membership/status"
          )
        }
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/30 hover:text-orange-400"
      >
        Membership Status
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-36 rounded bg-zinc-900" />
        <div className="mt-6 h-12 w-80 rounded-xl bg-zinc-900" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 h-52 rounded-3xl bg-zinc-950" />

        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 rounded-3xl bg-zinc-950"
            />
          ))}
        </div>

        <div className="mt-7 h-96 rounded-3xl bg-zinc-950" />
      </div>
    </main>
  );
}

export default function MembershipPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MembershipPageContent />
    </Suspense>
  );
}