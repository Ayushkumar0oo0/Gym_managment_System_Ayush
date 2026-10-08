// src/app/api/member/workout-machines/route.js

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import WorkoutMachine from "@/models/WorkoutMachine";
import MACHINES from "@/lib/workouts/machines";

export const runtime = "nodejs";

/* =========================================================
   DEFAULT WORKOUT ROTATION
========================================================= */

const WORKOUT_SCHEDULE = {
  monday: {
    day: "monday",
    groupId: "A",
    groupName: "Strength A",
    muscleGroups: ["chest", "triceps"],
    isRestDay: false,
  },

  tuesday: {
    day: "tuesday",
    groupId: "B",
    groupName: "Strength B",
    muscleGroups: ["legs"],
    isRestDay: false,
  },

  wednesday: {
    day: "wednesday",
    groupId: "A",
    groupName: "Strength A",
    muscleGroups: ["shoulders", "core"],
    isRestDay: false,
  },

  thursday: {
    day: "thursday",
    groupId: "C",
    groupName: "Strength C",
    muscleGroups: ["back", "biceps"],
    isRestDay: false,
  },

  friday: {
    day: "friday",
    groupId: "A",
    groupName: "Strength A",
    muscleGroups: ["chest", "triceps"],
    isRestDay: false,
  },

  saturday: {
    day: "B",
    groupId: "B",
    groupName: "Strength B",
    muscleGroups: ["legs", "shoulders"],
    isRestDay: false,
  },

  sunday: {
    day: "sunday",
    groupId: null,
    groupName: "Recovery",
    muscleGroups: [],
    isRestDay: true,
  },
};

/* =========================================================
   FIX SATURDAY DAY VALUE
========================================================= */

WORKOUT_SCHEDULE.saturday.day = "saturday";

/* =========================================================
   HELPERS
========================================================= */

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeMuscleGroup(value) {
  const normalized = normalizeValue(value);

  const aliases = {
    arms: [
      "arms",
      "biceps",
      "triceps",
      "forearms",
    ],

    core: [
      "core",
      "abs",
      "abdominals",
    ],

    legs: [
      "legs",
      "glutes",
      "calves",
      "hamstrings",
      "quadriceps",
      "quads",
    ],

    chest: [
      "chest",
    ],

    back: [
      "back",
      "lats",
      "latissimus_dorsi",
    ],

    shoulders: [
      "shoulders",
      "delts",
      "deltoids",
    ],

    biceps: [
      "biceps",
      "arms",
      "forearms",
    ],

    triceps: [
      "triceps",
      "arms",
      "forearms",
    ],

    cardio: [
      "cardio",
    ],

    full_body: [
      "full_body",
      "fullbody",
      "full-body",
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs",
      "core",
    ],
  };

  return aliases[normalized] || [normalized];
}

/* =========================================================
   BUILD MACHINE FILTER
========================================================= */

function buildMachineFilter(muscleGroups) {
  const requestedParts = muscleGroups.flatMap(
    normalizeMuscleGroup
  );

  const uniqueParts = [
    ...new Set(
      requestedParts
        .map(normalizeValue)
        .filter(Boolean)
    ),
  ];

  if (!uniqueParts.length) {
    return {
      isActive: true,
    };
  }

  const bodyPartVariants = [
    ...new Set([
      ...uniqueParts,

      ...uniqueParts.map((value) =>
        value.replaceAll("_", " ")
      ),

      ...uniqueParts.map((value) =>
        value.replaceAll("_", "-")
      ),
    ]),
  ];

  const categoryVariants = [
    ...new Set(
      muscleGroups.flatMap((group) => {
        const normalized =
          normalizeValue(group);

        return [
          normalized,
          normalized.replaceAll("_", "-"),
          normalized.replaceAll("_", " "),
        ];
      })
    ),
  ];

  return {
    isActive: true,

    $or: [
      {
        bodyParts: {
          $in: bodyPartVariants,
        },
      },

      {
        category: {
          $in: categoryVariants,
        },
      },

      {
        muscleGroups: {
          $in: bodyPartVariants,
        },
      },
    ],
  };
}

/* =========================================================
   SERIALIZE MACHINE
========================================================= */

function serializeMachine(machine) {
  return {
    key: machine.key,

    name: machine.name,

    shortName: machine.shortName,

    category: machine.category,

    bodyParts: machine.bodyParts || [],

    muscleGroups: machine.muscleGroups || [],

    exerciseType: machine.exerciseType,

    equipmentType: machine.equipmentType,

    description: machine.description,

    instructions: machine.instructions || [],

    tips: machine.tips || [],

    commonMistakes:
      machine.commonMistakes || [],

    difficulty: machine.difficulty,

    defaultSets: machine.defaultSets,

    defaultReps: machine.defaultReps,

    defaultRestSeconds:
      machine.defaultRestSeconds,

    recommendedMachineKeys:
      machine.recommendedMachineKeys || [],

    alternativeMachineKeys:
      machine.alternativeMachineKeys || [],

    imageUrl: machine.imageUrl,

    tutorialUrl: machine.tutorialUrl,

    tutorialPlatform:
      machine.tutorialPlatform,

    displayOrder: machine.displayOrder,
  };
}

/* =========================================================
   DEFAULT CATALOG
========================================================= */

async function ensureDefaultCatalog() {
  for (const machine of MACHINES) {
    await WorkoutMachine.updateOne(
      {
        key: machine.key,
      },

      {
        $setOnInsert: {
          ...machine,
          isDefaultCatalogItem: true,
          isActive: true,
        },
      },

      {
        upsert: true,
      }
    );
  }
}

/* =========================================================
   GET TODAY
========================================================= */

function getCurrentDay() {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date().getDay()];
}

/* =========================================================
   GET WEEKLY SCHEDULE
========================================================= */

function getWeeklySchedule() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return days.map((day) => {
    const workout = WORKOUT_SCHEDULE[day];

    return {
      day: workout.day,
      groupId: workout.groupId,
      groupName: workout.groupName,
      muscleGroups: workout.muscleGroups,
      isRestDay: workout.isRestDay,
    };
  });
}

/* =========================================================
   GET
========================================================= */

export async function GET(request) {
  try {
    /* -----------------------------------------------------
       AUTH
    ----------------------------------------------------- */

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "member" &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        {
          status: 403,
        }
      );
    }

    /* -----------------------------------------------------
       DATABASE
    ----------------------------------------------------- */

    await connectDB();

    await ensureDefaultCatalog();

    /* -----------------------------------------------------
       QUERY PARAMETERS
    ----------------------------------------------------- */

    const { searchParams } =
      new URL(request.url);

    const category =
      searchParams.get("category") || "";

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const mode =
      searchParams.get("mode") || "today";

    /* -----------------------------------------------------
       MEMBER
    ----------------------------------------------------- */

    const memberId = session.user.id;

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member identity could not be determined.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       TODAY'S WORKOUT
    ----------------------------------------------------- */

    const currentDay = getCurrentDay();

    const todayWorkout =
      WORKOUT_SCHEDULE[currentDay];

    /* -----------------------------------------------------
       WEEKLY SCHEDULE
    ----------------------------------------------------- */

    const weeklySchedule =
      getWeeklySchedule();

    /* -----------------------------------------------------
       REST DAY
    ----------------------------------------------------- */

    if (todayWorkout.isRestDay) {
      return NextResponse.json({
        success: true,

        today: {
          day: todayWorkout.day,

          groupId: todayWorkout.groupId,

          groupName: todayWorkout.groupName,

          muscleGroups: [],

          isRestDay: true,

          title: "Recovery Day",

          description:
            "Take a rest day and allow your muscles to recover.",
        },

        weeklySchedule,

        machines: [],

        count: 0,

        mode,
      });
    }

    /* -----------------------------------------------------
       MUSCLE GROUPS
    ----------------------------------------------------- */

    const workoutMuscleGroups =
      Array.isArray(
        todayWorkout.muscleGroups
      )
        ? todayWorkout.muscleGroups
        : [];

    /* -----------------------------------------------------
       BUILD FILTER
    ----------------------------------------------------- */

    let filter =
      buildMachineFilter(
        workoutMuscleGroups
      );

    /* -----------------------------------------------------
       CATEGORY FILTER
    ----------------------------------------------------- */

    if (
      category &&
      category !== "all"
    ) {
      filter = {
        $and: [
          filter,

          {
            category: {
              $regex: `^${category}$`,
              $options: "i",
            },
          },
        ],
      };
    }

    /* -----------------------------------------------------
       SEARCH FILTER
    ----------------------------------------------------- */

    if (search) {
      filter = {
        $and: [
          filter,

          {
            $or: [
              {
                name: {
                  $regex: search,
                  $options: "i",
                },
              },

              {
                shortName: {
                  $regex: search,
                  $options: "i",
                },
              },

              {
                bodyParts: {
                  $regex: search,
                  $options: "i",
                },
              },

              {
                muscleGroups: {
                  $regex: search,
                  $options: "i",
                },
              },

              {
                equipmentType: {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        ],
      };
    }

    /* -----------------------------------------------------
       LOAD MACHINES
    ----------------------------------------------------- */

    const machines =
      await WorkoutMachine.find(filter)
        .select(
          [
            "key",
            "name",
            "shortName",
            "category",
            "bodyParts",
            "muscleGroups",
            "exerciseType",
            "equipmentType",
            "description",
            "instructions",
            "tips",
            "commonMistakes",
            "difficulty",
            "defaultSets",
            "defaultReps",
            "defaultRestSeconds",
            "recommendedMachineKeys",
            "alternativeMachineKeys",
            "imageUrl",
            "tutorialUrl",
            "tutorialPlatform",
            "displayOrder",
          ].join(" ")
        )
        .sort({
          displayOrder: 1,
          name: 1,
        })
        .lean();

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return NextResponse.json({
      success: true,

      today: {
        day: todayWorkout.day,

        groupId: todayWorkout.groupId,

        groupName: todayWorkout.groupName,

        muscleGroups:
          workoutMuscleGroups,

        isRestDay: false,

        title:
          workoutMuscleGroups
            .map((group) =>
              String(group)
                .replaceAll("_", " ")
                .replace(
                  /\b\w/g,
                  (letter) =>
                    letter.toUpperCase()
                )
            )
            .join(" + "),

        description:
          "Complete today's recommended workout using the available gym equipment.",
      },

      weeklySchedule,

      machines:
        machines.map(serializeMachine),

      count: machines.length,

      mode,
    });
  } catch (error) {
    console.error(
      "GET /api/member/workout-machines error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Failed to load today's workout.",
      },
      {
        status: 500,
      }
    );
  }
}