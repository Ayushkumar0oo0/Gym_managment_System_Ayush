import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DietProfile from "@/models/DietProfile";
import DietProgress from "@/models/DietProgress";
import generateDietPlan from "@/lib/diet/generator";

async function getAuthenticatedMember() {
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
          message: "Only members can access the diet planner.",
        },
        { status: 403 }
      ),
    };
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("_id name email role isActive")
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

async function getProfile(userId) {
  return DietProfile.findOne({
    user: userId,
    isActive: true,
  }).lean();
}

async function getProgress(userId, dietProfileId) {
  return DietProgress.find({
    user: userId,
    dietProfile: dietProfileId,
  })
    .sort({ recordedAt: 1 })
    .lean();
}

/*
 * =========================================================
 * GET CURRENT DIET
 * =========================================================
 */

export async function GET() {
  try {
    const member =
      await getAuthenticatedMember();

    if (member.error) {
      return member.error;
    }

    const profile =
      await getProfile(
        member.user._id
      );

    if (!profile) {
      return NextResponse.json(
        {
          success: true,
          dietProfile: null,
          dietPlan: null,
          message:
            "Please create your diet profile first.",
        }
      );
    }

    const progress =
      await getProgress(
        member.user._id,
        profile._id
      );

    const dietPlan =
      generateDietPlan({
        profile,
        progress,
      });

    return NextResponse.json({
      success: true,

      dietProfile: profile,

      dietPlan,

      progress: {
        count: progress.length,
        latest:
          progress.length > 0
            ? progress[
                progress.length - 1
              ]
            : null,
      },
    });
  } catch (error) {
    console.error(
      "MEMBER DIET GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate your diet.",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * GENERATE / REFRESH DIET
 * =========================================================
 */

export async function POST() {
  try {
    const member =
      await getAuthenticatedMember();

    if (member.error) {
      return member.error;
    }

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
        { status: 400 }
      );
    }

    /*
     * Update phase based on how long the
     * member has been using the diet.
     */

    const now = new Date();

    const startDate =
      new Date(
        profile.dietStartDate
      );

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

    let phase = 1;

    if (elapsedDays >= 84) {
      phase = 3;
    } else if (elapsedDays >= 28) {
      phase = 2;
    }

    profile.currentPhase =
      phase;

    await profile.save();

    const progress =
      await getProgress(
        member.user._id,
        profile._id
      );

    const dietPlan =
      generateDietPlan({
        profile:
          profile.toObject(),
        progress,
      });

    return NextResponse.json({
      success: true,

      message:
        "Diet generated successfully.",

      dietPlan,

      dietProfile:
        profile.toObject(),
    });
  } catch (error) {
    console.error(
      "MEMBER DIET GENERATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate your diet.",
      },
      { status: 500 }
    );
  }
}