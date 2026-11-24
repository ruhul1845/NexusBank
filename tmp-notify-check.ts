import fs from "node:fs";
import path from "node:path";

async function main() {
  const raw = fs.readFileSync(path.resolve(".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }

  const { prisma } = await import("./src/lib/prisma");
  const { notifyUserWithEmail } = await import("./src/lib/mailer");

  const user = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log("NO_CUSTOMER_USER_FOUND");
    process.exit(1);
  }

  console.log("TARGET_USER=" + user.email);

  const emailSent = await notifyUserWithEmail({
    userId: user.id,
    email: process.env.SMTP_USER as string,
    name: user.name,
    title: "End-to-End Notification Test",
    message: "This notification was produced by notifyUserWithEmail().",
    type: "SECURITY",
    details: {
      "Reference ID": "TEST-NOTIFY-001",
      Amount: "৳0.00",
      Channel: "SMTP",
    },
  });

  const row = await prisma.notification.findFirst({
    where: { userId: user.id, title: "End-to-End Notification Test" },
    orderBy: { createdAt: "desc" },
  });

  console.log("EMAIL_SENT=" + emailSent);
  console.log("DB_ROW_CREATED=" + Boolean(row));
  console.log("DB_ROW_EMAIL_SENT_FLAG=" + (row ? row.emailSent : "n/a"));

  await prisma.$disconnect();
  process.exit(emailSent && row ? 0 : 1);
}

main().catch((err) => {
  console.log("NOTIFY_SCRIPT_ERROR=" + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
