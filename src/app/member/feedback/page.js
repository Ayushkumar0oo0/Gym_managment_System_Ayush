"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageSquareText,
  Wrench,
  UserRound,
  Users,
  Sparkles,
  ShoppingBag,
  Dumbbell,
  Lightbulb,
  MoreHorizontal,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
} from "lucide-react";

const CATEGORIES = [
  {
    value: "equipment_issue",
    label: "Equipment Issue",
    description: "Report a broken or faulty machine",
    icon: Wrench,
  },
  {
    value: "staff_complaint",
    label: "Staff Complaint",
    description: "Report a concern about gym staff",
    icon: UserRound,
  },
  {
    value: "member_complaint",
    label: "Member Complaint",
    description: "Report an issue involving another member",
    icon: Users,
  },
  {
    value: "cleanliness",
    label: "Cleanliness",
    description: "Report a cleaning or hygiene issue",
    icon: Sparkles,
  },
  {
    value: "product_recommendation",
    label: "Product Recommendation",
    description: "Suggest a product for the gym",
    icon: ShoppingBag,
  },
  {
    value: "new_equipment_request",
    label: "New Equipment",
    description: "Request a new machine or equipment",
    icon: Dumbbell,
  },
  {
    value: "suggestion",
    label: "Suggestion",
    description: "Share an idea to improve the gym",
    icon: Lightbulb,
  },
  {
    value: "other",
    label: "Other",
    description: "Anything else you want us to know",
    icon: MoreHorizontal,
  },
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

const INITIAL_FORM = {
  category: "",
  subject: "",
  message: "",
  productName: "",
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

function getCategoryLabel(value) {
  return (
    CATEGORIES.find((category) => category.value === value)?.label || "Other"
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

export default function MemberFeedbackPage() {
  const [form, setForm] = useState(INITIAL_FORM);

  const [feedback, setFeedback] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/member/feedback", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load feedback.");
      }

      setFeedback(Array.isArray(data.feedback) ? data.feedback : []);
    } catch (err) {
      console.error("LOAD FEEDBACK ERROR:", err);
      setError(err.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function selectCategory(value) {
    setForm((previous) => ({
      ...previous,
      category: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please describe your feedback or request.");
      return;
    }

    if (form.subject.trim().length > 100) {
      setError("Subject cannot exceed 100 characters.");
      return;
    }

    if (form.message.trim().length > 1000) {
      setError("Message cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/member/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
          productName: form.productName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit feedback.");
      }

      setSuccess(
        "Your feedback has been submitted. The gym team will review it."
      );

      setForm(INITIAL_FORM);

      await loadFeedback();
    } catch (err) {
      console.error("SUBMIT FEEDBACK ERROR:", err);
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] pb-16 text-white">
      {/* Header */}
      <section className="border-b border-zinc-800 bg-[#0c0c0f]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/member"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              <MessageSquareText size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Feedback & Requests
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Have a problem, suggestion, equipment request, or product idea?
                Tell us and our gym team will take a look.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            <XCircle className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-bold">Submitted successfully</p>
              <p className="mt-1 text-sm text-emerald-300">{success}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Form */}
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
            <div className="border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-black">Tell Us What&apos;s Wrong</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Select the type of feedback and give us the details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              {/* Category */}
              <div>
                <label className="mb-3 block text-sm font-bold text-zinc-200">
                  What is this about?
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const selected = form.category === category.value;

                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => selectCategory(category.value)}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                            : "border-zinc-800 bg-[#141416] hover:border-zinc-700 hover:bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <Icon size={17} />
                        </div>

                        <div>
                          <p
                            className={`text-sm font-black ${
                              selected ? "text-orange-400" : "text-zinc-200"
                            }`}
                          >
                            {category.label}
                          </p>

                          <p className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                            {category.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="mt-6">
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-bold text-zinc-200"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Treadmill number 2 is not working"
                  className="w-full rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />

                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-zinc-600">
                    {form.subject.length}/100
                  </span>
                </div>
              </div>

              {/* Product name */}
              {form.category === "product_recommendation" && (
                <div className="mt-5">
                  <label
                    htmlFor="productName"
                    className="mb-2 block text-sm font-bold text-zinc-200"
                  >
                    Product Name
                    <span className="ml-2 font-medium text-zinc-600">
                      Optional
                    </span>
                  </label>

                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    value={form.productName}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g. Whey Protein, Shaker, Pre-workout"
                    className="w-full rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              )}

              {/* Message */}
              <div className="mt-5">
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-bold text-zinc-200"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={6}
                  placeholder="Tell us what happened, what you need, or what you would like the gym to improve..."
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-[#141416] px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />

                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-zinc-600">
                    {form.message.length}/1000
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Info */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Lightbulb size={21} />
              </div>

              <h2 className="mt-4 text-lg font-black">
                Your feedback matters
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Help us make the gym better. You can report problems, suggest
                improvements, request equipment, or recommend products you
                would like to see.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Report broken equipment",
                  "Suggest new products",
                  "Request new gym equipment",
                  "Share improvement ideas",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#141416] p-3"
                  >
                    <CheckCircle2
                      size={17}
                      className="shrink-0 text-orange-500"
                    />

                    <span className="text-sm font-medium text-zinc-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/10 sm:p-6">
              <h2 className="font-black">Your submissions</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Check the status of feedback you have already submitted.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-[#141416] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {feedback.length}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#141416] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Open
                  </p>

                  <p className="mt-1 text-2xl font-black text-orange-500">
                    {
                      feedback.filter(
                        (item) =>
                          item.status === "new" ||
                          item.status === "reviewing"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* History */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/10">
          <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-black">My Feedback</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Previous requests and their current status.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-orange-500" size={26} />
            </div>
          ) : feedback.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                <MessageSquareText size={24} />
              </div>

              <h3 className="mt-4 font-black text-white">
                No feedback yet
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
                Your submitted feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {feedback.map((item) => (
                <div
                  key={item._id}
                  className="p-5 transition hover:bg-zinc-800/30 sm:px-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-400">
                          {getCategoryLabel(item.category)}
                        </span>

                        <StatusBadge status={item.status} />
                      </div>

                      <h3 className="mt-3 font-black text-white">
                        {item.subject}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-500">
                        {item.message}
                      </p>

                      {item.productName && (
                        <p className="mt-3 text-xs text-zinc-500">
                          Product:{" "}
                          <span className="font-bold text-zinc-300">
                            {item.productName}
                          </span>
                        </p>
                      )}

                      {item.adminNote && (
                        <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                            Gym Team Note
                          </p>

                          <p className="mt-2 text-sm leading-6 text-orange-200/80">
                            {item.adminNote}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="shrink-0 text-xs font-medium text-zinc-600">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}