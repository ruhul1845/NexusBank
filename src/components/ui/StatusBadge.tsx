import React from "react";

const VARIANT_MAP: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  UNDER_REVIEW: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
  FROZEN: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  FLAGGED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  DEACTIVATED: "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  REVERSED: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400",
};

/**
 * Text-only colours per status. No background, no ring, no pill —
 * used where a badge should read as plain coloured text.
 */
const TEXT_ONLY_MAP: Record<string, string> = {
  ACTIVE: "text-emerald-600 dark:text-emerald-400",
  COMPLETED: "text-emerald-600 dark:text-emerald-400",
  APPROVED: "text-emerald-600 dark:text-emerald-400",
  PAID: "text-emerald-600 dark:text-emerald-400",
  VERIFIED: "text-emerald-600 dark:text-emerald-400",
  PENDING: "text-amber-600 dark:text-amber-400",
  UNDER_REVIEW: "text-indigo-600 dark:text-indigo-400",
  FROZEN: "text-sky-600 dark:text-sky-400",
  REJECTED: "text-rose-600 dark:text-rose-400",
  FAILED: "text-rose-600 dark:text-rose-400",
  BLOCKED: "text-rose-600 dark:text-rose-400",
  FLAGGED: "text-rose-600 dark:text-rose-400",
  DEACTIVATED: "text-slate-500 dark:text-slate-400",
  REVERSED: "text-purple-600 dark:text-purple-400",
  CLOSED: "text-slate-500 dark:text-slate-400",
};

const DEFAULT_SOLID =
  "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300";
const DEFAULT_TEXT_ONLY = "text-slate-600 dark:text-slate-400";

type StatusBadgeVariant = "solid" | "text";

interface StatusBadgeProps {
  status: string;
  /** "text" (default) renders coloured text only; "solid" renders the pill. */
  variant?: StatusBadgeVariant;
  className?: string;
}

export function StatusBadge({ status, variant = "text", className = "" }: StatusBadgeProps) {
  const label = status.replace(/_/g, " ");

  if (variant === "text") {
    const tone = TEXT_ONLY_MAP[status] || DEFAULT_TEXT_ONLY;
    return (
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${tone} ${className}`.trim()}
      >
        {label}
      </span>
    );
  }

  const cls = VARIANT_MAP[status] || DEFAULT_SOLID;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
