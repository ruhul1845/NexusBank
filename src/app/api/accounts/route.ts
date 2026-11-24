import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccountNumber } from "@/lib/banking";

const createAccountSchema = z.object({
  userId: z.string().min(1),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]),
  initialDeposit: z.number().min(0).default(0),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";

  const where =
    session.user.role === "CUSTOMER"
      ? { userId: session.user.id }
      : search
      ? {
          OR: [
            { accountNumber: { contains: search, mode: "insensitive" as const } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

  const accounts = await prisma.bankAccount.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, status: true, isVerified: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    accounts.map((acc) => ({
      ...acc,
      balance: Number(acc.balance),
      dailyTransferLimit: Number(acc.dailyTransferLimit),
      maxSingleTransfer: Number(acc.maxSingleTransfer),
      minBalance: Number(acc.minBalance),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden: Staff or Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { userId, accountType, initialDeposit } = parsed.data;
    const customer = await prisma.user.findUnique({ where: { id: userId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const settings = await prisma.bankSettings.findUnique({ where: { id: "default" } });

    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.bankAccount.create({
        data: {
          accountNumber: generateAccountNumber(),
          userId,
          accountType,
          balance: initialDeposit,
          status: "ACTIVE",
          dailyTransferLimit: settings?.defaultDailyTransferLimit ?? 10000,
          maxSingleTransfer: settings?.defaultMaxSingleTransfer ?? 5000,
          minBalance: settings?.defaultMinBalance ?? 50,
        },
        include: {
          user: { select: { id: true, name: true, email: true, status: true, isVerified: true } },
        },
      });

      if (initialDeposit > 0) {
        await tx.transaction.create({
          data: {
            referenceId: `TXN-OPEN-${Date.now()}`,
            receiverAccountId: created.id,
            type: "DEPOSIT",
            amount: initialDeposit,
            fee: 0,
            status: "COMPLETED",
            description: "Initial Account Opening Deposit",
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        ...account,
        balance: Number(account.balance),
        dailyTransferLimit: Number(account.dailyTransferLimit),
        maxSingleTransfer: Number(account.maxSingleTransfer),
        minBalance: Number(account.minBalance),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
