"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useGetLoansQuery, useReviewLoanMutation } from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Check, X } from "lucide-react";

export default function AdminLoansPage() {
  const dispatch = useAppDispatch();
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [reviewLoan, { isLoading: processing }] = useReviewLoanMutation();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "APPROVE" | "REJECT" } | null>(null);

  async function executeDecision() {
    if (!confirmAction) return;
    try {
      await reviewLoan({ id: confirmAction.id, action: confirmAction.action }).unwrap();
      dispatch(
        showToast({
          message:
            confirmAction.action === "APPROVE"
              ? "Loan approved, disbursed to customer account, and email sent!"
              : "Loan rejected and customer notified.",
          type: "success",
        })
      );
      setConfirmAction(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Loan action failed";
      dispatch(showToast({ message: msg, type: "error" }));
      setConfirmAction(null);
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Loan Management</h1>
          <p className="text-sm text-slate-500">
            Approve or reject loan applications and monitor active repayment histories.
          </p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Loading loan portfolio...
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {loan.user?.name} — {loan.loanType} Loan
                      </h3>
                      <StatusBadge status={loan.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {loan.durationMonths} mo @ {loan.interestRate}% APR • Income: {formatCurrency(loan.monthlyIncome)}
                      /mo • Account: {loan.account?.accountNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">
                      {loan.status === "ACTIVE" ? "Remaining Balance" : "Requested Amount"}
                    </span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(loan.status === "ACTIVE" ? loan.remainingBalance : loan.requestedAmount)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{loan.description}</p>
                {loan.staffNotes && (
                  <p className="mt-2 rounded-xl bg-indigo-50/70 px-3.5 py-2 text-xs text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <span className="font-semibold">Staff Pre-Screen Note:</span> {loan.staffNotes}
                  </p>
                )}

                {(loan.status === "PENDING" || loan.status === "UNDER_REVIEW") && (
                  <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      onClick={() => setConfirmAction({ id: loan.id, action: "REJECT" })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: loan.id, action: "APPROVE" })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Approve & Disburse
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === "APPROVE" ? "Approve & Disburse Loan" : "Reject Loan Application"}
        description={
          confirmAction?.action === "APPROVE"
            ? "Approving will atomically credit the customer's bank account, record a LOAN_DISBURSEMENT transaction, and generate their repayment schedule."
            : "Are you sure you want to reject this loan application?"
        }
        confirmLabel={confirmAction?.action === "APPROVE" ? "Approve & Disburse" : "Reject Loan"}
        variant={confirmAction?.action === "REJECT" ? "danger" : "primary"}
        loading={processing}
        onConfirm={executeDecision}
        onCancel={() => setConfirmAction(null)}
      />
    </DashboardShell>
  );
}
