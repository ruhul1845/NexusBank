import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loanSchema = z.object({
  accountId: z.string().min(1),
  loanType: z.enum(["PERSONAL", "HOME", "AUTO", "BUSINESS", "EDUCATION"]),
  requestedAmount: z.number().positive("Requested amount must be greater than zero"),
  durationMonths: z.number().int().min(3).max(360),
  monthlyIncome: z.number().positive("Monthly income is required"),
  employmentStatus: z.string().min(2),
  description: z.string().min(5).max(500),
});

const DEFAULT_RATES: Record<string, number> = {
  PERSONAL: 10.5,
  HOME: 6.25,
  AUTO: 7.5,
  BUSINESS: 9.25,
  EDUCATION: 5.5,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.user.role === "CUSTOMER" ? { userId: session.user.id } : {};

  const loans = await prisma.loan.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, isVerified: true } },
      account: { select: { id: true, accountNumber: true, accountType: true } },
      repayments: { orderBy: { installmentNumber: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    loans.map((l) => ({
      ...l,
      requestedAmount: Number(l.requestedAmount),
      approvedAmount: l.approvedAmount ? Number(l.approvedAmount) : null,
      interestRate: Number(l.interestRate),
      monthlyIncome: Number(l.monthlyIncome),
      remainingBalance: Number(l.remainingBalance),
      repayments: l.repayments.map((r) => ({
        ...r,
        amountDue: Number(r.amountDue),
        principalPart: Number(r.principalPart),
        interestPart: Number(r.interestPart),
        amountPaid: Number(r.amountPaid),
      })),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = loanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid loan data" }, { status: 400 });
    }

    const { accountId, loanType, requestedAmount, durationMonths, monthlyIncome, employmentStatus, description } =
      parsed.data;

    const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid disbursement account" }, { status: 403 });
    }

    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: "Disbursement account must be active" }, { status: 400 });
    }

    const loan = await prisma.loan.create({
      data: {
        userId: session.user.id,
        accountId,
        loanType,
        requestedAmount,
        durationMonths,
        interestRate: DEFAULT_RATES[loanType] ?? 8.5,
        monthlyIncome,
        employmentStatus,
        description,
        status: "PENDING",
      },
      include: {
        account: { select: { id: true, accountNumber: true, accountType: true } },
        repayments: true,
      },
    });

    return NextResponse.json(
      {
        ...loan,
        requestedAmount: Number(loan.requestedAmount),
        approvedAmount: null,
        interestRate: Number(loan.interestRate),
        monthlyIncome: Number(loan.monthlyIncome),
        remainingBalance: Number(loan.remainingBalance),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Loan apply error:", error);
    return NextResponse.json({ error: "Failed to submit loan application" }, { status: 500 });
  }
}
