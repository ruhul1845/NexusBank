"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useCreateAccountMutation,
  useGetAccountsQuery,
  useGetCustomersQuery,
  useUpdateAccountMutation,
  BankAccountDTO,
} from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Snowflake, Sun, SlidersHorizontal, Plus, X } from "lucide-react";

export default function AdminAccountsPage() {
  const dispatch = useAppDispatch();
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const { data: customers = [] } = useGetCustomersQuery();
  const [createAccount] = useCreateAccountMutation();
  const [updateAccount] = useUpdateAccountMutation();

  const [editing, setEditing] = useState<BankAccountDTO | null>(null);
  const [limits, setLimits] = useState({ dailyTransferLimit: "", maxSingleTransfer: "", minBalance: "" });
  const [showNew, setShowNew] = useState(false);
  const [newAcc, setNewAcc] = useState({ userId: "", accountType: "SAVINGS", initialDeposit: "0" });

  async function toggleFreeze(acc: BankAccountDTO) {
    const nextStatus = acc.status === "FROZEN" ? "ACTIVE" : "FROZEN";
    try {
      await updateAccount({ id: acc.id, data: { status: nextStatus } }).unwrap();
      dispatch(showToast({ message: `Account ${acc.accountNumber} is now ${nextStatus}.`, type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to update account status.", type: "error" }));
    }
  }

  async function handleSaveLimits(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateAccount({
        id: editing.id,
        data: {
          dailyTransferLimit: Number(limits.dailyTransferLimit),
          maxSingleTransfer: Number(limits.maxSingleTransfer),
          minBalance: Number(limits.minBalance),
        },
      }).unwrap();
      setEditing(null);
      dispatch(showToast({ message: "Account transaction limits updated.", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to update limits.", type: "error" }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAccount({
        userId: newAcc.userId,
        accountType: newAcc.accountType,
        initialDeposit: Number(newAcc.initialDeposit || 0),
      }).unwrap();
      setShowNew(false);
      dispatch(showToast({ message: "New bank account created.", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to create account.", type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bank Account Management
            </h1>
            <p className="text-sm text-slate-500">
              Create accounts, freeze or unfreeze suspicious accounts, and configure per-account transaction limits.
            </p>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Create Bank Account
          </button>
        </div>

        {showNew && (
          <form
            onSubmit={handleCreate}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4"
          >
            <select
              required
              value={newAcc.userId}
              onChange={(e) => setNewAcc({ ...newAcc, userId: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            <select
              value={newAcc.accountType}
              onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="SAVINGS">SAVINGS</option>
              <option value="CURRENT">CURRENT</option>
              <option value="BUSINESS">BUSINESS</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="Initial Deposit (৳)"
              value={newAcc.initialDeposit}
              onChange={(e) => setNewAcc({ ...newAcc, initialDeposit: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Create
            </button>
          </form>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Account #</th>
                  <th className="px-5 py-3">Holder</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Daily / Single Limit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading accounts...</td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold">{acc.accountNumber}</td>
                      <td className="px-5 py-3.5">{acc.user?.name}</td>
                      <td className="px-5 py-3.5 text-xs">{acc.accountType}</td>
                      <td className="px-5 py-3.5 font-semibold">{formatCurrency(acc.balance)}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {formatCurrency(acc.dailyTransferLimit)} / {formatCurrency(acc.maxSingleTransfer)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(acc);
                              setLimits({
                                dailyTransferLimit: String(acc.dailyTransferLimit),
                                maxSingleTransfer: String(acc.maxSingleTransfer),
                                minBalance: String(acc.minBalance),
                              });
                            }}
                            title="Edit limits"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleFreeze(acc)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white ${
                              acc.status === "FROZEN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-600 hover:bg-sky-700"
                            }`}
                          >
                            {acc.status === "FROZEN" ? (
                              <>
                                <Sun className="h-3.5 w-3.5" /> Unfreeze
                              </>
                            ) : (
                              <>
                                <Snowflake className="h-3.5 w-3.5" /> Freeze
                              </>
                            )}
                          </button>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveLimits}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Limits for {editing.accountNumber}</h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Daily Transfer Limit (৳)</label>
              <input
                type="number"
                required
                value={limits.dailyTransferLimit}
                onChange={(e) => setLimits({ ...limits, dailyTransferLimit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Max Single Transfer (৳)</label>
              <input
                type="number"
                required
                value={limits.maxSingleTransfer}
                onChange={(e) => setLimits({ ...limits, maxSingleTransfer: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Minimum Balance (৳)</label>
              <input
                type="number"
                required
                value={limits.minBalance}
                onChange={(e) => setLimits({ ...limits, minBalance: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white">
              Save Account Limits
            </button>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
