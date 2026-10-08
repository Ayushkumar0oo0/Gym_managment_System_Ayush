"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to process your request."
        );
      }

      setMessage(
        data?.message ||
          "If an account exists with this email, a password reset link has been sent."
      );

      setEmail("");
    } catch (err) {
      setError(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Back */}
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>

          {/* Card */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/15 via-transparent to-transparent p-7 sm:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20">
                <Mail size={27} />
              </div>

              <h1 className="text-3xl font-black tracking-tight">
                Forgot Password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Enter the email address connected to your gym account.
                We&apos;ll send you a secure link to reset your password.
              </p>
            </div>

            {/* Form */}
            <div className="p-7 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-zinc-200"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium leading-5 text-red-300">
                    {error}
                  </div>
                )}

                {/* Success */}
                {message && (
                  <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium leading-5 text-emerald-300">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending Reset Link..." : "Send Reset Link"}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-7 flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-orange-400"
                />

                <p className="text-xs leading-5 text-zinc-500">
                  For security, we won&apos;t reveal whether an email address
                  is registered with the gym.
                </p>
              </div>

              {/* Login */}
              <p className="mt-7 text-center text-sm text-zinc-500">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-bold text-orange-400 transition hover:text-orange-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-600">
            Your password reset link will expire for security reasons.
          </p>
        </div>
      </div>
    </main>
  );
}