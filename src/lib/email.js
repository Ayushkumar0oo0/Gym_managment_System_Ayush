
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.replace(/\s/g, "");

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      })
    : null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateRecipient(to) {
  if (
    typeof to !== "string" ||
    to.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())
  ) {
    throw new Error("A valid recipient email is required.");
  }

  return to.trim();
}

function validateResetUrl(resetUrl) {
  if (typeof resetUrl !== "string") {
    throw new Error("A valid reset URL is required.");
  }

  let url;

  try {
    url = new URL(resetUrl);
  } catch {
    throw new Error("Invalid password reset URL.");
  }

  const isDevelopment =
    process.env.NODE_ENV !== "production";

  const isLocalhost =
    isDevelopment &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if (url.protocol !== "https:" && !isLocalhost) {
    throw new Error(
      "Password reset URL must use HTTPS in production."
    );
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/reset-password" ||
    !url.searchParams.has("token")
  ) {
    throw new Error("Invalid password reset URL.");
  }

  // In production, only allow the configured application host.
  if (process.env.NODE_ENV === "production") {
    const configuredUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL;

    if (!configuredUrl) {
      throw new Error(
        "Production application URL is not configured."
      );
    }

    const expectedUrl = new URL(configuredUrl);

    if (
      expectedUrl.protocol !== "https:" ||
      url.origin !== expectedUrl.origin
    ) {
      throw new Error(
        "Password reset URL does not match the application URL."
      );
    }
  }

  return url;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}) {
  if (!smtpUser || !smtpPass || !transporter) {
    throw new Error(
      "Gmail SMTP credentials are not configured."
    );
  }

  const recipient = validateRecipient(to);
  const parsedUrl = validateResetUrl(resetUrl);

  const displayName =
    typeof name === "string" && name.trim()
      ? name.trim().slice(0, 100)
      : "Member";

  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(parsedUrl.toString());

  try {
    const result = await transporter.sendMail({
      from: `"Gym Management" <${smtpUser}>`,
      to: recipient,
      subject: "Reset your gym account password",

      text: [
        `Hello ${displayName},`,
        "",
        "We received a request to reset your gym account password.",
        `Reset your password using this link: ${parsedUrl.toString()}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),

      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
          <h2>Reset Your Password</h2>
          <p>Hello ${safeName},</p>
          <p>We received a request to reset your Gym Management account password.</p>
          <p style="margin:28px 0">
            <a
              href="${safeUrl}"
              style="background:#16a34a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block"
            >
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p style="font-size:12px;color:#666">
            If the button doesn't work, copy this link into your browser:
          </p>
          <p style="font-size:12px;word-break:break-all">
            ${safeUrl}
          </p>
        </div>
      `,
    });

    console.log("PASSWORD RESET EMAIL SENT:", {
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    // Avoid logging the reset URL, credentials, or raw SMTP response.
    console.error("GMAIL SMTP ERROR:", {
      code: error?.code,
      responseCode: error?.responseCode,
    });

    throw new Error("Failed to send password reset email.");
  }
}
