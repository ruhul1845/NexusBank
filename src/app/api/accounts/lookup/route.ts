import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("accountNumber")?.trim();

  if (!accountNumber) {
    return NextResponse.json({ error: "Account number is required" }, { status: 400 });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { accountNumber },
    select: {
      id: true,
      accountNumber: true,
      accountType: true,
      status: true,
      user: { select: { name: true, status: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Recipient account not found" }, { status: 404 });
  }

  return NextResponse.json({
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    status: account.status,
    holderName: account.user.name,
  });
}
