"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        throw new Error("Unable to get session");
      }

      const session = await sessionResponse.json();
      const role = session?.user?.role;

      if (role === "admin") {
        router.replace("/admin");
        router.refresh();
        return;
      }

      if (role === "member") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setError("Your account role is not configured correctly.");
      setLoading(false);
    } catch (error) {
      console.error("LOGIN PAGE ERROR:", error);

      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

        <div className="absolute bottom-[-180px] right-[-100px] h-[400px] w-[400px] rounded-full bg-orange-600/5 blur-[120px]" />

        <div className="absolute left-[-150px] top-1/2 h-[300px] w-[300px] rounded-full bg-orange-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-black shadow-lg shadow-orange-500/20 transition group-hover:bg-orange-400">
            <Dumbbell size={21} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-sm font-black tracking-[0.2em]">
              GYM
            </p>

            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-orange-400">
              Fitness Club
            </p>
          </div>
        </Link>

        <Link
          href="/register"
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-white"
        >
          Join Now
        </Link>
      </header>

      {/* Main */}
      <section className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.12)]">
              <Dumbbell size={30} strokeWidth={2.2} />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
              Member Access
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Welcome Back
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Sign in to manage your membership, payments and
              gym account.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="mb-7 h-1 w-16 rounded-full bg-orange-500" />

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2.5 block text-sm font-semibold text-zinc-200"
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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:bg-orange-500/[0.03] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-zinc-200"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-zinc-500 transition hover:text-orange-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60 focus:bg-orange-500/[0.03] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login to Account
                    <ArrowRight
                      size={19}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                Don't have a gym account?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-orange-400 transition hover:text-orange-300"
              >
                Create your account
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Security */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
            <ShieldCheck size={14} />
            <span>Secure member authentication</span>
          </div>
        </div>
      </section>
    </main>
  );
}