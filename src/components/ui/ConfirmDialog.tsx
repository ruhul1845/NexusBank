"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                variant === "danger"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                  : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
