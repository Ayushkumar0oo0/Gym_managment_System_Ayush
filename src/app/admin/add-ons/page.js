
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Dumbbell,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  Zap,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "cardio",
  price: "",
  isActive: true,
};

const TYPE_LABELS = {
  cardio: "Cardio",
  personal_trainer: "Personal Trainer",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10";

export default function AddOnsPage() {
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchAddOns = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const response = await fetch("/api/admin/add-ons", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch add-ons.");
      }

      setAddOns(Array.isArray(data?.addOns) ? data.addOns : []);
    } catch (err) {
      console.error("FETCH ADD-ONS ERROR:", err);
      setError(err?.message || "Failed to load add-ons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  function openCreateModal() {
    setEditingAddOn(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(addOn) {
    setEditingAddOn(addOn);
    setForm({
      name: addOn?.name || "",
      description: addOn?.description || "",
      type: addOn?.type || "cardio",
      price:
        addOn?.price !== undefined && addOn?.price !== null
          ? String(addOn.price)
          : "",
      isActive:
        typeof addOn?.isActive === "boolean" ? addOn.isActive : true,
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingAddOn(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Add-on name is required.");
      return;
    }

    if (!["cardio", "personal_trainer"].includes(form.type)) {
      setError("Please select a valid add-on type.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Please enter a valid non-negative price.");
      return;
    }

    if (description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingAddOn?._id);
      const url = isEditing
        ? `/api/admin/add-ons/${editingAddOn._id}`
        : "/api/admin/add-ons";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type: form.type,
          price: Number(form.price),
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${isEditing ? "update" : "create"} add-on.`
        );
      }

      setShowModal(false);
      setEditingAddOn(null);
      setForm({ ...EMPTY_FORM });
      setSuccess(
        isEditing
          ? "Add-on updated successfully."
          : "Add-on created successfully."
      );

      await fetchAddOns(false);
    } catch (err) {
      console.error("SAVE ADD-ON ERROR:", err);
      setError(err?.message || "Unable to save add-on.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAddOnStatus(addOn) {
    if (!addOn?._id || busyId) return;

    const confirmed = window.confirm(
      addOn.isActive
        ? `Deactivate "${addOn.name}"? Customers will no longer be able to select it for new purchases.`
        : `Activate "${addOn.name}"?`
    );

    if (!confirmed) return;

    try {
      setBusyId(addOn._id);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/admin/add-ons/${addOn._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !addOn.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update add-on.");
      }

      setSuccess(
        addOn.isActive ? "Add-on deactivated." : "Add-on activated."
      );

      await fetchAddOns(false);
    } catch (err) {
      console.error("TOGGLE ADD-ON ERROR:", err);
      setError(err?.message || "Failed to update add-on.");
    } finally {
      setBusyId("");
    }
  }

  const activeCount = addOns.filter((item) => item.isActive).length;
  const inactiveCount = addOns.length - activeCount;

  const filteredAddOns = addOns.filter((item) => {
    const matchesSearch = [
      item.name,
      item.description,
      TYPE_LABELS[item.type] || item.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && item.isActive) ||
      (filter === "inactive" && !item.isActive);

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,.8)]" />
              Membership configuration
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Add-ons<span className="text-orange-500">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Manage optional services, set prices, and control which
              services members can purchase.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fetchAddOns()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-orange-500/10 transition hover:-translate-y-0.5 hover:bg-orange-400"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add add-on
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && !showModal && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Summary cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total add-ons"
            value={addOns.length}
            detail="All configured services"
            icon={Activity}
            accent="orange"
          />
          <SummaryCard
            title="Active services"
            value={activeCount}
            detail="Available for new purchases"
            icon={CheckCircle2}
            accent="green"
          />
          <SummaryCard
            title="Inactive services"
            value={inactiveCount}
            detail="Currently unavailable"
            icon={ShieldCheck}
            accent="zinc"
          />
        </section>

        {/* List toolbar */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Your services</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {filteredAddOns.length}{" "}
                {filteredAddOns.length === 1 ? "service" : "services"} shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services..."
                  aria-label="Search add-ons"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 sm:w-60"
                />
              </div>

              <div className="relative">
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  aria-label="Filter add-ons"
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 pr-10 text-sm text-zinc-300 outline-none focus:border-orange-500/50 sm:w-40"
                >
                  <option value="all">All services</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-zinc-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-orange-500"
              />
              <p className="text-sm">Loading your services...</p>
            </div>
          ) : error && addOns.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-zinc-200">
                Could not load add-ons
              </p>
              <p className="mt-2 text-sm text-zinc-500">{error}</p>
              <button
                type="button"
                onClick={() => fetchAddOns()}
                className="mt-5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-orange-400"
              >
                Try again
              </button>
            </div>
          ) : filteredAddOns.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] text-orange-400">
                <Dumbbell size={28} />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                {addOns.length === 0
                  ? "No add-ons yet"
                  : "No matching services"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                {addOns.length === 0
                  ? "Create your first optional service, such as cardio or personal training."
                  : "Try a different search or filter to find a service."}
              </p>
              {addOns.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black hover:bg-orange-400"
                >
                  <Plus size={17} />
                  Create first add-on
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 p-4 md:hidden">
                {filteredAddOns.map((addOn) => (
                  <AddOnCard
                    key={addOn._id}
                    addOn={addOn}
                    busy={busyId === addOn._id}
                    onEdit={openEditModal}
                    onToggle={toggleAddOnStatus}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="border-b border-white/[0.07] bg-white/[0.025]">
                    <tr>
                      {["Service", "Type", "Price", "Status", "Actions"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500"
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredAddOns.map((addOn) => (
                      <tr
                        key={addOn._id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <ServiceIcon type={addOn.type} />
                            <div>
                              <p className="font-semibold text-zinc-100">
                                {addOn.name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">
                                {addOn.description || "No description added"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <TypeBadge type={addOn.type} />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-white">
                            ₹{formatNumber(addOn.price)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge active={addOn.isActive} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(addOn)}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/[0.08] hover:text-orange-300"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(busyId)}
                              onClick={() => toggleAddOnStatus(addOn)}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                                addOn.isActive
                                  ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {busyId === addOn._id
                                ? "Saving..."
                                : addOn.isActive
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
            </>
          )}
        </section>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-zinc-600">
          <ShieldCheck size={14} />
          Changes apply to your configured gym services.
        </p>
      </div>

      {/* Create/edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="addon-modal-title"
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.08] bg-[#101010]/95 p-5 backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-black">
                  {editingAddOn ? (
                    <Pencil size={21} />
                  ) : (
                    <Plus size={23} />
                  )}
                </div>
                <div>
                  <h2
                    id="addon-modal-title"
                    className="text-xl font-black"
                  >
                    {editingAddOn ? "Edit add-on" : "Create add-on"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Configure the service and its price.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-xl border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              {error && <Alert type="error" message={error} />}

              <div>
                <label
                  htmlFor="addon-name"
                  className="mb-2 block text-sm font-semibold text-zinc-200"
                >
                  Service name <span className="text-orange-400">*</span>
                </label>
                <input
                  id="addon-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Premium cardio access"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="addon-type"
                  className="mb-2 block text-sm font-semibold text-zinc-200"
                >
                  Service type
                </label>
                <div className="relative">
                  <select
                    id="addon-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="cardio">Cardio</option>
                    <option value="personal_trainer">Personal Trainer</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="addon-price"
                  className="mb-2 block text-sm font-semibold text-zinc-200"
                >
                  Price (₹) <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-orange-400">
                    ₹
                  </span>
                  <input
                    id="addon-price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="500"
                    className={`${inputClass} pl-9`}
                    required
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Enter the price charged for this optional service.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="addon-description"
                    className="text-sm font-semibold text-zinc-200"
                  >
                    Description
                  </label>
                  <span className="text-xs text-zinc-600">
                    {form.description.length}/500
                  </span>
                </div>
                <textarea
                  id="addon-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe what this service includes..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-orange-500/25">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-200">
                    Make this service active
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    Members can select active services for new purchases.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      {editingAddOn ? "Save changes" : "Create add-on"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, value, detail, icon: Icon, accent }) {
  const accents = {
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/15",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    zinc: "bg-white/[0.05] text-zinc-400 border-white/10",
  };

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#101010] p-5 transition hover:border-white/[0.14] sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accents[accent]}`}
        >
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs text-zinc-600">{detail}</p>
    </article>
  );
}

function ServiceIcon({ type }) {
  const Icon = type === "personal_trainer" ? UserRound : Activity;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/[0.08] text-orange-400">
      <Icon size={20} />
    </div>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">
      {type === "personal_trainer" ? (
        <UserRound size={13} className="text-orange-400" />
      ) : (
        <Activity size={13} className="text-orange-400" />
      )}
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active
          ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
          : "border-white/10 bg-white/[0.04] text-zinc-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-zinc-600"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AddOnCard({ addOn, busy, onEdit, onToggle }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ServiceIcon type={addOn.type} />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-zinc-100">{addOn.name}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {TYPE_LABELS[addOn.type] || addOn.type}
            </p>
          </div>
        </div>
        <StatusBadge active={addOn.isActive} />
      </div>

      <p className="mt-4 min-h-10 text-sm leading-5 text-zinc-500">
        {addOn.description || "No description added."}
      </p>

      <div className="mt-4 flex items-end justify-between border-t border-white/[0.07] pt-4">
        <div>
          <p className="text-xs text-zinc-600">Current price</p>
          <p className="mt-1 text-2xl font-black">
            ₹{formatNumber(addOn.price)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(addOn)}
            aria-label={`Edit ${addOn.name}`}
            className="rounded-lg border border-white/10 p-2.5 text-zinc-300 transition hover:border-orange-500/40 hover:text-orange-400"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggle(addOn)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
              addOn.isActive
                ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            {busy
              ? "Saving..."
              : addOn.isActive
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Alert({ type, message, onClose }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/20 bg-red-500/[0.08] text-red-300"
          : "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {isError ? (
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
        )}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}
