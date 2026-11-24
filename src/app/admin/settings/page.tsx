"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/bankingApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const [form, setForm] = useState({
    defaultDailyTransferLimit: "10000",
    defaultMaxSingleTransfer: "5000",
    defaultMinBalance: "50",
    transferFeePercent: "0.25",
    suspiciousAmountThreshold: "8000",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        defaultDailyTransferLimit: String(settings.defaultDailyTransferLimit),
        defaultMaxSingleTransfer: String(settings.defaultMaxSingleTransfer),
        defaultMinBalance: String(settings.defaultMinBalance),
        transferFeePercent: String(settings.transferFeePercent),
        suspiciousAmountThreshold: String(settings.suspiciousAmountThreshold),
      });
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings({
        defaultDailyTransferLimit: Number(form.defaultDailyTransferLimit),
        defaultMaxSingleTransfer: Number(form.defaultMaxSingleTransfer),
        defaultMinBalance: Number(form.defaultMinBalance),
        transferFeePercent: Number(form.transferFeePercent),
        suspiciousAmountThreshold: Number(form.suspiciousAmountThreshold),
      }).unwrap();
      dispatch(showToast({ message: "Bank-wide transaction limits & thresholds saved.", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Failed to save settings.", type: "error" }));
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bank-Wide Limits & Security Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure default daily transfer caps, minimum balances, fee rates, and suspicious activity thresholds.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading settings...</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Default Daily Transfer Limit ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={form.defaultDailyTransferLimit}
                    onChange={(e) => setForm({ ...form, defaultDailyTransferLimit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Max Single Transaction Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={form.defaultMaxSingleTransfer}
                    onChange={(e) => setForm({ ...form, defaultMaxSingleTransfer: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Default Minimum Balance ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={form.defaultMinBalance}
                    onChange={(e) => setForm({ ...form, defaultMinBalance: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    External Transfer Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.transferFeePercent}
                    onChange={(e) => setForm({ ...form, transferFeePercent: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Suspicious Transaction Alert Threshold ($)
                </label>
                <input
                  type="number"
                  required
                  value={form.suspiciousAmountThreshold}
                  onChange={(e) => setForm({ ...form, suspiciousAmountThreshold: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}
