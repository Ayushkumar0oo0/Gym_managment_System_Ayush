"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  Dumbbell,
  Salad,
  CreditCard,
  Pencil,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10";

export default function MemberProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/member/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load your profile.");
      }

      const current = data?.user || data?.profile || data?.member || data;

      setProfile(current);
      setForm({
        name: current?.name || "",
        phone: current?.phone || "",
      });
    } catch (err) {
      setError(err?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update your profile.");
      }

      const updated = data?.user || data?.profile || data?.member;

      if (updated) {
        setProfile((current) => ({ ...current, ...updated }));
        setForm({
          name: updated.name ?? form.name,
          phone: updated.phone ?? form.phone,
        });
      } else {
        setProfile((current) => ({
          ...current,
          name: form.name.trim(),
          phone: form.phone.trim(),
        }));
      }

      setEditing(false);
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(err?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-4 w-40 rounded bg-zinc-800" />
          <div className="mt-8 h-40 rounded-3xl bg-zinc-900" />
          <div className="mt-5 h-72 rounded-3xl bg-zinc-900" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-230px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-orange-500/[0.08] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <header className="mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            <UserRound size={14} />
            My Account
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                My <span className="text-orange-500">Profile.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Manage your personal details and access your gym services
                from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#111113] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/30 hover:text-orange-400 sm:self-auto"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Profile summary */}
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-white/10 bg-[#101010] p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-500/[0.07] blur-[70px]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <UserRound size={36} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Member account
              </p>

              <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                {profile?.name || "Gym Member"}
              </h2>

              <p className="mt-2 break-all text-sm text-zinc-400">
                {profile?.email || "Email not available"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck size={13} />
                  {profile?.isActive === false ? "Inactive" : "Account"}
                </span>

                {profile?.role && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold capitalize text-zinc-400">
                    {profile.role}
                  </span>
                )}
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setEditing(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            )}
          </div>
        </section>

        {/* Personal details */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#101010] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-orange-400">
              <UserRound size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black">Personal Information</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Keep your contact details up to date.
              </p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-zinc-300"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-zinc-300"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                    disabled
                    readOnly
                  />
                  <p className="mt-2 text-xs text-zinc-600">
                    Email cannot be changed here.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-semibold text-zinc-300"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your phone number"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: profile?.name || "",
                      phone: profile?.phone || "",
                    });
                    setEditing(false);
                    setError("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
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
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProfileDetail
                icon={<UserRound size={18} />}
                label="Full name"
                value={profile?.name || "Not provided"}
              />

              <ProfileDetail
                icon={<Mail size={18} />}
                label="Email address"
                value={profile?.email || "Not provided"}
              />

              <ProfileDetail
                icon={<Phone size={18} />}
                label="Phone number"
                value={profile?.phone || "Not provided"}
              />

              <ProfileDetail
                icon={<CalendarDays size={18} />}
                label="Member since"
                value={formatDate(profile?.createdAt)}
              />
            </div>
          )}
        </section>

        {/* Member shortcuts */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-black">Your Gym Services</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Jump directly to the information you need.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              href="/member/membership"
              icon={<Dumbbell size={21} />}
              title="My Membership"
              description="View your plan and membership details."
            />

            <ServiceCard
              href="/member/payments"
              icon={<CreditCard size={21} />}
              title="Payments"
              description="Check your payment history and status."
            />

            <ServiceCard
              href="/member/diet"
              icon={<Salad size={21} />}
              title="My Diet Plan"
              description="Follow your meals and nutrition targets."
            />
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-zinc-600">
          Keep your account details accurate so the gym can contact you about
          important membership updates.
        </p>
      </div>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProfileDetail({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/[0.08] text-orange-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function ServiceCard({ href, icon, title, description }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.08] bg-[#101010] p-5 transition hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-[#14110e]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/[0.08] text-orange-400 transition group-hover:bg-orange-500/15">
          {icon}
        </div>

        <ArrowRight
          size={17}
          className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-orange-400"
        />
      </div>

      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </Link>
  );
}