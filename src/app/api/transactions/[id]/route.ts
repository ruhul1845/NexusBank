import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({
  action: z.enum(["FLAG", "CLEAR_FLAG", "REVERSE"]),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { action, reason } = parsed.data;

    if ((action === "REVERSE" || action === "CLEAR_FLAG") && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admin can reverse or clear flagged transactions" }, { status: 403 });
    }

    if (action === "FLAG") {
      const updated = await prisma.transaction.update({
        where: { id: params.id },
        data: {
          isFlagged: true,
          flagReason: reason || "Flagged by Bank Staff for Admin review",
          reviewedById: session.user.id,
        },
      });
      return NextResponse.json({ ...updated, amount: Number(updated.amount), fee: Number(updated.fee) });
    }

    if (action === "CLEAR_FLAG") {
      const updated = await prisma.transaction.update({
        where: { id: params.id },
        data: { isFlagged: false, flagReason: null, reviewedById: session.user.id },
      });
      return NextResponse.json({ ...updated, amount: Number(updated.amount), fee: Number(updated.fee) });
    }

    // REVERSE transaction atomically
    const reversed = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.findUnique({ where: { id: params.id } });
      if (!txn) throw new Error("Transaction not found");
      if (txn.status !== "COMPLETED") throw new Error("Only completed transactions can be reversed");

      const amt = Number(txn.amount);
      if (txn.senderAccountId) {
        await tx.bankAccount.update({
          where: { id: txn.senderAccountId },
          data: { balance: { increment: amt } },
        });
      }
      if (txn.receiverAccountId) {
        await tx.bankAccount.update({
          where: { id: txn.receiverAccountId },
          data: { balance: { decrement: amt } },
        });
      }

      return tx.transaction.update({
        where: { id: params.id },
        data: { status: "REVERSED", isFlagged: false, reviewedById: session.user.id },
      });
    });

    return NextResponse.json({ ...reversed, amount: Number(reversed.amount), fee: Number(reversed.fee) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update transaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
