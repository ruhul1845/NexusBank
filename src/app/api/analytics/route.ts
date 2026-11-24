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
  const scope = searchParams.get("scope") || (session.user.role === "CUSTOMER" ? "customer" : "admin");

  if (scope === "admin" && session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (scope === "admin") {
    const [
      totalCustomers,
      accounts,
      transactions,
      loans,
      pendingRequests,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.bankAccount.findMany({ select: { accountType: true, balance: true } }),
      prisma.transaction.findMany({
        where: { status: "COMPLETED" },
        select: { type: true, amount: true, createdAt: true },
      }),
      prisma.loan.findMany({ select: { status: true, requestedAmount: true } }),
      prisma.depositWithdrawalRequest.count({ where: { status: "PENDING" } }),
    ]);

    const totalBankBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalDeposits = transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalWithdrawals = transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingLoans = loans.filter((l) => l.status === "PENDING" || l.status === "UNDER_REVIEW").length;

    // Monthly aggregations (last 6 months)
    const monthlyMap = new Map<string, { month: string; volume: number; deposits: number; withdrawals: number; count: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap.set(key, { month: monthNames[d.getMonth()], volume: 0, deposits: 0, withdrawals: 0, count: 0 });
    }

    for (const t of transactions) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = monthlyMap.get(key);
      if (bucket) {
        const amt = Number(t.amount);
        bucket.volume = Number((bucket.volume + amt).toFixed(2));
        bucket.count += 1;
        if (t.type === "DEPOSIT") bucket.deposits = Number((bucket.deposits + amt).toFixed(2));
        if (t.type === "WITHDRAWAL") bucket.withdrawals = Number((bucket.withdrawals + amt).toFixed(2));
      }
    }

    const accountTypeCounts = ["SAVINGS", "CURRENT", "BUSINESS"].map((type) => ({
      name: type,
      value: accounts.filter((a) => a.accountType === type).length,
    }));

    const loanStatusCounts = ["PENDING", "UNDER_REVIEW", "ACTIVE", "REJECTED", "COMPLETED"].map((status) => ({
      status,
      count: loans.filter((l) => l.status === status).length,
    }));

    return NextResponse.json({
      kpis: {
        totalCustomers,
        totalAccounts: accounts.length,
        totalBankBalance,
        totalDeposits,
        totalWithdrawals,
        totalTransactions: transactions.length,
        pendingLoans,
        pendingRequests,
      },
      monthlyActivity: Array.from(monthlyMap.values()),
      accountDistribution: accountTypeCounts,
      loanStats: loanStatusCounts,
    });
  }

  // Customer Analytics
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id },
  });
  const accountIds = accounts.map((a) => a.id);

  const [transactions, loans] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT" || (t.type === "FUND_TRANSFER" && accountIds.includes(t.receiverAccountId || "") && !accountIds.includes(t.senderAccountId || "")))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL" || (t.type === "FUND_TRANSFER" && accountIds.includes(t.senderAccountId || "") && !accountIds.includes(t.receiverAccountId || "")))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyMap = new Map<string, { month: string; deposits: number; spending: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, { month: monthNames[d.getMonth()], deposits: 0, spending: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthlyMap.get(key);
    if (bucket) {
      const amt = Number(t.amount);
      if (t.type === "DEPOSIT" || (t.receiverAccountId && accountIds.includes(t.receiverAccountId) && !accountIds.includes(t.senderAccountId || ""))) {
        bucket.deposits = Number((bucket.deposits + amt).toFixed(2));
      } else {
        bucket.spending = Number((bucket.spending + amt).toFixed(2));
      }
    }
  }

  const txTypeDist = ["DEPOSIT", "WITHDRAWAL", "FUND_TRANSFER", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT"]
    .map((type) => ({
      name: type.replace("_", " "),
      value: transactions.filter((t) => t.type === type).length,
    }))
    .filter((item) => item.value > 0);

  return NextResponse.json({
    kpis: {
      totalBalance,
      totalDeposits,
      totalWithdrawals,
      activeLoansCount: loans.filter((l) => l.status === "ACTIVE").length,
      totalLoanRemaining: loans
        .filter((l) => l.status === "ACTIVE")
        .reduce((sum, l) => sum + Number(l.remainingBalance), 0),
    },
    monthlyHistory: Array.from(monthlyMap.values()),
    transactionDistribution: txTypeDist,
  });
}
