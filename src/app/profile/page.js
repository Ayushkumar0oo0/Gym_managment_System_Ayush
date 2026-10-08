"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/member/profile",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load profile."
        );
      }

      setUser(data.user);

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
      });
    } catch (error) {
      console.error(
        "Load profile error:",
        error
      );

      setError(
        error.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/member/profile",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load profile."
          );
        }

        if (cancelled) return;

        setUser(data.user);

        setForm({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        });
      } catch (error) {
        if (!cancelled) {
          setError(
            error.message ||
              "Failed to load profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/member/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      setUser(data.user);

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
      });

      setSuccess(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      setError(
        error.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-7 text-white sm:px-6 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <User
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Member Account
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                My{" "}
                <span className="text-orange-500">
                  Profile
                </span>
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Manage your personal account
                information and membership details.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfile}
              disabled={saving}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <XCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
                Error
              </p>

              <p className="mt-1 text-sm text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Updated
              </p>

              <p className="mt-1 text-sm text-emerald-300/80">
                {success}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* Profile form */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
            <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.06] to-transparent p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <User size={21} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                    Personal Information
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Account Details
                  </h2>

                  <p className="mt-1 text-xs text-zinc-700">
                    Keep your contact information
                    up to date.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-7"
            >
              <div className="space-y-5">
                <ProfileInput
                  id="name"
                  name="name"
                  label="Full Name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  icon={<User size={16} />}
                  required
                  minLength={2}
                  maxLength={100}
                />

                <ProfileInput
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  icon={<Mail size={16} />}
                  required
                />

                <ProfileInput
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10 digit phone number"
                  icon={<Phone size={16} />}
                  required
                  minLength={10}
                  maxLength={10}
                />
              </div>

              <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] leading-5 text-zinc-800">
                  Your account information is
                  protected and only used for gym
                  services.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Account */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">
                    Account
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Account Status
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <AccountItem
                  label="Role"
                  value={
                    user?.role || "Member"
                  }
                  icon={<BadgeCheck size={14} />}
                />

                <AccountItem
                  label="Account Status"
                  icon={
                    user?.isActive ? (
                      <CheckCircle2
                        size={14}
                      />
                    ) : (
                      <XCircle size={14} />
                    )
                  }
                  custom={
                    <StatusBadge
                      active={
                        Boolean(
                          user?.isActive
                        )
                      }
                      activeText="Active"
                      inactiveText="Inactive"
                    />
                  }
                />

                <AccountItem
                  label="Registration Fee"
                  icon={
                    <Wallet size={14} />
                  }
                  custom={
                    <StatusBadge
                      active={Boolean(
                        user?.registrationFeePaid
                      )}
                      activeText="Paid"
                      inactiveText="Not Paid"
                      warning
                    />
                  }
                />

                {user?.registrationFeePaidAt && (
                  <AccountItem
                    label="Registration Paid"
                    value={formatDate(
                      user.registrationFeePaidAt
                    )}
                  />
                )}
              </div>
            </section>

            {/* Quick Links */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                  <ArrowRight size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                    Navigation
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Quick Links
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <QuickLink
                  href="/member/membership"
                  icon={<BadgeCheck size={15} />}
                  label="My Membership"
                />

                <QuickLink
                  href="/member/payments"
                  icon={<CreditCard size={15} />}
                  label="Payment History"
                />

                <QuickLink
                  href="/member/promotions"
                  icon={<Wallet size={15} />}
                  label="View Offers"
                />

                <QuickLink
                  href="/member"
                  icon={<ArrowLeft size={15} />}
                  label="Dashboard"
                />
              </div>
            </section>

            {/* Security */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                  <Lock size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                    Security
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Account Security
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-zinc-700">
                Need to reset your password?
                Use the secure account recovery
                flow.
              </p>

              <Link
                href="/forgot-password"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-4 py-3 text-xs font-black text-zinc-500 transition hover:border-orange-500/20 hover:text-orange-400"
              >
                <Lock size={14} />
                Reset Password
              </Link>
            </section>
          </aside>
        </div>

        <div className="py-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-800">
            Gym Management System
          </p>
        </div>
      </div>
    </main>
  );
}

function ProfileInput({
  id,
  name,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  ...props
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-600"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700">
          {icon}
        </div>

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-black py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-800 focus:border-orange-500"
          {...props}
        />
      </div>
    </div>
  );
}

function AccountItem({
  label,
  value,
  icon,
  custom,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-zinc-700">
            {icon}
          </span>
        )}

        <span className="text-xs text-zinc-700">
          {label}
        </span>
      </div>

      {custom || (
        <span className="text-sm font-bold capitalize text-zinc-400">
          {value}
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
  warning = false,
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : warning
          ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function QuickLink({
  href,
  icon,
  label,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-transparent bg-black/30 px-3 py-3 text-sm text-zinc-500 transition hover:border-orange-500/15 hover:bg-orange-500/[0.04] hover:text-white"
    >
      <span className="flex items-center gap-3">
        <span className="text-zinc-700 transition group-hover:text-orange-400">
          {icon}
        </span>

        {label}
      </span>

      <ArrowRight
        size={14}
        className="text-zinc-800 transition group-hover:translate-x-0.5 group-hover:text-orange-400"
      />
    </Link>
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-28 rounded bg-zinc-900" />

        <div className="mt-8 h-12 w-64 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="h-[600px] rounded-3xl bg-zinc-950" />

          <div className="space-y-6">
            <div className="h-64 rounded-3xl bg-zinc-950" />
            <div className="h-64 rounded-3xl bg-zinc-950" />
          </div>
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <Loader2
            size={18}
            className="animate-spin text-orange-500"
          />

          <span className="text-sm font-bold text-zinc-500">
            Loading profile...
          </span>
        </div>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]" />
    </div>
  );
}