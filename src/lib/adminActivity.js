import AdminActivity from "@/models/AdminActivity";

/**
 * Create an activity log for an admin action.
 *
 * This function is intentionally designed so that
 * an activity-log failure does NOT break the main
 * business operation.
 */
export async function logAdminActivity({
  adminId,
  action,
  entityType = null,
  entityId = null,
  description,
  metadata = {},
}) {
  try {
    // Basic validation
    if (!adminId) {
      console.error("ADMIN ACTIVITY ERROR: adminId is required");
      return null;
    }

    if (!action) {
      console.error("ADMIN ACTIVITY ERROR: action is required");
      return null;
    }

    if (!description) {
      console.error("ADMIN ACTIVITY ERROR: description is required");
      return null;
    }

    // Create activity record
    const activity = await AdminActivity.create({
      admin: adminId,
      action,
      entityType,
      entityId,
      description,
      metadata,
    });

    return activity;
  } catch (error) {
    /*
     * IMPORTANT:
     *
     * If activity logging fails, we don't want to
     * cancel the actual operation.
     *
     * Example:
     *
     * Cash payment = successfully confirmed
     * Activity log = failed
     *
     * The payment should still remain confirmed.
     */
    console.error("ADMIN ACTIVITY LOG ERROR:", error);

    return null;
  }
}