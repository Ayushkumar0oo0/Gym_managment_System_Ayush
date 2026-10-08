import Notification from "@/models/Notification";

export async function createNotification({
  user,
  type,
  title,
  message,
  productOrder = null,
  link = null,
}) {
  try {
    if (!user) {
      throw new Error(
        "User is required to create notification."
      );
    }

    if (!type) {
      throw new Error(
        "Notification type is required."
      );
    }

    if (!title) {
      throw new Error(
        "Notification title is required."
      );
    }

    if (!message) {
      throw new Error(
        "Notification message is required."
      );
    }

    const notification =
      await Notification.create({
        user,
        type,
        title,
        message,
        productOrder,
        link,
        isRead: false,
      });

    return notification;
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

    throw error;
  }
}