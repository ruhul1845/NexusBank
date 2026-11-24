"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

const DEMO_USERS = [
  { role: "Admin", email: "admin@nexusbank.com", desc: "Full analytics, account freeze, loan approvals & limits" },
  { role: "Bank Staff", email: "staff@nexusbank.com", desc: "KYC verification, request review & loan forwarding" },
  { role: "Customer", email: "customer@nexusbank.com", desc: "Accounts, transfers, statements & loan applications" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    if (role === "ADMIN") router.push("/admin");
    else if (role === "STAFF") router.push("/staff");
    else router.push("/customer");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left Brand Panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-950 p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">NexusBank</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Enterprise-grade digital banking, engineered for trust.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-200/80">
            Sign in to access your role-specific banking workspace. All financial operations are protected by atomic
            database transactions, PIN validation, and real-time email alerts.
          </p>

          <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              Quick-Fill Demo Credentials (Password: Demo@1234 | PIN: 1234)
            </p>
            {DEMO_USERS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword("Demo@1234");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left transition hover:bg-white/10"
              >
                <div>
                  <span className="text-sm font-semibold text-white">{d.role}</span>
                  <p className="text-xs text-brand-200/70">{d.desc}</p>
                </div>
                <span className="font-mono text-xs text-brand-300">{d.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-200/60">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Simulated Banking Environment — No real payment cards or real funds
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to NexusBank
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your credentials or click a demo role to explore.
            </p>
          </div>

          {/* Mobile Demo Quick Fill */}
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {DEMO_USERS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword("Demo@1234");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Fill {d.role}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexusbank.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            New customer?{" "}
            <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Open a bank account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
