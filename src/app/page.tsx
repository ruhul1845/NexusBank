"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Zap,
  Landmark,
  BarChart3,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Atomic Fund Transfers",
    desc: "Every transfer executes inside a PostgreSQL database transaction with idempotency keys, PIN checks, and instant email alerts.",
    accent: "from-indigo-950 via-brand-900 to-slate-900",
  },
  {
    icon: Landmark,
    title: "Full Loan Lifecycle",
    desc: "Customers apply with income & employment details; Staff review and forward; Admin approves for instant disbursement and amortization schedules.",
    accent: "from-slate-900 via-indigo-950 to-brand-900",
  },
  {
    icon: BarChart3,
    title: "Live Financial Analytics",
    desc: "Interactive Recharts dashboards powered by real database aggregations for both Executive Admin and Personal Banking.",
    accent: "from-brand-950 via-slate-900 to-indigo-900",
  },
  {
    icon: Lock,
    title: "Server-Side Security",
    desc: "NextAuth JWT sessions, bcrypt PIN hashing, 2FA verification, and strict API-level role & ownership enforcement.",
    accent: "from-slate-950 via-brand-900 to-slate-900",
  },
  {
    icon: ShieldCheck,
    title: "Fraud & Limit Controls",
    desc: "Configurable daily transfer limits, single-transaction caps, minimum balances, and rule-based suspicious activity flagging.",
    accent: "from-indigo-900 via-slate-900 to-brand-950",
  },
  {
    icon: Building2,
    title: "PDF Receipts & Statements",
    desc: "Download official PDF transaction receipts and export full account statements in CSV or PDF format anytime.",
    accent: "from-slate-900 via-brand-950 to-indigo-950",
  },
];

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAPABILITIES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () =>
    setActiveIndex((prev) => (prev - 1 + CAPABILITIES.length) % CAPABILITIES.length);
  const nextSlide = () =>
    setActiveIndex((prev) => (prev + 1) % CAPABILITIES.length);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">NexusBank</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Open Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with /bank.webp background */}
      <section
        className="relative overflow-hidden bg-cover bg-center py-24 sm:py-32"
        style={{ backgroundImage: "url('/bank.webp')" }}
      >
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Atomic Ledger Integrity & Role-Based Access Control
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Modern digital banking built for precision and speed.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
            Manage multi-currency accounts, execute atomic fund transfers with PIN and 2FA verification, apply for
            amortized loans, and oversee institutional operations from one unified platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
            >
              Launch Banking Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Create Customer Account
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Coverflow Carousel */}
      <section className="overflow-hidden border-t border-slate-200 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-[370px] items-center justify-center">
            {CAPABILITIES.map((item, idx) => {
              const Icon = item.icon;
              const total = CAPABILITIES.length;
              let offset = idx - activeIndex;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;

              const abs = Math.abs(offset);
              const isVisible = abs <= 2;

              const translateX = offset * 175;
              const scale = offset === 0 ? 1 : abs === 1 ? 0.86 : 0.72;
              const zIndex = 30 - abs * 10;
              const opacity = !isVisible ? 0 : offset === 0 ? 1 : abs === 1 ? 0.88 : 0.65;

              return (
                <div
                  key={item.title}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    zIndex,
                    opacity,
                    pointerEvents: isVisible ? "auto" : "none",
                  }}
                  className={`absolute flex h-[320px] w-[260px] cursor-pointer flex-col justify-between rounded-2xl border bg-gradient-to-br p-6 text-white shadow-2xl transition-all duration-500 ease-out ${item.accent} ${
                    offset === 0 ? "border-brand-400/60 ring-2 ring-brand-500/30" : "border-white/15"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-brand-300 backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">{item.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{item.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* Left / Right Controls */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous card"
              className="absolute left-2 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-md transition hover:bg-white sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next card"
              className="absolute right-2 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-md transition hover:bg-white sm:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {CAPABILITIES.map((item, idx) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Go to ${item.title}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? "w-6 bg-brand-600" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand-300 backdrop-blur-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">NexusBank</span>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Enterprise-grade digital banking platform built with atomic PostgreSQL transactions, role-based access
                control, and real-time financial analytics.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Banking Portals</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/customer" className="transition hover:text-white">
                    Personal Banking
                  </Link>
                </li>
                <li>
                  <Link href="/staff" className="transition hover:text-white">
                    Bank Staff Operations
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="transition hover:text-white">
                    Admin Console
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Get Started</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/login" className="transition hover:text-white">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition hover:text-white">
                    Open New Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} NexusBank Digital Banking Management System.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
              Simulated Banking Environment — BDT (৳)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}