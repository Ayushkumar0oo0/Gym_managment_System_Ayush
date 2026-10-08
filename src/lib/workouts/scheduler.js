// src/lib/workouts/scheduler.js

/*
  Workout rotation system

  Important:
  - No time slots.
  - Only day-based scheduling.
  - Different members can receive different weekly rotations.
  - The rotation is deterministic, so the same member keeps the same group.
  - Sunday is recovery/rest day.
*/

export const WORKOUT_GROUPS = [
  {
    id: "A",
    name: "Strength A",
    days: {
      monday: ["chest", "triceps"],
      tuesday: ["back", "biceps"],
      wednesday: ["legs"],
      thursday: ["shoulders", "core"],
      friday: ["chest", "back"],
      saturday: ["legs", "cardio"],
      sunday: ["rest"],
    },
  },

  {
    id: "B",
    name: "Strength B",
    days: {
      monday: ["back", "biceps"],
      tuesday: ["legs"],
      wednesday: ["shoulders", "core"],
      thursday: ["chest", "triceps"],
      friday: ["legs", "cardio"],
      saturday: ["back", "shoulders"],
      sunday: ["rest"],
    },
  },

  {
    id: "C",
    name: "Strength C",
    days: {
      monday: ["legs"],
      tuesday: ["shoulders", "core"],
      wednesday: ["chest", "triceps"],
      thursday: ["back", "biceps"],
      friday: ["shoulders", "arms"],
      saturday: ["chest", "cardio"],
      sunday: ["rest"],
    },
  },

  {
    id: "D",
    name: "Strength D",
    days: {
      monday: ["shoulders", "core"],
      tuesday: ["chest", "triceps"],
      wednesday: ["back", "biceps"],
      thursday: ["legs"],
      friday: ["chest", "shoulders"],
      saturday: ["back", "cardio"],
      sunday: ["rest"],
    },
  },

  {
    id: "E",
    name: "Strength E",
    days: {
      monday: ["arms", "core"],
      tuesday: ["back", "shoulders"],
      wednesday: ["legs"],
      thursday: ["chest", "triceps"],
      friday: ["back", "biceps"],
      saturday: ["legs", "cardio"],
      sunday: ["rest"],
    },
  },
];

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Get today's day.
 */
export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()];
}

/**
 * Create a stable number from a member id.
 *
 * This means:
 * member A -> one group
 * member B -> another group
 *
 * The same member will continue getting the same group.
 */
function hashMemberId(memberId) {
  const value = String(memberId || "");

  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);

    hash |= 0;
  }

  return Math.abs(hash);
}

/**
 * Assign a member to one of the workout groups.
 */
export function getMemberWorkoutGroup(memberId) {
  if (!memberId) {
    return WORKOUT_GROUPS[0];
  }

  const hash = hashMemberId(memberId);

  return WORKOUT_GROUPS[hash % WORKOUT_GROUPS.length];
}

/**
 * Get today's workout for a member.
 */
export function getTodayWorkout(memberId, date = new Date()) {
  const group = getMemberWorkoutGroup(memberId);
  const day = getTodayName(date);

  const muscleGroups = group.days[day] || ["rest"];

  return {
    groupId: group.id,
    groupName: group.name,
    day,
    muscleGroups,
    isRestDay: muscleGroups.includes("rest"),
  };
}

/**
 * Get complete weekly schedule for a member.
 */
export function getMemberWeeklyWorkout(memberId) {
  const group = getMemberWorkoutGroup(memberId);

  return {
    groupId: group.id,
    groupName: group.name,
    schedule: Object.entries(group.days).map(
      ([day, muscleGroups]) => ({
        day,
        muscleGroups,
        isRestDay: muscleGroups.includes("rest"),
      })
    ),
  };
}

/**
 * Get all workout groups.
 *
 * Useful for admin/debugging.
 */
export function getAllWorkoutGroups() {
  return WORKOUT_GROUPS;
}