// server/src/utils/notify.ts
import axios from "axios";
import nodemailer from "nodemailer";

const WEBHOOK = process.env.NOTIFY_WEBHOOK_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "haroon.amin@mbarieservicesltd.com";

export async function sendWebhook(title: string, message: string, color = 3066993) {
  if (!WEBHOOK) {
    console.warn("No webhook configured. Skipping webhook send.");
    return;
  }
  try {
    const payload = {
      username: "Mbarie FMS Monitor",
      embeds: [
        {
          title,
          description: message,
          color,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    await axios.post(WEBHOOK, payload, { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Webhook send failed:", err?.message || err);
  }
}

export async function sendEmail(subject: string, text: string, html?: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not configured; skipping email.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Mbarie FMS Monitor" <${user}>`,
      to: ADMIN_EMAIL,
      subject,
      text,
      html,
    });
  } catch (err: any) {
    console.error("Send email failed:", err?.message || err);
  }
}

export async function notifyBoth(title: string, message: string) {
  await Promise.all([sendWebhook(title, message), sendEmail(title, message)]);
}
