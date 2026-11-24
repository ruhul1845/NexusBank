import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateSuspiciousTransaction, formatCurrency, generateReferenceId } from "@/lib/banking";
import { notifyUserWithEmail } from "@/lib/mailer";

const transferSchema = z.object({
  senderAccountId: z.string().min(1),
  recipientAccountNumber: z.string().min(6),
  amount: z.number().positive("Transfer amount must be greater than zero"),
  description: z.string().min(2).max(200),
  transactionPin: z.string().min(4).max(6),
  idempotencyKey: z.string().optional(),
  twoFactorCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid transfer data" }, { status: 400 });
    }

    const { senderAccountId, recipientAccountNumber, amount, description, transactionPin, idempotencyKey, twoFactorCode } =
      parsed.data;

    // Duplicate transaction prevention via idempotency key
    if (idempotencyKey) {
      const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return NextResponse.json(
          { ...existing, amount: Number(existing.amount), fee: Number(existing.fee), duplicatePrevented: true },
          { status: 200 }
        );
      }
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "User account is not active" }, { status: 403 });
    }

    if (!user.transactionPinHash) {
      return NextResponse.json({ error: "Transaction PIN is not configured" }, { status: 400 });
    }

    const pinValid = await bcrypt.compare(transactionPin, user.transactionPinHash);
    if (!pinValid) {
      return NextResponse.json({ error: "Invalid Transaction PIN" }, { status: 403 });
    }

    // 2FA check when enabled on user profile (simulated 6-digit OTP verification code: any valid 6 digits or 123456)
    if (user.twoFactorEnabled && (!twoFactorCode || !/^\d{6}$/.test(twoFactorCode))) {
      return NextResponse.json(
        { error: "Two-Factor Authentication code (6 digits) is required", requires2FA: true },
        { status: 403 }
      );
    }

    const settings = await prisma.bankSettings.findUnique({ where: { id: "default" } });
    const feePercent = Number(settings?.transferFeePercent ?? 0.25);
    const suspiciousThreshold = Number(settings?.suspiciousAmountThreshold ?? 8000);

    // Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      const senderAccount = await tx.bankAccount.findUnique({
        where: { id: senderAccountId },
        include: { user: true },
      });

      if (!senderAccount || senderAccount.userId !== session.user.id) {
        throw new Error("FORBIDDEN: You do not own the source account.");
      }

      if (senderAccount.status !== "ACTIVE") {
        throw new Error(`Source account is ${senderAccount.status.toLowerCase()} and cannot send funds.`);
      }

      const receiverAccount = await tx.bankAccount.findUnique({
        where: { accountNumber: recipientAccountNumber.trim() },
        include: { user: true },
      });

      if (!receiverAccount) {
        throw new Error("Recipient account number does not exist.");
      }

      if (receiverAccount.id === senderAccount.id) {
        throw new Error("Cannot transfer funds to the exact same account.");
      }

      if (receiverAccount.status !== "ACTIVE" || receiverAccount.user.status !== "ACTIVE") {
        throw new Error("Recipient account is not active.");
      }

      const isInternalOwnTransfer = receiverAccount.userId === session.user.id;
      const fee = isInternalOwnTransfer ? 0 : Number(((amount * feePercent) / 100).toFixed(2));
      const totalDebit = Number((amount + fee).toFixed(2));

      const currentBalance = Number(senderAccount.balance);
      const minBalance = Number(senderAccount.minBalance);
      const maxSingle = Number(senderAccount.maxSingleTransfer);
      const dailyLimit = Number(senderAccount.dailyTransferLimit);

      if (amount > maxSingle) {
        throw new Error(`Amount exceeds single transaction limit of ${formatCurrency(maxSingle)}.`);
      }

      if (currentBalance - totalDebit < minBalance) {
        throw new Error(
          `Insufficient available balance. Minimum required balance is ${formatCurrency(minBalance)} (Total debit with fee: ${formatCurrency(totalDebit)}).`
        );
      }

      // Check 24h daily transfer volume
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayAgg = await tx.transaction.aggregate({
        where: {
          senderAccountId: senderAccount.id,
          type: "FUND_TRANSFER",
          status: "COMPLETED",
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      });

      const todaySpent = Number(todayAgg._sum.amount ?? 0);
      if (todaySpent + amount > dailyLimit) {
        throw new Error(
          `Daily transfer limit of ${formatCurrency(dailyLimit)} exceeded. Remaining today: ${formatCurrency(
            Math.max(0, dailyLimit - todaySpent)
          )}.`
        );
      }

      // Suspicious activity check
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await tx.transaction.count({
        where: {
          senderAccountId: senderAccount.id,
          createdAt: { gte: oneHourAgo },
        },
      });
      const { isFlagged, flagReason } = evaluateSuspiciousTransaction(amount, suspiciousThreshold, recentCount);

      // Atomic balance updates
      await tx.bankAccount.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: totalDebit } },
      });

      await tx.bankAccount.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          referenceId: generateReferenceId("TRF"),
          idempotencyKey: idempotencyKey || null,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          type: "FUND_TRANSFER",
          amount,
          fee,
          status: "COMPLETED",
          description,
          isFlagged,
          flagReason,
        },
        include: {
          senderAccount: { select: { accountNumber: true, user: { select: { id: true, name: true, email: true } } } },
          receiverAccount: { select: { accountNumber: true, user: { select: { id: true, name: true, email: true } } } },
        },
      });

      return { transaction, senderAccount, receiverAccount, fee, totalDebit };
    });

    // Send transaction emails & in-app notifications to BOTH sender and receiver
    await Promise.allSettled([
      notifyUserWithEmail({
        userId: result.senderAccount.user.id,
        email: result.senderAccount.user.email,
        name: result.senderAccount.user.name,
        title: "Fund Transfer Completed",
        message: `You sent ${formatCurrency(amount)} to ${result.receiverAccount.user.name} (${result.receiverAccount.accountNumber}).`,
        type: "TRANSACTION",
        details: {
          "Reference ID": result.transaction.referenceId,
          "From Account": result.senderAccount.accountNumber,
          "To Account": result.receiverAccount.accountNumber,
          Amount: formatCurrency(amount),
          Fee: formatCurrency(result.fee),
          "Total Debited": formatCurrency(result.totalDebit),
        },
      }),
      ...(! (result.receiverAccount.user.id === result.senderAccount.user.id)
        ? [
            notifyUserWithEmail({
              userId: result.receiverAccount.user.id,
              email: result.receiverAccount.user.email,
              name: result.receiverAccount.user.name,
              title: "Money Received",
              message: `You received ${formatCurrency(amount)} from ${result.senderAccount.user.name}.`,
              type: "TRANSACTION",
              details: {
                "Reference ID": result.transaction.referenceId,
                "Credited Account": result.receiverAccount.accountNumber,
                "From": result.senderAccount.user.name,
                Amount: formatCurrency(amount),
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(
      {
        ...result.transaction,
        amount: Number(result.transaction.amount),
        fee: Number(result.transaction.fee),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    const status = message.startsWith("FORBIDDEN:") ? 403 : 400;
    return NextResponse.json({ error: message.replace("FORBIDDEN: ", "") }, { status });
  }
}
