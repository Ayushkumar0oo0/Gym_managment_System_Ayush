"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Upload,
  Image as ImageIcon,
  CalendarDays,
  IndianRupee,
  Gift,
  Zap,
  Dumbbell,
  CheckCircle2,
  Clock3,
  XCircle,
  Loader2,
  RefreshCw,
  Tag,
  Sparkles,
} from "lucide-react";

const initialForm = {
  type: "",
  title: "",
  description: "",
  posterImage: "",
  offerPrice: "",
  membershipPlan: "",
  registrationFeeWaived: false,
  extensionDays: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        const [promotionResponse, planResponse] = await Promise.all([
          fetch("/api/admin/promotions"),
          fetch("/api/admin/membership-plans"),
        ]);

        const promotionData = await promotionResponse.json();
        const planData = await planResponse.json();

        if (cancelled) return;

        if (!promotionResponse.ok) {
          throw new Error(
            promotionData.message || "Failed to load promotions"
          );
        }

        if (!planResponse.ok) {
          throw new Error(
            planData.message || "Failed to load membership plans"
          );
        }

        setPromotions(promotionData.promotions || []);
        setPlans((planData.plans || []).filter((plan) => plan.isActive));
        setMessage({ type: "", text: "" });
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMessage({
            type: "error",
            text: error.message || "Failed to load data",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handlePosterUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Only JPG, PNG and WebP images are allowed.",
      });

      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image size must be less than 5 MB.",
      });

      event.target.value = "";
      return;
    }

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image.");
      }

      if (!data.url) {
        throw new Error("Cloudinary did not return an image URL.");
      }

      setForm((previous) => ({
        ...previous,
        posterImage: data.url,
      }));

      setMessage({
        type: "success",
        text: "Poster uploaded successfully.",
      });
    } catch (error) {
      console.error("Poster upload error:", error);

      setMessage({
        type: "error",
        text: error.message || "Failed to upload poster.",
      });
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  function selectPromotionType(type) {
    if (form.type === type) {
      resetForm();
      return;
    }

    setForm((previous) => ({
      ...previous,
      type,
      ...(type === "membership"
        ? {
            extensionDays: "",
          }
        : {
            membershipPlan: "",
            registrationFeeWaived: false,
          }),
    }));

    setEditingId(null);
    setMessage({ type: "", text: "" });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setMessage({ type: "", text: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.type) {
      setMessage({
        type: "error",
        text: "Please select an offer type.",
      });
      return;
    }

    if (!form.title.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a promotion title.",
      });
      return;
    }

    if (!form.posterImage.trim()) {
      setMessage({
        type: "error",
        text: "Please upload a promotion poster.",
      });
      return;
    }

    if (form.offerPrice === "" || Number(form.offerPrice) < 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid offer price.",
      });
      return;
    }

    if (form.type === "membership" && !form.membershipPlan) {
      setMessage({
        type: "error",
        text: "Please select a membership plan.",
      });
      return;
    }

    if (
      form.type === "extension" &&
      (!form.extensionDays || Number(form.extensionDays) < 1)
    ) {
      setMessage({
        type: "error",
        text: "Please enter valid extension days.",
      });
      return;
    }

    if (!form.startDate || !form.endDate) {
      setMessage({
        type: "error",
        text: "Please select start and end dates.",
      });
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setMessage({
        type: "error",
        text: "End date must be after start date.",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const url = editingId
        ? `/api/admin/promotions/${editingId}`
        : "/api/admin/promotions";

      const method = editingId ? "PUT" : "POST";

      const body = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        posterImage: form.posterImage.trim(),
        offerPrice: Number(form.offerPrice),
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      };

      if (form.type === "membership") {
        body.membershipPlan = form.membershipPlan;
        body.registrationFeeWaived = form.registrationFeeWaived;
      }

      if (form.type === "extension") {
        body.extensionDays = Number(form.extensionDays);
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save promotion");
      }

      if (editingId) {
        setPromotions((previous) =>
          previous.map((promotion) =>
            promotion._id === editingId ? data.promotion : promotion
          )
        );

        setMessage({
          type: "success",
          text: "Promotion updated successfully.",
        });
      } else {
        setPromotions((previous) => [data.promotion, ...previous]);

        setMessage({
          type: "success",
          text: "Promotion created successfully.",
        });
      }

      resetForm();
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: error.message || "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(promotion) {
    setEditingId(promotion._id);

    setForm({
      type: promotion.type || "",
      title: promotion.title || "",
      description: promotion.description || "",
      posterImage: promotion.posterImage || "",
      offerPrice: promotion.offerPrice ?? "",
      membershipPlan:
        promotion.membershipPlan?._id || promotion.membershipPlan || "",
      registrationFeeWaived: promotion.registrationFeeWaived || false,
      extensionDays: promotion.extensionDays ?? "",
      startDate: promotion.startDate
        ? new Date(promotion.startDate).toISOString().split("T")[0]
        : "",
      endDate: promotion.endDate
        ? new Date(promotion.endDate).toISOString().split("T")[0]
        : "",
      isActive: promotion.isActive ?? true,
    });

    setMessage({ type: "", text: "" });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDeactivate(id) {
    const confirmed = window.confirm("Deactivate this promotion?");

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to deactivate promotion"
        );
      }

      setPromotions((previous) =>
        previous.map((promotion) =>
          promotion._id === id
            ? {
                ...promotion,
                isActive: false,
              }
            : promotion
        )
      );

      setMessage({
        type: "success",
        text: "Promotion deactivated successfully.",
      });
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: error.message || "Something went wrong.",
      });
    }
  }

  async function handleActivate(id) {
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to activate promotion"
        );
      }

      setPromotions((previous) =>
        previous.map((promotion) =>
          promotion._id === id
            ? {
                ...promotion,
                isActive: true,
              }
            : promotion
        )
      );

      setMessage({
        type: "success",
        text: "Promotion activated successfully.",
      });
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: error.message || "Something went wrong.",
      });
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

  function getStatus(promotion) {
    if (!promotion.isActive) return "Inactive";

    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (now < start) return "Scheduled";
    if (now > end) return "Expired";

    return "Live";
  }

  function getStatusConfig(status) {
    if (status === "Live") {
      return {
        icon: CheckCircle2,
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      };
    }

    if (status === "Scheduled") {
      return {
        icon: Clock3,
        className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      };
    }

    if (status === "Expired") {
      return {
        icon: XCircle,
        className: "border-zinc-700 bg-zinc-800 text-zinc-400",
      };
    }

    return {
      icon: PowerOff,
      className: "border-red-500/20 bg-red-500/10 text-red-400",
    };
  }

  const liveCount = promotions.filter(
    (promotion) => getStatus(promotion) === "Live"
  ).length;

  const scheduledCount = promotions.filter(
    (promotion) => getStatus(promotion) === "Scheduled"
  ).length;

  const expiredCount = promotions.filter(
    (promotion) => getStatus(promotion) === "Expired"
  ).length;

  const inactiveCount = promotions.filter(
    (promotion) => getStatus(promotion) === "Inactive"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-500" />
              <p className="mt-4 text-sm text-zinc-400">
                Loading promotions...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-orange-500">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                Offers & Promotions
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Promotions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Create powerful membership and extension offers to attract
              customers and increase gym sales.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" />
            New Promotion
          </button>
        </div>

        {/* MESSAGE */}
        {message.text && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#101010] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total
                </p>
                <p className="mt-2 text-2xl font-black">
                  {promotions.length}
                </p>
              </div>

              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
                <Tag className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#101010] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Live
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  {liveCount}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#101010] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Scheduled
                </p>
                <p className="mt-2 text-2xl font-black text-amber-400">
                  {scheduledCount}
                </p>
              </div>

              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#101010] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Inactive
                </p>
                <p className="mt-2 text-2xl font-black text-red-400">
                  {inactiveCount + expiredCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
                <PowerOff className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-[#101010] shadow-2xl">
          <div className="border-b border-zinc-800 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500">
                <Gift className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {editingId ? "Edit Promotion" : "Create Promotion"}
                </h2>

                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                  Build an offer customers can easily understand.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {/* OFFER TYPE */}
            <div>
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Promotion Type
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectPromotionType("membership")}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    form.type === "membership"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-[#0b0b0b] hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`rounded-xl p-3 ${
                        form.type === "membership"
                          ? "bg-orange-500 text-black"
                          : "bg-zinc-900 text-orange-500"
                      }`}
                    >
                      <Dumbbell className="h-6 w-6" />
                    </div>

                    {form.type === "membership" && (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black text-black">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    Membership Offer
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Sell a membership plan at a special promotional price.
                  </p>

                  <div className="mt-5 rounded-xl border border-zinc-800 bg-black/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      Example
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      6 Months Gym — ₹3,000
                    </p>
                    <p className="mt-1 text-sm text-emerald-400">
                      🎁 Registration FREE
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectPromotionType("extension")}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    form.type === "extension"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-[#0b0b0b] hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`rounded-xl p-3 ${
                        form.type === "extension"
                          ? "bg-orange-500 text-black"
                          : "bg-zinc-900 text-orange-500"
                      }`}
                    >
                      <Zap className="h-6 w-6" />
                    </div>

                    {form.type === "extension" && (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black text-black">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    Extension Offer
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Add extra days to an existing active membership.
                  </p>

                  <div className="mt-5 rounded-xl border border-zinc-800 bg-black/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      Example
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      +30 Days — ₹500
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      For existing members
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* FORM */}
            {form.type && (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6 border-t border-zinc-800 pt-8"
              >
                {/* TITLE + PRICE */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Promotion Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder={
                        form.type === "membership"
                          ? "New Year 6 Month Special"
                          : "New Year Extension Offer"
                      }
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Promotional Price
                    </label>

                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

                      <input
                        type="number"
                        name="offerPrice"
                        value={form.offerPrice}
                        onChange={handleChange}
                        placeholder="3000"
                        min="0"
                        required
                        className="w-full rounded-xl border border-zinc-800 bg-[#090909] py-3 pl-10 pr-4 text-lg font-black text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder={
                      form.type === "membership"
                        ? "Get 6 months of gym membership at a special price."
                        : "Get 30 extra days added to your current membership."
                    }
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                  />
                </div>

                {/* MEMBERSHIP */}
                {form.type === "membership" && (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Membership Plan
                      </label>

                      <select
                        name="membershipPlan"
                        value={form.membershipPlan}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
                      >
                        <option value="">Select a membership plan</option>

                        {plans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} — ₹{plan.price} —{" "}
                            {plan.durationInDays} days
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-zinc-800 bg-[#090909] p-4 transition hover:border-orange-500/50">
                      <input
                        type="checkbox"
                        name="registrationFeeWaived"
                        checked={form.registrationFeeWaived}
                        onChange={handleChange}
                        className="h-5 w-5 accent-orange-500"
                      />

                      <div>
                        <p className="text-sm font-bold text-white">
                          🎁 Make registration FREE
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Waive the normal ₹500 registration fee.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* EXTENSION */}
                {form.type === "extension" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Extra Membership Days
                    </label>

                    <input
                      type="number"
                      name="extensionDays"
                      value={form.extensionDays}
                      onChange={handleChange}
                      placeholder="30"
                      min="1"
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
                    />

                    <p className="mt-2 text-xs text-zinc-600">
                      These days will be added to the member's existing
                      membership.
                    </p>
                  </div>
                )}

                {/* POSTER */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Promotion Poster
                  </label>

                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-[#090909] p-5">
                    <label
                      htmlFor="poster-upload"
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-zinc-800 px-4 py-8 text-center transition ${
                        uploadingImage
                          ? "cursor-not-allowed opacity-50"
                          : "hover:border-orange-500/50 hover:bg-orange-500/5"
                      }`}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                      ) : (
                        <div className="rounded-xl bg-orange-500/10 p-4 text-orange-500">
                          <Upload className="h-8 w-8" />
                        </div>
                      )}

                      <p className="mt-4 font-bold">
                        {uploadingImage
                          ? "Uploading poster..."
                          : "Upload Promotion Poster"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        JPG, PNG or WebP
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Maximum file size: 5 MB
                      </p>

                      <input
                        id="poster-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePosterUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {form.posterImage && (
                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-bold">
                            Uploaded Poster
                          </p>

                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                            ✓ Uploaded
                          </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
                          <img
                            src={form.posterImage}
                            alt="Uploaded promotion poster"
                            className="max-h-[420px] w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DATES */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Offer Start Date
                    </label>

                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 pl-11 text-sm text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Offer End Date
                    </label>

                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

                      <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-zinc-800 bg-[#090909] px-4 py-3 pl-11 text-sm text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIVE */}
                <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-zinc-800 bg-[#090909] p-4 transition hover:border-orange-500/50">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 accent-orange-500"
                  />

                  <div>
                    <p className="font-bold">Promotion Active</p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Active promotions can be shown to customers when their
                      dates are valid.
                    </p>
                  </div>
                </label>

                {/* BUTTONS */}
                <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId ? (
                      <Pencil className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}

                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Promotion"
                      : "Publish Promotion"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving || uploadingImage}
                      className="w-full rounded-xl border border-zinc-700 px-6 py-3 font-bold text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* EXISTING PROMOTIONS */}
        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black sm:text-2xl">
                  Existing Promotions
                </h2>

                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">
                  {promotions.length}
                </span>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Manage your current and previous gym offers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#101010] px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {promotions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#101010] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <Gift className="h-7 w-7" />
              </div>

              <p className="mt-4 font-bold">No promotions created yet.</p>

              <p className="mt-1 text-sm text-zinc-500">
                Create your first gym offer above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promotion) => {
                const status = getStatus(promotion);
                const statusConfig = getStatusConfig(status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={promotion._id}
                    className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#101010] transition hover:border-zinc-700 hover:shadow-2xl"
                  >
                    {/* IMAGE */}
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <img
                        src={promotion.posterImage}
                        alt={promotion.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      <div className="absolute left-3 top-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusConfig.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                          {promotion.type === "membership"
                            ? "Membership"
                            : "Extension"}
                        </span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 break-words text-lg font-black">
                          {promotion.title}
                        </h3>
                      </div>

                      {promotion.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                          {promotion.description}
                        </p>
                      )}

                      {/* PRICE */}
                      <div className="mt-5 rounded-xl border border-zinc-800 bg-[#090909] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          Offer Price
                        </p>

                        <p className="mt-1 flex items-center text-2xl font-black text-orange-500">
                          <IndianRupee className="h-5 w-5" />
                          {promotion.offerPrice}
                        </p>

                        {promotion.type === "membership" && (
                          <p className="mt-3 text-sm text-zinc-500">
                            Plan:{" "}
                            <span className="font-bold text-zinc-300">
                              {promotion.membershipPlan?.name ||
                                "Membership Plan"}
                            </span>
                          </p>
                        )}

                        {promotion.type === "membership" &&
                          promotion.registrationFeeWaived && (
                            <p className="mt-2 text-sm font-bold text-emerald-400">
                              🎁 Registration FREE
                            </p>
                          )}

                        {promotion.type === "extension" && (
                          <p className="mt-2 text-sm text-zinc-400">
                            +{" "}
                            <span className="font-bold text-white">
                              {promotion.extensionDays}
                            </span>{" "}
                            days
                          </p>
                        )}
                      </div>

                      {/* DATES */}
                      <div className="mt-4 space-y-2 text-sm text-zinc-500">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-zinc-600" />
                            Start
                          </span>

                          <span className="font-medium text-zinc-300">
                            {formatDate(promotion.startDate)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-zinc-600" />
                            End
                          </span>

                          <span className="font-medium text-zinc-300">
                            {formatDate(promotion.endDate)}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(promotion)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-400"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        {promotion.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeactivate(promotion._id)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                          >
                            <PowerOff className="h-4 w-4" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(promotion._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                          >
                            <Power className="h-4 w-4" />
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}