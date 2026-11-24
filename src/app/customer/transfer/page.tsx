"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useGetAccountsQuery,
  useLazyLookupRecipientQuery,
  useTransferFundsMutation,
  TransactionDTO,
} from "@/store/api/bankingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/banking";
import { downloadTransactionReceiptPdf } from "@/lib/export";
import { ArrowLeftRight, CheckCircle2, Download, ShieldCheck, Search } from "lucide-react";

export default function FundTransferPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { data: accounts = [] } = useGetAccountsQuery();
  const [lookupRecipient, { data: recipientInfo, isFetching: lookingUp, error: lookupError }] =
    useLazyLookupRecipientQuery();
  const [transferFunds, { isLoading: transferring }] = useTransferFundsMutation();

  const [senderAccountId, setSenderAccountId] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completedTxn, setCompletedTxn] = useState<TransactionDTO | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (accounts.length > 0 && !senderAccountId) {
      setSenderAccountId(accounts[0].id);
    }
  }, [accounts, senderAccountId]);

  const ownOtherAccounts = accounts.filter((a) => a.id !== senderAccountId);
  const selectedSender = accounts.find((a) => a.id === senderAccountId);

  function handleLookup() {
    if (recipientAccountNumber.trim().length >= 6) {
      lookupRecipient(recipientAccountNumber.trim());
    }
  }

  function handlePreSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function handleConfirmTransfer() {
    try {
      const res = await transferFunds({
        senderAccountId,
        recipientAccountNumber: recipientAccountNumber.trim(),
        amount: Number(amount),
        description: description.trim(),
        transactionPin,
        twoFactorCode: authUser?.twoFactorEnabled ? twoFactorCode : undefined,
        idempotencyKey,
      }).unwrap();

      setCompletedTxn(res);
      setConfirmOpen(false);
      setAmount("");
      setDescription("");
      setTransactionPin("");
      setTwoFactorCode("");
      setIdempotencyKey(crypto.randomUUID());
      dispatch(showToast({ message: `Transfer ${res.referenceId} completed! Email alert sent.`, type: "success" }));
    } catch (err: unknown) {
      setConfirmOpen(false);
      const msg = (err as { data?: { error?: string } })?.data?.error || "Transfer failed";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fund Transfer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Transfer funds between your own accounts or to another NexusBank customer.
          </p>
        </div>

        {completedTxn && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-500/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Transfer Successful — {completedTxn.referenceId}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(completedTxn.amount)} sent (Fee: {formatCurrency(completedTxn.fee)}). Email receipt dispatched.
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadTransactionReceiptPdf(completedTxn)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF Receipt
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handlePreSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              From Account
            </label>
            <select
              required
              value={senderAccountId}
              onChange={(e) => setSenderAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType} — {a.accountNumber} (Balance: {formatCurrency(a.balance)}) [{a.status}]
                </option>
              ))}
            </select>
            {selectedSender && (
              <p className="mt-1 text-xs text-slate-500">
                Single Txn Max: {formatCurrency(selectedSender.maxSingleTransfer)} | Daily Limit:{" "}
                {formatCurrency(selectedSender.dailyTransferLimit)}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Recipient Account Number
              </label>
              {ownOtherAccounts.length > 0 && (
                <div className="flex gap-2">
                  {ownOtherAccounts.map((own) => (
                    <button
                      key={own.id}
                      type="button"
                      onClick={() => {
                        setRecipientAccountNumber(own.accountNumber);
                        lookupRecipient(own.accountNumber);
                      }}
                      className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300"
                    >
                      Own {own.accountType}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                required
                value={recipientAccountNumber}
                onChange={(e) => setRecipientAccountNumber(e.target.value)}
                onBlur={handleLookup}
                placeholder="e.g. 400199302001"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={handleLookup}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Search className="h-3.5 w-3.5" />
                Verify
              </button>
            </div>
            {lookingUp && <p className="mt-1.5 text-xs text-slate-400">Verifying recipient account...</p>}
            {recipientInfo && (
              <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Verified: {recipientInfo.holderName} ({recipientInfo.accountType} • {recipientInfo.status})
              </p>
            )}
            {lookupError && (
              <p className="mt-1.5 text-xs text-rose-500">Recipient account not found.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Transaction PIN
              </label>
              <input
                type="password"
                required
                pattern="\d{4,6}"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value)}
                placeholder="4-6 digit PIN (Demo: 1234)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          {authUser?.twoFactorEnabled && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/40 dark:bg-brand-500/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <ShieldCheck className="h-4 w-4" />
                Two-Factor Authentication Required
              </div>
              <input
                type="text"
                required
                pattern="\d{6}"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit 2FA code (e.g. 123456)"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description / Reference Note
            </label>
            <input
              required
              minLength={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly Rent or Invoice #102"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <button
            type="submit"
            disabled={transferring || !senderAccountId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Review & Transfer Funds
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Fund Transfer"
        description={`You are about to transfer ${formatCurrency(Number(amount || 0))} to account ${recipientAccountNumber}. This action executes atomically and cannot be undone by the customer.`}
        confirmLabel="Execute Transfer"
        loading={transferring}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setConfirmOpen(false)}
      />
    </DashboardShell>
  );
}
