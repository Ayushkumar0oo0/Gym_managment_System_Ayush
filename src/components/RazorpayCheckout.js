"use client";

import { useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export default function RazorpayCheckout({
  promotionId,
  promotionType = "membership",
  buttonText = "Pay with UPI",
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const [cashLoading, setCashLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
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
  };

  // ==========================================
  // EXTENSION UPI PAYMENT
  // ==========================================

  const handleExtensionUPIPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // STEP 1: CREATE PENDING PAYMENT
      const purchaseResponse = await fetch(
        `/api/member/promotions/${promotionId}/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "upi",
          }),
        }
      );

      const purchaseData =
        await purchaseResponse.json();

      if (!purchaseResponse.ok) {
        throw new Error(
          purchaseData.message ||
            "Failed to start payment."
        );
      }

      const paymentId =
        purchaseData.payment?.id;

      if (!paymentId) {
        throw new Error(
          "Payment ID was not returned."
        );
      }

      // STEP 2: LOAD RAZORPAY
      const loaded =
        await loadRazorpayScript();

      if (!loaded) {
        throw new Error(
          "Failed to load Razorpay."
        );
      }

      // STEP 3: CREATE RAZORPAY ORDER
      const orderResponse = await fetch(
        `/api/member/promotions/${promotionId}/razorpay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Failed to create Razorpay order."
        );
      }

      // STEP 4: OPEN RAZORPAY
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Gym Management",
        description:
          orderData.promotion?.title ||
          "Membership Extension",
        order_id: orderData.orderId,

        handler: async function (response) {
          try {
            setLoading(true);
            setError("");

            // STEP 5: VERIFY PAYMENT
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

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            setSuccess(
              verifyData.message ||
                "Extension payment successful!"
            );

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (error) {
            console.error(
              "Extension payment verification error:",
              error
            );

            setError(
              error?.message ||
                "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        prefill: {},

        theme: {
          color: "#f97316",
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay checkout is not available."
        );
      }

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Extension UPI payment error:",
        error
      );

      setError(
        error?.message ||
          "Something went wrong."
      );

      setLoading(false);
    }
  };

  // ==========================================
  // EXTENSION CASH PAYMENT
  // ==========================================

  const handleExtensionCashPayment =
    async () => {
      try {
        setCashLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/member/promotions/${promotionId}/purchase`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "cash",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create cash payment request."
          );
        }

        setSuccess(
          "Cash payment request submitted. Please pay at the gym. Your membership will be extended after admin confirmation."
        );

        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } catch (error) {
        console.error(
          "Extension cash payment error:",
          error
        );

        setError(
          error?.message ||
            "Failed to submit cash payment request."
        );
      } finally {
        setCashLoading(false);
      }
    };

  // ==========================================
  // MEMBERSHIP PROMOTION UPI PAYMENT
  // ==========================================

  const handleMembershipUPIPayment =
    async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        // LOAD RAZORPAY
        const loaded =
          await loadRazorpayScript();

        if (!loaded) {
          throw new Error(
            "Failed to load Razorpay."
          );
        }

        // CREATE RAZORPAY ORDER
        const orderResponse =
          await fetch(
            `/api/promotions/${promotionId}/razorpay/order`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const orderData =
          await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(
            orderData.message ||
              "Failed to create payment."
          );
        }

        // RAZORPAY OPTIONS
        const options = {
          key:
            orderData.razorpay.keyId,

          amount:
            orderData.razorpay.amount,

          currency:
            orderData.razorpay.currency,

          name: "Gym Management",

          description:
            orderData.promotion.title,

          order_id:
            orderData.razorpay.orderId,

          handler: async function (response) {
            try {
              setLoading(true);
              setError("");

              const verifyResponse =
                await fetch(
                  "/api/payments/razorpay/verify",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify({
                      paymentId:
                        orderData.payment.id,

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

              setSuccess(
                verifyData.message ||
                  "Payment successful!"
              );

              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } catch (error) {
              console.error(
                "Payment verification error:",
                error
              );

              setError(
                error?.message ||
                  "Payment verification failed."
              );
            } finally {
              setLoading(false);
            }
          },

          prefill: {},

          theme: {
            color: "#f97316",
          },

          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        if (!window.Razorpay) {
          throw new Error(
            "Razorpay checkout is not available."
          );
        }

        const razorpay =
          new window.Razorpay(options);

        razorpay.on(
          "payment.failed",
          function (response) {
            console.error(
              "Razorpay payment failed:",
              response
            );

            setError(
              response?.error?.description ||
                "Payment failed. Please try again."
            );

            setLoading(false);
          }
        );

        razorpay.open();
      } catch (error) {
        console.error(
          "UPI payment error:",
          error
        );

        setError(
          error?.message ||
            "Something went wrong."
        );

        setLoading(false);
      }
    };

  // ==========================================
  // PAYMENT HANDLER
  // ==========================================

  const handleUPIPayment = () => {
    if (promotionType === "extension") {
      return handleExtensionUPIPayment();
    }

    return handleMembershipUPIPayment();
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <div>
            <p className="text-sm font-semibold text-red-400">
              Payment failed
            </p>

            <p className="mt-1 text-xs leading-5 text-red-400/70">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3.5">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-green-400"
          />

          <div>
            <p className="text-sm font-semibold text-green-400">
              Payment request successful
            </p>

            <p className="mt-1 text-xs leading-5 text-green-400/70">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Extension Payment Methods */}
      {promotionType === "extension" ? (
        <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-zinc-950 to-zinc-950">
          <div className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <CreditCard size={18} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Choose Payment Method
                </p>

                <p className="mt-0.5 text-xs text-zinc-600">
                  Select how you want to pay for the extension.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* UPI */}
              <button
                type="button"
                onClick={handleUPIPayment}
                disabled={loading || cashLoading}
                className="group flex items-center justify-center gap-2.5 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone size={17} />
                    Pay with UPI
                  </>
                )}
              </button>

              {/* Cash */}
              <button
                type="button"
                onClick={handleExtensionCashPayment}
                disabled={loading || cashLoading}
                className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/20 hover:bg-orange-500/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cashLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Banknote size={17} />
                    Pay with Cash
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-600">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <p>
                Cash payments remain pending until the gym
                admin confirms your payment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Membership Promotion */
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleUPIPayment}
            disabled={loading}
            className={
              className ||
              "flex w-full items-center justify-center gap-2.5 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                <Smartphone size={17} />
                {buttonText}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-700">
            <ShieldCheck
              size={13}
              className="text-orange-500"
            />
            Secure UPI payment powered by Razorpay
          </div>
        </div>
      )}
    </div>
  );
}