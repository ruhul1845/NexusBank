import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAmortizationSchedule, formatCurrency, generateReferenceId } from "@/lib/banking";
import { notifyUserWithEmail } from "@/lib/mailer";

const reviewLoanSchema = z.object({
  action: z.enum(["FORWARD", "APPROVE", "REJECT"]),
  staffNotes: z.string().optional(),
  approvedAmount: z.number().positive().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = reviewLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid loan action" }, { status: 400 });
    }

    const { action, staffNotes, approvedAmount } = parsed.data;

    if ((action === "APPROVE" || action === "REJECT") && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin can approve or reject loan applications" },
        { status: 403 }
      );
    }

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: { user: true, account: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot review or approve your own loan application." }, { status: 403 });
    }

    if (action === "FORWARD") {
      const updated = await prisma.loan.update({
        where: { id: loan.id },
        data: {
          status: "UNDER_REVIEW",
          staffNotes: staffNotes ?? loan.staffNotes,
        },
      });
      return NextResponse.json({
        ...updated,
        requestedAmount: Number(updated.requestedAmount),
        interestRate: Number(updated.interestRate),
        monthlyIncome: Number(updated.monthlyIncome),
        remainingBalance: Number(updated.remainingBalance),
      });
    }

    if (action === "REJECT") {
      if (loan.status === "ACTIVE" || loan.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot reject an active or completed loan" }, { status: 400 });
      }

      const updated = await prisma.loan.update({
        where: { id: loan.id },
        data: {
          status: "REJECTED",
          staffNotes: staffNotes ?? loan.staffNotes,
        },
      });

      await notifyUserWithEmail({
        userId: loan.user.id,
        email: loan.user.email,
        name: loan.user.name,
        title: "Loan Application Rejected",
        message: `Your ${loan.loanType} loan application for ${formatCurrency(Number(loan.requestedAmount))} was not approved.${staffNotes ? ` Note: ${staffNotes}` : ""}`,
        type: "LOAN",
        details: {
          "Loan Type": loan.loanType,
          "Requested Amount": formatCurrency(Number(loan.requestedAmount)),
          Status: "REJECTED",
        },
      });

      return NextResponse.json({
        ...updated,
        requestedAmount: Number(updated.requestedAmount),
        interestRate: Number(updated.interestRate),
        monthlyIncome: Number(updated.monthlyIncome),
        remainingBalance: Number(updated.remainingBalance),
      });
    }

    // APPROVE & DISBURSE atomically
    if (loan.status !== "PENDING" && loan.status !== "UNDER_REVIEW") {
      return NextResponse.json({ error: "Loan has already been processed" }, { status: 400 });
    }

    const finalAmount = approvedAmount ?? Number(loan.requestedAmount);
    const schedule = calculateAmortizationSchedule(finalAmount, Number(loan.interestRate), loan.durationMonths);
    const totalPayable = Number(schedule.reduce((acc, s) => acc + s.amountDue, 0).toFixed(2));
    const refId = generateReferenceId("LN");

    const disbursed = await prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({
        where: { id: loan.accountId },
        data: { balance: { increment: finalAmount } },
      });

      await tx.transaction.create({
        data: {
          referenceId: refId,
          receiverAccountId: loan.accountId,
          type: "LOAN_DISBURSEMENT",
          amount: finalAmount,
          fee: 0,
          status: "COMPLETED",
          description: `${loan.loanType} Loan Disbursement (${loan.durationMonths} months)`,
          reviewedById: session.user.id,
        },
      });

      await tx.loanRepayment.createMany({
        data: schedule.map((item) => ({
          loanId: loan.id,
          installmentNumber: item.installmentNumber,
          dueDate: item.dueDate,
          amountDue: item.amountDue,
          principalPart: item.principalPart,
          interestPart: item.interestPart,
          amountPaid: 0,
          status: "PENDING",
        })),
      });

      return tx.loan.update({
        where: { id: loan.id },
        data: {
          status: "ACTIVE",
          approvedAmount: finalAmount,
          remainingBalance: totalPayable,
          disbursedAt: new Date(),
          staffNotes: staffNotes ?? loan.staffNotes,
        },
        include: { repayments: { orderBy: { installmentNumber: "asc" } } },
      });
    });

    await notifyUserWithEmail({
      userId: loan.user.id,
      email: loan.user.email,
      name: loan.user.name,
      title: "Loan Approved & Disbursed",
      message: `Congratulations! Your ${loan.loanType} loan of ${formatCurrency(finalAmount)} has been approved and credited to account ${loan.account.accountNumber}.`,
      type: "LOAN",
      details: {
        "Disbursed Amount": formatCurrency(finalAmount),
        "Target Account": loan.account.accountNumber,
        "Interest Rate": `${Number(loan.interestRate)}% APR`,
        "Duration": `${loan.durationMonths} months`,
        "Reference ID": refId,
      },
    });

    return NextResponse.json({
      ...disbursed,
      requestedAmount: Number(disbursed.requestedAmount),
      approvedAmount: Number(disbursed.approvedAmount),
      interestRate: Number(disbursed.interestRate),
      monthlyIncome: Number(disbursed.monthlyIncome),
      remainingBalance: Number(disbursed.remainingBalance),
    });
  } catch (error) {
    console.error("Loan review error:", error);
    return NextResponse.json({ error: "Failed to process loan" }, { status: 500 });
  }
}
