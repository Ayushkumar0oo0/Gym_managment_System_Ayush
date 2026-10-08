import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Gym Management <onboarding@resend.dev>";

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!to || !resetUrl) {
    throw new Error("Recipient email and reset URL are required.");
  }

  const displayName = name?.trim() || "Member";

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Reset your gym account password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #09090b;
            font-family: Arial, Helvetica, sans-serif;
            color: #ffffff;
          "
        >
          <div style="padding: 40px 16px;">
            <div
              style="
                max-width: 560px;
                margin: 0 auto;
                background-color: #18181b;
                border: 1px solid #27272a;
                border-radius: 20px;
                overflow: hidden;
              "
            >
              <!-- Header -->
              <div
                style="
                  padding: 30px;
                  background: linear-gradient(
                    135deg,
                    #f97316 0%,
                    #ea580c 100%
                  );
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 800;
                  "
                >
                  Gym Management
                </h1>

                <p
                  style="
                    margin: 8px 0 0;
                    color: rgba(255,255,255,0.9);
                    font-size: 14px;
                  "
                >
                  Account Security
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <h2
                  style="
                    margin: 0 0 16px;
                    color: #ffffff;
                    font-size: 24px;
                  "
                >
                  Reset your password
                </h2>

                <p
                  style="
                    margin: 0 0 16px;
                    color: #d4d4d8;
                    font-size: 15px;
                    line-height: 1.7;
                  "
                >
                  Hi ${escapeHtml(displayName)},
                </p>

                <p
                  style="
                    margin: 0 0 24px;
                    color: #a1a1aa;
                    font-size: 15px;
                    line-height: 1.7;
                  "
                >
                  We received a request to reset the password for your gym
                  account. Click the button below to create a new password.
                </p>

                <!-- Button -->
                <div style="margin: 28px 0;">
                  <a
                    href="${escapeHtml(resetUrl)}"
                    style="
                      display: inline-block;
                      padding: 14px 24px;
                      background-color: #f97316;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 10px;
                      font-size: 15px;
                      font-weight: 700;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <p
                  style="
                    margin: 0 0 12px;
                    color: #a1a1aa;
                    font-size: 13px;
                    line-height: 1.6;
                  "
                >
                  This password reset link will expire in
                  <strong style="color:#ffffff;">15 minutes</strong>.
                </p>

                <p
                  style="
                    margin: 24px 0 0;
                    padding: 16px;
                    background-color: #27272a;
                    border-radius: 10px;
                    color: #a1a1aa;
                    font-size: 12px;
                    line-height: 1.6;
                    word-break: break-all;
                  "
                >
                  If the button doesn't work, copy and paste this link into
                  your browser:
                  <br />
                  <span style="color:#fb923c;">
                    ${escapeHtml(resetUrl)}
                  </span>
                </p>

                <p
                  style="
                    margin: 28px 0 0;
                    color: #71717a;
                    font-size: 12px;
                    line-height: 1.6;
                  "
                >
                  If you did not request a password reset, you can safely
                  ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <!-- Footer -->
              <div
                style="
                  padding: 20px 32px;
                  border-top: 1px solid #27272a;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #52525b;
                    font-size: 11px;
                  "
                >
                  © ${new Date().getFullYear()} Gym Management. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("RESEND EMAIL ERROR:", error);
    throw new Error("Failed to send password reset email.");
  }

  console.log("PASSWORD RESET EMAIL SENT:", data?.id);

  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}