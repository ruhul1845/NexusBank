"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useGetTransactionsQuery, TransactionDTO } from "@/store/api/bankingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setTransactionSearch,
  setTransactionTypeFilter,
  setTransactionDateRange,
  setTransactionPage,
  resetTransactionFilters,
} from "@/store/slices/transactionSlice";
import { formatCurrency } from "@/lib/banking";
import { downloadTransactionReceiptPdf } from "@/lib/export";
import { Search, Download, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerTransactionsPage() {
  const dispatch = useAppDispatch();
  const { search, typeFilter, startDate, endDate, page } = useAppSelector((s) => s.transaction);
  const [selectedTxn, setSelectedTxn] = useState<TransactionDTO | null>(null);

  const { data, isLoading } = useGetTransactionsQuery({
    page,
    limit: 10,
    search,
    type: typeFilter,
    startDate,
    endDate,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transaction History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search by Reference ID, filter by date or type, inspect details, and download PDF receipts.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => dispatch(setTransactionSearch(e.target.value))}
              placeholder="Search Transaction ID or description..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => dispatch(setTransactionTypeFilter(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">All Types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="FUND_TRANSFER">Fund Transfer</option>
            <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
            <option value="LOAN_REPAYMENT">Loan Repayment</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => dispatch(setTransactionDateRange({ startDate: e.target.value, endDate }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => dispatch(setTransactionDateRange({ startDate, endDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              onClick={() => dispatch(resetTransactionFilters())}
              className="rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference ID</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t.referenceId}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{t.type.replace("_", " ")}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{t.description}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedTxn(t)}
                            title="View details"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadTransactionReceiptPdf(t)}
                            title="Download PDF receipt"
                            className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 text-xs text-slate-500 dark:border-slate-800">
            <span>
              Page {page} of {totalPages} ({data?.total || 0} records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => dispatch(setTransactionPage(page - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => dispatch(setTransactionPage(page + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Transaction Details</h3>
              <button onClick={() => setSelectedTxn(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-mono font-medium">{selectedTxn.referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span>{selectedTxn.type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selectedTxn.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender Account</span>
                <span className="font-mono">{selectedTxn.senderAccount?.accountNumber || "External / Bank"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiver Account</span>
                <span className="font-mono">{selectedTxn.receiverAccount?.accountNumber || "External / Bank"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold">{formatCurrency(selectedTxn.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee</span>
                <span>{formatCurrency(selectedTxn.fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span>{new Date(selectedTxn.createdAt).toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <span className="block text-xs text-slate-500">Description</span>
                <p className="mt-0.5 text-slate-800 dark:text-slate-200">{selectedTxn.description}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => downloadTransactionReceiptPdf(selectedTxn)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
