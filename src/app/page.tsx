import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Zap, Landmark, BarChart3, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">NexusBank</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
            >
              Open Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-950 to-slate-950" />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-medium text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Atomic Ledger Integrity & Role-Based Access Control
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Modern digital banking built for precision and speed.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Manage multi-currency accounts, execute atomic fund transfers with PIN and 2FA verification, apply for
            amortized loans, and oversee institutional operations from one unified platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500"
            >
              Launch Banking Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Create Customer Account
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Atomic Fund Transfers",
                desc: "Every transfer executes inside a PostgreSQL database transaction with idempotency keys, PIN checks, and instant email alerts.",
              },
              {
                icon: Landmark,
                title: "Full Loan Lifecycle",
                desc: "Customers apply with income & employment details; Staff review and forward; Admin approves for instant disbursement and amortization schedules.",
              },
              {
                icon: BarChart3,
                title: "Live Financial Analytics",
                desc: "Interactive Recharts dashboards powered by real database aggregations for both Executive Admin and Personal Banking.",
              },
              {
                icon: Lock,
                title: "Server-Side Security",
                desc: "NextAuth JWT sessions, bcrypt PIN hashing, 2FA verification, and strict API-level role & ownership enforcement.",
              },
              {
                icon: ShieldCheck,
                title: "Fraud & Limit Controls",
                desc: "Configurable daily transfer limits, single-transaction caps, minimum balances, and rule-based suspicious activity flagging.",
              },
              {
                icon: Building2,
                title: "PDF Receipts & Statements",
                desc: "Download official PDF transaction receipts and export full account statements in CSV or PDF format anytime.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-brand-500/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
