"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Megaphone,
  Loader2,
  X,
  Clock,
  Sun,
  Moon,
  Power,
} from "lucide-react";

const initialForm = {
  title: "",
  message: "",
  type: "full_day_closed",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function GymAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/gym-announcements", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch announcements"
        );
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(
        err.message || "Failed to fetch announcements"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openCreateModal() {
    setFormData(initialForm);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;

    setIsModalOpen(false);
    setFormData(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.title.trim()) {
      setError("Announcement title is required.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Announcement message is required.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (
      new Date(formData.endDate) <
      new Date(formData.startDate)
    ) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/admin/gym-announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to create announcement"
        );
      }

      setAnnouncements((previous) => [
        data.announcement,
        ...previous,
      ]);

      setIsModalOpen(false);
      setFormData(initialForm);

      setMessage("Announcement created successfully.");
    } catch (err) {
      console.error("Error creating announcement:", err);

      setError(
        err.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setError("");
      setMessage("");

      const res = await fetch(
        `/api/admin/gym-announcements/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      setAnnouncements((previous) =>
        previous.map((item) =>
          item._id === id ? data.announcement : item
        )
      );

      setMessage(
        `Announcement ${
          !currentStatus ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error("Error toggling status:", err);

      setError(
        err.message || "Failed to update announcement status."
      );
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(
        `/api/admin/gym-announcements/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to delete announcement"
        );
      }

      setAnnouncements((previous) =>
        previous.filter((item) => item._id !== id)
      );

      setMessage("Announcement deleted successfully.");
    } catch (err) {
      console.error("Error deleting announcement:", err);

      setError(
        err.message || "Failed to delete announcement."
      );
    }
  }

  function getTypeConfig(type) {
    switch (type) {
      case "full_day_closed":
        return {
          label: "Full Day Closure",
          icon: XCircle,
          className:
            "border-red-500/20 bg-red-500/10 text-red-400",
        };

      case "morning_closed":
        return {
          label: "Morning Closure",
          icon: Sun,
          className:
            "border-amber-500/20 bg-amber-500/10 text-amber-400",
        };

      case "evening_closed":
        return {
          label: "Evening Closure",
          icon: Moon,
          className:
            "border-orange-500/20 bg-orange-500/10 text-orange-400",
        };

      default:
        return {
          label: "General Notice",
          icon: Bell,
          className:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",
        };
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const activeCount = announcements.filter(
    (item) => item.isActive
  ).length;

  const inactiveCount =
    announcements.length - activeCount;

  const closureCount = announcements.filter(
    (item) =>
      item.type === "full_day_closed" ||
      item.type === "morning_closed" ||
      item.type === "evening_closed"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
              <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            </div>

            <p className="mt-4 text-sm text-zinc-500">
              Loading announcements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
              <Megaphone className="h-4 w-4" />
              Member Communication
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Announcements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Manage gym closures, holiday hours and important
              notices for your members.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Notices"
            value={announcements.length}
            icon={Bell}
            iconClass="text-orange-500"
            bgClass="bg-orange-500/10"
          />

          <StatCard
            label="Active"
            value={activeCount}
            icon={CheckCircle2}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <StatCard
            label="Inactive"
            value={inactiveCount}
            icon={Power}
            iconClass="text-zinc-400"
            bgClass="bg-zinc-800"
          />

          <StatCard
            label="Closures"
            value={closureCount}
            icon={Calendar}
            iconClass="text-red-400"
            bgClass="bg-red-500/10"
          />
        </div>

        {/* ANNOUNCEMENTS */}
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Megaphone className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-lg font-black">
              No announcements yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Create your first announcement to notify members
              about closures, schedule changes or important
              gym updates.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black hover:bg-orange-400"
            >
              <Plus className="h-4 w-4" />
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {announcements.map((item) => {
              const typeConfig = getTypeConfig(item.type);
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={item._id}
                  className={`group overflow-hidden rounded-2xl border bg-zinc-950 transition ${
                    item.isActive
                      ? "border-white/[0.08] hover:border-zinc-700"
                      : "border-white/[0.05] opacity-60"
                  }`}
                >
                  {/* CARD TOP */}
                  <div className="border-b border-white/[0.06] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${typeConfig.className}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                        {typeConfig.label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(
                            item._id,
                            item.isActive
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                          item.isActive
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {item.isActive ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}

                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </div>

                    <h3 className="mt-5 break-words text-lg font-black text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-500">
                      {item.message}
                    </p>
                  </div>

                  {/* DATE */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/40 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                        <Calendar className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          Announcement Period
                        </p>

                        <p className="mt-1 text-xs font-bold text-zinc-300">
                          {formatDate(item.startDate)}
                          {" — "}
                          {formatDate(item.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="border-t border-white/[0.06] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Announcement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0b0b] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0b0b0b]/95 px-5 py-5 backdrop-blur sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Megaphone className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black">
                    New Announcement
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Notify members about important gym updates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              <Field label="Title" required>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Diwali Holiday Closure"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input"
                />
              </Field>

              <Field label="Announcement Type">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="full_day_closed">
                    Full Day Closure
                  </option>

                  <option value="morning_closed">
                    Morning Closure
                  </option>

                  <option value="evening_closed">
                    Evening Closure
                  </option>

                  <option value="general">
                    General Notice
                  </option>
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start Date" required>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="input"
                  />
                </Field>

                <Field label="End Date" required>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Message" required>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Provide details about the schedule change..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="input resize-none"
                />
              </Field>

              {/* ACTIVE */}
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-white/[0.07] bg-black/40 p-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <div>
                  <p className="text-sm font-bold text-white">
                    Publish immediately
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Active announcements can be displayed to
                    members according to their configured dates.
                  </p>
                </div>
              </label>

              {/* MODAL ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {submitting
                    ? "Saving..."
                    : "Save Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #080808;
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition: all 150ms ease;
        }

        .input::placeholder {
          color: #3f3f46;
        }

        .input:focus {
          border-color: rgba(249, 115, 22, 0.7);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.06);
        }

        .input[type="date"] {
          color-scheme: dark;
        }

        select.input option {
          background: #090909;
          color: white;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  bgClass,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgClass} ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
        {required && (
          <span className="ml-1 text-orange-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}