import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import GymSettings from "@/models/GymSettings";

function isAdmin(session) {
  return session?.user?.role === "admin";
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizePhoneNumbers(phoneNumbers) {
  if (!Array.isArray(phoneNumbers)) return [];

  return phoneNumbers
    .map((phone) => ({
      label: cleanString(phone?.label),
      number: cleanString(phone?.number),
      isWhatsApp: Boolean(phone?.isWhatsApp),
    }))
    .filter((phone) => phone.number);
}

function normalizeTimings(timings) {
  const morning = timings?.morning || {};
  const evening = timings?.evening || {};

  return {
    morning: {
      open: isValidTime(morning.open) ? morning.open : "06:00",
      close: isValidTime(morning.close) ? morning.close : "10:00",
    },
    evening: {
      open: isValidTime(evening.open) ? evening.open : "16:00",
      close: isValidTime(evening.close) ? evening.close : "21:00",
    },
    sundayClosed:
      typeof timings?.sundayClosed === "boolean"
        ? timings.sundayClosed
        : true,
  };
}

/*
|--------------------------------------------------------------------------
| GET /api/admin/gym-settings
|--------------------------------------------------------------------------
*/
export async function GET() {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    let settings = await GymSettings.findOne().lean();

    /*
     * Create default settings if no document exists.
     */
    if (!settings) {
      const created = await GymSettings.create({
        gymName: "My Gym",
        logoUrl: "",
        heroImageUrl: "",
        tagline: "",
        description: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phoneNumbers: [],
        email: "",
        timings: {
          morning: {
            open: "06:00",
            close: "10:00",
          },
          evening: {
            open: "16:00",
            close: "21:00",
          },
          sundayClosed: true,
        },
        instagramUrl: "",
        facebookUrl: "",
        whatsappNumber: "",
        isActive: true,
      });

      settings = created.toObject();
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET GYM SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load gym settings",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/admin/gym-settings
|--------------------------------------------------------------------------
*/
export async function PUT(request) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      gymName,
      logoUrl,
      heroImageUrl,
      tagline,
      description,
      address,
      city,
      state,
      pincode,
      phoneNumbers,
      email,
      timings,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      isActive,
    } = body;

    if (!cleanString(gymName)) {
      return NextResponse.json(
        {
          success: false,
          message: "Gym name is required",
        },
        { status: 400 }
      );
    }

    const normalizedTimings = normalizeTimings(timings);

    /*
     * Make sure opening time is before closing time.
     */
    if (
      normalizedTimings.morning.open >= normalizedTimings.morning.close
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Morning opening time must be before closing time",
        },
        { status: 400 }
      );
    }

    if (
      normalizedTimings.evening.open >= normalizedTimings.evening.close
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Evening opening time must be before closing time",
        },
        { status: 400 }
      );
    }

    const updateData = {
      gymName: cleanString(gymName),
      logoUrl: cleanString(logoUrl),
      heroImageUrl: cleanString(heroImageUrl),
      tagline: cleanString(tagline),
      description: cleanString(description),

      address: cleanString(address),
      city: cleanString(city),
      state: cleanString(state),
      pincode: cleanString(pincode),

      phoneNumbers: normalizePhoneNumbers(phoneNumbers),

      email: cleanString(email).toLowerCase(),

      timings: normalizedTimings,

      instagramUrl: cleanString(instagramUrl),
      facebookUrl: cleanString(facebookUrl),
      whatsappNumber: cleanString(whatsappNumber),

      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    };

    const settings = await GymSettings.findOneAndUpdate(
      {},
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Gym settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("PUT GYM SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update gym settings",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}