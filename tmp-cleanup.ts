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

  const removed = await prisma.notification.deleteMany({
    where: { title: { in: ["End-to-End Notification Test"] } },
  });

  console.log("DELETED_TEST_NOTIFICATIONS=" + removed.count);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.log("CLEANUP_ERROR=" + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
