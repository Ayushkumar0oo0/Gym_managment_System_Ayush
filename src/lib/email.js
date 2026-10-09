
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS?.replace(/\s/g, "");

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!smtpUser || !smtpPass || !transporter) {
    throw new Error("Gmail SMTP credentials are not configured.");
  }

  if (!to || !resetUrl) {
    throw new Error("Recipient email and reset URL are required.");
  }

  const displayName = name?.trim() || "Member";

  try {
    const result = await transporter.sendMail({
      from: `"Gym Management" <${smtpUser}>`,
      to,
      subject: "Reset your gym account password",
      text: [
        `Hello ${displayName},`,
        "",
        "We received a request to reset your gym account password.",
        `Reset your password using this link: ${resetUrl}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
          <h2>Reset Your Password</h2>
          <p>Hello ${escapeHtml(displayName)},</p>
          <p>We received a request to reset your Gym Management account password.</p>
          <p style="margin:28px 0">
            <a href="${escapeHtml(resetUrl)}"
               style="background:#16a34a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p style="font-size:12px;color:#666">If the button doesn't work, copy this link into your browser:</p>
          <p style="font-size:12px;word-break:break-all">${escapeHtml(resetUrl)}</p>
        </div>
      `,
    });

    console.log("PASSWORD RESET EMAIL SENT:", result.messageId);
    return result;
  } catch (error) {
    console.error("GMAIL SMTP ERROR:", error);
    throw new Error("Failed to send password reset email.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
