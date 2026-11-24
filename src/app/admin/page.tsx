"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useGetAnalyticsQuery } from "@/store/api/bankingApi";
import { formatCurrency } from "@/lib/banking";
import {
  Users,
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Landmark,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9"];

export default function AdminDashboardPage() {
  const { data: analytics, isLoading } = useGetAnalyticsQuery({ scope: "admin" });

  const kpis = (analytics?.kpis as Record<string, number>) || {};
  const monthlyActivity =
    (analytics?.monthlyActivity as Array<{
      month: string;
      volume: number;
      deposits: number;
      withdrawals: number;
      count: number;
    }>) || [];
  const accountDist = (analytics?.accountDistribution as Array<{ name: string; value: number }>) || [];
  const loanStats = (analytics?.loanStats as Array<{ status: string; count: number }>) || [];

  const cards = [
    { label: "Total Customers", value: kpis.totalCustomers ?? 0, icon: Users, isMoney: false },
    { label: "Total Bank Accounts", value: kpis.totalAccounts ?? 0, icon: Wallet, isMoney: false },
    { label: "Total Bank Balance", value: kpis.totalBankBalance ?? 0, icon: Building2, isMoney: true },
    { label: "Total Deposits", value: kpis.totalDeposits ?? 0, icon: ArrowDownLeft, isMoney: true },
    { label: "Total Withdrawals", value: kpis.totalWithdrawals ?? 0, icon: ArrowUpRight, isMoney: true },
    { label: "Total Transactions", value: kpis.totalTransactions ?? 0, icon: Activity, isMoney: false },
    { label: "Pending Loans", value: kpis.pendingLoans ?? 0, icon: Landmark, isMoney: false },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Banking Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time institutional liquidity, transaction volume, account distribution, and credit pipeline.
          </p>
        </div>

        {/* 7 Required KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{c.label}</span>
                  <Icon className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? "..." : c.isMoney ? formatCurrency(c.value) : c.value.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Monthly Transaction Volume */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Transaction Volume</h2>
            <p className="mb-4 text-xs text-slate-500">Total dollar volume processed per month</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="volume" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} name="Volume ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Deposit vs Withdrawal */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Deposit vs. Withdrawal</h2>
            <p className="mb-4 text-xs text-slate-500">Monthly cash inflows vs. outflows</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deposits" fill="#10b981" radius={[6, 6, 0, 0]} name="Deposits ($)" />
                  <Bar dataKey="withdrawals" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Withdrawals ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Account Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Account Distribution</h2>
            <p className="mb-4 text-xs text-slate-500">Breakdown across Savings, Current, and Business accounts</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={accountDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4}>
                    {accountDist.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Loan Approval Statistics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Loan Approval Statistics</h2>
            <p className="mb-4 text-xs text-slate-500">Portfolio distribution by loan lifecycle status</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Loans" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. Monthly Banking Activity (Transaction Count) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Banking Activity</h2>
          <p className="mb-4 text-xs text-slate-500">Number of completed transactions per month</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2.5} name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
