"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useGetCustomersQuery, useUpdateCustomerMutation } from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { Search, ShieldBan, CheckCircle, XCircle, Eye, X } from "lucide-react";

export default function AdminCustomersPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading } = useGetCustomersQuery({ search });
  const [updateCustomer] = useUpdateCustomerMutation();
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

  async function handleStatusChange(id: string, status: "ACTIVE" | "DEACTIVATED" | "BLOCKED") {
    try {
      await updateCustomer({ id, status }).unwrap();
      dispatch(showToast({ message: `Customer status updated to ${status}.`, type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to update customer status.", type: "error" }));
    }
  }

  async function handleViewDetails(id: string) {
    const res = await fetch(`/api/customers/${id}`);
    if (res.ok) {
      setDetailData(await res.json());
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Management</h1>
          <p className="text-sm text-slate-500">
            Search customers, inspect full transaction histories, activate/deactivate, or block suspicious profiles.
          </p>
        </div>

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
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Admin Actions</th>
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
                      <td className="px-5 py-3.5 font-mono text-xs">{c.accounts.length} account(s)</td>
                      <td className="px-5 py-3.5 font-semibold">{formatCurrency(c.totalBalance)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(c.id)}
                            title="View history & details"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {c.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(c.id, "ACTIVE")}
                              title="Activate"
                              className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {c.status === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(c.id, "DEACTIVATED")}
                              title="Deactivate"
                              className="rounded-lg bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {c.status !== "BLOCKED" && (
                            <button
                              onClick={() => handleStatusChange(c.id, "BLOCKED")}
                              title="Block Suspicious Customer"
                              className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700"
                            >
                              <ShieldBan className="h-4 w-4" />
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

      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-semibold">{String(detailData.name)} — Profile & History</h3>
              <button onClick={() => setDetailData(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <p className="text-slate-500">
                Email: {String(detailData.email)} | Phone: {String(detailData.phone || "N/A")}
              </p>
              <h4 className="font-semibold">Recent Transactions</h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {((detailData.transactions as Array<Record<string, unknown>>) || []).map((t) => (
                  <div key={String(t.id)} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div>
                      <span className="font-mono font-semibold">{String(t.referenceId)}</span>
                      <p className="text-slate-500">{String(t.description)}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(Number(t.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
