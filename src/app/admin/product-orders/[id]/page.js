"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Package,
  MapPin,
  ShieldCheck,
  Truck,
  User,
  XCircle,
  Box,
} from "lucide-react";

const ORDER_STATUS_LABELS = {
  pending_payment: "Pending Payment",
  ordered: "Ordered",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function getOrderStatusClass(status) {
  switch (status) {
    case "ordered":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    case "ready_for_pickup":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    case "delivered":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    case "pending_payment":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

function getPaymentStatusClass(status) {
  switch (status) {
    case "paid":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "partially_paid":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    default:
      return "border-red-500/20 bg-red-500/10 text-red-400";
  }
}

export default function AdminProductOrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/product-orders/${orderId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load product order."
          );
        }

        if (!cancelled) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error("Admin product order details error:", error);

        if (!cancelled) {
          setError(
            error.message || "Failed to load product order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const response = await fetch(
        `/api/admin/product-orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update order."
        );
      }

      setActionSuccess(
        data.message || "Order updated successfully."
      );

      const refreshedResponse = await fetch(
        `/api/admin/product-orders/${orderId}`
      );

      const refreshedData = await refreshedResponse.json();

      if (!refreshedResponse.ok) {
        throw new Error(
          refreshedData.message || "Failed to refresh order."
        );
      }

      setOrder(refreshedData.order);
    } catch (error) {
      console.error("Admin order action error:", error);

      setActionError(
        error.message || "Failed to update order."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <PageShell>
        <Link
          href="/admin/product-orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Orders
        </Link>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 text-red-500" />

            <div>
              <h1 className="font-semibold text-red-400">
                Failed to load order
              </h1>

              <p className="mt-2 text-sm text-red-300/70">
                {error}
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <Link
          href="/admin/product-orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Orders
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-zinc-700" />

          <h1 className="mt-4 text-lg font-bold">
            Order not found
          </h1>
        </div>
      </PageShell>
    );
  }

  const totalAmount = Number(order.totalAmount) || 0;

  const initialPaymentAmount =
    Number(order.initialPaymentAmount) || 0;

  const initialPaidAmount =
    Number(order.initialPaidAmount) || 0;

  const finalPaidAmount =
    Number(order.finalPaidAmount) || 0;

  const totalPaid =
    Number(order.totalPaid) ||
    initialPaidAmount + finalPaidAmount;

  const remainingAmount = Math.max(
    totalAmount - totalPaid,
    0
  );

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/product-orders"
          className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Orders
        </Link>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
              <Package className="h-4 w-4 text-orange-500" />
              Product Order
            </div>

            <h1 className="max-w-full break-all text-2xl font-black tracking-tight sm:text-3xl">
              Order #{order._id}
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              Created {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              className={getPaymentStatusClass(
                order.paymentStatus
              )}
            >
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                order.paymentStatus}
            </StatusBadge>

            <StatusBadge
              className={getOrderStatusClass(
                order.orderStatus
              )}
            >
              {ORDER_STATUS_LABELS[order.orderStatus] ||
                order.orderStatus}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product */}
          <Section title="Product" icon={Box}>
            <div className="flex flex-col gap-5 sm:flex-row">
              {order.product?.imageUrl ? (
                <img
                  src={order.product.imageUrl}
                  alt={order.product.name || "Product"}
                  className="h-32 w-32 shrink-0 rounded-2xl border border-zinc-800 object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-zinc-600">
                  <Package className="h-10 w-10" />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-bold">
                  {order.product?.name || "Product"}
                </h3>

                {order.product?.description && (
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {order.product.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <InfoBox
                    label="Quantity"
                    value={order.quantity}
                  />

                  <InfoBox
                    label="Price at Order"
                    value={formatCurrency(order.priceAtOrder)}
                  />

                  <InfoBox
                    label="Total"
                    value={formatCurrency(totalAmount)}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Member */}
          <Section title="Member" icon={User}>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox
                label="Name"
                value={order.user?.name || "—"}
              />

              <InfoBox
                label="Email"
                value={order.user?.email || "—"}
              />

              <InfoBox
                label="Phone"
                value={order.user?.phone || "—"}
              />
            </div>
          </Section>

          {/* Payment Breakdown */}
          <Section title="Payment Breakdown" icon={CreditCard}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MoneyBox
                label="Total Amount"
                value={totalAmount}
              />

              <MoneyBox
                label="Initial Payment"
                value={initialPaymentAmount}
              />

              <MoneyBox
                label="Total Paid"
                value={totalPaid}
                positive={totalPaid > 0}
              />

              <MoneyBox
                label="Remaining"
                value={remainingAmount}
                highlight={remainingAmount > 0}
              />
            </div>

            <div className="mt-6 space-y-3">
              <PaymentRow
                title="Initial Payment"
                amount={initialPaymentAmount}
                paidAmount={initialPaidAmount}
                method={order.initialPaymentMethod}
                status={order.initialPaymentStatus}
                confirmedBy={order.initialPaymentConfirmedBy}
                paidAt={order.initialPaidAt}
              />

              <PaymentRow
                title="Final Payment"
                amount={Math.max(
                  totalAmount - initialPaymentAmount,
                  0
                )}
                paidAmount={finalPaidAmount}
                method={order.finalPaymentMethod}
                status={order.finalPaymentStatus}
                confirmedBy={order.finalPaymentConfirmedBy}
                paidAt={order.finalPaidAt}
              />
            </div>
          </Section>

          {/* Notes */}
          {(order.memberNotes || order.adminNotes) && (
            <Section title="Notes" icon={Clock3}>
              <div className="space-y-4">
                {order.memberNotes && (
                  <NoteBox
                    title="Member Notes"
                    text={order.memberNotes}
                  />
                )}

                {order.adminNotes && (
                  <NoteBox
                    title="Admin Notes"
                    text={order.adminNotes}
                  />
                )}
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Actions */}
          <Section title="Order Actions" icon={Truck}>
            <p className="text-sm leading-6 text-zinc-500">
              Manage payment confirmation and product delivery
              status.
            </p>

            {actionError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-400">
                    {actionError}
                  </p>
                </div>
              </div>
            )}

            {actionSuccess && (
              <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <p className="text-sm text-green-400">
                    {actionSuccess}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {/* Initial cash */}
              {order.orderStatus === "pending_payment" &&
                order.initialPaymentMethod === "cash" &&
                order.initialPaymentStatus !== "paid" && (
                  <ActionButton
                    onClick={() =>
                      handleAction("confirm_initial_cash")
                    }
                    loading={actionLoading}
                    variant="primary"
                    icon={IndianRupee}
                  >
                    Confirm Initial Cash
                  </ActionButton>
                )}

              {/* Initial UPI */}
              {order.orderStatus === "pending_payment" &&
                order.initialPaymentMethod === "upi" &&
                order.initialPaymentStatus !== "paid" && (
                  <PaymentNotice
                    title="UPI Payment Pending"
                    text="The initial UPI payment must be verified through Razorpay. It cannot be manually confirmed here."
                    type="blue"
                  />
                )}

              {/* Mark ordered */}
              {order.initialPaymentStatus === "paid" &&
                order.orderStatus === "pending_payment" && (
                  <ActionButton
                    onClick={() =>
                      handleAction("mark_ordered")
                    }
                    loading={actionLoading}
                    variant="primary"
                    icon={Package}
                  >
                    Mark Ordered
                  </ActionButton>
                )}

              {/* Ready */}
              {order.orderStatus === "ordered" && (
                <ActionButton
                  onClick={() =>
                    handleAction("mark_ready_for_pickup")
                  }
                  loading={actionLoading}
                  variant="primary"
                  icon={MapPin}
                >
                  Mark Ready for Pickup
                </ActionButton>
              )}

              {/* Final cash */}
              {order.orderStatus === "ready_for_pickup" &&
                order.paymentStatus !== "paid" &&
                order.finalPaymentMethod !== "upi" && (
                  <ActionButton
                    onClick={() =>
                      handleAction("confirm_final_cash")
                    }
                    loading={actionLoading}
                    variant="primary"
                    icon={IndianRupee}
                  >
                    Confirm Final Cash
                  </ActionButton>
                )}

              {/* Final UPI */}
              {order.orderStatus === "ready_for_pickup" &&
                order.paymentStatus !== "paid" &&
                order.finalPaymentMethod === "upi" && (
                  <PaymentNotice
                    title="Final UPI Payment Pending"
                    text="The final UPI payment must be verified through Razorpay before delivery."
                    type="blue"
                  />
                )}

              {/* Delivered */}
              {order.paymentStatus === "paid" &&
                order.orderStatus === "ready_for_pickup" && (
                  <ActionButton
                    onClick={() =>
                      handleAction("mark_delivered")
                    }
                    loading={actionLoading}
                    variant="success"
                    icon={CheckCircle2}
                  >
                    Mark Delivered
                  </ActionButton>
                )}

              {/* Cancel */}
              {order.orderStatus !== "delivered" &&
                order.orderStatus !== "cancelled" &&
                order.paymentStatus !== "paid" && (
                  <ActionButton
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Are you sure you want to cancel this product order?"
                      );

                      if (confirmed) {
                        handleAction("cancel");
                      }
                    }}
                    loading={actionLoading}
                    variant="danger"
                    icon={XCircle}
                  >
                    Cancel Order
                  </ActionButton>
                )}

              {/* Completed */}
              {order.orderStatus === "delivered" && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />

                    <div>
                      <p className="text-sm font-semibold text-green-400">
                        Order Completed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-300/60">
                        The product has been fully paid for and
                        delivered.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {order.orderStatus === "cancelled" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex gap-3">
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />

                    <div>
                      <p className="text-sm font-semibold text-red-400">
                        Order Cancelled
                      </p>

                      <p className="mt-1 text-xs text-red-300/60">
                        This order can no longer be processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-black p-4">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-orange-500" />

                <div>
                  <p className="text-sm font-semibold text-zinc-300">
                    Secure payment flow
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Cash payments require admin confirmation.
                    UPI payments are marked paid only after
                    Razorpay verification.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Order Timeline" icon={Clock3}>
            <div className="mt-2 space-y-1">
              <TimelineItem
                title="Order Created"
                date={order.createdAt}
                active
              />

              <TimelineItem
                title="Initial Payment"
                date={order.initialPaidAt}
                active={order.initialPaymentStatus === "paid"}
              />

              <TimelineItem
                title="Ordered"
                date={order.initialPaidAt}
                active={
                  order.orderStatus === "ordered" ||
                  order.orderStatus === "ready_for_pickup" ||
                  order.orderStatus === "delivered"
                }
              />

              <TimelineItem
                title="Ready for Pickup"
                date={order.readyForPickupAt}
                active={
                  order.orderStatus === "ready_for_pickup" ||
                  order.orderStatus === "delivered"
                }
              />

              <TimelineItem
                title="Final Payment"
                date={order.finalPaidAt}
                active={order.finalPaymentStatus === "paid"}
              />

              <TimelineItem
                title="Delivered"
                date={order.deliveredAt}
                active={order.orderStatus === "delivered"}
              />

              {order.orderStatus === "cancelled" && (
                <TimelineItem
                  title="Cancelled"
                  date={order.updatedAt}
                  active
                  danger
                />
              )}
            </div>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">{children}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
      <div className="border-b border-zinc-800 bg-zinc-950/60 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/10 bg-orange-500/10 text-orange-500">
            <Icon className="h-4 w-4" />
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            {title}
          </h2>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function MoneyBox({
  label,
  value,
  highlight = false,
  positive = false,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-500/20 bg-orange-500/5"
          : positive
          ? "border-green-500/20 bg-green-500/5"
          : "border-zinc-800 bg-black"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-black ${
          highlight
            ? "text-orange-400"
            : positive
            ? "text-green-400"
            : "text-white"
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function PaymentRow({
  title,
  amount,
  paidAmount,
  method,
  status,
  confirmedBy,
  paidAt,
}) {
  const isPaid = status === "paid";

  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">{title}</p>

          <p className="mt-1 text-xs text-zinc-600">
            Expected: {formatCurrency(amount)}
          </p>
        </div>

        <StatusBadge
          className={
            isPaid
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-zinc-700 bg-zinc-900 text-zinc-500"
          }
        >
          {isPaid ? "Paid" : "Pending"}
        </StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoBox
          label="Paid Amount"
          value={formatCurrency(paidAmount)}
        />

        <InfoBox
          label="Method"
          value={method ? method.toUpperCase() : "—"}
        />

        <InfoBox
          label="Paid At"
          value={formatDateTime(paidAt)}
        />
      </div>

      {confirmedBy && (
        <p className="mt-3 text-xs text-zinc-600">
          Confirmed by{" "}
          <span className="text-zinc-400">
            {confirmedBy.name ||
              confirmedBy.email ||
              "Admin"}
          </span>
        </p>
      )}
    </div>
  );
}

function NoteBox({ title, text }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        {title}
      </p>

      <p className="mt-2 rounded-xl border border-zinc-900 bg-black p-4 text-sm leading-6 text-zinc-400">
        {text}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  active,
  danger = false,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 h-3 w-3 rounded-full ring-4 ${
            active
              ? danger
                ? "bg-red-500 ring-red-500/10"
                : "bg-orange-500 ring-orange-500/10"
              : "bg-zinc-800 ring-zinc-800/10"
          }`}
        />

        <div className="mt-2 h-full min-h-8 w-px bg-zinc-800" />
      </div>

      <div className="pb-5">
        <p
          className={`text-sm font-semibold ${
            active
              ? danger
                ? "text-red-400"
                : "text-white"
              : "text-zinc-600"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-700">
          {date ? formatDateTime(date) : "Not completed"}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  loading,
  variant = "primary",
  icon: Icon,
}) {
  const variants = {
    primary:
      "border border-orange-500/20 bg-orange-500 text-black hover:bg-orange-400",
    success:
      "border border-green-500/20 bg-green-500 text-black hover:bg-green-400",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {Icon && <Icon className="h-4 w-4" />}

      {loading ? "Processing..." : children}
    </button>
  );
}

function PaymentNotice({ title, text, type = "blue" }) {
  const styles = {
    blue: {
      wrapper: "border-blue-500/20 bg-blue-500/5",
      icon: "text-blue-400",
      title: "text-blue-400",
      text: "text-blue-300/60",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`rounded-xl border p-4 ${style.wrapper}`}
    >
      <div className="flex gap-3">
        <CreditCard
          className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`}
        />

        <div>
          <p className={`text-sm font-semibold ${style.title}`}>
            {title}
          </p>

          <p className={`mt-1 text-xs leading-5 ${style.text}`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ children, className }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function LoadingState() {
  return (
    <PageShell>
      <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-14 text-center">
        <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
          <Package className="h-6 w-6 text-orange-500" />
        </div>

        <p className="mt-4 text-sm font-medium text-zinc-400">
          Loading order...
        </p>
      </div>
    </PageShell>
  );
}