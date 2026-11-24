import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateSuspiciousTransaction, formatCurrency, generateReferenceId } from "@/lib/banking";
import { notifyUserWithEmail } from "@/lib/mailer";

const processSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden: Staff or Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = processSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const { decision, rejectionReason } = parsed.data;
    const settings = await prisma.bankSettings.findUnique({ where: { id: "default" } });
    const suspiciousThreshold = Number(settings?.suspiciousAmountThreshold ?? 8000);

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.depositWithdrawalRequest.findUnique({
        where: { id: params.id },
        include: { account: true, user: true },
      });

      if (!request) throw new Error("Request not found");
      if (request.status !== "PENDING") throw new Error("Request has already been processed");
      if (request.userId === session.user.id) {
        throw new Error("You cannot approve or reject your own request.");
      }

      const amt = Number(request.amount);

      if (decision === "REJECTED") {
        const updated = await tx.depositWithdrawalRequest.update({
          where: { id: request.id },
          data: {
            status: "REJECTED",
            processedById: session.user.id,
            processedAt: new Date(),
            rejectionReason: rejectionReason || "Declined by bank review",
          },
        });
        return { updated, transaction: null, user: request.user, account: request.account, amt };
      }

      // APPROVED
      if (request.account.status !== "ACTIVE") {
        throw new Error(`Target account is ${request.account.status.toLowerCase()}`);
      }

      if (request.type === "WITHDRAWAL") {
        const available = Number(request.account.balance) - Number(request.account.minBalance);
        if (amt > available) {
          throw new Error("Insufficient balance in customer account for withdrawal.");
        }
        await tx.bankAccount.update({
          where: { id: request.accountId },
          data: { balance: { decrement: amt } },
        });
      } else {
        await tx.bankAccount.update({
          where: { id: request.accountId },
          data: { balance: { increment: amt } },
        });
      }

      const { isFlagged, flagReason } = evaluateSuspiciousTransaction(amt, suspiciousThreshold, 0);

      const transaction = await tx.transaction.create({
        data: {
          referenceId: generateReferenceId(request.type === "DEPOSIT" ? "DEP" : "WDR"),
          senderAccountId: request.type === "WITHDRAWAL" ? request.accountId : null,
          receiverAccountId: request.type === "DEPOSIT" ? request.accountId : null,
          type: request.type,
          amount: amt,
          fee: 0,
          status: "COMPLETED",
          description: request.description,
          isFlagged,
          flagReason,
          reviewedById: session.user.id,
        },
      });

      const updated = await tx.depositWithdrawalRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          processedById: session.user.id,
          processedAt: new Date(),
        },
      });

      return { updated, transaction, user: request.user, account: request.account, amt };
    });

    await notifyUserWithEmail({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      title: `${result.updated.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} ${decision === "APPROVED" ? "Approved" : "Rejected"}`,
      message:
        decision === "APPROVED"
          ? `Your ${result.updated.type.toLowerCase()} request of ${formatCurrency(result.amt)} for account ${result.account.accountNumber} has been approved.`
          : `Your ${result.updated.type.toLowerCase()} request of ${formatCurrency(result.amt)} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      type: "DEPOSIT_WITHDRAWAL",
      details: {
        Account: result.account.accountNumber,
        Type: result.updated.type,
        Amount: formatCurrency(result.amt),
        Status: decision,
        ...(result.transaction ? { "Reference ID": result.transaction.referenceId } : {}),
      },
    });

    return NextResponse.json({
      ...result.updated,
      amount: Number(result.updated.amount),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
