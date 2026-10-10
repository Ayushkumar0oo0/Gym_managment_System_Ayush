"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Dumbbell,
  Gift,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import PurchaseCustomerForm from "@/components/membership/PurchaseCustomerForm";
import PurchaseSummary from "@/components/membership/PurchaseSummary";

function MembershipPurchasePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const promotionIdFromUrl =
    searchParams.get("promotionId");

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const [plans, setPlans] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [selectedPlan, setSelectedPlan] =
    useState(null);

  const [selectedAddOns, setSelectedAddOns] =
    useState([]);

  const [selectedPromotion, setSelectedPromotion] =
    useState(null);

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const [errors, setErrors] = useState({});

  // --------------------------------------------------
  // COUPLE
  // --------------------------------------------------

  const [membershipType, setMembershipType] =
    useState("individual");

  const [partner, setPartner] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "female",
  });

  // --------------------------------------------------
  // PAYMENT
  // --------------------------------------------------

 const [method, setMethod] = useState("online");

  // --------------------------------------------------
  // QUOTE
  // --------------------------------------------------

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] =
    useState(false);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [promotionLoading, setPromotionLoading] =
    useState(false);
  const [purchasing, setPurchasing] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [razorpayReady, setRazorpayReady] =
    useState(false);

  // --------------------------------------------------
  // RAZORPAY
  // --------------------------------------------------

  useEffect(() => {
    const scriptId =
      "razorpay-checkout-script";

    const existing =
      document.getElementById(scriptId);

    if (existing) {
      if (window.Razorpay) {
        setRazorpayReady(true);
      }

      return;
    }

    const script =
      document.createElement("script");

    script.id = scriptId;
    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      setRazorpayReady(
        Boolean(window.Razorpay)
      );
    };

    script.onerror = () => {
      setRazorpayReady(false);
    };

    document.body.appendChild(script);
  }, []);

  // --------------------------------------------------
  // LOAD OPTIONS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/public/membership-options",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load membership options."
          );
        }

        const activePlans =
          (data.plans || []).filter(
            (plan) =>
              plan.isActive !== false
          );

        const activeAddOns =
          (data.addOns || []).filter(
            (addOn) =>
              addOn.isActive !== false
          );

        if (cancelled) return;

        setPlans(activePlans);
        setAddOns(activeAddOns);

        if (activePlans.length > 0) {
          setSelectedPlan(activePlans[0]);
        }
      } catch (err) {
        console.error(
          "LOAD MEMBERSHIP OPTIONS ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load membership options."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // LOAD PROMOTIONS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadPromotions() {
      try {
        const response = await fetch(
          "/api/public/promotions",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        const activePromotions =
          (data.promotions || []).filter(
            (promotion) =>
              promotion.isActive !== false &&
              promotion.type === "membership"
          );

        if (!cancelled) {
          setPromotions(activePromotions);
        }
      } catch (err) {
        console.error(
          "LOAD PROMOTIONS ERROR:",
          err
        );
      }
    }

    loadPromotions();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // LOAD URL PROMOTION
  // --------------------------------------------------

  useEffect(() => {
    if (!promotionIdFromUrl) return;

    let cancelled = false;

    async function loadPromotion() {
      try {
        setPromotionLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/promotions/${promotionIdFromUrl}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "This promotion is no longer available."
          );
        }

        if (
          data.promotion?.type !==
          "membership"
        ) {
          throw new Error(
            "This promotion cannot be used for a new membership purchase."
          );
        }

        if (!cancelled) {
          setSelectedPromotion(
            data.promotion
          );
        }
      } catch (err) {
        console.error(
          "LOAD SELECTED PROMOTION ERROR:",
          err
        );

        if (!cancelled) {
          setSelectedPromotion(null);
          setError(
            err.message ||
              "Unable to load this promotion."
          );
        }
      } finally {
        if (!cancelled) {
          setPromotionLoading(false);
        }
      }
    }

    loadPromotion();

    return () => {
      cancelled = true;
    };
  }, [promotionIdFromUrl]);

  // --------------------------------------------------
  // PROMOTION → PLAN
  // --------------------------------------------------

  useEffect(() => {
    if (
      !selectedPromotion ||
      plans.length === 0
    ) {
      return;
    }

    const promotionPlanId =
      typeof selectedPromotion.membershipPlan ===
      "object"
        ? selectedPromotion.membershipPlan?._id
        : selectedPromotion.membershipPlan;

    if (!promotionPlanId) return;

    const promotionPlan =
      plans.find(
        (plan) =>
          String(plan._id) ===
          String(promotionPlanId)
      );

    if (promotionPlan) {
      setSelectedPlan(promotionPlan);
    }
  }, [
    selectedPromotion,
    plans,
  ]);

  // --------------------------------------------------
  // ELIGIBLE PLANS
  // --------------------------------------------------

  const eligiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      const eligibility =
        plan.eligibility || "both";

      if (eligibility === "both") {
        return true;
      }

      return eligibility === form.gender;
    });
  }, [
    plans,
    form.gender,
  ]);

  // --------------------------------------------------
  // KEEP PLAN VALID
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedPlan) return;

    const stillEligible =
      eligiblePlans.some(
        (plan) =>
          String(plan._id) ===
          String(selectedPlan._id)
      );

    if (!stillEligible) {
      setSelectedPlan(
        eligiblePlans[0] || null
      );

      if (!promotionIdFromUrl) {
        setSelectedPromotion(null);
      }
    }
  }, [
    eligiblePlans,
    selectedPlan,
    promotionIdFromUrl,
  ]);

  // --------------------------------------------------
  // COUPLE PLAN VALIDATION
  // --------------------------------------------------

  useEffect(() => {
    if (membershipType !== "couple") {
      return;
    }

    if (
      selectedPlan?.eligibility ===
      "both"
    ) {
      return;
    }

    const couplePlan =
      eligiblePlans.find(
        (plan) =>
          (plan.eligibility || "both") ===
          "both"
      );

    setSelectedPlan(
      couplePlan || null
    );

    if (!promotionIdFromUrl) {
      setSelectedPromotion(null);
    }
  }, [
    membershipType,
    eligiblePlans,
    selectedPlan,
    promotionIdFromUrl,
  ]);

  // --------------------------------------------------
  // PARTNER GENDER
  // --------------------------------------------------

  useEffect(() => {
    if (membershipType !== "couple") {
      return;
    }

    setPartner((prev) => ({
      ...prev,
      gender:
        form.gender === "male"
          ? "female"
          : "male",
    }));
  }, [
    form.gender,
    membershipType,
  ]);

  // --------------------------------------------------
  // APPLICABLE PROMOTIONS
  // --------------------------------------------------

  const applicablePromotions =
    useMemo(() => {
      if (!selectedPlan) {
        return [];
      }

      return promotions.filter(
        (promotion) => {
          const promotionPlanId =
            typeof promotion.membershipPlan ===
            "object"
              ? promotion.membershipPlan?._id
              : promotion.membershipPlan;

          return (
            String(promotionPlanId) ===
            String(selectedPlan._id)
          );
        }
      );
    }, [
      promotions,
      selectedPlan,
    ]);

  // --------------------------------------------------
  // QUOTE PAYLOAD
  // --------------------------------------------------

  const quotePayload = useMemo(() => {
    return {
      planId:
        selectedPlan?._id || null,

      gender: form.gender,

      membershipType,

      addOnIds:
        selectedAddOns.map(
          (addOn) => addOn._id
        ),

      promotionId:
        selectedPromotion?._id || null,

      email: form.email.trim(),

      phone: form.phone.trim(),
    };
  }, [
    selectedPlan,
    form.gender,
    form.email,
    form.phone,
    membershipType,
    selectedAddOns,
    selectedPromotion,
  ]);

  // --------------------------------------------------
  // SERVER QUOTE
  // --------------------------------------------------

  useEffect(() => {
    if (
      !selectedPlan ||
      !form.gender
    ) {
      setQuote(null);
      return;
    }

    const cleanEmail =
      form.email.trim();

    const cleanPhone =
      form.phone.trim();

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setQuote(null);
      return;
    }

    if (
      cleanPhone &&
      !/^[0-9]{10}$/.test(
        cleanPhone
      )
    ) {
      setQuote(null);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          setQuoteLoading(true);

          const response =
            await fetch(
              "/api/public/purchase/quote",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                cache: "no-store",
                body: JSON.stringify(
                  quotePayload
                ),
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            if (!cancelled) {
              setQuote(null);
            }

            return;
          }

          if (!cancelled) {
            setQuote(
              data.quote || null
            );
          }
        } catch (err) {
          console.error(
            "QUOTE ERROR:",
            err
          );

          if (!cancelled) {
            setQuote(null);
          }
        } finally {
          if (!cancelled) {
            setQuoteLoading(false);
          }
        }
      },
      350
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    quotePayload,
    selectedPlan,
  ]);

  // --------------------------------------------------
  // PRICING
  // --------------------------------------------------

  const pricing =
    quote?.pricing || null;

  const membershipPrice =
    Number(
      pricing?.membershipPrice ??
        selectedPlan?.price ??
        0
    );

  const normalMembershipPrice =
    Number(
      pricing?.regularMembershipPrice ??
        selectedPlan?.price ??
        0
    );

  const addOnsTotal =
    Number(
      pricing?.addOnsTotal || 0
    );

  const registrationFee =
    Number(
      pricing?.registrationFee ?? 500
    );

  const discount =
    Number(
      pricing?.promotionDiscount || 0
    );

  const totalAmount =
    Number(
      pricing?.totalAmount || 0
    );

  // --------------------------------------------------
  // ADD-ON
  // --------------------------------------------------

  function toggleAddOn(addOn) {
    setSelectedAddOns(
      (current) => {
        const exists =
          current.some(
            (item) =>
              String(item._id) ===
              String(addOn._id)
          );

        if (exists) {
          return current.filter(
            (item) =>
              String(item._id) !==
              String(addOn._id)
          );
        }

        return [
          ...current,
          addOn,
        ];
      }
    );
  }

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  function validateForm() {
    const nextErrors = {};

    if (
      form.name.trim().length < 2
    ) {
      nextErrors.name =
        "Please enter your full name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      nextErrors.email =
        "Please enter a valid email address.";
    }

    if (
      !/^[0-9]{10}$/.test(
        form.phone.trim()
      )
    ) {
      nextErrors.phone =
        "Please enter a valid 10-digit phone number.";
    }

    if (
      !["male", "female"].includes(
        form.gender
      )
    ) {
      nextErrors.gender =
        "Please select your gender.";
    }

    if (
      form.password.length < 8
    ) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (
      form.emergencyContactPhone &&
      !/^[0-9]{10}$/.test(
        form.emergencyContactPhone
      )
    ) {
      nextErrors.emergencyContactPhone =
        "Emergency contact phone must contain 10 digits.";
    }

    if (
      form.emergencyContactPhone &&
      form.emergencyContactPhone ===
        form.phone
    ) {
      nextErrors.emergencyContactPhone =
        "Emergency contact phone cannot be the same as your phone number.";
    }

    if (membershipType === "couple") {
      if (
        partner.name.trim().length < 2
      ) {
        nextErrors.partnerName =
          "Please enter your partner's name.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          partner.email.trim()
        )
      ) {
        nextErrors.partnerEmail =
          "Please enter a valid partner email.";
      }

      if (
        !/^[0-9]{10}$/.test(
          partner.phone.trim()
        )
      ) {
        nextErrors.partnerPhone =
          "Please enter a valid partner phone number.";
      }

      if (
        partner.email
          .trim()
          .toLowerCase() ===
        form.email
          .trim()
          .toLowerCase()
      ) {
        nextErrors.partnerEmail =
          "Partner email must be different from your email.";
      }

      if (
        partner.phone.trim() ===
        form.phone.trim()
      ) {
        nextErrors.partnerPhone =
          "Partner phone must be different from your phone number.";
      }

      if (
        partner.gender ===
        form.gender
      ) {
        nextErrors.partnerGender =
          "Couple membership requires different genders.";
      }

      if (
        !selectedPlan ||
        (selectedPlan.eligibility ||
          "both") !== "both"
      ) {
        nextErrors.membershipType =
          "Couple membership requires a plan available for both genders.";
      }
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  // --------------------------------------------------
  // PURCHASE
  // --------------------------------------------------

  async function handlePurchase() {
    try {
      setError("");
      setSuccess("");

      if (!selectedPlan) {
        setError(
          "Please select a membership plan."
        );
        return;
      }

      if (!validateForm()) {
        setError(
          "Please correct the highlighted fields."
        );
        return;
      }

      if (!quote) {
        setError(
          "Please wait for the final price to be calculated."
        );
        return;
      }

      if (quoteLoading) {
        setError(
          "Please wait while we calculate the final price."
        );
        return;
      }

      if (
  method === "online" &&
  !razorpayReady
) {
        setError(
          "Razorpay is still loading. Please wait a moment and try again."
        );
        return;
      }

      setPurchasing(true);

      const purchaseResponse =
        await fetch(
          "/api/public/purchase",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name:
                form.name.trim(),

              email:
                form.email
                  .trim()
                  .toLowerCase(),

              phone:
                form.phone.trim(),

              password:
                form.password,

              gender:
                form.gender,

              emergencyContactName:
                form.emergencyContactName.trim(),

              emergencyContactPhone:
                form.emergencyContactPhone.trim(),

              emergencyContactRelation:
                form.emergencyContactRelation.trim(),

              membershipPlanId:
                selectedPlan._id,

              membershipType,

              partner:
                membershipType === "couple"
                  ? {
                      name:
                        partner.name.trim(),

                      email:
                        partner.email
                          .trim()
                          .toLowerCase(),

                      phone:
                        partner.phone.trim(),

                      gender:
                        partner.gender,
                    }
                  : null,

              selectedAddOns:
                selectedAddOns.map(
                  (addOn) =>
                    addOn._id
                ),

              promotionId:
                selectedPromotion?._id ||
                null,

              paymentMethod:
                method,
            }),
          }
        );

      const purchaseData =
        await purchaseResponse.json();

      if (!purchaseResponse.ok) {
        throw new Error(
          purchaseData.message ||
            "Unable to create purchase order."
        );
      }

      const purchaseOrder =
        purchaseData.purchaseOrder;

      if (!purchaseOrder?.id) {
        throw new Error(
          "Purchase order ID was not returned."
        );
      }

      // CASH
      if (method === "cash") {
        setSuccess(
          "Your cash payment request has been created. Please pay at the gym. Your account and membership will be activated after admin confirmation."
        );

        setPurchasing(false);
        return;
      }

      // ONLINE PAYMENT
await startRazorpayPayment(
  purchaseOrder.id
);
    } catch (err) {
      console.error(
        "PUBLIC MEMBERSHIP PURCHASE ERROR:",
        err
      );

      setPurchasing(false);

      setError(
        err.message ||
          "Something went wrong while creating your purchase."
      );
    }
  }

  // --------------------------------------------------
  // RAZORPAY
  // --------------------------------------------------

  async function startRazorpayPayment(
    purchaseOrderId
  ) {
    try {
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay is still loading. Please try again."
        );
      }

      const response =
        await fetch(
          "/api/public/purchase/razorpay",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              purchaseOrderId,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to start online payment."
        );
      }

      if (
        !data.razorpay?.orderId ||
        !data.razorpay?.key ||
        !data.razorpay?.amount
      ) {
        throw new Error(
          "Invalid Razorpay payment information."
        );
      }

const options = {
  key: data.razorpay.key,

  amount: data.razorpay.amount,

  currency: data.razorpay.currency || "INR",

  name: "Gym Management",

  description:
    selectedPromotion?.title ||
    "Gym Membership Purchase",

  order_id: data.razorpay.orderId,
prefill: {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    contact: form.phone.trim(),
  },

  notes: {
    purchaseOrderId,
  },

  theme: {
    color: "#f97316",
  },

  handler: async (razorpayResponse) => {
    await verifyRazorpayPayment({
      purchaseOrderId,
      razorpayOrderId: razorpayResponse.razorpay_order_id,
      razorpayPaymentId: razorpayResponse.razorpay_payment_id,
      razorpaySignature: razorpayResponse.razorpay_signature,
    });
  },


        modal: {
          ondismiss: () => {
            setPurchasing(false);

            setError(
              "Payment window was closed. Your purchase order is still pending."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setPurchasing(false);

          setError(
            response?.error
              ?.description ||
              "Razorpay payment failed."
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.error(
        "START PUBLIC RAZORPAY ERROR:",
        err
      );

      setPurchasing(false);

      setError(
        err.message ||
          "Unable to start online payment."
      );
    }
  }

  // --------------------------------------------------
  // VERIFY
  // --------------------------------------------------

  async function verifyRazorpayPayment({
    purchaseOrderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) {
    try {
      setError("");

      setSuccess(
        "Payment successful. Verifying your payment..."
      );

      const response =
        await fetch(
          "/api/public/purchase/razorpay/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              purchaseOrderId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Payment verification failed."
        );
      }

      setSuccess(
        "Payment verified successfully. Your account and membership have been created."
      );

      setPurchasing(false);

      setTimeout(() => {
        router.push("/member");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error(
        "VERIFY PUBLIC RAZORPAY ERROR:",
        err
      );

      setPurchasing(false);

      setError(
        err.message ||
          "Payment verification failed."
      );
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return <LoadingScreen />;
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <AmbientBackground />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              router.push("/membership")
            }
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft
              size={15}
              className="transition group-hover:-translate-x-1"
            />
            Back
          </button>

          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700 sm:flex">
            <Lock size={12} />
            Secure Membership Checkout
          </div>
        </div>

        {/* HERO */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.1] via-zinc-950 to-zinc-950">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute right-[-120px] top-[-180px] h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[130px]" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                  <Dumbbell size={12} />
                  Gym Membership
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                  {selectedPromotion
                    ? "Claim Your "
                    : "Start Your "}
                  <span className="text-orange-500">
                    Fitness Journey
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                  {selectedPromotion
                    ? "Complete your details and secure this special membership offer."
                    : "Choose your plan, customize your membership and get started."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StepBadge
                  number="01"
                  label="Details"
                  active
                />
                <StepBadge
                  number="02"
                  label="Plan"
                  active={Boolean(
                    selectedPlan
                  )}
                />
                <StepBadge
                  number="03"
                  label="Payment"
                  active={Boolean(
                    quote
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ALERTS */}
        <div className="mt-6 space-y-3">
          {promotionLoading && (
            <Alert
              type="info"
              icon={<Loader2 size={16} className="animate-spin" />}
              text="Loading selected promotion..."
            />
          )}

          {error && (
            <Alert
              type="error"
              icon={<span>!</span>}
              text={error}
            />
          )}

          {success && (
            <Alert
              type="success"
              icon={<CheckCircle2 size={16} />}
              text={success}
            />
          )}
        </div>

        {eligiblePlans.length === 0 ? (
          <EmptyPlans />
        ) : (
          <>
            {/* CUSTOMER */}
            <section className="mt-8">
              <SectionHeading
                number="01"
                icon={<UserRound size={17} />}
                eyebrow="Your information"
                title="Personal Details"
                description="Tell us a little about yourself to create your gym account."
              />

              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-1">
                <PurchaseCustomerForm
                  form={form}
                  setForm={setForm}
                  membershipType={
                    membershipType
                  }
                  errors={errors}
                />
              </div>
            </section>

            {/* MEMBERSHIP TYPE */}
            <section className="mt-8">
              <SectionHeading
                number="02"
                icon={<Users size={17} />}
                eyebrow="Membership"
                title="Choose Membership Type"
                description="Train solo or join together with your partner."
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MembershipTypeCard
                  selected={
                    membershipType ===
                    "individual"
                  }
                  disabled={purchasing}
                  icon={<UserRound size={22} />}
                  title="Individual"
                  description="Perfect for one member."
                  onClick={() => {
                    setMembershipType(
                      "individual"
                    );
                    setErrors({});
                  }}
                />

                <MembershipTypeCard
                  selected={
                    membershipType ===
                    "couple"
                  }
                  disabled={purchasing}
                  icon={<Users size={22} />}
                  title="Couple"
                  description="Membership for two people."
                  onClick={() => {
                    setMembershipType(
                      "couple"
                    );
                    setErrors({});
                  }}
                />
              </div>

              {membershipType ===
                "couple" && (
                <div className="mt-4 rounded-3xl border border-orange-500/15 bg-zinc-950 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      <Users size={18} />
                    </div>

                    <div>
                      <h3 className="font-black">
                        Partner Information
                      </h3>

                      <p className="mt-0.5 text-xs text-zinc-700">
                        Add the details of your
                        partner.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <PartnerField
                      label="Partner Name"
                      value={partner.name}
                      onChange={(value) =>
                        setPartner(
                          (prev) => ({
                            ...prev,
                            name: value,
                          })
                        )
                      }
                      error={
                        errors.partnerName
                      }
                      disabled={purchasing}
                    />

                    <PartnerField
                      label="Partner Email"
                      type="email"
                      value={partner.email}
                      onChange={(value) =>
                        setPartner(
                          (prev) => ({
                            ...prev,
                            email: value,
                          })
                        )
                      }
                      error={
                        errors.partnerEmail
                      }
                      disabled={purchasing}
                    />

                    <PartnerField
                      label="Partner Phone"
                      type="tel"
                      value={partner.phone}
                      maxLength={10}
                      onChange={(value) =>
                        setPartner(
                          (prev) => ({
                            ...prev,
                            phone:
                              value.replace(
                                /\D/g,
                                ""
                              ),
                          })
                        )
                      }
                      error={
                        errors.partnerPhone
                      }
                      disabled={purchasing}
                    />

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Partner Gender
                      </label>

                      <select
                        value={partner.gender}
                        onChange={(event) =>
                          setPartner(
                            (prev) => ({
                              ...prev,
                              gender:
                                event.target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          purchasing
                        }
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/40"
                      >
                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>
                      </select>

                      {errors.partnerGender && (
                        <p className="mt-1 text-xs text-red-400">
                          {
                            errors.partnerGender
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* SELECTED PROMOTION */}
            {selectedPromotion && (
              <section className="mt-8 overflow-hidden rounded-3xl border border-orange-500/20 bg-orange-500/[0.04]">
                <div className="grid md:grid-cols-[280px_1fr]">
                  {selectedPromotion.posterImage && (
                    <div className="h-56 md:h-full">
                      <img
                        src={
                          selectedPromotion.posterImage
                        }
                        alt={
                          selectedPromotion.title ||
                          "Membership offer"
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                        <Gift size={12} />
                        Special Offer
                      </span>

                      {selectedPromotion.registrationFeeWaived && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Registration Free
                        </span>
                      )}
                    </div>

                    <h2 className="mt-5 text-2xl font-black sm:text-3xl">
                      {
                        selectedPromotion.title
                      }
                    </h2>

                    {selectedPromotion.description && (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                        {
                          selectedPromotion.description
                        }
                      </p>
                    )}

                    <div className="mt-5 flex items-end gap-3">
                      <span className="text-3xl font-black text-orange-400">
                        ₹
                        {Number(
                          selectedPromotion.offerPrice ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      {selectedPlan?.price >
                        selectedPromotion.offerPrice && (
                        <span className="mb-1 text-sm text-zinc-700 line-through">
                          ₹
                          {Number(
                            selectedPlan.price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-zinc-700">
                      Final price is verified
                      securely by the server.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* PLANS */}
            <section className="mt-8">
              <SectionHeading
                number="03"
                icon={<Crown size={17} />}
                eyebrow="Membership plans"
                title="Choose Your Plan"
                description="Select the membership that fits your training goals."
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eligiblePlans.map(
                  (plan) => {
                    const selected =
                      String(
                        selectedPlan?._id
                      ) ===
                      String(plan._id);

                    const promotionPlanId =
                      selectedPromotion
                        ? typeof selectedPromotion.membershipPlan ===
                          "object"
                          ? selectedPromotion
                              .membershipPlan?._id
                          : selectedPromotion.membershipPlan
                        : null;

                    const isPromotionPlan =
                      promotionPlanId &&
                      String(
                        promotionPlanId
                      ) ===
                        String(
                          plan._id
                        );

                    return (
                      <PlanCard
                        key={plan._id}
                        plan={plan}
                        selected={selected}
                        isPromotionPlan={
                          Boolean(
                            isPromotionPlan
                          )
                        }
                        disabled={purchasing}
                        onClick={() => {
                          if (
                            promotionIdFromUrl &&
                            !isPromotionPlan
                          ) {
                            setError(
                              "This promotion is only available for its selected membership plan."
                            );

                            return;
                          }

                          setSelectedPlan(
                            plan
                          );

                          if (
                            !promotionIdFromUrl
                          ) {
                            setSelectedPromotion(
                              null
                            );
                          }

                          setError("");
                        }}
                      />
                    );
                  }
                )}
              </div>
            </section>

            {/* ADDONS */}
            {selectedPlan &&
              addOns.length > 0 && (
                <section className="mt-8">
                  <SectionHeading
                    number="04"
                    icon={<Zap size={17} />}
                    eyebrow="Customize"
                    title="Optional Add-ons"
                    description="Gym access is already included. Add cardio or personal training if needed."
                  />

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {addOns.map(
                      (addOn) => {
                        const selected =
                          selectedAddOns.some(
                            (item) =>
                              String(
                                item._id
                              ) ===
                              String(
                                addOn._id
                              )
                          );

                        return (
                          <AddonCard
                            key={addOn._id}
                            addOn={addOn}
                            selected={selected}
                            disabled={
                              purchasing
                            }
                            onClick={() =>
                              toggleAddOn(
                                addOn
                              )
                            }
                          />
                        );
                      }
                    )}
                  </div>
                </section>
              )}

            {/* PROMOTIONS */}
            {!promotionIdFromUrl &&
              selectedPlan &&
              applicablePromotions.length >
                0 && (
                <section className="mt-8">
                  <SectionHeading
                    number="05"
                    icon={<Gift size={17} />}
                    eyebrow="Save money"
                    title="Available Offers"
                    description="Apply an available promotion to your selected plan."
                  />

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {applicablePromotions.map(
                      (promotion) => {
                        const selected =
                          String(
                            selectedPromotion?._id
                          ) ===
                          String(
                            promotion._id
                          );

                        return (
                          <PromotionCard
                            key={
                              promotion._id
                            }
                            promotion={
                              promotion
                            }
                            selected={
                              selected
                            }
                            disabled={
                              purchasing
                            }
                            onClick={() => {
                              setSelectedPromotion(
                                selected
                                  ? null
                                  : promotion
                              );

                              setError("");
                            }}
                          />
                        );
                      }
                    )}
                  </div>
                </section>
              )}

            {/* PAYMENT */}
            <section className="mt-8">
              <SectionHeading
                number="06"
                icon={<WalletCards size={17} />}
                eyebrow="Checkout"
                title="Payment Method"
                description="Choose how you want to pay for your membership."
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <PaymentCard
  selected={method === "online"}
  disabled={purchasing}
  icon={<CreditCard size={21} />}
  title="Online Payment"
  description="Pay using UPI, cards, net banking, and other available methods."
  badge="Recommended"
  onClick={() => {
    setMethod("online");
    setError("");
  }}
/>
                

                <PaymentCard
                  selected={
                    method === "cash"
                  }
                  disabled={purchasing}
                  icon={
                    <Banknote
                      size={21}
                    />
                  }
                  title="Cash at Gym"
                  description="Pay directly at the gym."
                  badge="Admin confirmation"
                  onClick={() => {
                    setMethod("cash");
                    setError("");
                  }}
                />
              </div>
            </section>

            {/* CHECKOUT */}
            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div className="space-y-5">
                <div className="rounded-3xl border border-orange-500/15 bg-zinc-950 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      <ShieldCheck
                        size={21}
                      />
                    </div>

                    <div>
                      <h3 className="font-black">
                        Secure Checkout
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-zinc-700">
                        Your final membership amount
                        is calculated and verified
                        by the server before payment.
                      </p>
                    </div>
                  </div>

                  {method === "online" &&
                    !razorpayReady && (
                      <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                        Preparing secure online
                        payment...
                      </div>
                    )}

                  {quoteLoading && (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-black px-4 py-3 text-xs text-zinc-600">
                      <Loader2
                        size={14}
                        className="animate-spin text-orange-400"
                      />
                      Calculating your final
                      price...
                    </div>
                  )}

                  {!quote &&
                    !quoteLoading && (
                      <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                        Enter valid email and phone
                        details to calculate the
                        final price.
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={
                      handlePurchase
                    }
                    disabled={
                      purchasing ||
                      !selectedPlan ||
                      promotionLoading ||
                      quoteLoading ||
                      !quote
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {purchasing ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Processing...
                      </>
                    ) : method ===
                      "cash" ? (
                      <>
                        Request Cash Payment
                        <ArrowRight
                          size={16}
                        />
                      </>
                    ) : (
                      <>
                        Continue to Online  Payment
                        <ArrowRight
                          size={16}
                        />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/membership"
                      )
                    }
                    disabled={
                      purchasing
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-6 py-3.5 text-sm font-bold text-zinc-600 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                  >
                    <ArrowLeft
                      size={15}
                    />
                    Back to Membership
                  </button>
                </div>

                <div className="rounded-2xl border border-white/5 bg-zinc-950/70 p-5">
                  <div className="flex gap-3">
                    <Lock
                      size={16}
                      className="mt-0.5 shrink-0 text-orange-400"
                    />

                    <div>
                      <p className="text-xs font-black text-zinc-400">
                        Important
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-700">
                        Your permanent account and
                        membership will only be
                        created after successful
                        online payment or admin
                        confirmation of your cash
                        payment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="lg:sticky lg:top-6">
                <PurchaseSummary
                  selectedPlan={
                    selectedPlan
                  }
                  selectedPromotion={
                    selectedPromotion
                  }
                  selectedAddOns={
                    selectedAddOns
                  }
                  registrationFee={
                    registrationFee
                  }
                  membershipPrice={
                    membershipPrice
                  }
                  addOnsTotal={
                    addOnsTotal
                  }
                  discount={discount}
                  totalAmount={
                    totalAmount
                  }
                />

                {quote && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">
                    <CheckCircle2
                      size={12}
                    />
                    Final amount verified by
                    server
                  </div>
                )}

                {normalMembershipPrice >
                  membershipPrice && (
                  <p className="mt-2 text-center text-xs font-bold text-emerald-400">
                    You save ₹
                    {(
                      normalMembershipPrice -
                      membershipPrice
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ==================================================
// UI COMPONENTS
// ==================================================

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-350px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[170px]" />

      <div className="absolute bottom-[-300px] right-[-200px] h-[550px] w-[550px] rounded-full bg-orange-500/5 blur-[150px]" />
    </div>
  );
}

function StepBadge({
  number,
  label,
  active,
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-center ${
        active
          ? "border-orange-500/20 bg-orange-500/10"
          : "border-white/5 bg-black/30"
      }`}
    >
      <p
        className={`text-[9px] font-black ${
          active
            ? "text-orange-400"
            : "text-zinc-800"
        }`}
      >
        {number}
      </p>

      <p
        className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${
          active
            ? "text-zinc-300"
            : "text-zinc-800"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function SectionHeading({
  number,
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
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-orange-500">
            {number}
          </span>

          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">
            {eyebrow}
          </span>
        </div>

        <h2 className="mt-1 text-xl font-black sm:text-2xl">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-zinc-700 sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

function MembershipTypeCard({
  selected,
  disabled,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${
        selected
          ? "border-orange-500/40 bg-orange-500/[0.07]"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            selected
              ? "bg-orange-500 text-black"
              : "bg-orange-500/10 text-orange-400"
          }`}
        >
          {icon}
        </div>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            selected
              ? "border-orange-500 bg-orange-500 text-black"
              : "border-white/10 text-transparent"
          }`}
        >
          <Check size={13} />
        </div>
      </div>

      <h3 className="mt-5 text-lg font-black">
        {title}
      </h3>

      <p className="mt-1 text-xs text-zinc-700">
        {description}
      </p>

      {selected && (
        <div className="mt-5 text-[10px] font-black uppercase tracking-wider text-orange-400">
          Selected
        </div>
      )}
    </button>
  );
}

function PlanCard({
  plan,
  selected,
  isPromotionPlan,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition duration-300 ${
        selected
          ? "border-orange-500/50 bg-orange-500/[0.07] shadow-xl shadow-orange-500/5"
          : "border-white/10 bg-zinc-950 hover:-translate-y-0.5 hover:border-orange-500/20"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {selected && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-black">
          Selected
        </div>
      )}

      {isPromotionPlan && (
        <div className="absolute left-0 top-0 rounded-br-xl bg-emerald-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-black">
          Offer Plan
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
          <Dumbbell size={19} />
        </div>

        <span className="text-[10px] font-bold text-zinc-700">
          {formatDuration(
            plan.durationInDays
          )}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black">
        {plan.name}
      </h3>

      {plan.description && (
        <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-700">
          {plan.description}
        </p>
      )}

      <div className="mt-5">
        <span className="text-3xl font-black text-white">
          ₹
          {Number(
            plan.price || 0
          ).toLocaleString("en-IN")}
        </span>

        <span className="ml-2 text-xs text-zinc-700">
          / {formatDuration(
            plan.durationInDays
          )}
        </span>
      </div>

      <div className="mt-5 space-y-2 border-t border-white/5 pt-5">
        {(plan.features || []).map(
          (feature, index) => (
            <div
              key={`${feature}-${index}`}
              className="flex items-center gap-2 text-xs text-zinc-600"
            >
              <CheckCircle2
                size={14}
                className="shrink-0 text-orange-400"
              />

              <span>
                {formatFeature(
                  feature
                )}
              </span>
            </div>
          )
        )}
      </div>

      <div
        className={`mt-6 flex items-center justify-between rounded-xl px-4 py-3 text-xs font-black ${
          selected
            ? "bg-orange-500 text-black"
            : "bg-black text-zinc-600"
        }`}
      >
        <span>
          {selected
            ? "Plan selected"
            : "Choose this plan"}
        </span>

        <ArrowRight size={14} />
      </div>
    </button>
  );
}

function AddonCard({
  addOn,
  selected,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border p-5 text-left transition ${
        selected
          ? "border-orange-500/40 bg-orange-500/[0.05]"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
      } disabled:opacity-50`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              selected
                ? "bg-orange-500 text-black"
                : "bg-orange-500/10 text-orange-400"
            }`}
          >
            <Zap size={18} />
          </div>

          <div>
            <p className="font-black">
              {addOn.name}
            </p>

            {addOn.description && (
              <p className="mt-1 text-xs text-zinc-700">
                {addOn.description}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-black">
            ₹
            {Number(
              addOn.price || 0
            ).toLocaleString(
              "en-IN"
            )}
          </p>

          <div
            className={`mt-1 text-[10px] font-black ${
              selected
                ? "text-orange-400"
                : "text-zinc-700"
            }`}
          >
            {selected
              ? "Added"
              : "Add"}
          </div>
        </div>
      </div>
    </button>
  );
}

function PromotionCard({
  promotion,
  selected,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`overflow-hidden rounded-2xl border text-left transition ${
        selected
          ? "border-orange-500/40 bg-orange-500/[0.05]"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
      } disabled:opacity-50`}
    >
      <div className="flex gap-4 p-5">
        {promotion.posterImage && (
          <img
            src={promotion.posterImage}
            alt={
              promotion.title ||
              "Offer"
            }
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-orange-400">
                Special Offer
              </span>

              <h3 className="mt-1 font-black">
                {promotion.title}
              </h3>
            </div>

            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? "border-orange-500 bg-orange-500 text-black"
                  : "border-white/10 text-transparent"
              }`}
            >
              <Check size={12} />
            </div>
          </div>

          {promotion.description && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-700">
              {
                promotion.description
              }
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="font-black text-orange-400">
              ₹
              {Number(
                promotion.offerPrice ||
                  0
              ).toLocaleString(
                "en-IN"
              )}
            </span>

            {promotion.registrationFeeWaived && (
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                Registration waived
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function PaymentCard({
  selected,
  disabled,
  icon,
  title,
  description,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-3xl border p-6 text-left transition ${
        selected
          ? "border-orange-500/40 bg-orange-500/[0.06]"
          : "border-white/10 bg-zinc-950 hover:border-orange-500/20"
      } disabled:opacity-50`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            selected
              ? "bg-orange-500 text-black"
              : "bg-orange-500/10 text-orange-400"
          }`}
        >
          {icon}
        </div>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            selected
              ? "border-orange-500 bg-orange-500 text-black"
              : "border-white/10 text-transparent"
          }`}
        >
          <Check size={13} />
        </div>
      </div>

      <h3 className="mt-5 font-black">
        {title}
      </h3>

      <p className="mt-1 text-xs text-zinc-700">
        {description}
      </p>

      <div className="mt-4 text-[9px] font-black uppercase tracking-wider text-orange-400">
        {badge}
      </div>
    </button>
  );
}

function PartnerField({
  label,
  type = "text",
  value,
  onChange,
  error,
  disabled,
  maxLength,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={`w-full rounded-xl border bg-black px-4 py-3 text-sm text-white outline-none transition ${
          error
            ? "border-red-500/40"
            : "border-white/10 focus:border-orange-500/40"
        } disabled:opacity-50`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Alert({
  type,
  icon,
  text,
}) {
  const styles = {
    info:
      "border-blue-500/20 bg-blue-500/5 text-blue-400",
    error:
      "border-red-500/20 bg-red-500/5 text-red-400",
    success:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${styles[type]}`}
    >
      <span className="mt-0.5">
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}

function EmptyPlans() {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <Dumbbell size={24} />
      </div>

      <h2 className="mt-5 text-xl font-black">
        No Membership Plans Available
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-700">
        There are currently no membership
        plans available for your selection.
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-24 rounded bg-zinc-900" />

        <div className="mt-8 h-64 rounded-3xl bg-zinc-950" />

        <div className="mt-8 h-8 w-48 rounded bg-zinc-900" />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-3xl bg-zinc-950" />
          <div className="h-40 rounded-3xl bg-zinc-950" />
        </div>
      </div>
    </main>
  );
}

// ==================================================
// HELPERS
// ==================================================

function formatDuration(days) {
  const numericDays = Number(days);

  if (!numericDays) {
    return "Membership";
  }

  if (numericDays === 30) {
    return "1 Month";
  }

  if (numericDays === 90) {
    return "3 Months";
  }

  if (numericDays === 180) {
    return "6 Months";
  }

  if (numericDays === 270) {
    return "9 Months";
  }

  if (numericDays === 365) {
    return "12 Months";
  }

  if (numericDays % 30 === 0) {
    return `${numericDays / 30} Months`;
  }

  return `${numericDays} Days`;
}

function formatFeature(feature) {
  const map = {
    gym: "Gym Access",
  };

  return (
    map[feature] ||
    String(feature)
  );
}

// ==================================================
// SUSPENSE
// ==================================================

export default function MembershipPurchasePage() {
  return (
    <Suspense
      fallback={<LoadingScreen />}
    >
      <MembershipPurchasePageContent />
    </Suspense>
  );
}