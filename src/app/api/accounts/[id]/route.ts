import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateAccountSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN", "CLOSED"]).optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).optional(),
  dailyTransferLimit: z.number().min(0).optional(),
  maxSingleTransfer: z.number().min(0).optional(),
  minBalance: z.number().min(0).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.bankAccount.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, isVerified: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      balance: Number(updated.balance),
      dailyTransferLimit: Number(updated.dailyTransferLimit),
      maxSingleTransfer: Number(updated.maxSingleTransfer),
      minBalance: Number(updated.minBalance),
    });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Failed to update bank account" }, { status: 500 });
  }
}
