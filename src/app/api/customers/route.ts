import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccountNumber } from "@/lib/banking";

const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
  transactionPin: z.string().regex(/^\d{4,6}$/).default("1234"),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).default("SAVINGS"),
  initialDeposit: z.number().min(0).default(0),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      isVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      accounts: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          balance: true,
          status: true,
        },
      },
      _count: { select: { loans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    customers.map((c) => ({
      ...c,
      accounts: c.accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
      totalBalance: c.accounts.reduce((sum, a) => sum + Number(a.balance), 0),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { name, email, password, phone, address, transactionPin, accountType, initialDeposit } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const transactionPinHash = await bcrypt.hash(transactionPin, 10);
    const settings = await prisma.bankSettings.findUnique({ where: { id: "default" } });

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          phone: phone || null,
          address: address || null,
          role: "CUSTOMER",
          status: "ACTIVE",
          isVerified: true,
          transactionPinHash,
        },
      });

      const account = await tx.bankAccount.create({
        data: {
          accountNumber: generateAccountNumber(),
          userId: user.id,
          accountType,
          balance: initialDeposit,
          status: "ACTIVE",
          dailyTransferLimit: settings?.defaultDailyTransferLimit ?? 10000,
          maxSingleTransfer: settings?.defaultMaxSingleTransfer ?? 5000,
          minBalance: settings?.defaultMinBalance ?? 50,
        },
      });

      if (initialDeposit > 0) {
        await tx.transaction.create({
          data: {
            referenceId: `TXN-OPEN-${Date.now()}`,
            receiverAccountId: account.id,
            type: "DEPOSIT",
            amount: initialDeposit,
            fee: 0,
            status: "COMPLETED",
            description: "Initial Deposit on Customer Onboarding",
            reviewedById: session.user.id,
          },
        });
      }

      return { user, account };
    });

    return NextResponse.json(
      {
        id: created.user.id,
        name: created.user.name,
        email: created.user.email,
        accountNumber: created.account.accountNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Staff create customer error:", error);
    return NextResponse.json({ error: "Failed to register customer" }, { status: 500 });
  }
}
