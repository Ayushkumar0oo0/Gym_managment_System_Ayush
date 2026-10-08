"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  HeartPulse,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";

function formatTime(value) {
  if (!value) return "";

  const [hours, minutes] = String(value).split(":");
  const hour = Number(hours);

  if (Number.isNaN(hour)) return value;

  return `${hour % 12 || 12}:${minutes || "00"} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

function formatPrice(value) {
  if (value === undefined || value === null || value === "") return null;

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getDuration(plan) {
  if (!plan?.durationInDays) return "";

  const days = Number(plan.durationInDays);

  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} Year${years > 1 ? "s" : ""}`;
  }

  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }

  return `${days} Days`;
}

function getFeatureLabel(feature) {
  const labels = {
    gym: "Full gym access",
    cardio: "Cardio access",
    personalTrainer: "Personal trainer",
    pt: "Personal trainer",
  };

  return labels[feature] || String(feature);
}

function InstagramIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle
        cx="17.5"
        cy="6.5"
        r="0.8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function FacebookIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.66.34-1 1-1Z" />
    </svg>
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [plans, setPlans] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      setLoading(true);
      setError("");

      const responses = await Promise.all([
        fetch("/api/public/gym-settings", { cache: "no-store" }),
        fetch("/api/public/gym-announcements", { cache: "no-store" }),
        fetch("/api/public/membership-options", { cache: "no-store" }),
        fetch("/api/public/promotions", { cache: "no-store" }),
      ]);

      const [
        settingsResponse,
        announcementsResponse,
        membershipResponse,
        promotionsResponse,
      ] = responses;

      const [
        settingsData,
        announcementsData,
        membershipData,
        promotionsData,
      ] = await Promise.all(responses.map((response) => response.json()));

      if (!settingsResponse.ok) {
        throw new Error(
          settingsData.message || "Failed to load gym information"
        );
      }

      setSettings(settingsData.settings || null);

      setAnnouncements(
        announcementsResponse.ok
          ? announcementsData.announcements || []
          : []
      );

      setPlans(
        membershipResponse.ok ? membershipData.plans || [] : []
      );

      setPromotions(
        promotionsResponse.ok
          ? (promotionsData.promotions || []).filter(
              (promotion) =>
                promotion.isActive !== false &&
                promotion.type === "membership"
            )
          : []
      );
    } catch (err) {
      console.error("LOAD HOME DATA ERROR:", err);
      setError("Unable to load gym information.");
    } finally {
      setLoading(false);
    }
  }

  const phoneNumber =
    settings?.phoneNumbers?.find((item) => item?.number)?.number ||
    settings?.phone ||
    "";

  const cleanPhone = String(phoneNumber).replace(/[^\d+]/g, "");

  const whatsappNumber = String(
    settings?.whatsappNumber || cleanPhone || ""
  ).replace(/[^\d]/g, "");

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "";

  const locationText =
    settings?.location ||
    [
      settings?.address,
      settings?.city,
      settings?.state,
      settings?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const timings = settings?.timings || {
    morning: { open: "06:00", close: "10:00" },
    evening: { open: "16:00", close: "21:00" },
    sundayClosed: true,
  };

  const navItems = useMemo(
    () => [
      ["Home", "#home"],
      ["Membership", "#plans"],
      ...(promotions.length ? [["Offers", "#offers"]] : []),
      ["Facilities", "#facilities"],
      ["Hours", "#hours"],
      ["Contact", "#contact"],
    ],
    [promotions.length]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-[0_0_60px_rgba(249,115,22,.25)]">
            <Dumbbell size={28} />
          </div>

          <p className="mt-5 font-semibold text-zinc-400">
            Loading your gym...
          </p>

          <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-orange-500" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-950 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <ShieldCheck size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Gym information unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Please try again later.
          </p>

          <button
            type="button"
            onClick={loadHomeData}
            className="mt-6 rounded-xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/75 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-[76px] items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.gymName || "Gym"}
                  className="h-11 w-11 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-black shadow-[0_0_35px_rgba(249,115,22,.25)]">
                  <Dumbbell size={22} />
                </div>
              )}

              <div>
                <div className="max-w-[190px] truncate font-black tracking-tight">
                  {settings.gymName}
                </div>

                {settings.tagline && (
                  <div className="hidden max-w-[220px] truncate text-xs text-zinc-500 sm:block">
                    {settings.tagline}
                  </div>
                )}
              </div>
            </Link>

            <div className="hidden items-center gap-7 lg:flex">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 hover:text-white"
              >
                Join Now
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] sm:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-white/[0.07] py-4 sm:hidden">
              <div className="grid gap-1">
                {navItems.map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  >
                    {label}
                  </a>
                ))}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
                  >
                    Join Now
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="border-b border-orange-500/20 bg-orange-500/[0.035]">
          <div className="mx-auto max-w-7xl px-5 py-3 sm:px-8">
            <div className="flex flex-wrap gap-2">
              {announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement._id}
                  className="flex flex-1 items-center gap-3 rounded-xl border border-orange-500/10 bg-orange-500/[0.035] px-4 py-3"
                >
                  <Sparkles
                    size={16}
                    className="shrink-0 text-orange-400"
                  />

                  <div>
                    <p className="text-sm font-bold text-orange-300">
                      {announcement.title}
                    </p>

                    {announcement.message && (
                      <p className="text-xs text-zinc-500">
                        {announcement.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HERO */}
      <section
        id="home"
        className="relative isolate overflow-hidden border-b border-white/[0.06]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-orange-500/[0.14] blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/[0.08] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                Now accepting members
              </div>

              <h1 className="max-w-5xl text-[3.7rem] font-black leading-[0.88] tracking-[-0.06em] sm:text-6xl lg:text-[6.6rem]">
                BUILD
                <span className="block text-orange-500">
                  YOUR BEST
                </span>
                SELF.
              </h1>

              {settings.tagline && (
                <p className="mt-8 max-w-2xl text-xl font-semibold leading-8 text-zinc-200 sm:text-2xl">
                  {settings.tagline}
                </p>
              )}

              {settings.description && (
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg">
                  {settings.description}
                </p>
              )}

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-black text-black shadow-[0_15px_50px_rgba(249,115,22,.18)] transition hover:-translate-y-1 hover:bg-orange-400"
                >
                  Start Your Journey
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#plans"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-semibold transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  View Memberships
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-500" />
                  Flexible memberships
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-500" />
                  UPI & Cash
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-500" />
                  Member support
                </span>
              </div>
            </div>

            {/* HERO IMAGE */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-orange-500/[0.07] blur-3xl" />

              <div className="relative min-h-[450px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl sm:min-h-[570px]">
                {settings.heroImageUrl ? (
                  <>
                    <img
                      src={settings.heroImageUrl}
                      alt={settings.gymName || "Gym"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                    <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-xl">
                      {settings.gymName}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                        TRAIN • GROW • REPEAT
                      </p>

                      <h2 className="mt-3 max-w-lg text-4xl font-black tracking-tight sm:text-5xl">
                        Train with purpose.
                      </h2>

                      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-300">
                        Build strength, improve your fitness and stay
                        consistent.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[450px] items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(249,115,22,.2),transparent_45%),linear-gradient(145deg,#171717,#050505)] sm:min-h-[570px]">
                    <div className="text-center">
                      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-orange-500/20 bg-orange-500/10 text-orange-400">
                        <Dumbbell size={50} />
                      </div>

                      <p className="mt-7 text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
                        Train hard
                      </p>

                      <h2 className="mt-3 text-4xl font-black">
                        Stay consistent.
                      </h2>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="border-b border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/[0.07] sm:grid-cols-4 sm:divide-y-0">
          <InfoStat
            icon={<Dumbbell size={18} />}
            label="Training"
            value="Gym Access"
          />

          <InfoStat
            icon={<HeartPulse size={18} />}
            label="Fitness"
            value="Cardio"
          />

          <InfoStat
            icon={<UserRound size={18} />}
            label="Guidance"
            value="Personal Trainer"
          />

          <InfoStat
            icon={<Zap size={18} />}
            label="Payments"
            value="UPI & Cash"
          />
        </div>
      </section>

      {/* FACILITIES */}
      <section
        id="facilities"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="THE GYM"
          title="Everything you need to train seriously."
          description="A focused environment for strength, cardio and guided training."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FacilityCard
            number="01"
            icon={<Dumbbell size={27} />}
            title="Strength Training"
            description="Train consistently with dedicated gym access for your regular workout sessions."
          />

          <FacilityCard
            number="02"
            icon={<HeartPulse size={27} />}
            title="Cardio Training"
            description="Improve endurance and conditioning with dedicated cardio sessions."
          />

          <FacilityCard
            number="03"
            icon={<UserRound size={27} />}
            title="Personal Training"
            description="Get one-to-one guidance when personal training is included in your plan."
          />
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section
        id="plans"
        className="border-y border-white/[0.07] bg-white/[0.018]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="MEMBERSHIPS"
            title="Choose your training plan."
            description="Simple plans designed around your fitness goals."
          />

          {plans.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.slice(0, 6).map((plan, index) => (
                <PlanCard
                  key={plan._id || plan.id || plan.name}
                  plan={plan}
                  featured={index === 1 && plans.length > 2}
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-white/10 bg-black p-10 text-center">
              <Dumbbell
                size={30}
                className="mx-auto text-orange-500"
              />

              <h3 className="mt-4 text-xl font-bold">
                Membership plans coming soon
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Contact the gym for current membership options.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href="/membership"
              className="group flex items-center gap-2 text-sm font-bold text-orange-400 transition hover:text-orange-300"
            >
              View all membership options
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* OFFERS */}
      {promotions.length > 0 && (
        <section
          id="offers"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
        >
          <SectionHeading
            eyebrow="SPECIAL OFFERS"
            title="Train more. Save more."
            description="Limited-time membership offers from the gym."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {promotions.slice(0, 6).map((promotion) => (
              <OfferCard
                key={promotion._id}
                promotion={promotion}
              />
            ))}
          </div>
        </section>
      )}

      {/* HOURS */}
      <section
        id="hours"
        className="border-y border-white/[0.07] bg-white/[0.018]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                OPENING HOURS
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Train on
                <span className="block text-orange-500">
                  your schedule.
                </span>
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-zinc-500">
                Two convenient sessions every day from Monday to Saturday.
                Sunday is closed.
              </p>

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Clock3 size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Gym opening hours
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Morning & evening sessions
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HoursCard
                day="Monday – Saturday"
                open
                morning={`${formatTime(
                  timings.morning?.open
                )} - ${formatTime(timings.morning?.close)}`}
                evening={`${formatTime(
                  timings.evening?.open
                )} - ${formatTime(timings.evening?.close)}`}
              />

              <HoursCard
                day="Sunday"
                open={!timings.sundayClosed}
                morning={
                  !timings.sundayClosed
                    ? `${formatTime(
                        timings.morning?.open
                      )} - ${formatTime(timings.morning?.close)}`
                    : ""
                }
                evening={
                  !timings.sundayClosed
                    ? `${formatTime(
                        timings.evening?.open
                      )} - ${formatTime(timings.evening?.close)}`
                    : ""
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 p-7 sm:p-9">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <MapPin size={22} />
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                VISIT US
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Come train with us.
              </h2>

              {locationText && (
                <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
                  {locationText}
                </p>
              )}

              <div className="mt-8 space-y-3">
                {phoneNumber && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-orange-500/20 hover:bg-orange-500/[0.03]"
                  >
                    <Phone
                      size={18}
                      className="text-orange-400"
                    />

                    <div>
                      <p className="text-xs text-zinc-600">
                        Call us
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                        {phoneNumber}
                      </p>
                    </div>
                  </a>
                )}

                {settings.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-orange-500/20 hover:bg-orange-500/[0.03]"
                  >
                    <Mail
                      size={18}
                      className="text-orange-400"
                    />

                    <div>
                      <p className="text-xs text-zinc-600">
                        Email
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                        {settings.email}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-orange-500 p-7 text-black sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10">
                <MessageCircle size={23} />
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-black/60">
                READY TO START?
              </p>

              <h2 className="mt-3 max-w-lg text-4xl font-black tracking-tight sm:text-5xl">
                Your next version starts today.
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-black/65">
                Become a member and start building a stronger,
                healthier routine.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
    <Link
    href="/register"
    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-400"
  >
    Join Now
  </Link>

  {whatsappUrl && (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/90 px-6 py-3.5 text-sm font-black text-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <MessageCircle size={17} />
      WhatsApp
    </a>
  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      {(settings.instagramUrl ||
        settings.facebookUrl ||
        whatsappUrl) && (
        <section className="border-t border-white/[0.07]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-8">
            <div>
              <p className="text-sm font-bold">
                Stay connected
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Follow the gym for updates, offers and announcements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {settings.instagramUrl && (
                <SocialLink
                  href={settings.instagramUrl}
                  label="Instagram"
                >
                  <InstagramIcon />
                </SocialLink>
              )}

              {settings.facebookUrl && (
                <SocialLink
                  href={settings.facebookUrl}
                  label="Facebook"
                >
                  <FacebookIcon />
                </SocialLink>
              )}

              {whatsappUrl && (
                <SocialLink
                  href={whatsappUrl}
                  label="WhatsApp"
                >
                  <MessageCircle size={19} />
                </SocialLink>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="border-t border-white/[0.07] bg-[#080808]">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
            <Sparkles size={25} />
          </div>

          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-[-0.03em] sm:text-6xl">
            Stop waiting.
            <span className="block text-orange-500">
              Start training.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-500">
            Join {settings.gymName} and make training part of your
            lifestyle.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-black text-black transition hover:bg-orange-400"
            >
              Become a Member
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 font-semibold transition hover:bg-white/[0.06]"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] bg-black">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.gymName || "Gym"}
                    className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-black">
                    <Dumbbell size={20} />
                  </div>
                )}

                <div>
                  <p className="font-black">
                    {settings.gymName}
                  </p>

                  <p className="text-xs text-zinc-600">
                    {settings.tagline ||
                      "Fitness • Strength • Discipline"}
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-600">
                {settings.description ||
                  "A focused place to train, improve and stay consistent."}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
              <Link
                href="/membership"
                className="transition hover:text-orange-400"
              >
                Membership
              </Link>

              <Link
                href="/register"
                className="transition hover:text-orange-400"
              >
                Join
              </Link>

              <Link
                href="/login"
                className="transition hover:text-orange-400"
              >
                Login
              </Link>

              <a
                href="#contact"
                className="transition hover:text-orange-400"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {settings.gymName}. All
              rights reserved.
            </p>

            <p>Train hard. Stay consistent.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_10px_35px_rgba(34,197,94,.25)] transition hover:scale-105 hover:bg-green-400"
        >
          <MessageCircle size={24} />
        </a>
      )}
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-base leading-7 text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}

function InfoStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6 sm:px-7">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-bold text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function FacilityCard({
  number,
  icon,
  title,
  description,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950 p-7 transition duration-300 hover:-translate-y-1 hover:border-orange-500/25">
      <div className="absolute right-5 top-4 text-5xl font-black text-white/[0.025]">
        {number}
      </div>

      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 transition group-hover:bg-orange-500 group-hover:text-black">
          {icon}
        </div>

        <h3 className="mt-7 text-xl font-black">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-zinc-500">
          {description}
        </p>

        <div className="mt-7 h-px w-10 bg-orange-500 transition-all group-hover:w-20" />
      </div>
    </div>
  );
}

function PlanCard({ plan, featured }) {
  const price = formatPrice(plan.price);
  const duration = getDuration(plan);

  const features = Array.isArray(plan.features)
    ? plan.features
    : [];

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 sm:p-7 ${
        featured
          ? "border-orange-500/50 bg-orange-500/[0.055] shadow-[0_20px_70px_rgba(249,115,22,.08)]"
          : "border-white/[0.08] bg-black hover:border-orange-500/20"
      }`}
    >
      {featured && (
        <div className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
          Popular
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
          <Dumbbell size={20} />
        </div>

        <div>
          <p className="text-lg font-black">
            {plan.name}
          </p>

          {duration && (
            <p className="mt-0.5 text-xs text-zinc-600">
              {duration}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7">
        {price ? (
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight">
              {price}
            </span>

            {duration && (
              <span className="mb-1 text-sm text-zinc-600">
                / {duration.toLowerCase()}
              </span>
            )}
          </div>
        ) : (
          <p className="text-2xl font-black">
            Contact gym
          </p>
        )}
      </div>

      {plan.description && (
        <p className="mt-4 min-h-[48px] text-sm leading-6 text-zinc-500">
          {plan.description}
        </p>
      )}

      <div className="my-6 h-px bg-white/[0.07]" />

      <div className="flex-1 space-y-3">
        {features.length > 0 ? (
          features.map((feature, index) => (
            <div
              key={`${feature}-${index}`}
              className="flex items-start gap-2.5 text-sm text-zinc-300"
            >
              <Check
                size={16}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <span>{getFeatureLabel(feature)}</span>
            </div>
          ))
        ) : (
          <div className="flex items-start gap-2.5 text-sm text-zinc-300">
            <Check
              size={16}
              className="mt-0.5 shrink-0 text-orange-500"
            />

            <span>Gym access</span>
          </div>
        )}
      </div>

      <Link
        href="/register"
        className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition ${
          featured
            ? "bg-orange-500 text-black hover:bg-orange-400"
            : "border border-white/10 bg-white/[0.04] text-white hover:border-orange-500/30 hover:bg-orange-500/[0.07]"
        }`}
      >
        Get Started
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function OfferCard({ promotion }) {
  const price = formatPrice(promotion.offerPrice);

  return (
    <Link
      href={`/promotions/${promotion._id}`}
      className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950 transition duration-300 hover:-translate-y-1 hover:border-orange-500/25"
    >
      {promotion.posterImage ? (
        <div className="relative h-56 overflow-hidden bg-zinc-900">
          <img
            src={promotion.posterImage}
            alt={promotion.title || "Gym offer"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
            Limited Offer
          </div>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(249,115,22,.18),transparent_60%)]">
          <Zap size={38} className="text-orange-500" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-black tracking-tight">
            {promotion.title}
          </h3>

          {price && (
            <span className="shrink-0 text-lg font-black text-orange-400">
              {price}
            </span>
          )}
        </div>

        {promotion.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
            {promotion.description}
          </p>
        )}

        {promotion.registrationFeeWaived && (
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-green-400">
            <CheckCircle2 size={15} />
            Registration fee waived
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-orange-400">
          View offer
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

function HoursCard({
  day,
  open,
  morning,
  evening,
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black">{day}</h3>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
            open
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {open ? "Open" : "Closed"}
        </span>
      </div>

      {open ? (
        <div className="mt-6 space-y-4 border-t border-white/[0.07] pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Morning
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-200">
                {morning}
              </p>
            </div>

            <Clock3
              size={18}
              className="text-orange-500"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Evening
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-200">
                {evening}
              </p>
            </div>

            <Clock3
              size={18}
              className="text-orange-500"
            />
          </div>
        </div>
      ) : (
        <p className="mt-6 border-t border-white/[0.07] pt-5 text-sm text-zinc-600">
          Gym is closed on Sunday.
        </p>
      )}
    </div>
  );
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
    >
      {children}
    </a>
  );
}