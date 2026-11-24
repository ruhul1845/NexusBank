"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    transactionPin: "",
    accountType: "SAVINGS",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/login");
    } catch {
      setError("Network error while registering");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Open a NexusBank Account</h1>
            <p className="text-xs text-slate-500">Instant digital account provisioning</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Transaction PIN (4-6 digits)
              </label>
              <input
                type="password"
                required
                pattern="\d{4,6}"
                value={form.transactionPin}
                onChange={(e) => setForm({ ...form, transactionPin: e.target.value })}
                placeholder="e.g. 1234"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Account Type</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="SAVINGS">Savings Account</option>
                <option value="CURRENT">Current Account</option>
                <option value="BUSINESS">Business Account</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street, City"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
