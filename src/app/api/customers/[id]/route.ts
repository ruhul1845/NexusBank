import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateCustomerSchema = z.object({
  status: z.enum(["ACTIVE", "DEACTIVATED", "BLOCKED"]).optional(),
  isVerified: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      isVerified: true,
      createdAt: true,
      accounts: true,
      loans: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const accountIds = customer.accounts.map((a) => a.id);
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    ...customer,
    accounts: customer.accounts.map((a) => ({
      ...a,
      balance: Number(a.balance),
      dailyTransferLimit: Number(a.dailyTransferLimit),
      maxSingleTransfer: Number(a.maxSingleTransfer),
      minBalance: Number(a.minBalance),
    })),
    loans: customer.loans.map((l) => ({
      ...l,
      requestedAmount: Number(l.requestedAmount),
      approvedAmount: l.approvedAmount ? Number(l.approvedAmount) : null,
      remainingBalance: Number(l.remainingBalance),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee),
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    if (parsed.data.status && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admin can activate, deactivate, or block customers" }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, status: true, isVerified: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
