"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useGetAccountsQuery,
  useGetAnalyticsQuery,
  useGetTransactionsQuery,
} from "@/store/api/bankingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedAccountId } from "@/store/slices/accountSlice";
import { formatCurrency } from "@/lib/banking";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  ArrowLeftRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899"];

export default function CustomerDashboard() {
  const dispatch = useAppDispatch();
  const selectedAccountId = useAppSelector((s) => s.account.selectedAccountId);

  const { data: accounts = [], isLoading: accountsLoading } = useGetAccountsQuery();
  const { data: analytics } = useGetAnalyticsQuery({ scope: "customer" });
  const { data: txData } = useGetTransactionsQuery({
    page: 1,
    limit: 6,
    accountId: selectedAccountId || undefined,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      dispatch(setSelectedAccountId(accounts[0].id));
    }
  }, [accounts, selectedAccountId, dispatch]);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const kpis = (analytics?.kpis as Record<string, number>) || {};
  const monthlyHistory =
    (analytics?.monthlyHistory as Array<{ month: string; deposits: number; spending: number }>) || [];
  const txDist = (analytics?.transactionDistribution as Array<{ name: string; value: number }>) || [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Personal Banking Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor balances, cash flow, and active credit facilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeAccount && (
              <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white">
                {activeAccount.accountType} ACCOUNT :  {activeAccount.accountNumber}
              </span>
            )}

            
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Portfolio Balance
              </span>
              <Wallet className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {accountsLoading ? "..." : formatCurrency(kpis.totalBalance ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Active Account: {activeAccount ? formatCurrency(activeAccount.balance) : formatCurrency(0)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Deposits</span>
              <ArrowDownLeft className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(kpis.totalDeposits ?? 0)}
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Cumulative inflows</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Withdrawals</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-rose-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(kpis.totalWithdrawals ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Transfers & cash outs</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Loans</span>
              <Landmark className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(kpis.totalLoanRemaining ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {kpis.activeLoansCount ?? 0} active loan facility
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Monthly Deposit History vs. Spending
            </h2>
            <p className="mb-4 text-xs text-slate-500">6-month cash flow from live ledger records</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyHistory}>
                  <defs>
                    <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="deposits" stroke="#10b981" fill="url(#depGrad)" name="Deposits (৳)" />
                  <Area type="monotone" dataKey="spending" stroke="#4f46e5" fill="url(#spendGrad)" name="Spending (৳)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Transaction Distribution</h2>
            <p className="mb-4 text-xs text-slate-500">Activity breakdown by type</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={txDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {txDist.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {txDist.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Transactions</h2>
            <Link
              href="/customer/transactions"
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Reference</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(txData?.items || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {t.referenceId}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{t.description}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{t.type.replace("_", " ")}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
                {txData?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No transactions found for this account.
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