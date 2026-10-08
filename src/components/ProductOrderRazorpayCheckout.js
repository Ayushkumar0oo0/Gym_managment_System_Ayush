"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export default function ProductOrderRazorpayCheckout({
  orderId,
  buttonText = "Pay Initial Amount with UPI",
  className = "",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
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

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // 1. Load Razorpay
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Failed to load Razorpay.");
      }

      // 2. Create Razorpay order
      const orderResponse = await fetch(
        `/api/member/product-orders/${orderId}/razorpay/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Failed to create payment."
        );
      }

      // 3. Razorpay options
      const options = {
        key: orderData.razorpay.keyId,

        amount: orderData.razorpay.amount,

        currency: orderData.razorpay.currency,

        name: "Gym Management",

        description:
          "Product Order Initial Payment",

        order_id: orderData.razorpay.orderId,

        handler: async function (response) {
          try {
            setLoading(true);
            setError("");

            // 4. Verify payment on server
            const verifyResponse = await fetch(
              "/api/payments/product/razorpay/verify",
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

            // 5. Tell parent page to refresh
            if (onSuccess) {
              onSuccess(verifyData);
            }

            // 6. Refresh page after short delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (error) {
            console.error(
              "Product payment verification error:",
              error
            );

            setError(
              error.message ||
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

      // 7. Open Razorpay
      const razorpay =
        new window.Razorpay(options);

      // 8. Handle payment failure
      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay product payment failed:",
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
        "Product UPI payment error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong."
      );

      setLoading(false);
    }
  };

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

            <p className="mt-0.5 text-xs leading-5 text-red-400/70">
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
              Payment successful
            </p>

            <p className="mt-0.5 text-xs leading-5 text-green-400/70">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Payment Card */}
      <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-zinc-950 to-zinc-950">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Smartphone size={19} />
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                UPI Payment
              </p>

              <p className="mt-0.5 text-xs text-zinc-600">
                Fast and secure payment through Razorpay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className={
              className ||
              "mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                <CreditCard size={17} />
                {buttonText}
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-700">
            <ShieldCheck
              size={13}
              className="text-orange-500"
            />
            Secure payment powered by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
}