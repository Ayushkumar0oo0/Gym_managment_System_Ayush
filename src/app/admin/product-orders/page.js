"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Package,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
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

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export default function AdminProductOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/product-orders");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load product orders."
          );
        }

        if (!cancelled) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Admin product orders load error:", error);

        if (!cancelled) {
          setError(
            error.message || "Failed to load product orders."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return orders.filter((order) => {
      const memberName = order.user?.name?.toLowerCase() || "";
      const memberEmail = order.user?.email?.toLowerCase() || "";
      const memberPhone = order.user?.phone?.toLowerCase() || "";
      const productName = order.product?.name?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        memberName.includes(searchText) ||
        memberEmail.includes(searchText) ||
        memberPhone.includes(searchText) ||
        productName.includes(searchText);

      const matchesPayment =
        paymentStatusFilter === "all" ||
        order.paymentStatus === paymentStatusFilter;

      const matchesOrderStatus =
        orderStatusFilter === "all" ||
        order.orderStatus === orderStatusFilter;

      return matchesSearch && matchesPayment && matchesOrderStatus;
    });
  }, [
    orders,
    search,
    paymentStatusFilter,
    orderStatusFilter,
  ]);

  const statistics = useMemo(() => {
    const totalOrders = orders.length;

    const pendingPayment = orders.filter(
      (order) => order.paymentStatus === "pending"
    ).length;

    const partiallyPaid = orders.filter(
      (order) => order.paymentStatus === "partially_paid"
    ).length;

    const paid = orders.filter(
      (order) => order.paymentStatus === "paid"
    ).length;

    const readyForPickup = orders.filter(
      (order) => order.orderStatus === "ready_for_pickup"
    ).length;

    const delivered = orders.filter(
      (order) => order.orderStatus === "delivered"
    ).length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalPaid || 0),
      0
    );

    const remainingAmount = orders.reduce(
      (sum, order) => sum + Number(order.remainingAmount || 0),
      0
    );

    return {
      totalOrders,
      pendingPayment,
      partiallyPaid,
      paid,
      readyForPickup,
      delivered,
      totalRevenue,
      remainingAmount,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                <Package className="h-4 w-4 text-orange-500" />
                Admin / Product Orders
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Product Orders
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Manage gym supplement orders, payments and pickup status
                from one place.
              </p>
            </div>

            <Link
              href="/admin"
              className="group inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={ShoppingBag}
            title="Total Orders"
            value={statistics.totalOrders}
          />

          <StatCard
            icon={Clock3}
            title="Pending"
            value={statistics.pendingPayment}
            accent="orange"
          />

          <StatCard
            icon={CreditCard}
            title="Partially Paid"
            value={statistics.partiallyPaid}
            accent="yellow"
          />

          <StatCard
            icon={CheckCircle2}
            title="Fully Paid"
            value={statistics.paid}
            accent="green"
          />

          <StatCard
            icon={Package}
            title="Ready"
            value={statistics.readyForPickup}
            accent="blue"
          />

          <StatCard
            icon={Truck}
            title="Delivered"
            value={statistics.delivered}
            accent="green"
          />
        </div>

        {/* Financial summary */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <FinancialCard
            icon={IndianRupee}
            title="Total Collected"
            value={formatCurrency(statistics.totalRevenue)}
            description="Amount already received from product orders"
            accent="green"
          />

          <FinancialCard
            icon={CreditCard}
            title="Remaining to Collect"
            value={formatCurrency(statistics.remainingAmount)}
            description="Outstanding amount across product orders"
            accent="orange"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold">Order Filters</h2>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1.5fr_1fr_1fr]">
            <FilterField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Member, email, phone or product..."
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>
            </FilterField>

            <FilterField label="Payment Status">
              <select
                value={paymentStatusFilter}
                onChange={(event) =>
                  setPaymentStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
              >
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </FilterField>

            <FilterField label="Order Status">
              <select
                value={orderStatusFilter}
                onChange={(event) =>
                  setOrderStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
              >
                <option value="all">All Order Statuses</option>
                <option value="pending_payment">
                  Pending Payment
                </option>
                <option value="ordered">Ordered</option>
                <option value="ready_for_pickup">
                  Ready for Pickup
                </option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FilterField>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-400">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : filteredOrders.length === 0 ? (
          <EmptyState hasFilters={Boolean(search || paymentStatusFilter !== "all" || orderStatusFilter !== "all")} />
        ) : (
          <>
            {/* Mobile / Tablet */}
            <div className="grid gap-4 lg:hidden">
              {filteredOrders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] lg:block">
              <div className="border-b border-zinc-800 bg-zinc-950/70 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Order Management
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Review payments, products and fulfillment status.
                    </p>
                  </div>

                  <div className="rounded-full border border-zinc-800 bg-black px-3 py-1.5 text-xs text-zinc-500">
                    {filteredOrders.length} results
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead className="border-b border-zinc-800 bg-zinc-950">
                    <tr>
                      <TableHeading>Member</TableHeading>
                      <TableHeading>Product</TableHeading>
                      <TableHeading>Amount</TableHeading>
                      <TableHeading>Payment</TableHeading>
                      <TableHeading>Order Status</TableHeading>
                      <TableHeading>Date</TableHeading>
                      <TableHeading align="right">Action</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-900">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition hover:bg-orange-500/[0.025]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500">
                              <User className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">
                                {order.user?.name || "Unknown Member"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-zinc-500">
                                {order.user?.email || "—"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-700">
                                {order.user?.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            {order.product?.imageUrl ? (
                              <img
                                src={order.product.imageUrl}
                                alt={order.product?.name || "Product"}
                                className="h-12 w-12 rounded-xl border border-zinc-800 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-600">
                                <Box className="h-5 w-5" />
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-white">
                                {order.product?.name || "Product"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-600">
                                Quantity: {order.quantity}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-white">
                            {formatCurrency(order.totalAmount)}
                          </p>

                          <p className="mt-1 text-xs text-green-400">
                            Paid: {formatCurrency(order.totalPaid)}
                          </p>

                          {Number(order.remainingAmount) > 0 && (
                            <p className="mt-1 text-xs text-orange-400">
                              Due: {formatCurrency(order.remainingAmount)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            className={getPaymentStatusClass(
                              order.paymentStatus
                            )}
                          >
                            {PAYMENT_STATUS_LABELS[
                              order.paymentStatus
                            ] || order.paymentStatus}
                          </StatusBadge>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            className={getOrderStatusClass(
                              order.orderStatus
                            )}
                          >
                            {ORDER_STATUS_LABELS[order.orderStatus] ||
                              order.orderStatus}
                          </StatusBadge>
                        </td>

                        <td className="px-5 py-5 text-sm text-zinc-500">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <Link
                            href={`/admin/product-orders/${order._id}`}
                            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-400"
                          >
                            Manage
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
              <span>
                Showing {filteredOrders.length} of {orders.length} orders
              </span>

              {(search ||
                paymentStatusFilter !== "all" ||
                orderStatusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPaymentStatusFilter("all");
                    setOrderStatusFilter("all");
                  }}
                  className="text-orange-500 transition hover:text-orange-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  accent = "orange",
}) {
  const accentClasses = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10 border-yellow-500/10",
    green: "text-green-500 bg-green-500/10 border-green-500/10",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/10",
  };

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4 transition hover:border-zinc-700">
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl border ${accentClasses[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function FinancialCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}) {
  const isGreen = accent === "green";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-5">
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl ${
          isGreen ? "bg-green-500/10" : "bg-orange-500/10"
        }`}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isGreen
                ? "border-green-500/20 bg-green-500/10 text-green-500"
                : "border-orange-500/20 bg-orange-500/10 text-orange-500"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <p className="text-sm font-medium text-zinc-500">
            {title}
          </p>
        </div>

        <p className="mt-5 text-3xl font-black tracking-tight text-white">
          {value}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-4 text-${align} text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ children, className }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function OrderCard({ order }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
      {/* Product header */}
      <div className="flex gap-4 border-b border-zinc-800 p-4">
        {order.product?.imageUrl ? (
          <img
            src={order.product.imageUrl}
            alt={order.product?.name || "Product"}
            className="h-16 w-16 shrink-0 rounded-xl border border-zinc-800 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-black text-zinc-600">
            <Box className="h-6 w-6" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">
            {order.product?.name || "Product"}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Quantity: {order.quantity}
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Member */}
      <div className="p-4">
        <div className="rounded-xl border border-zinc-900 bg-black p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            <User className="h-3.5 w-3.5" />
            Member
          </div>

          <p className="mt-2 font-semibold text-white">
            {order.user?.name || "Unknown Member"}
          </p>

          <p className="mt-1 break-all text-xs text-zinc-500">
            {order.user?.email || "—"}
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            {order.user?.phone || "—"}
          </p>
        </div>

        {/* Amount */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <AmountBox
            label="Total"
            value={formatCurrency(order.totalAmount)}
          />

          <AmountBox
            label="Paid"
            value={formatCurrency(order.totalPaid)}
          />

          <AmountBox
            label="Due"
            value={formatCurrency(order.remainingAmount)}
          />
        </div>

        {/* Status */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge
            className={getPaymentStatusClass(order.paymentStatus)}
          >
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
              order.paymentStatus}
          </StatusBadge>

          <StatusBadge
            className={getOrderStatusClass(order.orderStatus)}
          >
            {ORDER_STATUS_LABELS[order.orderStatus] ||
              order.orderStatus}
          </StatusBadge>
        </div>

        {/* Manage */}
        <Link
          href={`/admin/product-orders/${order._id}`}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
        >
          Manage Order
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function AmountBox({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-12 text-center">
      <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
        <Package className="h-5 w-5 text-orange-500" />
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-400">
        Loading product orders...
      </p>

      <p className="mt-1 text-xs text-zinc-700">
        Please wait while we fetch the latest orders.
      </p>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-zinc-600">
        <Package className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-white">
        No product orders found
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        {hasFilters
          ? "No orders match your current search or filters."
          : "There are no product orders available yet."}
      </p>
    </div>
  );
}