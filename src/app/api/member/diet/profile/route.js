import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DietProfile from "@/models/DietProfile";
import DietProgress from "@/models/DietProgress";

const ALLOWED_GOALS = [
  "weight_gain",
  "muscle_gain",
  "fat_loss",
  "maintenance",
  "general_fitness",
];

const ALLOWED_DIET_TYPES = [
  "vegetarian",
  "non_vegetarian",
];

const ALLOWED_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function validateProfile(body) {
  const age = Number(body.age);
  const heightCm = Number(body.heightCm);
  const currentWeightKg = Number(
    body.currentWeightKg
  );

  const workoutDaysPerWeek = Number(
    body.workoutDaysPerWeek
  );

  if (
    !Number.isFinite(age) ||
    age < 14 ||
    age > 100
  ) {
    return {
      error: "Age must be between 14 and 100.",
    };
  }

  if (
    body.gender !== "male" &&
    body.gender !== "female"
  ) {
    return {
      error: "Please select a valid gender.",
    };
  }

  if (
    !Number.isFinite(heightCm) ||
    heightCm < 100 ||
    heightCm > 250
  ) {
    return {
      error:
        "Height must be between 100 cm and 250 cm.",
    };
  }

  if (
    !Number.isFinite(currentWeightKg) ||
    currentWeightKg < 30 ||
    currentWeightKg > 300
  ) {
    return {
      error:
        "Weight must be between 30 kg and 300 kg.",
    };
  }

  if (!ALLOWED_GOALS.includes(body.goal)) {
    return {
      error: "Please select a valid fitness goal.",
    };
  }

  if (
    !ALLOWED_DIET_TYPES.includes(
      body.dietType
    )
  ) {
    return {
      error: "Please select a valid diet type.",
    };
  }

  if (
    !Number.isInteger(workoutDaysPerWeek) ||
    workoutDaysPerWeek < 0 ||
    workoutDaysPerWeek > 7
  ) {
    return {
      error:
        "Workout days must be between 0 and 7.",
    };
  }

  let nonVegRestrictedDays = [];

  if (
    body.dietType === "non_vegetarian"
  ) {
    if (
      body.nonVegRestrictedDays !==
        undefined &&
      !Array.isArray(
        body.nonVegRestrictedDays
      )
    ) {
      return {
        error:
          "Non-veg restricted days must be a list.",
      };
    }

    nonVegRestrictedDays = [
      ...new Set(
        (
          body.nonVegRestrictedDays || []
        ).map((day) =>
          String(day).toLowerCase()
        )
      ),
    ];

    const invalidDay =
      nonVegRestrictedDays.find(
        (day) =>
          !ALLOWED_DAYS.includes(day)
      );

    if (invalidDay) {
      return {
        error:
          "One or more restricted days are invalid.",
      };
    }
  }

  return {
    data: {
      age,
      gender: body.gender,
      heightCm,
      currentWeightKg,
      goal: body.goal,
      dietType: body.dietType,
      nonVegRestrictedDays,
      workoutDaysPerWeek,
    },
  };
}

async function getMember() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "member") {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "Only members can use the diet planner.",
        },
        { status: 403 }
      ),
    };
  }

  await connectDB();

  const user = await User.findById(
    session.user.id
  )
    .select(
      "_id role isActive gender"
    )
    .lean();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "Member account not found.",
        },
        { status: 404 }
      ),
    };
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "Your account is inactive.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    user,
  };
}

/*
 * =========================================================
 * GET DIET PROFILE
 * =========================================================
 */

export async function GET() {
  try {
    const member = await getMember();

    if (member.error) {
      return member.error;
    }

    const dietProfile =
      await DietProfile.findOne({
        user: member.user._id,
        isActive: true,
      }).lean();

    return NextResponse.json({
      success: true,
      dietProfile: dietProfile || null,
    });
  } catch (error) {
    console.error(
      "DIET PROFILE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load diet profile.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * CREATE DIET PROFILE
 * =========================================================
 */

export async function POST(request) {
  try {
    const member = await getMember();

    if (member.error) {
      return member.error;
    }

    const body = await request.json();

    const validation =
      validateProfile(body);

    if (validation.error) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const existingProfile =
      await DietProfile.findOne({
        user: member.user._id,
        isActive: true,
      });

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have a diet profile. Please update your existing profile.",
        },
        { status: 409 }
      );
    }

    const profileData =
      validation.data;

    const dietProfile =
      await DietProfile.create({
        user: member.user._id,

        age: profileData.age,

        gender:
          member.user.gender ||
          profileData.gender,

        heightCm:
          profileData.heightCm,

        currentWeightKg:
          profileData.currentWeightKg,

        goal:
          profileData.goal,

        dietType:
          profileData.dietType,

        nonVegRestrictedDays:
          profileData.nonVegRestrictedDays,

        workoutDaysPerWeek:
          profileData.workoutDaysPerWeek,

        dietStartDate: new Date(),

        currentPhase: 1,

        isActive: true,
      });

    /*
     * First progress entry.
     *
     * This gives us the starting weight so
     * future progress can be compared with
     * the member's original weight.
     */

    await DietProgress.create({
      user: member.user._id,

      dietProfile:
        dietProfile._id,

      recordedAt: new Date(),

      weightKg:
        profileData.currentWeightKg,

      workoutDaysPerWeek:
        profileData.workoutDaysPerWeek,

      energyLevel: "normal",

      goalProgress: "not_sure",

      notes:
        "Initial diet profile measurement.",
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Diet profile created successfully.",

        dietProfile:
          dietProfile.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "DIET PROFILE CREATE ERROR:",
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A diet profile already exists for this member.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create diet profile.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * UPDATE DIET PROFILE
 * =========================================================
 */

export async function PATCH(request) {
  try {
    const member = await getMember();

    if (member.error) {
      return member.error;
    }

    const body = await request.json();

    const validation =
      validateProfile(body);

    if (validation.error) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const dietProfile =
      await DietProfile.findOne({
        user: member.user._id,
        isActive: true,
      });

    if (!dietProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Diet profile not found.",
        },
        { status: 404 }
      );
    }

    const profileData =
      validation.data;

    const oldWeight =
      Number(
        dietProfile.currentWeightKg
      );

    const newWeight =
      Number(
        profileData.currentWeightKg
      );

    dietProfile.age =
      profileData.age;

    dietProfile.gender =
      member.user.gender ||
      profileData.gender;

    dietProfile.heightCm =
      profileData.heightCm;

    dietProfile.currentWeightKg =
      newWeight;

    dietProfile.goal =
      profileData.goal;

    dietProfile.dietType =
      profileData.dietType;

    dietProfile.nonVegRestrictedDays =
      profileData.nonVegRestrictedDays;

    dietProfile.workoutDaysPerWeek =
      profileData.workoutDaysPerWeek;

    /*
     * Determine the diet phase from how
     * long the member has been using the
     * diet planner.
     */

    const now = new Date();

    const startDate =
      new Date(
        dietProfile.dietStartDate
      );

    const elapsedMs =
      now.getTime() -
      startDate.getTime();

    const elapsedDays =
      Math.max(
        0,
        Math.floor(
          elapsedMs /
            (1000 * 60 * 60 * 24)
        )
      );

    if (elapsedDays < 28) {
      dietProfile.currentPhase = 1;
    } else if (elapsedDays < 84) {
      dietProfile.currentPhase = 2;
    } else {
      dietProfile.currentPhase = 3;
    }

    await dietProfile.save();

    /*
     * Add a progress record only when
     * weight actually changes.
     *
     * This prevents every small profile
     * edit from creating fake progress
     * history.
     */

    if (
      Math.abs(
        newWeight - oldWeight
      ) >= 0.1
    ) {
      await DietProgress.create({
        user: member.user._id,

        dietProfile:
          dietProfile._id,

        recordedAt: new Date(),

        weightKg: newWeight,

        workoutDaysPerWeek:
          profileData.workoutDaysPerWeek,

        energyLevel: "normal",

        goalProgress: "not_sure",

        notes:
          "Weight updated from diet profile.",
      });
    }

    return NextResponse.json({
      success: true,

      message:
        "Diet profile updated successfully.",

      dietProfile:
        dietProfile.toObject(),
    });
  } catch (error) {
    console.error(
      "DIET PROFILE UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update diet profile.",
      },
      { status: 500 }
    );
  }
}