"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useGetCustomersQuery,
  useGetLoansQuery,
  useGetRequestsQuery,
  useGetTransactionsQuery,
} from "@/store/api/bankingApi";
import { formatCurrency } from "@/lib/banking";
import { Users, ArrowDownUp, Landmark, ShieldAlert, ArrowRight } from "lucide-react";

export default function StaffDashboardPage() {
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: requests = [] } = useGetRequestsQuery({ status: "PENDING" });
  const { data: loans = [] } = useGetLoansQuery();
  const { data: flaggedTx } = useGetTransactionsQuery({ flagged: true, limit: 5 });

  const pendingLoans = loans.filter((l) => l.status === "PENDING");
  const unverifiedCustomers = customers.filter((c) => !c.isVerified);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bank Staff Operations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage customer onboarding, KYC verification, deposit/withdrawal approvals, and loan pre-screening.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Unverified KYC</span>
              <Users className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{unverifiedCustomers.length}</p>
            <Link href="/staff/customers" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              Review customers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Requests</span>
              <ArrowDownUp className="h-4.5 w-4.5 text-brand-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{requests.length}</p>
            <Link href="/staff/transactions" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              Process requests <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Loans to Screen</span>
              <Landmark className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{pendingLoans.length}</p>
            <Link href="/staff/loans" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              Review loans <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Flagged Txns</span>
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{flaggedTx?.total ?? 0}</p>
            <Link href="/staff/transactions" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              Inspect alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Pending Requests Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Pending Deposit & Withdrawal Queue
            </h2>
            <Link href="/staff/transactions" className="text-xs font-semibold text-brand-600 hover:underline">
              Open Queue
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3.5 font-medium">{r.user?.name}</td>
                    <td className="px-6 py-3.5 font-mono text-xs">{r.account.accountNumber}</td>
                    <td className="px-6 py-3.5 text-xs">{r.type}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      All deposit and withdrawal requests are caught up.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
