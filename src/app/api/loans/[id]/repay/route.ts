import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, generateReferenceId } from "@/lib/banking";
import { notifyUserWithEmail } from "@/lib/mailer";

const repaySchema = z.object({
  repaymentId: z.string().min(1),
  accountId: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = repaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid repayment payload" }, { status: 400 });
    }

    const { repaymentId, accountId } = parsed.data;
    const refId = generateReferenceId("LNR");

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: params.id },
        include: { user: true },
      });

      if (!loan || loan.userId !== session.user.id) {
        throw new Error("Loan not found or access denied");
      }

      if (loan.status !== "ACTIVE") {
        throw new Error("Loan is not active");
      }

      const installment = await tx.loanRepayment.findUnique({ where: { id: repaymentId } });
      if (!installment || installment.loanId !== loan.id) {
        throw new Error("Installment not found");
      }

      if (installment.status === "PAID") {
        throw new Error("Installment has already been paid");
      }

      const account = await tx.bankAccount.findUnique({ where: { id: accountId } });
      if (!account || account.userId !== session.user.id) {
        throw new Error("Invalid payment account");
      }

      if (account.status !== "ACTIVE") {
        throw new Error("Payment account is not active");
      }

      const dueAmount = Number(installment.amountDue);
      const available = Number(account.balance) - Number(account.minBalance);
      if (dueAmount > available) {
        throw new Error(`Insufficient balance. Required: ${formatCurrency(dueAmount)}, Available: ${formatCurrency(available)}`);
      }

      await tx.bankAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: dueAmount } },
      });

      const txn = await tx.transaction.create({
        data: {
          referenceId: refId,
          senderAccountId: account.id,
          type: "LOAN_REPAYMENT",
          amount: dueAmount,
          fee: 0,
          status: "COMPLETED",
          description: `Loan Installment #${installment.installmentNumber} (${loan.loanType})`,
        },
      });

      await tx.loanRepayment.update({
        where: { id: installment.id },
        data: {
          status: "PAID",
          amountPaid: dueAmount,
          paidAt: new Date(),
          transactionId: txn.id,
        },
      });

      const newRemaining = Math.max(0, Number((Number(loan.remainingBalance) - dueAmount).toFixed(2)));
      const pendingCount = await tx.loanRepayment.count({
        where: { loanId: loan.id, status: { not: "PAID" } },
      });

      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingBalance: newRemaining,
          status: pendingCount === 0 ? "COMPLETED" : "ACTIVE",
        },
      });

      return { loan: updatedLoan, user: loan.user, installment, dueAmount, account };
    });

    await notifyUserWithEmail({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      title: "Loan Repayment Confirmed",
      message: `Installment #${result.installment.installmentNumber} of ${formatCurrency(result.dueAmount)} has been paid from account ${result.account.accountNumber}.`,
      type: "LOAN",
      details: {
        "Reference ID": refId,
        "Installment": `#${result.installment.installmentNumber}`,
        "Amount Paid": formatCurrency(result.dueAmount),
        "Remaining Balance": formatCurrency(Number(result.loan.remainingBalance)),
      },
    });

    return NextResponse.json({
      message: "Repayment successful",
      remainingBalance: Number(result.loan.remainingBalance),
      status: result.loan.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Repayment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
