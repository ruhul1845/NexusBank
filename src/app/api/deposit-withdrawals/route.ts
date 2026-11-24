import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createReqSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(2).max(200),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> =
    session.user.role === "CUSTOMER" ? { userId: session.user.id } : {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  const requests = await prisma.depositWithdrawalRequest.findMany({
    where,
    include: {
      account: { select: { accountNumber: true, accountType: true, balance: true } },
      user: { select: { id: true, name: true, email: true } },
      processedBy: { select: { name: true, role: true } },
    },
    orderBy: { requestDate: "desc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      ...r,
      amount: Number(r.amount),
      account: { ...r.account, balance: Number(r.account.balance) },
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
    const parsed = createReqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { accountId, type, amount, description } = parsed.data;

    const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 403 });
    }

    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: `Account is ${account.status.toLowerCase()}` }, { status: 400 });
    }

    if (type === "WITHDRAWAL") {
      const available = Number(account.balance) - Number(account.minBalance);
      if (amount > available) {
        return NextResponse.json(
          { error: `Insufficient balance for withdrawal. Available: $${available.toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    const created = await prisma.depositWithdrawalRequest.create({
      data: {
        accountId,
        userId: session.user.id,
        type,
        amount,
        description,
        status: "PENDING",
      },
      include: {
        account: { select: { accountNumber: true, accountType: true, balance: true } },
      },
    });

    return NextResponse.json(
      {
        ...created,
        amount: Number(created.amount),
        account: { ...created.account, balance: Number(created.account.balance) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create deposit/withdrawal error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
