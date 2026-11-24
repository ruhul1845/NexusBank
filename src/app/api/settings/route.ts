import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  defaultDailyTransferLimit: z.number().min(100),
  defaultMaxSingleTransfer: z.number().min(50),
  defaultMinBalance: z.number().min(0),
  transferFeePercent: z.number().min(0).max(10),
  suspiciousAmountThreshold: z.number().min(100),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.bankSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return NextResponse.json({
    defaultDailyTransferLimit: Number(settings.defaultDailyTransferLimit),
    defaultMaxSingleTransfer: Number(settings.defaultMaxSingleTransfer),
    defaultMinBalance: Number(settings.defaultMinBalance),
    transferFeePercent: Number(settings.transferFeePercent),
    suspiciousAmountThreshold: Number(settings.suspiciousAmountThreshold),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only Admin can modify bank-wide financial settings" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid settings" }, { status: 400 });
    }

    const updated = await prisma.bankSettings.update({
      where: { id: "default" },
      data: parsed.data,
    });

    return NextResponse.json({
      defaultDailyTransferLimit: Number(updated.defaultDailyTransferLimit),
      defaultMaxSingleTransfer: Number(updated.defaultMaxSingleTransfer),
      defaultMinBalance: Number(updated.defaultMinBalance),
      transferFeePercent: Number(updated.transferFeePercent),
      suspiciousAmountThreshold: Number(updated.suspiciousAmountThreshold),
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
