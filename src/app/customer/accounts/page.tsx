"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useGetAccountsQuery, useGetTransactionsQuery } from "@/store/api/bankingApi";
import { formatCurrency } from "@/lib/banking";
import { downloadStatementCsv, downloadStatementPdf } from "@/lib/export";
import { Download, FileSpreadsheet, Wallet } from "lucide-react";

export default function CustomerAccountsPage() {
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const { data: txData } = useGetTransactionsQuery({ page: 1, limit: 100 });

  const allTxns = txData?.items || [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Bank Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View account numbers, limits, status, and export official statements.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading your accounts...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {accounts.map((acc) => {
              const accTxns = allTxns.filter(
                (t) => t.senderAccountId === acc.id || t.receiverAccountId === acc.id
              );

              return (
                <div
                  key={acc.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {acc.accountType} Account
                          </h3>
                          <p className="font-mono text-xs text-slate-500">{acc.accountNumber}</p>
                        </div>
                      </div>
                      <StatusBadge status={acc.status} />
                    </div>

                    <div className="mt-6">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Available Balance
                      </span>
                      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(acc.balance)}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs dark:bg-slate-800/50">
                      <div>
                        <span className="block text-slate-400">Daily Limit</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(acc.dailyTransferLimit)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Single Max</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(acc.maxSingleTransfer)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Min Balance</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(acc.minBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      onClick={() => downloadStatementPdf(acc, accTxns)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export PDF Statement
                    </button>
                    <button
                      onClick={() => downloadStatementCsv(acc, accTxns)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
