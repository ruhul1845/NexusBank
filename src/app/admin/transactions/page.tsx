"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useGetTransactionsQuery, useReviewTransactionMutation } from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { RotateCcw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminTransactionsPage() {
  const dispatch = useAppDispatch();
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const { data: txData, isLoading } = useGetTransactionsQuery({ page: 1, limit: 30, flagged: flaggedOnly });
  const [reviewTxn, { isLoading: processing }] = useReviewTransactionMutation();
  const [reverseId, setReverseId] = useState<string | null>(null);

  async function handleAction(id: string, action: "CLEAR_FLAG" | "REVERSE") {
    try {
      await reviewTxn({ id, action }).unwrap();
      setReverseId(null);
      dispatch(showToast({ message: `Transaction ${action === "REVERSE" ? "reversed" : "cleared"}!`, type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Action failed";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Transaction & Fraud Oversight
            </h1>
            <p className="text-sm text-slate-500">
              Audit flagged suspicious transactions, clear false positives, or execute atomic reversals.
            </p>
          </div>
          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              flaggedOnly
                ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            {flaggedOnly ? "Showing Flagged Only" : "Filter Flagged Suspicious"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description / Alert</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading ledger...</td>
                  </tr>
                ) : (
                  (txData?.items || []).map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-3.5 font-mono text-xs">{t.referenceId}</td>
                      <td className="px-5 py-3.5 text-xs">{t.type.replace("_", " ")}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{t.description}</p>
                        {t.flagReason && <p className="text-xs text-rose-500">{t.flagReason}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={t.status} />
                          {t.isFlagged && <StatusBadge status="FLAGGED" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-2">
                          {t.isFlagged && (
                            <button
                              onClick={() => handleAction(t.id, "CLEAR_FLAG")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                            </button>
                          )}
                          {t.status === "COMPLETED" && (
                            <button
                              onClick={() => setReverseId(t.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!reverseId}
        title="Reverse Completed Transaction"
        description="Reversing this transaction will atomically refund the sender and debit the receiver. Continue?"
        confirmLabel="Reverse Transaction"
        variant="danger"
        loading={processing}
        onConfirm={() => reverseId && handleAction(reverseId, "REVERSE")}
        onCancel={() => setReverseId(null)}
      />
    </DashboardShell>
  );
}
