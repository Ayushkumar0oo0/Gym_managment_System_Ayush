import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GymSettings from "@/models/GymSettings";

function formatPhoneNumbers(phoneNumbers = []) {
  if (!Array.isArray(phoneNumbers)) return [];

  return phoneNumbers
    .filter((phone) => phone?.number)
    .map((phone) => ({
      label: phone.label || "",
      number: phone.number,
      isWhatsApp: Boolean(phone.isWhatsApp),
    }));
}

function getWhatsAppNumber(settings) {
  if (settings.whatsappNumber) {
    return settings.whatsappNumber;
  }

  const whatsappPhone = settings.phoneNumbers?.find(
    (phone) => phone.isWhatsApp
  );

  return whatsappPhone?.number || "";
}

function getLocation(settings) {
  return [settings.address, settings.city, settings.state, settings.pincode]
    .filter(Boolean)
    .join(", ");
}

export async function GET() {
  try {
    await connectDB();

    const settings = await GymSettings.findOne({
      isActive: true,
    }).lean();

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          message: "Gym settings not found",
        },
        { status: 404 }
      );
    }

    /*
     * New timing structure
     */
    const timings = {
      morning: {
        open: settings.timings?.morning?.open || "06:00",
        close: settings.timings?.morning?.close || "10:00",
      },

      evening: {
        open: settings.timings?.evening?.open || "16:00",
        close: settings.timings?.evening?.close || "21:00",
      },

      sundayClosed:
        typeof settings.timings?.sundayClosed === "boolean"
          ? settings.timings.sundayClosed
          : true,
    };

    /*
     * Keep a weeklySchedule response as well.
     *
     * This makes the existing homepage compatible while we move
     * completely to the new simpler timing system.
     */
    const weeklySchedule = [
      {
        day: "Monday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Tuesday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Wednesday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Thursday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Friday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Saturday",
        isClosed: false,
        sessions: [
          {
            name: "Morning",
            open: timings.morning.open,
            close: timings.morning.close,
          },
          {
            name: "Evening",
            open: timings.evening.open,
            close: timings.evening.close,
          },
        ],
      },
      {
        day: "Sunday",
        isClosed: timings.sundayClosed,
        sessions: timings.sundayClosed
          ? []
          : [
              {
                name: "Morning",
                open: timings.morning.open,
                close: timings.morning.close,
              },
              {
                name: "Evening",
                open: timings.evening.open,
                close: timings.evening.close,
              },
            ],
      },
    ];

    const phoneNumbers = formatPhoneNumbers(settings.phoneNumbers);

    const phone =
      phoneNumbers.find((item) => item.number)?.number || "";

    const whatsapp = getWhatsAppNumber(settings);

    const location = getLocation(settings);

    return NextResponse.json({
      success: true,

      settings: {
        _id: settings._id,

        gymName: settings.gymName || "",

        logoUrl: settings.logoUrl || "",

        heroImageUrl: settings.heroImageUrl || "",

        tagline: settings.tagline || "",

        description: settings.description || "",

        address: settings.address || "",
        city: settings.city || "",
        state: settings.state || "",
        pincode: settings.pincode || "",

        location,

        phoneNumbers,

        phone,

        email: settings.email || "",

        whatsappNumber: settings.whatsappNumber || "",

        whatsapp,

        instagramUrl: settings.instagramUrl || "",

        facebookUrl: settings.facebookUrl || "",

        isActive: settings.isActive,

        /*
         * New simple timing system
         */
        timings,

        /*
         * Compatibility for current homepage
         */
        weeklySchedule,
      },
    });
  } catch (error) {
    console.error("PUBLIC GYM SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load gym settings",
      },
      { status: 500 }
    );
  }
}