"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useCreateAccountMutation,
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
} from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { UserPlus, Search, CheckCircle2, PlusCircle } from "lucide-react";

export default function StaffCustomersPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading } = useGetCustomersQuery({ search });
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [createAccount] = useCreateAccountMutation();

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    transactionPin: "1234",
    accountType: "SAVINGS",
    initialDeposit: "0",
  });

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await createCustomer({
        ...newForm,
        initialDeposit: Number(newForm.initialDeposit || 0),
      }).unwrap();
      setShowNewCustomer(false);
      setNewForm({ name: "", email: "", password: "", phone: "", transactionPin: "1234", accountType: "SAVINGS", initialDeposit: "0" });
      dispatch(showToast({ message: `Registered ${res.name} (Acct: ${res.accountNumber})`, type: "success" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to register customer";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  async function handleVerify(id: string) {
    try {
      await updateCustomer({ id, isVerified: true }).unwrap();
      dispatch(showToast({ message: "Customer KYC verified.", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Verification failed.", type: "error" }));
    }
  }

  async function handleOpenAdditionalAccount(userId: string) {
    try {
      const res = await createAccount({ userId, accountType: "CURRENT", initialDeposit: 0 }).unwrap();
      dispatch(showToast({ message: `Opened new CURRENT account ${res.accountNumber}`, type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to open account.", type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer Operations & KYC
            </h1>
            <p className="text-sm text-slate-500">
              Register customers, open bank accounts, and verify customer KYC profiles.
            </p>
          </div>
          <button
            onClick={() => setShowNewCustomer(!showNewCustomer)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <UserPlus className="h-4 w-4" />
            Register Customer
          </button>
        </div>

        {showNewCustomer && (
          <form
            onSubmit={handleCreateCustomer}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3"
          >
            <input
              required
              placeholder="Full Name"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={newForm.email}
              onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="Temp Password (min 6)"
              value={newForm.password}
              onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder="Phone Number"
              value={newForm.phone}
              onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <select
              value={newForm.accountType}
              onChange={(e) => setNewForm({ ...newForm, accountType: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="SAVINGS">Savings Account</option>
              <option value="CURRENT">Current Account</option>
              <option value="BUSINESS">Business Account</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Initial Deposit ($)"
                value={newForm.initialDeposit}
                onChange={(e) => setNewForm({ ...newForm, initialDeposit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="submit"
                disabled={creating}
                className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {creating ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Accounts</th>
                  <th className="px-5 py-3">Total Balance</th>
                  <th className="px-5 py-3">KYC Status</th>
                  <th className="px-5 py-3 text-right">Staff Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">Loading customers...</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {c.accounts.map((a) => (
                          <div key={a.id} className="font-mono">
                            {a.accountNumber} ({a.accountType})
                          </div>
                        ))}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">{formatCurrency(c.totalBalance)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.isVerified ? "VERIFIED" : "PENDING"} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-2">
                          {!c.isVerified && (
                            <button
                              onClick={() => handleVerify(c.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verify KYC
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAdditionalAccount(c.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <PlusCircle className="h-3.5 w-3.5" /> + Account
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
    </DashboardShell>
  );
}
