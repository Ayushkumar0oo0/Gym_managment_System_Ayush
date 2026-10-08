"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  Edit3,
  FileText,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

export default function MemberProfilePage() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
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

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load profile."
        );
      }

      setUser(data.user);

      setForm({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
      });
    } catch (error) {
      console.error(
        "MEMBER PROFILE PAGE ERROR:",
        error
      );

      setError(
        error?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      setUser(data.user);

      setForm({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
      });

      setEditing(false);
      setSuccess(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (error) {
      console.error(
        "MEMBER PROFILE UPDATE ERROR:",
        error
      );

      setError(
        error?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
    setSuccess("");

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !user) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <AmbientGlow />

        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-500/20 bg-zinc-950 p-7 text-center shadow-2xl shadow-black/30 sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle size={26} />
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Unable to load profile
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              Try Again
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <section className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-orange-400"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                <User size={12} />
                Member Account
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                My{" "}
                <span className="text-orange-500">
                  Profile
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Manage your personal information and
                keep your gym account up to date.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-xs text-zinc-600 sm:flex">
              <ShieldCheck
                size={15}
                className="text-orange-400"
              />
              Secure Member Account
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && user && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            <XCircle
              size={17}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-400">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.08] via-zinc-950 to-zinc-950 shadow-2xl shadow-black/30">
          <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-orange-500/10 blur-[100px]" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-black text-black shadow-xl shadow-orange-500/20 sm:h-24 sm:w-24 sm:text-4xl">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "M"}

                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-zinc-950 bg-emerald-500 text-black">
                  <Check size={13} strokeWidth={3} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black sm:text-3xl">
                    {user?.name || "Member"}
                  </h2>

                  {user?.isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 size={10} />
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-zinc-600">
                  Gym Member
                </p>

                <p className="mt-2 text-xs text-zinc-700">
                  Member since{" "}
                  <span className="text-zinc-500">
                    {formatDate(
                      user?.createdAt
                    )}
                  </span>
                </p>
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 md:w-auto"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </section>

        {/* Profile Details */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20">
          <div className="border-b border-white/10 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <User size={17} />
              </div>

              <div>
                <h2 className="font-black">
                  Personal Information
                </h2>

                <p className="mt-1 text-xs text-zinc-700">
                  Your basic account details.
                </p>
              </div>
            </div>
          </div>

          {editing ? (
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <ProfileInput
                  id="name"
                  name="name"
                  label="Full Name"
                  icon={<User size={16} />}
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />

                <ProfileInput
                  id="email"
                  name="email"
                  label="Email Address"
                  icon={<Mail size={16} />}
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  autoComplete="email"
                />

                <ProfileInput
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  icon={<Phone size={16} />}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  autoComplete="tel"
                  helper="Enter exactly 10 digits."
                />
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
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
          ) : (
            <div className="grid md:grid-cols-2">
              <InfoCard
                icon={<User size={17} />}
                label="Full Name"
                value={user?.name || "—"}
              />

              <InfoCard
                icon={<Mail size={17} />}
                label="Email Address"
                value={user?.email || "—"}
              />

              <InfoCard
                icon={<Phone size={17} />}
                label="Phone Number"
                value={user?.phone || "—"}
              />

              <div className="border-b border-white/10 p-6 md:border-b-0 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Account Status
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      user?.isActive
                        ? "bg-emerald-400 shadow-lg shadow-emerald-400/30"
                        : "bg-red-400"
                    }`}
                  />

                  <span
                    className={`text-sm font-bold ${
                      user?.isActive
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {user?.isActive
                      ? "Active Account"
                      : "Inactive Account"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Account Information */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20">
          <div className="border-b border-white/10 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <ShieldCheck size={17} />
              </div>

              <div>
                <h2 className="font-black">
                  Account Information
                </h2>

                <p className="mt-1 text-xs text-zinc-700">
                  Important details about your gym
                  account.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {/* Registration */}
            <div className="border-b border-white/10 p-6 md:border-r sm:p-8">
              <div className="flex items-center gap-2">
                <Wallet
                  size={15}
                  className="text-orange-400"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Registration Fee
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    user?.registrationFeePaid
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />

                <span
                  className={`text-sm font-bold ${
                    user?.registrationFeePaid
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {user?.registrationFeePaid
                    ? "Paid"
                    : "Not Paid"}
                </span>
              </div>

              {user?.registrationFeePaidAt && (
                <p className="mt-2 text-xs text-zinc-700">
                  Paid on{" "}
                  <span className="text-zinc-500">
                    {formatDate(
                      user.registrationFeePaidAt
                    )}
                  </span>
                </p>
              )}
            </div>

            {/* Joined */}
            <div className="border-b border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={15}
                  className="text-orange-400"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Member Since
                </p>
              </div>

              <p className="mt-4 text-base font-black text-zinc-300">
                {formatDate(user?.createdAt)}
              </p>
            </div>

            {/* Account Type */}
            <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r sm:p-8">
              <div className="flex items-center gap-2">
                <BadgeCheck
                  size={15}
                  className="text-orange-400"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Account Type
                </p>
              </div>

              <p className="mt-4 text-base font-black capitalize text-zinc-300">
                {user?.role || "Member"}
              </p>
            </div>

            {/* Password */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <KeyRound
                  size={15}
                  className="text-orange-400"
                />

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Password
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Keep your password secure and never
                share it with anyone.
              </p>

              <Link
                href="/forgot-password"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-orange-400 transition hover:text-orange-300"
              >
                Reset Password
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/member/membership/status"
            icon={<Dumbbell size={18} />}
            title="Membership"
            description="View your current membership."
          />

          <QuickLink
            href="/member/payments"
            icon={<FileText size={18} />}
            title="Payments"
            description="View your payment history."
          />

          <QuickLink
            href="/member/promotions"
            icon={<Wallet size={18} />}
            title="Offers"
            description="Check available gym offers."
          />
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 pb-5 text-center text-[11px] text-zinc-800">
          <ShieldCheck size={13} />
          Your profile information is private and
          protected.
        </div>
      </div>
    </main>
  );
}

function ProfileInput({
  id,
  name,
  label,
  icon,
  helper,
  ...props
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600"
      >
        <span className="text-orange-400">
          {icon}
        </span>
        {label}
      </label>

      <input
        id={id}
        name={name}
        {...props}
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-zinc-800 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
      />

      {helper && (
        <p className="mt-2 text-xs text-zinc-800">
          {helper}
        </p>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="border-b border-white/10 p-6 md:border-r sm:p-8">
      <div className="flex items-center gap-2">
        <span className="text-orange-400">
          {icon}
        </span>

        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
          {label}
        </p>
      </div>

      <p className="mt-3 break-all text-base font-bold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-5 transition hover:-translate-y-0.5 hover:border-orange-500/20"
    >
      <div className="absolute right-[-30px] top-[-30px] h-20 w-20 rounded-full bg-orange-500/5 blur-2xl transition group-hover:bg-orange-500/10" />

      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
          {icon}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-black">
            {title}
          </p>

          <ArrowRight
            size={15}
            className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400"
          />
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-700">
          {description}
        </p>
      </div>
    </Link>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-280px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[150px]" />

      <div className="absolute bottom-[-220px] right-[-180px] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-36 rounded bg-zinc-900" />

        <div className="mt-7 h-12 w-72 rounded-xl bg-zinc-900" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-zinc-950" />

        <div className="mt-8 h-36 rounded-3xl bg-zinc-950" />

        <div className="mt-6 h-96 rounded-3xl bg-zinc-950" />

        <div className="mt-6 h-72 rounded-3xl bg-zinc-950" />
      </div>
    </main>
  );
}