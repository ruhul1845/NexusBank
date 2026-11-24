"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

const DEMO_USERS = [
  { role: "Admin", email: "admin@nexusbank.com" },
  { role: "Bank Staff", email: "staff@nexusbank.com" },
  { role: "Customer", email: "customer@nexusbank.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-colors duration-200 hover:border-brand-500">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            NexusBank
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to NexusBank
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access your banking workspace.
          </p>
        </div>

        {error && (
          <p className="mb-5 text-center text-sm font-medium text-rose-600">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
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

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
          <span className="text-slate-400">Demo:</span>
          {DEMO_USERS.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("Demo@1234");
              }}
              className="transition hover:text-brand-600"
            >
              {d.role}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          New customer?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            Create new account
          </Link>
        </p>
      </div>
    </div>
  );
}
