"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
  Wrench,
  X,
  XCircle,
  Dumbbell,
  Lightbulb,
} from "lucide-react";

const CATEGORIES = [
  { value: "equipment_issue", label: "Equipment Issue", icon: Wrench },
  { value: "staff_complaint", label: "Staff Complaint", icon: UserRound },
  { value: "member_complaint", label: "Member Complaint", icon: Users },
  { value: "cleanliness", label: "Cleanliness", icon: Sparkles },
  {
    value: "product_recommendation",
    label: "Product Recommendation",
    icon: ShoppingBag,
  },
  {
    value: "new_equipment_request",
    label: "New Equipment",
    icon: Dumbbell,
  },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const STATUS_CONFIG = {
  new: {
    label: "New",
    icon: AlertCircle,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  reviewing: {
    label: "Reviewing",
    icon: Clock3,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategory(value) {
  return (
    CATEGORIES.find((category) => category.value === value) || {
      label: "Other",
      icon: MoreHorizontal,
    }
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [editStatus, setEditStatus] = useState("new");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    loadFeedback();
  }, [statusFilter, categoryFilter]);

  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/feedback${query ? `?${query}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load feedback.");
      }

      setFeedback(Array.isArray(data.feedback) ? data.feedback : []);

      setCounts({
        total: data.counts?.total || 0,
        new: data.counts?.new || 0,
        reviewing: data.counts?.reviewing || 0,
        resolved: data.counts?.resolved || 0,
        rejected: data.counts?.rejected || 0,
      });
    } catch (err) {
      console.error("ADMIN FEEDBACK LOAD ERROR:", err);
      setError(err.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  function openFeedback(item) {
    setSelectedFeedback(item);
    setEditStatus(item.status || "new");
    setAdminNote(item.adminNote || "");
    setError("");
    setSuccess("");
  }

  function closeFeedback() {
    if (updating) return;

    setSelectedFeedback(null);
    setEditStatus("new");
    setAdminNote("");
  }

  async function updateFeedback() {
    if (!selectedFeedback?._id) return;

    if (adminNote.length > 500) {
      setError("Admin note cannot exceed 500 characters.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId: selectedFeedback._id,
          status: editStatus,
          adminNote: adminNote.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update feedback.");
      }

      setSuccess("Feedback updated successfully.");

      setFeedback((previous) =>
        previous.map((item) =>
          item._id === selectedFeedback._id
            ? data.feedback
            : item
        )
      );

      setSelectedFeedback(data.feedback);

      setTimeout(() => {
        setSuccess("");
      }, 2500);

      await loadFeedback();
    } catch (err) {
      console.error("ADMIN FEEDBACK UPDATE ERROR:", err);
      setError(err.message || "Failed to update feedback.");
    } finally {
      setUpdating(false);
    }
  }

  const filteredFeedback = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return feedback;

    return feedback.filter((item) => {
      const category = getCategory(item.category).label.toLowerCase();

      const memberName = item.user?.name?.toLowerCase() || "";
      const email = item.user?.email?.toLowerCase() || "";
      const phone = item.user?.phone?.toLowerCase() || "";
      const subject = item.subject?.toLowerCase() || "";
      const message = item.message?.toLowerCase() || "";

      return (
        memberName.includes(value) ||
        email.includes(value) ||
        phone.includes(value) ||
        subject.includes(value) ||
        message.includes(value) ||
        category.includes(value)
      );
    });
  }, [feedback, search]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
                <MessageSquareText size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Feedback & Requests
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage member complaints, suggestions and requests.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadFeedback}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-500 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            <XCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">{success}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total"
            value={counts.total}
            icon={MessageSquareText}
            className="bg-zinc-800 text-zinc-300"
          />

          <StatCard
            label="New"
            value={counts.new}
            icon={AlertCircle}
            className="bg-blue-500/10 text-blue-400"
          />

          <StatCard
            label="Reviewing"
            value={counts.reviewing}
            icon={Clock3}
            className="bg-amber-500/10 text-amber-400"
          />

          <StatCard
            label="Resolved"
            value={counts.resolved}
            icon={CheckCircle2}
            className="bg-emerald-500/10 text-emerald-400"
          />

          <StatCard
            label="Rejected"
            value={counts.rejected}
            icon={XCircle}
            className="bg-red-500/10 text-red-400"
          />
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member, subject, email or message..."
                className="w-full rounded-xl border border-zinc-700 bg-[#141416] py-3 pl-10 pr-4 text-sm font-medium text-white outline-none placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#141416] py-3 pl-9 pr-9 text-sm font-bold text-zinc-200 outline-none focus:border-orange-500 lg:w-44"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-orange-500 lg:w-56"
            >
              <option value="all">All Categories</option>

              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Feedback list */}
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-black">Member Submissions</h2>

              <p className="mt-1 text-xs text-zinc-600">
                {filteredFeedback.length} result
                {filteredFeedback.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                <MessageSquareText size={24} />
              </div>

              <h3 className="mt-4 font-black text-white">
                No feedback found
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                There are no submissions matching your filters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#141416] text-left">
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Member
                      </th>

                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Category
                      </th>

                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Subject
                      </th>

                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Date
                      </th>

                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Status
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800">
                    {filteredFeedback.map((item) => {
                      const category = getCategory(item.category);
                      const CategoryIcon = category.icon;

                      return (
                        <tr
                          key={item._id}
                          className="transition hover:bg-zinc-800/30"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-zinc-200">
                                {item.user?.name || "Unknown Member"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-600">
                                {item.user?.email || "No email"}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                                <CategoryIcon size={15} />
                              </div>

                              <span className="text-sm font-semibold text-zinc-300">
                                {category.label}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-[280px] px-6 py-4">
                            <p className="truncate text-sm font-bold text-zinc-200">
                              {item.subject}
                            </p>

                            <p className="mt-1 truncate text-xs text-zinc-600">
                              {item.message}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {formatDate(item.createdAt)}
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openFeedback(item)}
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-500"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-zinc-800 lg:hidden">
                {filteredFeedback.map((item) => {
                  const category = getCategory(item.category);
                  const CategoryIcon = category.icon;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => openFeedback(item)}
                      className="block w-full p-5 text-left transition hover:bg-zinc-800/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                            <CategoryIcon size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black text-white">
                              {item.subject}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {item.user?.name || "Unknown Member"}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={item.status} />
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">
                        {item.message}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
                        <span>{category.label}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Details Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#111113] shadow-2xl sm:rounded-3xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-[#111113]/95 p-5 backdrop-blur sm:p-6">
              <div className="min-w-0 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedFeedback.status} />

                  <span className="text-xs text-zinc-600">
                    {formatDateTime(selectedFeedback.createdAt)}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-black text-white">
                  {selectedFeedback.subject}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeFeedback}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Member */}
              <div className="rounded-2xl border border-zinc-800 bg-[#141416] p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                  Member
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <UserRound size={18} />
                  </div>

                  <div>
                    <p className="font-black text-zinc-200">
                      {selectedFeedback.user?.name || "Unknown Member"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {selectedFeedback.user?.email || "No email"}
                    </p>

                    {selectedFeedback.user?.phone && (
                      <p className="mt-1 text-xs text-zinc-600">
                        {selectedFeedback.user.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                  Category
                </p>

                <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-300">
                  {getCategory(selectedFeedback.category).label}
                </div>
              </div>

              {/* Product */}
              {selectedFeedback.productName && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Product
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#141416] p-3">
                    <Package size={17} className="text-orange-500" />

                    <span className="text-sm font-bold text-zinc-200">
                      {selectedFeedback.productName}
                    </span>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                  Member Message
                </p>

                <div className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-[#141416] p-4 text-sm leading-7 text-zinc-400">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Admin note */}
              {selectedFeedback.adminNote && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                    Previous Admin Note
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-200/80">
                    {selectedFeedback.adminNote}
                  </p>
                </div>
              )}

              {/* Update */}
              <div className="border-t border-zinc-800 pt-6">
                <h3 className="font-black text-white">Manage Feedback</h3>

                <p className="mt-1 text-sm text-zinc-600">
                  Update the status and optionally leave a note for the member.
                </p>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-zinc-300">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="adminNote"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    Admin Note
                    <span className="ml-2 font-medium text-zinc-600">
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(event) =>
                      setAdminNote(event.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Add a note about what action was taken..."
                    className="w-full resize-none rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />

                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-zinc-600">
                      {adminNote.length}/500
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeFeedback}
                    disabled={updating}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={updateFeedback}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Update Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}