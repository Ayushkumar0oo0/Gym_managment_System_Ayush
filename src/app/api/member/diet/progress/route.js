import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DietProfile from "@/models/DietProfile";
import DietProgress from "@/models/DietProgress";

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
            "Only members can update diet progress.",
        },
        { status: 403 }
      ),
    };
  }

  await connectDB();

  const user = await User.findById(
    session.user.id
  )
    .select("_id name isActive")
    .lean();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Member account not found.",
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
          message: "Your account is inactive.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
  };
}

/*
 * =========================================================
 * GET PROGRESS HISTORY
 * =========================================================
 */

export async function GET() {
  try {
    const member = await getMember();

    if (member.error) {
      return member.error;
    }

    const profile =
      await DietProfile.findOne({
        user: member.user._id,
        isActive: true,
      }).lean();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please create your diet profile first.",
        },
        { status: 404 }
      );
    }

    const progress =
      await DietProgress.find({
        user: member.user._id,
        dietProfile: profile._id,
      })
        .sort({ recordedAt: -1 })
        .lean();

    const latest =
      progress.length > 0
        ? progress[0]
        : null;

    const oldest =
      progress.length > 0
        ? progress[
            progress.length - 1
          ]
        : null;

    let weightChange = 0;

    if (latest && oldest) {
      weightChange =
        Number(latest.weightKg) -
        Number(oldest.weightKg);
    }

    return NextResponse.json({
      success: true,

      progress,

      summary: {
        totalEntries:
          progress.length,

        startingWeight:
          oldest
            ? oldest.weightKg
            : profile.currentWeightKg,

        currentWeight:
          latest
            ? latest.weightKg
            : profile.currentWeightKg,

        weightChange:
          Math.round(
            weightChange * 10
          ) / 10,

        latestRecordedAt:
          latest?.recordedAt ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "DIET PROGRESS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load progress.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * ADD PROGRESS ENTRY
 * =========================================================
 */

export async function POST(request) {
  try {
    const member = await getMember();

    if (member.error) {
      return member.error;
    }

    const body =
      await request.json();

    const weightKg =
      Number(body.weightKg);

    const workoutDaysPerWeek =
      Number(
        body.workoutDaysPerWeek
      );

    const energyLevel =
      String(
        body.energyLevel || "normal"
      )
        .trim()
        .toLowerCase();

    const goalProgress =
      String(
        body.goalProgress ||
          "not_sure"
      )
        .trim()
        .toLowerCase();

    const notes =
      String(
        body.notes || ""
      ).trim();

    /*
     * -----------------------------------------
     * VALIDATION
     * -----------------------------------------
     */

    if (
      !Number.isFinite(weightKg) ||
      weightKg < 30 ||
      weightKg > 300
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Weight must be between 30 kg and 300 kg.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(
        workoutDaysPerWeek
      ) ||
      workoutDaysPerWeek < 0 ||
      workoutDaysPerWeek > 7
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Workout days must be between 0 and 7.",
        },
        { status: 400 }
      );
    }

    const allowedEnergyLevels = [
      "low",
      "normal",
      "good",
      "high",
    ];

    if (
      !allowedEnergyLevels.includes(
        energyLevel
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid energy level.",
        },
        { status: 400 }
      );
    }

    const allowedGoalProgress = [
  "too_slow",
  "on_track",
  "too_fast",
  "not_sure",
];

    if (
      !allowedGoalProgress.includes(
        goalProgress
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid goal progress value.",
        },
        { status: 400 }
      );
    }

    if (notes.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notes cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------
     * FIND PROFILE
     * -----------------------------------------
     */

    const profile =
      await DietProfile.findOne({
        user: member.user._id,
        isActive: true,
      });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please create your diet profile first.",
        },
        { status: 404 }
      );
    }

    /*
     * -----------------------------------------
     * PREVENT ACCIDENTAL DUPLICATES
     * -----------------------------------------
     *
     * If someone accidentally submits the same
     * weight twice on the same day, don't create
     * multiple progress records.
     */

    const startOfToday =
      new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );

    const endOfToday =
      new Date();

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );

    const existingToday =
      await DietProgress.findOne({
        user: member.user._id,

        dietProfile:
          profile._id,

        recordedAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }).sort({
        recordedAt: -1,
      });

    if (existingToday) {
      existingToday.weightKg =
        weightKg;

      existingToday.workoutDaysPerWeek =
        workoutDaysPerWeek;

      existingToday.energyLevel =
        energyLevel;

      existingToday.goalProgress =
        goalProgress;

      existingToday.notes =
        notes;

      await existingToday.save();

      /*
       * Keep the profile's current weight
       * synchronized with the latest progress.
       */

      profile.currentWeightKg =
        weightKg;

      profile.workoutDaysPerWeek =
        workoutDaysPerWeek;

      await profile.save();

      return NextResponse.json({
        success: true,

        message:
          "Today's progress was updated.",

        progress:
          existingToday.toObject(),

        updated:
          true,
      });
    }

    /*
     * -----------------------------------------
     * CREATE NEW PROGRESS ENTRY
     * -----------------------------------------
     */

    const progress =
      await DietProgress.create({
        user: member.user._id,

        dietProfile:
          profile._id,

        recordedAt: new Date(),

        weightKg,

        workoutDaysPerWeek,

        energyLevel,

        goalProgress,

        notes,
      });

    /*
     * -----------------------------------------
     * UPDATE PROFILE
     * -----------------------------------------
     */

    profile.currentWeightKg =
      weightKg;

    profile.workoutDaysPerWeek =
      workoutDaysPerWeek;

    /*
     * Update phase according to the time
     * since the member first created the
     * diet profile.
     */

    const startDate =
      new Date(
        profile.dietStartDate
      );

    const now =
      new Date();

    const elapsedDays =
      Math.max(
        0,
        Math.floor(
          (now.getTime() -
            startDate.getTime()) /
            (1000 *
              60 *
              60 *
              24)
        )
      );

    if (elapsedDays < 28) {
      profile.currentPhase = 1;
    } else if (elapsedDays < 84) {
      profile.currentPhase = 2;
    } else {
      profile.currentPhase = 3;
    }

    await profile.save();

    /*
     * -----------------------------------------
     * CALCULATE WEIGHT CHANGE
     * -----------------------------------------
     */

    const firstProgress =
      await DietProgress.findOne({
        user: member.user._id,
        dietProfile:
          profile._id,
      }).sort({
        recordedAt: 1,
      });

    const weightChange =
      firstProgress
        ? weightKg -
          Number(
            firstProgress.weightKg
          )
        : 0;

    return NextResponse.json(
      {
        success: true,

        message:
          "Progress recorded successfully.",

        progress:
          progress.toObject(),

        summary: {
          startingWeight:
            firstProgress
              ? firstProgress.weightKg
              : weightKg,

          currentWeight:
            weightKg,

          weightChange:
            Math.round(
              weightChange * 10
            ) / 10,

          currentPhase:
            profile.currentPhase,
        },

        updated:
          false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "DIET PROGRESS CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to record progress.",
      },
      { status: 500 }
    );
  }
}