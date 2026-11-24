import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccountNumber } from "@/lib/banking";
import { notifyUserWithEmail } from "@/lib/mailer";

const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  transactionPin: z.string().regex(/^\d{4,6}$/, "Transaction PIN must be 4 to 6 digits"),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).default("SAVINGS"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address, transactionPin, accountType } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
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
          isVerified: false,
          transactionPinHash,
        },
      });

      const account = await tx.bankAccount.create({
        data: {
          accountNumber: generateAccountNumber(),
          userId: user.id,
          accountType,
          balance: 0,
          status: "ACTIVE",
          dailyTransferLimit: settings?.defaultDailyTransferLimit ?? 10000,
          maxSingleTransfer: settings?.defaultMaxSingleTransfer ?? 5000,
          minBalance: settings?.defaultMinBalance ?? 50,
        },
      });

      return { user, account };
    });

    await notifyUserWithEmail({
      userId: created.user.id,
      email: created.user.email,
      name: created.user.name,
      title: "Welcome to NexusBank",
      message: `Your ${accountType} account (${created.account.accountNumber}) has been opened.`,
      type: "SECURITY",
      details: {
        "Account Number": created.account.accountNumber,
        "Account Type": accountType,
        Status: "Active",
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: { id: created.user.id, name: created.user.name, email: created.user.email },
        accountNumber: created.account.accountNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
