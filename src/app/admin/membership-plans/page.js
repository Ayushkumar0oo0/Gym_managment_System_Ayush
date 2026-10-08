"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  X,
  Check,
  AlertCircle,
  Dumbbell,
  Users,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  durationInDays: "",
  eligibility: "both",
  isActive: true,
};

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function fetchPlans() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/membership-plans", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch membership plans."
        );
      }

      setPlans(Array.isArray(data?.plans) ? data.plans : []);
    } catch (error) {
      console.error("FETCH MEMBERSHIP PLANS ERROR:", error);
      setError(error?.message || "Failed to load membership plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  function openCreateModal() {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(plan) {
    setEditingPlan(plan);

    setForm({
      name: plan?.name || "",
      description: plan?.description || "",
      price:
        plan?.price !== undefined && plan?.price !== null
          ? String(plan.price)
          : "",
      durationInDays:
        plan?.durationInDays !== undefined &&
        plan?.durationInDays !== null
          ? String(plan.durationInDays)
          : "",
      eligibility: plan?.eligibility || "both",
      isActive:
        typeof plan?.isActive === "boolean"
          ? plan.isActive
          : true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function createPlan() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/membership-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          durationInDays: Number(form.durationInDays),
          eligibility: form.eligibility,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to create membership plan."
        );
      }

      setSuccess("Membership plan created successfully.");
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingPlan(null);

      await fetchPlans();
    } catch (error) {
      console.error("CREATE MEMBERSHIP PLAN ERROR:", error);
      setError(
        error?.message || "Failed to create membership plan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePlan() {
    if (!editingPlan?._id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/membership-plans/${editingPlan._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            durationInDays: Number(form.durationInDays),
            eligibility: form.eligibility,
            isActive: form.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update membership plan."
        );
      }

      setSuccess("Membership plan updated successfully.");
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingPlan(null);

      await fetchPlans();
    } catch (error) {
      console.error("UPDATE MEMBERSHIP PLAN ERROR:", error);
      setError(
        error?.message || "Failed to update membership plan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const price = Number(form.price);
    const duration = Number(form.durationInDays);

    if (!name) {
      setError("Plan name is required.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Please enter a valid non-negative price.");
      return;
    }

    if (
      form.durationInDays === "" ||
      !Number.isInteger(duration) ||
      duration < 1
    ) {
      setError(
        "Duration must be a positive whole number of days."
      );
      return;
    }

    if (!["both", "male", "female"].includes(form.eligibility)) {
      setError("Please select valid eligibility.");
      return;
    }

    if (editingPlan) {
      await updatePlan();
    } else {
      await createPlan();
    }
  }

  async function togglePlanStatus(plan) {
    if (!plan?._id) return;

    const confirmed = window.confirm(
      plan.isActive
        ? `Deactivate "${plan.name}"? New customers will not be able to purchase this plan.`
        : `Activate "${plan.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/membership-plans/${plan._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !plan.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update membership plan."
        );
      }

      setSuccess(
        plan.isActive
          ? "Membership plan deactivated."
          : "Membership plan activated."
      );

      await fetchPlans();
    } catch (error) {
      console.error("TOGGLE MEMBERSHIP PLAN ERROR:", error);
      setError(
        error?.message || "Failed to update membership plan."
      );
    }
  }

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.isActive).length,
    [plans]
  );

  const inactivePlans = useMemo(
    () => plans.filter((plan) => !plan.isActive).length,
    [plans]
  );

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header className="mb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Dumbbell size={18} />
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                  Membership Management
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Membership Plans
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Create and manage the membership plans available
                to your gym members.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchPlans}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#0c0c0c] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
              >
                <Plus size={18} />
                Add Plan
              </button>
            </div>
          </div>
        </header>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            <Check size={18} className="mt-0.5 shrink-0" />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto text-green-400 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}
        <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<Dumbbell size={19} />}
            title="Total Plans"
            value={plans.length}
          />

          <SummaryCard
            icon={<Check size={19} />}
            title="Active Plans"
            value={activePlans}
            accent="green"
          />

          <SummaryCard
            icon={<Power size={19} />}
            title="Inactive Plans"
            value={inactivePlans}
          />
        </section>

        {/* CONTENT */}
        {loading ? (
          <LoadingState />
        ) : plans.length === 0 ? (
          <EmptyState onAdd={openCreateModal} />
        ) : (
          <>
            {/* MOBILE */}
            <div className="grid gap-4 md:hidden">
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onEdit={openEditModal}
                  onToggle={togglePlanStatus}
                />
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0c] shadow-xl md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Plan
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Price
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Duration
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Eligibility
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800">
                    {plans.map((plan) => (
                      <tr
                        key={plan._id}
                        className="transition hover:bg-zinc-900/50"
                      >
                        <td className="px-5 py-5">
                          <div className="max-w-sm">
                            <p className="font-bold text-white">
                              {plan.name}
                            </p>

                            {plan.description && (
                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
                                {plan.description}
                              </p>
                            )}

                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
                              <Dumbbell size={12} />
                              Gym included
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span className="font-black text-white">
                            ₹{formatNumber(plan.price)}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm text-zinc-400">
                          {formatDuration(plan.durationInDays)}
                        </td>

                        <td className="px-5 py-5">
                          <EligibilityBadge
                            eligibility={plan.eligibility}
                          />
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge active={plan.isActive} />
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(plan)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-400"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                togglePlanStatus(plan)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                plan.isActive
                                  ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  : "border-green-500/20 text-green-400 hover:bg-green-500/10"
                              }`}
                            >
                              <Power size={14} />

                              {plan.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#0c0c0c] shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-[#0c0c0c]/95 px-5 py-5 backdrop-blur sm:px-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-black">
                    {editingPlan ? (
                      <Pencil size={17} />
                    ) : (
                      <Plus size={19} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingPlan
                        ? "Edit Membership Plan"
                        : "Create Membership Plan"}
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      {editingPlan
                        ? "Update the plan details."
                        : "Create a base gym membership plan."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5 sm:p-6"
            >
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Plan Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Example: 6 Month Gym"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe what this membership includes."
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                />

                <p className="mt-1 text-right text-xs text-zinc-600">
                  {form.description.length}/500
                </p>
              </div>

              {/* PRICE + DURATION */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Price
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400"
                    />

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="600"
                      className="w-full rounded-xl border border-zinc-800 bg-black py-3.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Duration
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="durationInDays"
                      value={form.durationInDays}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      placeholder="180"
                      className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                      required
                    />

                    <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-500">
                      days
                    </div>
                  </div>
                </div>
              </div>

              {/* ELIGIBILITY */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-zinc-300">
                  Who can purchase this plan?
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <EligibilityOption
                    value="both"
                    selected={form.eligibility === "both"}
                    onChange={handleChange}
                    title="Both"
                    description="Male & female"
                  />

                  <EligibilityOption
                    value="male"
                    selected={form.eligibility === "male"}
                    onChange={handleChange}
                    title="Male"
                    description="Male members"
                  />

                  <EligibilityOption
                    value="female"
                    selected={form.eligibility === "female"}
                    onChange={handleChange}
                    title="Female"
                    description="Female members"
                  />
                </div>
              </div>

              {/* INCLUDED SERVICE */}
              <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <Dumbbell size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Gym access included
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Every membership plan includes normal gym
                      access.
                    </p>
                  </div>
                </div>
              </div>

              {/* ADDONS */}
              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm font-bold text-white">
                  Optional services
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Cardio and Personal Trainer are managed separately
                  as add-ons and can be selected during purchase.
                </p>
              </div>

              {/* ACTIVE */}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-white">
                    Plan is active
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    Active plans can be shown to customers for
                    purchase.
                  </span>
                </span>
              </label>

              {/* FORM ERROR */}
              {error && (
                <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingPlan ? (
                        <Pencil size={16} />
                      ) : (
                        <Plus size={17} />
                      )}

                      {editingPlan
                        ? "Save Changes"
                        : "Create Plan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  accent = "default",
}) {
  const iconClass =
    accent === "green"
      ? "bg-green-500/10 text-green-400"
      : "bg-orange-500/10 text-orange-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-5 shadow-lg shadow-black/10">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-600">
            {title}
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onEdit, onToggle }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0c] p-5 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-white">
            {plan.name}
          </h3>

          {plan.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
              {plan.description}
            </p>
          )}
        </div>

        <StatusBadge active={plan.isActive} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <IndianRupee size={13} />
            Price
          </div>

          <p className="mt-1 text-xl font-black text-white">
            ₹{formatNumber(plan.price)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <CalendarDays size={13} />
            Duration
          </div>

          <p className="mt-1 text-xl font-black text-white">
            {formatDuration(plan.durationInDays)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Eligibility
        </p>

        <EligibilityBadge eligibility={plan.eligibility} />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-400"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onToggle(plan)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
            plan.isActive
              ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
              : "border-green-500/20 text-green-400 hover:bg-green-500/10"
          }`}
        >
          <Power size={15} />

          {plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function EligibilityOption({
  value,
  selected,
  onChange,
  title,
  description,
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-4 transition ${
        selected
          ? "border-orange-500/50 bg-orange-500/5 ring-1 ring-orange-500/20"
          : "border-zinc-800 bg-black hover:border-zinc-700"
      }`}
    >
      <input
        type="radio"
        name="eligibility"
        value={value}
        checked={selected}
        onChange={onChange}
        className="sr-only"
      />

      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-orange-500"
              : "border-zinc-700"
          }`}
        >
          {selected && (
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-white">{title}</p>

          <p className="mt-1 text-xs text-zinc-600">
            {description}
          </p>
        </div>
      </div>
    </label>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        active
          ? "bg-green-500/10 text-green-400"
          : "bg-zinc-800 text-zinc-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-green-400" : "bg-zinc-500"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

function EligibilityBadge({ eligibility }) {
  const config = {
    both: {
      label: "Male & Female",
      className: "bg-blue-500/10 text-blue-400",
    },
    male: {
      label: "Male only",
      className: "bg-indigo-500/10 text-indigo-400",
    },
    female: {
      label: "Female only",
      className: "bg-pink-500/10 text-pink-400",
    },
  };

  const current = config[eligibility] || config.both;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${current.className}`}
    >
      <Users size={12} />
      {current.label}
    </span>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#0c0c0c] px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
        <Dumbbell size={28} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-white">
        No membership plans yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        Create your first gym membership plan so customers can
        purchase it.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
      >
        <Plus size={17} />
        Create First Plan
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0c] p-5"
        >
          <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-900" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-900" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
            <div className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
          </div>

          <div className="mt-5 h-10 animate-pulse rounded-xl bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatDuration(days) {
  const number = Number(days);

  if (!Number.isFinite(number)) {
    return "—";
  }

  if (number === 1) return "1 day";
  if (number < 30) return `${number} days`;
  if (number === 30) return "1 month";
  if (number === 60) return "2 months";
  if (number === 90) return "3 months";
  if (number === 180) return "6 months";
  if (number === 270) return "9 months";
  if (number === 365) return "12 months";

  return `${number} days`;
}