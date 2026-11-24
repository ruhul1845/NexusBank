"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useGetLoansQuery, useReviewLoanMutation } from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Send } from "lucide-react";

export default function StaffLoansPage() {
  const dispatch = useAppDispatch();
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [reviewLoan, { isLoading: forwarding }] = useReviewLoanMutation();
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  async function handleForward(id: string) {
    try {
      await reviewLoan({
        id,
        action: "FORWARD",
        staffNotes: notesMap[id] || "Pre-screened by Bank Staff; ready for Admin decision.",
      }).unwrap();
      dispatch(showToast({ message: "Loan forwarded for Admin approval.", type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to forward loan";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Loan Assistance</h1>
          <p className="text-sm text-slate-500">
            Review customer loan applications, add internal notes, and forward to Admin for final approval.
          </p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Loading loan applications...
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
                    <dl className="mt-3 grid grid-cols-1 gap-1.5">
                      <div className="flex items-baseline gap-2">
                        <dt className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Email
                        </dt>
                        <dd className="min-w-0 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {loan.user?.email}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <dt className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Monthly Income
                        </dt>
                        <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(loan.monthlyIncome)}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <dt className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Employment
                        </dt>
                        <dd className="min-w-0 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {loan.employmentStatus}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <dt className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Term
                        </dt>
                        <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {loan.durationMonths} months
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Requested Amount</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(loan.requestedAmount)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{loan.description}</p>

                {loan.status === "PENDING" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row">
                    <input
                      value={notesMap[loan.id] ?? loan.staffNotes ?? ""}
                      onChange={(e) => setNotesMap({ ...notesMap, [loan.id]: e.target.value })}
                      placeholder="Add internal review notes for Admin..."
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <button
                      disabled={forwarding}
                      onClick={() => handleForward(loan.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Forward to Admin
                    </button>
                  </div>
                )}

                {loan.staffNotes && loan.status !== "PENDING" && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Staff Notes:</span> {loan.staffNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
