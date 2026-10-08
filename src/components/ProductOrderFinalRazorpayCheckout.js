"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

export default function ProductOrderFinalRazorpayCheckout({
  orderId,
  remainingAmount,
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    try {
      setLoading(true);
      setError("");

      // ----------------------------------------
      // 1. Load Razorpay Checkout
      // ----------------------------------------
      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay Checkout failed to load."
        );
      }

      // ----------------------------------------
      // 2. Create final Razorpay order
      // ----------------------------------------
      const response = await fetch(
        `/api/member/product-orders/${orderId}/razorpay/final-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create payment order."
        );
      }

      // ----------------------------------------
      // 3. Open Razorpay Checkout
      // ----------------------------------------
      const options = {
        key: data.key,

        amount: Math.round(
          Number(data.amount) * 100
        ),

        currency: data.currency || "INR",

        name: "Gym Management",

        description:
          "Remaining product order payment",

        order_id: data.razorpayOrderId,

        handler: async function (paymentResponse) {
          try {
            setLoading(true);
            setError("");

            // ----------------------------------------
            // 4. Verify payment on server
            // ----------------------------------------
            const verifyResponse =
              await fetch(
                "/api/payments/product/final-verify",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    paymentId:
                      data.paymentId,

                    razorpayOrderId:
                      paymentResponse.razorpay_order_id,

                    razorpayPaymentId:
                      paymentResponse.razorpay_payment_id,

                    razorpaySignature:
                      paymentResponse.razorpay_signature,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            router.refresh();
            window.location.reload();
          } catch (verificationError) {
            console.error(
              "FINAL PAYMENT VERIFICATION ERROR:",
              verificationError
            );

            setError(
              verificationError.message ||
                "Payment verification failed."
            );

            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },

        theme: {
          color: "#f97316",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response.error
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
        "FINAL RAZORPAY PAYMENT ERROR:",
        error
      );

      setError(
        error?.message ||
          "Unable to start payment."
      );

      setLoading(false);
    }
  }

  const amount = Number(remainingAmount || 0);

  return (
    <div className="space-y-4">
      {/* Payment Card */}
      <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] via-zinc-950 to-zinc-950">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <CreditCard size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Final Payment
                </p>

                <p className="mt-0.5 text-xs text-zinc-600">
                  Complete your remaining order balance
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Remaining
              </p>

              <p className="mt-0.5 flex items-center justify-end text-xl font-black text-white">
                <IndianRupee size={16} />
                {amount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <CreditCard size={17} />
                  Pay Remaining ₹
                  {amount.toLocaleString("en-IN")}
                  <span className="text-black/50">
                    •
                  </span>
                  UPI
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
            <ShieldCheck
              size={14}
              className="text-orange-500"
            />
            Secure payment powered by Razorpay
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <div>
            <p className="text-sm font-semibold text-red-400">
              Payment failed
            </p>

            <p className="mt-0.5 text-xs leading-5 text-red-400/70">
              {error}
            </p>
          </div>
        </div>
      )}

      {!error && !loading && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-700">
          <CheckCircle2 size={12} />
          Your payment will be verified securely on the server
        </div>
      )}
    </div>
  );
}