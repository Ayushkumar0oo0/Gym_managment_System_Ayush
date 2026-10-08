"use client";

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  HeartPulse,
  VenusAndMars,
} from "lucide-react";
import { useState } from "react";

export default function PurchaseCustomerForm({
  form,
  setForm,
  membershipType = "individual",
  errors = {},
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.08] via-transparent to-transparent p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
            <User size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Personal Details
              </h2>

              <span className="hidden rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400 sm:inline-flex">
                Required
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-6 text-zinc-500">
              Enter the details that will be used to create your gym account.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Account information */}
        <div>
          <SectionLabel
            icon={<User size={16} />}
            title="Account Information"
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={errors.name}
              required
              icon={<User size={17} />}
            />

            <Field
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              required
              icon={<Mail size={17} />}
            />

            <Field
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
              error={errors.phone}
              required
              icon={<Phone size={17} />}
            />

            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Gender <span className="text-orange-400">*</span>
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <VenusAndMars size={17} />
                </div>

                <select
                  id="gender"
                  name="gender"
                  value={form.gender ?? ""}
                  onChange={handleChange}
                  className={`w-full appearance-none rounded-xl border bg-zinc-900/80 py-3.5 pl-11 pr-10 text-sm text-white outline-none transition ${
                    errors.gender
                      ? "border-red-500/70 focus:border-red-400"
                      : "border-white/10 hover:border-white/20 focus:border-orange-500"
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {errors.gender && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.gender}
                </p>
              )}
            </div>

            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create your password"
              error={errors.password}
              visible={showPassword}
              setVisible={setShowPassword}
              required
            />

            <PasswordField
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              setVisible={setShowConfirmPassword}
              required
            />
          </div>
        </div>

        {/* Emergency contact */}
        <div className="mt-9 border-t border-white/10 pt-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-orange-400 ring-1 ring-white/10">
              <HeartPulse size={18} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white sm:text-lg">
                Emergency Contact
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                Optional. This person can be contacted in case of an
                emergency.
              </p>
            </div>

            <span className="ml-auto hidden rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline-flex">
              Optional
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label="Contact Name"
              name="emergencyContactName"
              value={form.emergencyContactName}
              onChange={handleChange}
              placeholder="Emergency contact name"
              error={errors.emergencyContactName}
              icon={<User size={17} />}
            />

            <Field
              label="Contact Phone"
              name="emergencyContactPhone"
              type="tel"
              value={form.emergencyContactPhone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
              error={errors.emergencyContactPhone}
              icon={<Phone size={17} />}
            />

            <Field
              label="Relation"
              name="emergencyContactRelation"
              value={form.emergencyContactRelation}
              onChange={handleChange}
              placeholder="Father, Mother, Brother..."
              error={errors.emergencyContactRelation}
              icon={<Users size={17} />}
            />
          </div>
        </div>

        {/* Couple membership */}
        {membershipType === "couple" && (
          <div className="mt-9 border-t border-white/10 pt-8">
            <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.05] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Users size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Couple Membership
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Your partner&apos;s details will be collected separately
                    in the next step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-orange-400"
          />

          <p className="text-xs leading-5 text-zinc-500">
            Your account information is used to create and manage your gym
            membership. Keep your password private and secure.
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-orange-400">{icon}</span>

      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
        {title}
      </h3>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder,
  error,
  required = false,
  maxLength,
  inputMode,
  icon,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}{" "}
        {required && <span className="text-orange-400">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={getAutoComplete(name)}
          className={`w-full rounded-xl border bg-zinc-900/80 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition ${
            icon ? "pl-11" : "px-4"
          } ${
            error
              ? "border-red-500/70 focus:border-red-400"
              : "border-white/10 hover:border-white/20 focus:border-orange-500"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  name,
  value = "",
  onChange,
  placeholder,
  error,
  visible,
  setVisible,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}{" "}
        {required && <span className="text-orange-400">*</span>}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
          <Lock size={17} />
        </div>

        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`w-full rounded-xl border bg-zinc-900/80 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-zinc-700 outline-none transition ${
            error
              ? "border-red-500/70 focus:border-red-400"
              : "border-white/10 hover:border-white/20 focus:border-orange-500"
          }`}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-orange-400"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function getAutoComplete(name) {
  const map = {
    name: "name",
    email: "email",
    phone: "tel",
    password: "new-password",
    confirmPassword: "new-password",
    emergencyContactName: "off",
    emergencyContactPhone: "off",
    emergencyContactRelation: "off",
  };

  return map[name] || "off";
}