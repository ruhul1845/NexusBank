"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useCreateRequestMutation,
  useGetAccountsQuery,
  useGetRequestsQuery,
} from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { ArrowDownUp } from "lucide-react";

export default function DepositsWithdrawalsPage() {
  const dispatch = useAppDispatch();
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: requests = [], isLoading } = useGetRequestsQuery();
  const [createRequest, { isLoading: submitting }] = useCreateRequestMutation();

  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRequest({
        accountId,
        type,
        amount: Number(amount),
        description: description.trim(),
      }).unwrap();
      setAmount("");
      setDescription("");
      dispatch(
        showToast({
          message: `${type === "DEPOSIT" ? "Deposit" : "Withdrawal"} request submitted for staff/admin approval.`,
          type: "success",
        })
      );
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Request failed";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Deposits & Withdrawals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit deposit or withdrawal requests for bank staff/admin verification.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">New Request</h2>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["DEPOSIT", "WITHDRAWAL"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    type === t
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Account</label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} ({a.accountNumber}) — {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
              <input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Check deposit / Branch withdrawal"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !accountId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              <ArrowDownUp className="h-4 w-4" />
              {submitting ? "Submitting..." : `Submit ${type === "DEPOSIT" ? "Deposit" : "Withdrawal"}`}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Request History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Loading requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{r.type}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{r.account.accountNumber}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                          {r.description}
                          {r.rejectionReason && (
                            <span className="block text-xs text-rose-500">Reason: {r.rejectionReason}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(r.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(r.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
