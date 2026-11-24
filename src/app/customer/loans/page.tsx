"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useApplyLoanMutation,
  useGetAccountsQuery,
  useGetLoansQuery,
  useRepayLoanMutation,
} from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Landmark, CheckCircle2 } from "lucide-react";

export default function CustomerLoansPage() {
  const dispatch = useAppDispatch();
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [applyLoan, { isLoading: applying }] = useApplyLoanMutation();
  const [repayLoan, { isLoading: repaying }] = useRepayLoanMutation();

  const [form, setForm] = useState({
    accountId: "",
    loanType: "PERSONAL",
    requestedAmount: "",
    durationMonths: "12",
    monthlyIncome: "",
    employmentStatus: "Full-Time Employed",
    description: "",
  });

  useEffect(() => {
    if (accounts.length > 0 && !form.accountId) {
      setForm((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, form.accountId]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    try {
      await applyLoan({
        accountId: form.accountId,
        loanType: form.loanType,
        requestedAmount: Number(form.requestedAmount),
        durationMonths: Number(form.durationMonths),
        monthlyIncome: Number(form.monthlyIncome),
        employmentStatus: form.employmentStatus,
        description: form.description.trim(),
      }).unwrap();
      setForm((prev) => ({ ...prev, requestedAmount: "", monthlyIncome: "", description: "" }));
      dispatch(showToast({ message: "Loan application submitted for review!", type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Loan application failed";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  async function handleRepay(loanId: string, repaymentId: string, accountId: string) {
    try {
      await repayLoan({ loanId, repaymentId, accountId }).unwrap();
      dispatch(showToast({ message: "Loan installment paid! Email confirmation sent.", type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Repayment failed";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Loans & Credit</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Apply for personal, auto, home, business, or education loans and manage repayment schedules.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Application Form */}
          <form
            onSubmit={handleApply}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Apply for a Loan</h2>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Disbursement Account
              </label>
              <select
                required
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} ({a.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Loan Type</label>
                <select
                  value={form.loanType}
                  onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="HOME">Home</option>
                  <option value="AUTO">Auto</option>
                  <option value="BUSINESS">Business</option>
                  <option value="EDUCATION">Education</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Duration (Months)
                </label>
                <select
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                  <option value="36">36 Months</option>
                  <option value="60">60 Months</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Requested Amount ($)
                </label>
                <input
                  type="number"
                  min="500"
                  required
                  value={form.requestedAmount}
                  onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })}
                  placeholder="10000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Monthly Income ($)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={form.monthlyIncome}
                  onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  placeholder="6500"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Employment Status
              </label>
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="Full-Time Employed">Full-Time Employed</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Student">Student</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Purpose / Description
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe the purpose of this loan..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              disabled={applying || !form.accountId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              <Landmark className="h-4 w-4" />
              {applying ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          {/* Loans List & Repayment Schedules */}
          <div className="space-y-4 lg:col-span-2">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                Loading loans...
              </div>
            ) : loans.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                You have no loan applications yet.
              </div>
            ) : (
              loans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {loan.loanType} Loan
                        </h3>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {loan.durationMonths} months @ {loan.interestRate}% APR • Account{" "}
                        {loan.account?.accountNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">
                        {loan.status === "ACTIVE" ? "Remaining Balance" : "Requested Amount"}
                      </span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(
                          loan.status === "ACTIVE" ? loan.remainingBalance : loan.requestedAmount
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{loan.description}</p>

                  {loan.repayments && loan.repayments.length > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Repayment Schedule
                      </h4>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Due Date</th>
                              <th className="px-3 py-2">Installment</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loan.repayments.map((rep) => (
                              <tr key={rep.id}>
                                <td className="px-3 py-2 font-medium">{rep.installmentNumber}</td>
                                <td className="px-3 py-2">{new Date(rep.dueDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{formatCurrency(rep.amountDue)}</td>
                                <td className="px-3 py-2">
                                  <StatusBadge status={rep.status} />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {rep.status === "PAID" ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                                    </span>
                                  ) : loan.status === "ACTIVE" ? (
                                    <button
                                      disabled={repaying}
                                      onClick={() => handleRepay(loan.id, rep.id, loan.accountId)}
                                      className="rounded-lg bg-brand-600 px-2.5 py-1 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                                    >
                                      Pay Now
                                    </button>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
