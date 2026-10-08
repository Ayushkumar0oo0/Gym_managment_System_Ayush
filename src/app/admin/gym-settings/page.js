"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock3,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Globe2,
  Power,
} from "lucide-react";

const DEFAULT_TIMINGS = {
  morning: {
    open: "06:00 AM",
    close: "10:00 AM",
  },
  evening: {
    open: "04:00 PM",
    close: "09:00 PM",
  },
};

function convertTo12Hour(time) {
  if (!time) return "";

  const [hourString, minute] = time.split(":");
  let hour = Number(hourString);

  if (!Number.isInteger(hour) || !minute) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

function normalizeTime(value, fallback) {
  if (!value) return fallback;

  const trimmed = String(value).trim();

  // Already 12-hour format.
  if (/(AM|PM)$/i.test(trimmed)) {
    return trimmed
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  // Convert old 24-hour data.
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return convertTo12Hour(trimmed);
  }

  return fallback;
}

function parseTimeTo24Hour(value) {
  if (!value) return "";

  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return value;
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();

  if (hour === 12) {
    hour = 0;
  }

  if (period === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export default function GymSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // BASIC INFORMATION
  // =====================================================

  const [gymName, setGymName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");

  // =====================================================
  // LOCATION
  // =====================================================

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // =====================================================
  // CONTACT
  // =====================================================

  const [phoneNumbers, setPhoneNumbers] = useState([
    {
      label: "Reception",
      number: "",
      isWhatsApp: false,
    },
  ]);

  const [email, setEmail] = useState("");

  // =====================================================
  // TIMINGS
  // =====================================================

  const [timings, setTimings] = useState(
    DEFAULT_TIMINGS
  );

  // =====================================================
  // SOCIAL
  // =====================================================

  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // =====================================================
  // STATUS
  // =====================================================

  const [isActive, setIsActive] = useState(true);

  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/gym-settings",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load gym settings."
        );
      }

      if (!data.settings) {
        setLoading(false);
        return;
      }

      const settings = data.settings;

      // Basic information
      setGymName(settings.gymName || "");
      setLogoUrl(settings.logoUrl || "");
      setHeroImageUrl(
        settings.heroImageUrl || ""
      );
      setTagline(settings.tagline || "");
      setDescription(
        settings.description || ""
      );

      // Location
      setAddress(settings.address || "");
      setCity(settings.city || "");
      setState(settings.state || "");
      setPincode(settings.pincode || "");

      // Phone numbers
      setPhoneNumbers(
        settings.phoneNumbers?.length
          ? settings.phoneNumbers
          : [
              {
                label: "Reception",
                number: "",
                isWhatsApp: false,
              },
            ]
      );

      setEmail(settings.email || "");

      // =================================================
      // NEW SIMPLE TIMING SYSTEM
      // =================================================

      if (settings.timings) {
        setTimings({
          morning: {
            open: normalizeTime(
              settings.timings.morning?.open,
              DEFAULT_TIMINGS.morning.open
            ),
            close: normalizeTime(
              settings.timings.morning?.close,
              DEFAULT_TIMINGS.morning.close
            ),
          },

          evening: {
            open: normalizeTime(
              settings.timings.evening?.open,
              DEFAULT_TIMINGS.evening.open
            ),
            close: normalizeTime(
              settings.timings.evening?.close,
              DEFAULT_TIMINGS.evening.close
            ),
          },
        });
      } else if (
        settings.weeklySchedule?.length
      ) {
        // Backward compatibility with old data.
        const monday =
          settings.weeklySchedule.find(
            (day) => day.day === "monday"
          );

        const morning =
          monday?.sessions?.find(
            (session) =>
              session.name?.toLowerCase() ===
              "morning"
          );

        const evening =
          monday?.sessions?.find(
            (session) =>
              session.name?.toLowerCase() ===
              "evening"
          );

        setTimings({
          morning: {
            open: normalizeTime(
              morning?.open,
              DEFAULT_TIMINGS.morning.open
            ),
            close: normalizeTime(
              morning?.close,
              DEFAULT_TIMINGS.morning.close
            ),
          },

          evening: {
            open: normalizeTime(
              evening?.open,
              DEFAULT_TIMINGS.evening.open
            ),
            close: normalizeTime(
              evening?.close,
              DEFAULT_TIMINGS.evening.close
            ),
          },
        });
      }

      // Social
      setInstagramUrl(
        settings.instagramUrl || ""
      );

      setFacebookUrl(
        settings.facebookUrl || ""
      );

      setWhatsappNumber(
        settings.whatsappNumber || ""
      );

      setIsActive(
        settings.isActive ?? true
      );
    } catch (err) {
      console.error(
        "LOAD GYM SETTINGS ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to load gym settings."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // PHONE FUNCTIONS
  // =====================================================

  function addPhoneNumber() {
    setPhoneNumbers((previous) => [
      ...previous,
      {
        label: "",
        number: "",
        isWhatsApp: false,
      },
    ]);
  }

  function removePhoneNumber(index) {
    setPhoneNumbers((previous) =>
      previous.filter(
        (_, phoneIndex) =>
          phoneIndex !== index
      )
    );
  }

  function updatePhoneNumber(
    index,
    field,
    value
  ) {
    setPhoneNumbers((previous) =>
      previous.map((phone, phoneIndex) =>
        phoneIndex === index
          ? {
              ...phone,
              [field]: value,
            }
          : phone
      )
    );
  }

  // =====================================================
  // TIMING FUNCTIONS
  // =====================================================

  function updateTiming(
    session,
    field,
    value
  ) {
    setTimings((previous) => ({
      ...previous,
      [session]: {
        ...previous[session],
        [field]: value,
      },
    }));
  }

  // =====================================================
  // SAVE
  // =====================================================

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!gymName.trim()) {
        setError(
          "Gym name is required."
        );
        return;
      }

      const cleanedPhoneNumbers =
        phoneNumbers
          .filter(
            (phone) =>
              phone.label.trim() ||
              phone.number.trim()
          )
          .map((phone) => ({
            label: phone.label.trim(),
            number: phone.number.trim(),
            isWhatsApp: Boolean(
              phone.isWhatsApp
            ),
          }));

      // =================================================
      // CONVERT 12-HOUR → 24-HOUR BEFORE SAVING
      // =================================================

      const cleanedTimings = {
        morning: {
          open: parseTimeTo24Hour(
            timings.morning.open
          ),
          close: parseTimeTo24Hour(
            timings.morning.close
          ),
        },

        evening: {
          open: parseTimeTo24Hour(
            timings.evening.open
          ),
          close: parseTimeTo24Hour(
            timings.evening.close
          ),
        },

        sundayClosed: true,
      };

      const response = await fetch(
        "/api/admin/gym-settings",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            gymName: gymName.trim(),

            logoUrl: logoUrl.trim(),

            heroImageUrl:
              heroImageUrl.trim(),

            tagline:
              tagline.trim(),

            description:
              description.trim(),

            address:
              address.trim(),

            city:
              city.trim(),

            state:
              state.trim(),

            pincode:
              pincode.trim(),

            phoneNumbers:
              cleanedPhoneNumbers,

            email: email
              .trim()
              .toLowerCase(),

            timings:
              cleanedTimings,

            instagramUrl:
              instagramUrl.trim(),

            facebookUrl:
              facebookUrl.trim(),

            whatsappNumber:
              whatsappNumber.trim(),

            isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save gym settings."
        );
      }

      setMessage(
        "Gym settings saved successfully."
      );
    } catch (err) {
      console.error(
        "SAVE GYM SETTINGS ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to save gym settings."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
            <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Loading gym settings...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
              <Building2 className="h-6 w-6 text-orange-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Gym Settings
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Manage your gym information,
                contact details and opening hours.
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="space-y-6"
        >

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-orange-500" />

              <div>
                <h2 className="font-semibold">
                  Basic Information
                </h2>

                <p className="text-xs text-zinc-500">
                  Information shown on your website.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <Field
                label="Gym Name"
                value={gymName}
                onChange={setGymName}
                placeholder="Your Gym Name"
                required
              />

              <Field
                label="Tagline"
                value={tagline}
                onChange={setTagline}
                placeholder="Train Hard. Stay Strong."
              />

              <Field
                label="Logo URL"
                value={logoUrl}
                onChange={setLogoUrl}
                placeholder="https://..."
                icon={ImageIcon}
              />

              <Field
                label="Hero Image URL"
                value={heroImageUrl}
                onChange={setHeroImageUrl}
                placeholder="https://..."
                icon={ImageIcon}
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Tell visitors about your gym..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50"
                />
              </div>

            </div>
          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-orange-500" />

              <div>
                <h2 className="font-semibold">
                  Location
                </h2>

                <p className="text-xs text-zinc-500">
                  Your gym's physical location.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <Field
                label="Address"
                value={address}
                onChange={setAddress}
                placeholder="Street / Area"
              />

              <Field
                label="City"
                value={city}
                onChange={setCity}
                placeholder="City"
              />

              <Field
                label="State"
                value={state}
                onChange={setState}
                placeholder="State"
              />

              <Field
                label="Pincode"
                value={pincode}
                onChange={setPincode}
                placeholder="Pincode"
              />

            </div>
          </section>

          {/* =================================================
              CONTACT
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <Phone className="h-5 w-5 text-orange-500" />

              <div>
                <h2 className="font-semibold">
                  Contact Details
                </h2>

                <p className="text-xs text-zinc-500">
                  Phone, WhatsApp and email.
                </p>
              </div>
            </div>

            <div className="space-y-4">

              {phoneNumbers.map(
                (phone, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">

                      <input
                        value={phone.label}
                        onChange={(e) =>
                          updatePhoneNumber(
                            index,
                            "label",
                            e.target.value
                          )
                        }
                        placeholder="Label e.g. Reception"
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                      />

                      <input
                        value={phone.number}
                        onChange={(e) =>
                          updatePhoneNumber(
                            index,
                            "number",
                            e.target.value
                          )
                        }
                        placeholder="Phone number"
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removePhoneNumber(index)
                        }
                        disabled={
                          phoneNumbers.length === 1
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>

                    </div>

                    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-zinc-400">
                      <input
                        type="checkbox"
                        checked={
                          phone.isWhatsApp
                        }
                        onChange={(e) =>
                          updatePhoneNumber(
                            index,
                            "isWhatsApp",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 accent-orange-500"
                      />

                      Use this number for WhatsApp
                    </label>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={addPhoneNumber}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-orange-500/30 hover:bg-orange-500/5"
              >
                + Add Phone Number
              </button>

              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="gym@example.com"
                icon={Mail}
                type="email"
              />

            </div>
          </section>

          {/* =================================================
              OPENING HOURS
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-orange-500" />

              <div>
                <h2 className="font-semibold">
                  Opening Hours
                </h2>

                <p className="text-xs text-zinc-500">
                  Same timings from Monday to Saturday.
                </p>
              </div>
            </div>

            {/* DAYS */}

            <div className="mb-6 rounded-2xl border border-white/10 bg-black/30 p-5">

              <p className="text-sm font-medium text-zinc-300">
                Weekly Schedule
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">

                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day) => (
                  <div
                    key={day}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-center"
                  >
                    <p className="text-xs font-semibold text-white">
                      {day}
                    </p>

                    <p className="mt-1 text-[11px] text-emerald-400">
                      Open
                    </p>
                  </div>
                ))}

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-3 text-center">
                  <p className="text-xs font-semibold text-white">
                    Sunday
                  </p>

                  <p className="mt-1 text-[11px] text-red-400">
                    Closed
                  </p>
                </div>

              </div>
            </div>

            {/* MORNING + EVENING */}

            <div className="grid gap-5 md:grid-cols-2">

              {/* MORNING */}

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                    🌅
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Morning
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Monday – Saturday
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <TimeInput
                    label="Opening"
                    value={
                      timings.morning.open
                    }
                    onChange={(value) =>
                      updateTiming(
                        "morning",
                        "open",
                        value
                      )
                    }
                  />

                  <TimeInput
                    label="Closing"
                    value={
                      timings.morning.close
                    }
                    onChange={(value) =>
                      updateTiming(
                        "morning",
                        "close",
                        value
                      )
                    }
                  />

                </div>

              </div>

              {/* EVENING */}

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                    🌙
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Evening
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Monday – Saturday
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <TimeInput
                    label="Opening"
                    value={
                      timings.evening.open
                    }
                    onChange={(value) =>
                      updateTiming(
                        "evening",
                        "open",
                        value
                      )
                    }
                  />

                  <TimeInput
                    label="Closing"
                    value={
                      timings.evening.close
                    }
                    onChange={(value) =>
                      updateTiming(
                        "evening",
                        "close",
                        value
                      )
                    }
                  />

                </div>

              </div>

            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4">
              <span className="text-lg">🔴</span>

              <div>
                <p className="text-sm font-medium text-white">
                  Sunday — Closed
                </p>

                <p className="text-xs text-zinc-500">
                  The gym is closed every Sunday.
                </p>
              </div>
            </div>

          </section>

          {/* =================================================
              SOCIAL LINKS
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-orange-500" />

              <div>
                <h2 className="font-semibold">
                  Social Links
                </h2>

                <p className="text-xs text-zinc-500">
                  Social media links shown on the website.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <Field
  label="Instagram URL"
  value={instagramUrl}
  onChange={setInstagramUrl}
  placeholder="https://instagram.com/..."
  icon={Globe2}
/>

<Field
  label="Facebook URL"
  value={facebookUrl}
  onChange={setFacebookUrl}
  placeholder="https://facebook.com/..."
/>

<Field
  label="WhatsApp Number"
  value={whatsappNumber}
  onChange={setWhatsappNumber}
  placeholder="91XXXXXXXXXX"
  icon={MessageCircle}
/>

            </div>
          </section>

          {/* =================================================
              GYM STATUS
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">

            <div className="flex items-center justify-between gap-5">

              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-orange-500" />

                <div>
                  <h2 className="font-semibold">
                    Gym Status
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Control whether the gym is active on the website.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsActive(
                    (previous) => !previous
                  )
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  isActive
                    ? "bg-emerald-500"
                    : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    isActive
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>

            <p
              className={`mt-4 text-sm ${
                isActive
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {isActive
                ? "Gym is active."
                : "Gym is currently inactive."}
            </p>

          </section>

          {/* =================================================
              SAVE
          ================================================= */}

          <div className="flex justify-end pb-10">

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

// =========================================================
// REUSABLE FIELD
// =========================================================

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        )}

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-2xl border border-white/10 bg-black/40 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500/50 ${
            Icon
              ? "pl-11 pr-4"
              : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

// =========================================================
// TIME INPUT
// =========================================================

function TimeInput({
  label,
  value,
  onChange,
}) {
  const [hour, setHour] = useState("06");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    const match = String(value || "")
      .trim()
      .match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );

    if (!match) return;

    setHour(
      String(match[1]).padStart(2, "0")
    );

    setMinute(match[2]);

    setPeriod(
      match[3].toUpperCase()
    );
  }, [value]);

  function update(
    nextHour = hour,
    nextMinute = minute,
    nextPeriod = period
  ) {
    onChange(
      `${String(nextHour).padStart(
        2,
        "0"
      )}:${nextMinute} ${nextPeriod}`
    );
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-500">
        {label}
      </label>

      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/40">

        <select
          value={hour}
          onChange={(e) => {
            setHour(e.target.value);
            update(
              e.target.value,
              minute,
              period
            );
          }}
          className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none"
        >
          {Array.from(
            { length: 12 },
            (_, index) => {
              const value = String(
                index + 1
              ).padStart(2, "0");

              return (
                <option
                  key={value}
                  value={value}
                  className="bg-zinc-900"
                >
                  {value}
                </option>
              );
            }
          )}
        </select>

        <span className="flex items-center text-zinc-600">
          :
        </span>

        <select
          value={minute}
          onChange={(e) => {
            setMinute(e.target.value);
            update(
              hour,
              e.target.value,
              period
            );
          }}
          className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none"
        >
          {["00", "15", "30", "45"].map(
            (value) => (
              <option
                key={value}
                value={value}
                className="bg-zinc-900"
              >
                {value}
              </option>
            )
          )}
        </select>

        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            update(
              hour,
              minute,
              e.target.value
            );
          }}
          className="w-full bg-transparent px-2 py-3 text-sm font-semibold text-orange-400 outline-none"
        >
          <option
            value="AM"
            className="bg-zinc-900"
          >
            AM
          </option>

          <option
            value="PM"
            className="bg-zinc-900"
          >
            PM
          </option>
        </select>

      </div>
    </div>
  );
}