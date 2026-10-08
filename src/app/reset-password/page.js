"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password.length > 128) {
      setError("Password is too long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to reset your password."
        );
        return;
      }

      setMessage(
        data.message ||
          "Password reset successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error(
        "RESET PASSWORD REQUEST ERROR:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-10 text-white">
      {/* Ambient gym glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[150px]" />

        <div className="absolute bottom-[-250px] right-[-150px] h-[450px] w-[450px] rounded-full bg-orange-500/[0.035] blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/10">
            <LockKeyhole size={24} strokeWidth={2.5} />
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
            Gym Account Security
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-black tracking-tight">
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Create a new secure password for
              your gym account.
            </p>
          </div>

          {!token ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
              <div className="flex items-start gap-3">
                <XCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <p className="text-sm font-bold text-red-300">
                    Invalid reset link
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-400/60">
                    This password reset link is
                    invalid or missing.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* New password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold text-zinc-400"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/60 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-800 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-700 transition hover:text-orange-400 disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-bold text-zinc-400"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/60 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-800 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-700 transition hover:text-orange-400 disabled:opacity-50"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Requirement */}
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/40 px-3 py-2.5">
                <ShieldCheck
                  size={14}
                  className="text-orange-500"
                />

                <p className="text-[10px] text-zinc-700">
                  Password must contain at least
                  8 characters.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3.5">
                  <div className="flex items-start gap-2.5">
                    <XCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <p className="text-xs leading-5 text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-emerald-400"
                    />

                    <p className="text-xs leading-5 text-emerald-300">
                      {message}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-black text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </button>
            </form>
          )}

          {/* Back */}
          <div className="mt-7 border-t border-white/5 pt-5 text-center">
            <button
              type="button"
              onClick={() =>
                router.push("/login")
              }
              className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 transition hover:text-orange-400"
            >
              <ArrowLeft size={13} />
              Back to Login
            </button>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-800">
          <ShieldCheck size={11} />
          Secure account recovery
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-orange-500" />

            <p className="text-xs font-bold text-zinc-600">
              Loading password reset...
            </p>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}