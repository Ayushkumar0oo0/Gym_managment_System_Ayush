"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  X,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  Users,
  AlertTriangle,
} from "lucide-react";

const initialCreateForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const initialEditForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState(initialCreateForm);

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/admin-accounts",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load admin accounts."
        );
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error("LOAD ADMINS ERROR:", err);

      setError(
        err.message || "Failed to load admin accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCreateChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleEditChange(event) {
    const { name, value, type, checked } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/admin-accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create admin account."
        );
      }

      setSuccess(
        "Admin account created successfully."
      );

      setForm(initialCreateForm);
      setShowCreateForm(false);
      setShowPassword(false);

      await loadAdmins();
    } catch (err) {
      console.error("CREATE ADMIN ERROR:", err);

      setError(
        err.message ||
          "Failed to create admin account."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditAdmin(admin) {
    setError("");
    setSuccess("");

    setEditingAdmin(admin);

    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      isActive: admin.isActive,
    });
  }

  function closeEdit() {
    if (saving) return;

    setEditingAdmin(null);
    setEditForm(initialEditForm);
  }

  async function handleUpdateAdmin(event) {
    event.preventDefault();

    if (!editingAdmin) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        isActive: editForm.isActive,
      };

      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const response = await fetch(
        `/api/admin/admin-accounts/${editingAdmin._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update admin account."
        );
      }

      setSuccess(
        "Admin account updated successfully."
      );

      closeEdit();

      await loadAdmins();
    } catch (err) {
      console.error("UPDATE ADMIN ERROR:", err);

      setError(
        err.message ||
          "Failed to update admin account."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  const activeAdmins = admins.filter(
    (admin) => admin.isActive
  ).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
              <ShieldCheck className="h-4 w-4" />
              Gym Administration
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Admin Accounts
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Manage trusted administrators who can access
              and operate the gym management system.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(
                (previous) => !previous
              );
              setError("");
              setSuccess("");
            }}
            disabled={admins.length >= 3}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showCreateForm ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {showCreateForm
              ? "Close Form"
              : "Add Admin"}
          </button>
        </div>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            label="Admin Accounts"
            value={`${admins.length} / 3`}
            icon={Users}
            iconClass="text-orange-500"
            bgClass="bg-orange-500/10"
          />

          <StatCard
            label="Active Admins"
            value={activeAdmins}
            icon={CheckCircle2}
            iconClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />

          <div className="col-span-2 rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 sm:p-5 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Access
                </p>

                <p className="mt-1 text-sm font-black">
                  Protected Admin Panel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* CREATE FORM */}
        {showCreateForm && admins.length < 3 && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-orange-500/20 bg-zinc-950">
            <div className="border-b border-white/[0.07] bg-orange-500/[0.03] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <UserPlus className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-black">
                    Create Admin Account
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Add a trusted gym partner or administrator.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCreateAdmin}
              className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6"
            >
              <Field label="Full Name" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleCreateChange}
                  placeholder="Admin name"
                  maxLength={100}
                  required
                  className="input"
                />
              </Field>

              <Field label="Email" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleCreateChange}
                  placeholder="admin@example.com"
                  maxLength={150}
                  required
                  className="input"
                />
              </Field>

              <Field label="Phone" required>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleCreateChange}
                  placeholder="10 digit phone number"
                  maxLength={10}
                  inputMode="numeric"
                  required
                  className="input"
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={form.password}
                    onChange={handleCreateChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    maxLength={128}
                    required
                    className="input pr-20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 hover:text-orange-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>

              <div className="border-t border-white/[0.07] pt-5 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADMIN LIST */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-black">
                Gym Administrators
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                People with administrative access.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-black px-3 py-1.5 text-xs font-bold text-zinc-400">
              {admins.length} / 3
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />
                <p className="mt-3 text-sm text-zinc-600">
                  Loading admin accounts...
                </p>
              </div>
            </div>
          ) : admins.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <h3 className="mt-5 font-black">
                No admin accounts found
              </h3>

              <p className="mt-2 text-sm text-zinc-600">
                Create the first administrator account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {admins.map((admin, index) => (
                <div
                  key={admin._id}
                  className="p-5 transition hover:bg-white/[0.015] sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-lg font-black text-orange-500">
                        {admin.name
                          ?.charAt(0)
                          ?.toUpperCase() || "A"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-white">
                            {admin.name}
                          </h3>

                          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-400">
                            Admin {index + 1}
                          </span>

                          {admin.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-zinc-700" />
                            {admin.email}
                          </span>

                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-zinc-700" />
                            {admin.phone}
                          </span>
                        </div>

                        <p className="mt-3 flex items-center gap-2 text-xs text-zinc-700">
                          <Calendar className="h-3.5 w-3.5" />
                          Created {formatDate(admin.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openEditAdmin(admin)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-5 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-400"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0b0b] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#0b0b0b]/95 px-5 py-5 backdrop-blur sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Pencil className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-black">
                    Edit Admin
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Update {editingAdmin.name}'s account.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateAdmin}
              className="space-y-5 p-5 sm:p-6"
            >
              <Field label="Full Name" required>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  maxLength={100}
                  required
                  className="input"
                />
              </Field>

              <Field label="Email" required>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  maxLength={150}
                  required
                  className="input"
                />
              </Field>

              <Field label="Phone" required>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  maxLength={10}
                  inputMode="numeric"
                  required
                  className="input"
                />
              </Field>

              <Field label="New Password">
                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Leave empty to keep current password"
                  minLength={8}
                  maxLength={128}
                  className="input"
                />

                <p className="mt-2 text-xs text-zinc-700">
                  Leave this empty if you do not want to
                  change the password.
                </p>
              </Field>

              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-white/[0.07] bg-black/40 p-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={editForm.isActive}
                  onChange={handleEditChange}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <div>
                  <p className="text-sm font-bold">
                    Active account
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Inactive admins cannot log into the admin
                    panel.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
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