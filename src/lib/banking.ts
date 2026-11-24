import crypto from "crypto";

export function generateReferenceId(prefix = "TXN"): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${datePart}-${randPart}`;
}

export function generateAccountNumber(): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `4001${randomDigits}`;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const safeNum = Number.isNaN(num) ? 0 : num;
  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeNum));
  return `${safeNum < 0 ? "-" : ""}৳${formatted}`;
}

export interface AmortizationInstallment {
  installmentNumber: number;
  dueDate: Date;
  amountDue: number;
  principalPart: number;
  interestPart: number;
}

export function calculateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  months: number
): AmortizationInstallment[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let remaining = principal;
  const schedule: AmortizationInstallment[] = [];

  for (let i = 1; i <= months; i++) {
    const interest = Number((remaining * monthlyRate).toFixed(2));
    let principalPart = Number((emi - interest).toFixed(2));
    if (i === months) {
      principalPart = Number(remaining.toFixed(2));
    }
    const amountDue = Number((principalPart + interest).toFixed(2));
    remaining = Math.max(0, Number((remaining - principalPart).toFixed(2)));

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      amountDue,
      principalPart,
      interestPart: interest,
    });
  }

  return schedule;
}

export function evaluateSuspiciousTransaction(
  amount: number,
  threshold: number,
  recentHourlyCount: number
): { isFlagged: boolean; flagReason: string | null } {
  if (amount >= threshold) {
    return {
      isFlagged: true,
      flagReason: `Amount (৳${amount.toFixed(2)}) meets or exceeds suspicious threshold (৳${threshold.toFixed(2)})`,
    };
  }
  if (recentHourlyCount >= 5) {
    return {
      isFlagged: true,
      flagReason: `High-velocity activity detected (${recentHourlyCount + 1} transactions within 1 hour)`,
    };
  }
  return { isFlagged: false, flagReason: null };
}
