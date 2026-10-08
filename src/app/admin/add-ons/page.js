"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AddOnsPage() {
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // ==========================================
  // FETCH
  // ==========================================

  async function fetchAddOns() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/add-ons", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch add-ons."
        );
      }

      setAddOns(
        Array.isArray(data?.addOns) ? data.addOns : []
      );
    } catch (error) {
      console.error("FETCH ADD-ONS ERROR:", error);

      setError(
        error?.message || "Failed to load add-ons."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAddOns();
  }, []);

  // ==========================================
  // MODAL
  // ==========================================

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
        addOn?.price !== undefined &&
        addOn?.price !== null
          ? String(addOn.price)
          : "",
      isActive:
        typeof addOn?.isActive === "boolean"
          ? addOn.isActive
          : true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAddOn(null);
    setForm({ ...EMPTY_FORM });
  }

  // ==========================================
  // FORM CHANGE
  // ==========================================

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  // ==========================================
  // CREATE
  // ==========================================

  async function createAddOn() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/add-ons",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
            price: Number(form.price),
            isActive: form.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create add-on."
        );
      }

      setSuccess("Add-on created successfully.");

      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingAddOn(null);

      await fetchAddOns();
    } catch (error) {
      console.error(
        "CREATE ADD-ON ERROR:",
        error
      );

      setError(
        error?.message ||
          "Failed to create add-on."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // UPDATE
  // ==========================================

  async function updateAddOn() {
    if (!editingAddOn?._id) {
      setError("Invalid add-on selected.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/add-ons/${editingAddOn._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
            price: Number(form.price),
            isActive: form.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update add-on."
        );
      }

      setSuccess("Add-on updated successfully.");

      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingAddOn(null);

      await fetchAddOns();
    } catch (error) {
      console.error(
        "UPDATE ADD-ON ERROR:",
        error
      );

      setError(
        error?.message ||
          "Failed to update add-on."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedDescription =
      form.description.trim();

    if (!trimmedName) {
      setError("Add-on name is required.");
      return;
    }

    if (
      !["cardio", "personal_trainer"].includes(
        form.type
      )
    ) {
      setError(
        "Please select a valid add-on type."
      );
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError(
        "Please enter a valid non-negative price."
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Description cannot exceed 500 characters."
      );
      return;
    }

    setForm((current) => ({
      ...current,
      name: trimmedName,
      description: trimmedDescription,
    }));

    if (editingAddOn) {
      await updateAddOn();
    } else {
      await createAddOn();
    }
  }

  // ==========================================
  // TOGGLE
  // ==========================================

  async function toggleAddOnStatus(addOn) {
    if (!addOn?._id) {
      return;
    }

    const confirmed = window.confirm(
      addOn.isActive
        ? `Deactivate "${addOn.name}"? Customers will no longer be able to select it for new purchases.`
        : `Activate "${addOn.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/add-ons/${addOn._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !addOn.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update add-on."
        );
      }

      setSuccess(
        addOn.isActive
          ? "Add-on deactivated."
          : "Add-on activated."
      );

      await fetchAddOns();
    } catch (error) {
      console.error(
        "TOGGLE ADD-ON ERROR:",
        error
      );

      setError(
        error?.message ||
          "Failed to update add-on."
      );
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  const activeCount = useMemo(
    () =>
      addOns.filter(
        (item) => item?.isActive
      ).length,
    [addOns]
  );

  const inactiveCount = useMemo(
    () =>
      addOns.filter(
        (item) => !item?.isActive
      ).length,
    [addOns]
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Membership Configuration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Add-ons
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage optional services that
              customers can add to their gym
              membership.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchAddOns}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              + Add Add-on
            </button>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Add-ons"
            value={addOns.length}
          />

          <SummaryCard
            title="Active"
            value={activeCount}
          />

          <SummaryCard
            title="Inactive"
            value={inactiveCount}
          />
        </div>

        {/* CONTENT */}

        {loading ? (
          <LoadingState />
        ) : addOns.length === 0 ? (
          <EmptyState onAdd={openCreateModal} />
        ) : (
          <>
            {/* MOBILE */}

            <div className="grid gap-4 md:hidden">
              {addOns.map((addOn) => (
                <AddOnCard
                  key={addOn._id}
                  addOn={addOn}
                  onEdit={openEditModal}
                  onToggle={toggleAddOnStatus}
                />
              ))}
            </div>

            {/* DESKTOP */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Add-on
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Price
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {addOns.map((addOn) => (
                      <tr
                        key={addOn._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-5">
                          <p className="font-semibold text-slate-900">
                            {addOn.name}
                          </p>

                          {addOn.description && (
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                              {addOn.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <TypeBadge
                            type={addOn.type}
                          />
                        </td>

                        <td className="px-5 py-5">
                          <span className="font-bold text-slate-900">
                            ₹
                            {formatNumber(
                              addOn.price
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            active={addOn.isActive}
                          />
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(addOn)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleAddOnStatus(
                                  addOn
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                addOn.isActive
                                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                                  : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {addOn.isActive
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {editingAddOn
                    ? "Edit Add-on"
                    : "Create Add-on"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set the optional service and
                  its current price.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Example: Cardio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  required
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service Type
                </label>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="cardio">
                    Cardio
                  </option>

                  <option value="personal_trainer">
                    Personal Trainer
                  </option>
                </select>
              </div>

              {/* PRICE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Price
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="500"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This is the add-on price used
                  when calculating a new purchase.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain what this add-on provides."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/500
                </p>
              </div>

              {/* ACTIVE */}

              <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Add-on is active
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Active add-ons can be selected
                    by customers during purchase.
                  </span>
                </span>
              </label>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingAddOn
                    ? "Save Changes"
                    : "Create Add-on"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// ==========================================
// MOBILE CARD
// ==========================================

function AddOnCard({
  addOn,
  onEdit,
  onToggle,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {addOn.name}
          </h3>

          <div className="mt-2">
            <TypeBadge type={addOn.type} />
          </div>
        </div>

        <StatusBadge active={addOn.isActive} />
      </div>

      {addOn.description && (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {addOn.description}
        </p>
      )}

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Current price
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          ₹{formatNumber(addOn.price)}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(addOn)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onToggle(addOn)}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            addOn.isActive
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {addOn.isActive
            ? "Deactivate"
            : "Activate"}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// SUMMARY
// ==========================================

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

// ==========================================
// BADGES
// ==========================================

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// ==========================================
// EMPTY
// ==========================================

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
        +
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-900">
        No add-ons yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Create Cardio or Personal Trainer
        as an optional service for members.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Create Add-on
      </button>
    </div>
  );
}

// ==========================================
// LOADING
// ==========================================

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

// ==========================================
// FORMAT
// ==========================================

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}