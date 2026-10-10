
"use client";

import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  HeartPulse,
  VenusAndMars,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

export default function PurchaseCustomerForm({
  form,
  setForm,
  membershipType = "individual",
  errors = {},
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [showEmergencyContact, setShowEmergencyContact] =
    useState(
      Boolean(
        form.emergencyContactName ||
          form.emergencyContactPhone ||
          form.emergencyContactRelation
      )
    );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl shadow-black/20">
      {/* Header */}
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-orange-500/[0.09] to-transparent p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <UserRound size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Your details
              </h2>

              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                Required
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
              Create your gym account to continue with your
              membership.
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={14} className="text-emerald-400" />
              Your account details are handled securely.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-7">
        {/* Account details */}
        <div>
          <SectionHeading
            icon={<UserRound size={16} />}
            title="Account information"
            subtitle="Use an email address and phone number you can access."
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={errors.name}
              required
              icon={<UserRound size={17} />}
              autoComplete="name"
            />

            <Field
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              required
              icon={<Mail size={17} />}
              autoComplete="email"
            />

            <Field
              label="Mobile number"
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
              autoComplete="tel"
            />

            <div>
              <FieldLabel name="gender" required>
                Gender
              </FieldLabel>

              <div className="relative">
                <VenusAndMars
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <select
                  id="gender"
                  name="gender"
                  value={form.gender ?? ""}
                  onChange={handleChange}
                  className={inputClass(
                    Boolean(errors.gender),
                    "pl-11 pr-10"
                  )}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <ErrorMessage>{errors.gender}</ErrorMessage>
            </div>

            <PasswordField
              label="Create password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={errors.password}
              visible={showPassword}
              setVisible={setShowPassword}
              autoComplete="new-password"
              required
            />

            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Enter password again"
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              setVisible={setShowConfirmPassword}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3.5">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-emerald-400"
            />
            <p className="text-xs leading-5 text-zinc-400">
              Choose a strong password and keep it private.
              You will use it to access your gym account.
            </p>
          </div>
        </div>

        {/* Optional emergency contact */}
        <div className="border-t border-white/[0.07] pt-6">
          <button
            type="button"
            onClick={() =>
              setShowEmergencyContact((previous) => !previous)
            }
            aria-expanded={showEmergencyContact}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-orange-500/20 hover:bg-white/[0.035]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <HeartPulse size={19} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">
                Emergency contact
              </span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                Optional · Add someone we can contact in an emergency.
              </span>
            </span>

            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-400">
              Optional
            </span>

            <ChevronDown
              size={17}
              className={`shrink-0 text-zinc-400 transition-transform ${
                showEmergencyContact ? "rotate-180" : ""
              }`}
            />
          </button>

          {showEmergencyContact && (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Contact name"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Full name"
                error={errors.emergencyContactName}
                icon={<UserRound size={17} />}
                autoComplete="off"
              />

              <Field
                label="Contact phone"
                name="emergencyContactPhone"
                type="tel"
                value={form.emergencyContactPhone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                error={errors.emergencyContactPhone}
                icon={<Phone size={17} />}
                autoComplete="off"
              />

              <Field
                label="Relationship"
                name="emergencyContactRelation"
                value={form.emergencyContactRelation}
                onChange={handleChange}
                placeholder="e.g. Father, Mother, Friend"
                error={errors.emergencyContactRelation}
                icon={<Users size={17} />}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Couple membership information */}
        {membershipType === "couple" && (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-500/15 bg-orange-500/[0.05] p-4">
            <Users
              size={19}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <div>
              <h3 className="text-sm font-bold text-white">
                Couple membership
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Your partner&apos;s details will be collected in
                the next step.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeading({ icon, title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="text-orange-400">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-300">
          {title}
        </h3>
      </div>

      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ name, required, children }) {
  return (
    <label
      htmlFor={name}
      className="mb-2 block text-sm font-medium text-zinc-300"
    >
      {children}
      {required && (
        <span className="ml-1 text-orange-400">*</span>
      )}
    </label>
  );
}

function inputClass(hasError, padding = "px-4") {
  return `w-full rounded-xl border bg-zinc-900/80 py-3.5 ${padding} text-sm text-white outline-none transition placeholder:text-zinc-600 ${
    hasError
      ? "border-red-500/70 focus:border-red-400"
      : "border-white/10 hover:border-white/20 focus:border-orange-500"
  }`;
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <p className="mt-1.5 text-xs text-red-400" role="alert">
      {children}
    </p>
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
  autoComplete = "off",
}) {
  return (
    <div>
      <FieldLabel name={name} required={required}>
        {label}
      </FieldLabel>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </span>
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
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`${inputClass(
            Boolean(error),
            icon ? "pl-11 pr-4" : "px-4"
          )}`}
        />
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-xs text-red-400"
          role="alert"
        >
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
  autoComplete = "new-password",
  required = false,
}) {
  return (
    <div>
      <FieldLabel name={name} required={required}>
        {label}
      </FieldLabel>

      <div className="relative">
        <Lock
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={inputClass(
            Boolean(error),
            "pl-11 pr-12"
          )}
        />

        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-orange-400"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-xs text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
