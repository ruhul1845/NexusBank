import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || "NexusBank <noreply@nexusbank.local>";

  if (!transporter) {
    console.log(`[Email Service - Console Fallback] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    await transporter.sendMail({ from, to, subject, html, text });
    return true;
  } catch (error) {
    console.error("[Email Service Error]:", error);
    return false;
  }
}

interface NotifyUserParams {
  userId: string;
  email: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  details?: Record<string, string>;
}

export async function notifyUserWithEmail({
  userId,
  email,
  name,
  title,
  message,
  type,
  details,
}: NotifyUserParams) {
  const detailRows = details
    ? Object.entries(details)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${v}</td></tr>`
        )
        .join("")
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#1e1b4b;padding:24px 28px;color:#ffffff;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">NexusBank</div>
        <div style="font-size:13px;color:#c7d2fe;margin-top:4px;">Digital Banking Alert</div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">${title}</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">Hello ${name},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">${message}</p>
        ${
          detailRows
            ? `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:20px;">${detailRows}</table>`
            : ""
        }
        <p style="margin:0;font-size:12px;color:#64748b;">If you did not authorize this activity, please contact NexusBank Security immediately.</p>
      </div>
    </div>
  `;

  const emailSent = await sendEmail({
    to: email,
    subject: `[NexusBank] ${title}`,
    html,
    text: `${title}\n\nHello ${name},\n\n${message}`,
  });

  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      emailSent,
    },
  });

  return emailSent;
}
