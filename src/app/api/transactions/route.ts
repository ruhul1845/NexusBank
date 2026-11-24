import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 15)));
  const search = searchParams.get("search")?.trim() || "";
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const accountId = searchParams.get("accountId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const flaggedOnly = searchParams.get("flagged") === "true";

  const where: Prisma.TransactionWhereInput = {};

  if (session.user.role === "CUSTOMER") {
    const userAccounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const ownedIds = userAccounts.map((a) => a.id);

    if (accountId && ownedIds.includes(accountId)) {
      where.OR = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
    } else {
      where.OR = [
        { senderAccountId: { in: ownedIds } },
        { receiverAccountId: { in: ownedIds } },
      ];
    }
  } else if (accountId) {
    where.OR = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
  }

  if (search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { referenceId: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (type && type !== "ALL") {
    where.type = type as Prisma.EnumTransactionTypeFilter;
  }

  if (status && status !== "ALL") {
    where.status = status as Prisma.EnumTransactionStatusFilter;
  }

  if (flaggedOnly) {
    where.isFlagged = true;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        senderAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        receiverAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    items: items.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
