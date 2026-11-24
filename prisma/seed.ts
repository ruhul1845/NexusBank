import { PrismaClient, Role, AccountType, TransactionType, TransactionStatus, LoanType, LoanStatus, RepaymentStatus, RequestType, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding NexusBank database...");

  // 1. Bank Settings
  await prisma.bankSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      defaultDailyTransferLimit: 10000.0,
      defaultMaxSingleTransfer: 5000.0,
      defaultMinBalance: 50.0,
      transferFeePercent: 0.25,
      suspiciousAmountThreshold: 8000.0,
    },
  });

  const passwordHash = await bcrypt.hash("Demo@1234", 10);
  const pinHash = await bcrypt.hash("1234", 10);

  // 2. Users (Admin, Staff, Customers)
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexusbank.com" },
    update: {},
    create: {
      name: "Victoria Sterling",
      email: "admin@nexusbank.com",
      passwordHash,
      phone: "+1 (555) 100-0001",
      address: "100 Financial Plaza, Suite 400, New York, NY",
      role: Role.ADMIN,
      status: "ACTIVE",
      isVerified: true,
      transactionPinHash: pinHash,
      twoFactorEnabled: false,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@nexusbank.com" },
    update: {},
    create: {
      name: "Marcus Vance",
      email: "staff@nexusbank.com",
      passwordHash,
      phone: "+1 (555) 100-0002",
      address: "100 Financial Plaza, Suite 210, New York, NY",
      role: Role.STAFF,
      status: "ACTIVE",
      isVerified: true,
      transactionPinHash: pinHash,
      twoFactorEnabled: false,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "customer@nexusbank.com" },
    update: {},
    create: {
      name: "Elena Rostova",
      email: "customer@nexusbank.com",
      passwordHash,
      phone: "+1 (555) 234-5678",
      address: "742 Evergreen Terrace, Brooklyn, NY",
      role: Role.CUSTOMER,
      status: "ACTIVE",
      isVerified: true,
      transactionPinHash: pinHash,
      twoFactorEnabled: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "alex.mercer@nexusbank.com" },
    update: {},
    create: {
      name: "Alex Mercer",
      email: "alex.mercer@nexusbank.com",
      passwordHash,
      phone: "+1 (555) 345-6789",
      address: "88 Market Street, San Francisco, CA",
      role: Role.CUSTOMER,
      status: "ACTIVE",
      isVerified: true,
      transactionPinHash: pinHash,
      twoFactorEnabled: false,
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { email: "sophia.chen@nexusbank.com" },
    update: {},
    create: {
      name: "Sophia Chen",
      email: "sophia.chen@nexusbank.com",
      passwordHash,
      phone: "+1 (555) 456-7890",
      address: "450 Congress Ave, Austin, TX",
      role: Role.CUSTOMER,
      status: "ACTIVE",
      isVerified: false,
      transactionPinHash: pinHash,
      twoFactorEnabled: false,
    },
  });

  // 3. Bank Accounts
  const acc1 = await prisma.bankAccount.upsert({
    where: { accountNumber: "400188291001" },
    update: {},
    create: {
      accountNumber: "400188291001",
      userId: customer1.id,
      accountType: AccountType.CURRENT,
      balance: 24850.75,
      status: "ACTIVE",
      dailyTransferLimit: 10000.0,
      maxSingleTransfer: 5000.0,
      minBalance: 50.0,
    },
  });

  const acc2 = await prisma.bankAccount.upsert({
    where: { accountNumber: "400188291002" },
    update: {},
    create: {
      accountNumber: "400188291002",
      userId: customer1.id,
      accountType: AccountType.SAVINGS,
      balance: 68400.0,
      status: "ACTIVE",
      dailyTransferLimit: 15000.0,
      maxSingleTransfer: 7500.0,
      minBalance: 500.0,
    },
  });

  const acc3 = await prisma.bankAccount.upsert({
    where: { accountNumber: "400199302001" },
    update: {},
    create: {
      accountNumber: "400199302001",
      userId: customer2.id,
      accountType: AccountType.BUSINESS,
      balance: 142300.5,
      status: "ACTIVE",
      dailyTransferLimit: 50000.0,
      maxSingleTransfer: 25000.0,
      minBalance: 1000.0,
    },
  });

  const acc4 = await prisma.bankAccount.upsert({
    where: { accountNumber: "400177403001" },
    update: {},
    create: {
      accountNumber: "400177403001",
      userId: customer3.id,
      accountType: AccountType.SAVINGS,
      balance: 9200.0,
      status: "ACTIVE",
      dailyTransferLimit: 10000.0,
      maxSingleTransfer: 5000.0,
      minBalance: 50.0,
    },
  });

  // 4. Historical Transactions (only seed if empty)
  const existingTxns = await prisma.transaction.count();
  if (existingTxns === 0) {
    const now = new Date();
    const monthsAgo = (m: number, day: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - m, day, 14, 30, 0);
      return d;
    };

    await prisma.transaction.createMany({
      data: [
        {
          referenceId: "TXN-2026-10001",
          receiverAccountId: acc1.id,
          type: TransactionType.DEPOSIT,
          amount: 12500.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Payroll Direct Deposit - Acme Tech",
          createdAt: monthsAgo(4, 5),
        },
        {
          referenceId: "TXN-2026-10002",
          senderAccountId: acc1.id,
          receiverAccountId: acc3.id,
          type: TransactionType.FUND_TRANSFER,
          amount: 2400.0,
          fee: 6.0,
          status: TransactionStatus.COMPLETED,
          description: "Design Retainer Invoice #408",
          createdAt: monthsAgo(4, 18),
        },
        {
          referenceId: "TXN-2026-10003",
          receiverAccountId: acc2.id,
          type: TransactionType.DEPOSIT,
          amount: 18000.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Annual Bonus Transfer to Savings",
          createdAt: monthsAgo(3, 10),
        },
        {
          referenceId: "TXN-2026-10004",
          senderAccountId: acc1.id,
          type: TransactionType.WITHDRAWAL,
          amount: 1850.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "ATM & Branch Cash Withdrawal",
          createdAt: monthsAgo(3, 22),
        },
        {
          referenceId: "TXN-2026-10005",
          receiverAccountId: acc1.id,
          type: TransactionType.DEPOSIT,
          amount: 9800.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Monthly Salary Deposit",
          createdAt: monthsAgo(2, 4),
        },
        {
          referenceId: "TXN-2026-10006",
          senderAccountId: acc3.id,
          receiverAccountId: acc1.id,
          type: TransactionType.FUND_TRANSFER,
          amount: 4500.0,
          fee: 11.25,
          status: TransactionStatus.COMPLETED,
          description: "Consulting Milestone Payout",
          createdAt: monthsAgo(2, 16),
        },
        {
          referenceId: "TXN-2026-10007",
          senderAccountId: acc1.id,
          receiverAccountId: acc2.id,
          type: TransactionType.FUND_TRANSFER,
          amount: 5000.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Internal Savings Sweep",
          createdAt: monthsAgo(1, 7),
        },
        {
          referenceId: "TXN-2026-10008",
          senderAccountId: acc3.id,
          type: TransactionType.WITHDRAWAL,
          amount: 9500.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Equipment Vendor Wire",
          isFlagged: true,
          flagReason: "Exceeds suspicious amount threshold ($8,000.00)",
          createdAt: monthsAgo(1, 21),
        },
        {
          referenceId: "TXN-2026-10009",
          receiverAccountId: acc4.id,
          type: TransactionType.DEPOSIT,
          amount: 9200.0,
          fee: 0,
          status: TransactionStatus.COMPLETED,
          description: "Initial Account Opening Deposit",
          createdAt: monthsAgo(0, 3),
        },
        {
          referenceId: "TXN-2026-10010",
          senderAccountId: acc1.id,
          receiverAccountId: acc4.id,
          type: TransactionType.FUND_TRANSFER,
          amount: 1250.0,
          fee: 3.13,
          status: TransactionStatus.COMPLETED,
          description: "Shared Apartment Utilities",
          createdAt: monthsAgo(0, 12),
        },
      ],
    });
  }

  // 5. Pending Deposit & Withdrawal Requests
  const existingReqs = await prisma.depositWithdrawalRequest.count();
  if (existingReqs === 0) {
    await prisma.depositWithdrawalRequest.createMany({
      data: [
        {
          accountId: acc1.id,
          userId: customer1.id,
          type: RequestType.DEPOSIT,
          amount: 3200.0,
          description: "Client Check Clearance #9921",
          status: RequestStatus.PENDING,
        },
        {
          accountId: acc3.id,
          userId: customer2.id,
          type: RequestType.WITHDRAWAL,
          amount: 4500.0,
          description: "Quarterly Tax Reserve Withdrawal",
          status: RequestStatus.PENDING,
        },
      ],
    });
  }

  // 6. Loans (1 Active with schedule, 1 Pending for review)
  const existingLoans = await prisma.loan.count();
  if (existingLoans === 0) {
    const activeLoan = await prisma.loan.create({
      data: {
        userId: customer1.id,
        accountId: acc1.id,
        loanType: LoanType.AUTO,
        requestedAmount: 18000.0,
        approvedAmount: 18000.0,
        durationMonths: 12,
        interestRate: 7.5,
        monthlyIncome: 9500.0,
        employmentStatus: "Full-Time Employed",
        description: "Electric vehicle financing",
        status: LoanStatus.ACTIVE,
        staffNotes: "Verified employment and strong credit history.",
        remainingBalance: 15112.5,
        disbursedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    });

    const monthlyPayment = 1561.63;
    const repayments = [];
    for (let i = 1; i <= 12; i++) {
      const due = new Date();
      due.setMonth(due.getMonth() + (i - 2));
      const isPaid = i <= 2;
      repayments.push({
        loanId: activeLoan.id,
        installmentNumber: i,
        dueDate: due,
        amountDue: monthlyPayment,
        principalPart: 1449.13,
        interestPart: 112.5,
        amountPaid: isPaid ? monthlyPayment : 0,
        status: isPaid ? RepaymentStatus.PAID : RepaymentStatus.PENDING,
        paidAt: isPaid ? new Date(due.getTime() - 86400000) : null,
      });
    }
    await prisma.loanRepayment.createMany({ data: repayments });

    await prisma.loan.create({
      data: {
        userId: customer2.id,
        accountId: acc3.id,
        loanType: LoanType.BUSINESS,
        requestedAmount: 45000.0,
        durationMonths: 24,
        interestRate: 9.25,
        monthlyIncome: 28000.0,
        employmentStatus: "Business Owner",
        description: "Warehouse automation and inventory expansion",
        status: LoanStatus.UNDER_REVIEW,
        staffNotes: "Business revenue statements verified; forwarded for Admin approval.",
        remainingBalance: 0,
      },
    });
  }

  // 7. Notifications
  const existingNotifs = await prisma.notification.count();
  if (existingNotifs === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: customer1.id,
          title: "Loan Disbursed",
          message: "Your Auto Loan of $18,000.00 has been approved and credited to account 400188291001.",
          type: "LOAN",
          emailSent: true,
        },
        {
          userId: customer1.id,
          title: "Transfer Completed",
          message: "You transferred $1,250.00 to account 400177403001 (Ref: TXN-2026-10010).",
          type: "TRANSACTION",
          emailSent: true,
        },
        {
          userId: admin.id,
          title: "Flagged Transaction Alert",
          message: "Withdrawal of $9,500.00 (Ref: TXN-2026-10008) exceeded the $8,000.00 threshold.",
          type: "SECURITY",
          emailSent: false,
        },
      ],
    });
  }

  console.log("Seed completed successfully!");
  console.log("Demo Accounts (Password: Demo@1234 | Transaction PIN: 1234):");
  console.log("  Admin:    admin@nexusbank.com");
  console.log("  Staff:    staff@nexusbank.com");
  console.log("  Customer: customer@nexusbank.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
