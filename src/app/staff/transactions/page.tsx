"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useGetRequestsQuery,
  useGetTransactionsQuery,
  useProcessRequestMutation,
  useReviewTransactionMutation,
} from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Search, Flag, Check, X } from "lucide-react";

export default function StaffTransactionsPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");

  const { data: requests = [] } = useGetRequestsQuery({ status: "PENDING" });
  const { data: txData } = useGetTransactionsQuery({ page: 1, limit: 20, search, type });
  const [processRequest] = useProcessRequestMutation();
  const [reviewTxn] = useReviewTransactionMutation();

  async function handleRequestDecision(id: string, decision: "APPROVED" | "REJECTED") {
    try {
      await processRequest({ id, decision }).unwrap();
      dispatch(showToast({ message: `Request ${decision.toLowerCase()} & customer notified.`, type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to process request";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  async function handleFlag(id: string) {
    try {
      await reviewTxn({ id, action: "FLAG", reason: "Flagged by Bank Staff for Admin review" }).unwrap();
      dispatch(showToast({ message: "Transaction flagged for Admin review.", type: "info" }));
    } catch {
      dispatch(showToast({ message: "Failed to flag transaction.", type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transaction & Request Management
          </h1>
          <p className="text-sm text-slate-500">
            Approve or reject pending deposit/withdrawal requests and flag suspicious ledger activity.
          </p>
        </div>

        {/* Pending Requests Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Pending Deposit & Withdrawal Requests ({requests.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3.5 font-medium">{r.user?.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{r.account.accountNumber}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold">{r.type}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{r.description}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{formatCurrency(r.amount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleRequestDecision(r.id, "APPROVED")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRequestDecision(r.id, "REJECTED")}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                      No pending requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Transactions */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Transaction ID..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="FUND_TRANSFER">Fund Transfer</option>
              <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
              <option value="LOAN_REPAYMENT">Loan Repayment</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(txData?.items || []).map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-3.5 font-mono text-xs">{t.referenceId}</td>
                      <td className="px-5 py-3.5 text-xs">{t.type.replace("_", " ")}</td>
                      <td className="px-5 py-3.5">{t.description}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={t.status} />
                          {t.isFlagged && <StatusBadge status="FLAGGED" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {!t.isFlagged && (
                          <button
                            onClick={() => handleFlag(t.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                          >
                            <Flag className="h-3.5 w-3.5" /> Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
