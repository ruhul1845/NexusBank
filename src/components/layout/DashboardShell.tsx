"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowDownUp,
  History,
  Landmark,
  Users,
  ShieldAlert,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Building2,
  CheckCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen, toggleDarkMode } from "@/store/slices/uiSlice";
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from "@/store/api/bankingApi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const CUSTOMER_NAV: NavItem[] = [
  { label: "Overview", href: "/customer", icon: LayoutDashboard },
  { label: "Accounts", href: "/customer/accounts", icon: Wallet },
  { label: "Fund Transfer", href: "/customer/transfer", icon: ArrowLeftRight },
  { label: "Deposit & Withdraw", href: "/customer/deposits-withdrawals", icon: ArrowDownUp },
  { label: "Transactions", href: "/customer/transactions", icon: History },
  { label: "Loans", href: "/customer/loans", icon: Landmark },
];

const STAFF_NAV: NavItem[] = [
  { label: "Operations", href: "/staff", icon: LayoutDashboard },
  { label: "Customers & KYC", href: "/staff/customers", icon: Users },
  { label: "Transactions", href: "/staff/transactions", icon: History },
  { label: "Loan Review", href: "/staff/loans", icon: Landmark },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Analytics", href: "/admin", icon: LayoutDashboard },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Bank Accounts", href: "/admin/accounts", icon: Wallet },
  { label: "Transactions", href: "/admin/transactions", icon: ShieldAlert },
  { label: "Loan Approvals", href: "/admin/loans", icon: Landmark },
  { label: "Settings & Limits", href: "/admin/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((s) => s.ui.darkMode);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !session?.user,
    pollingInterval: 30000,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const role = session?.user?.role || "CUSTOMER";
  const navItems = role === "ADMIN" ? ADMIN_NAV : role === "STAFF" ? STAFF_NAV : CUSTOMER_NAV;

  const roleLabel = role === "ADMIN" ? "Administrator" : role === "STAFF" ? "Bank Staff" : "Personal Banking";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                NexusBank
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {roleLabel}
              </span>
            </div>
          </Link>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/customer" &&
                item.href !== "/staff" &&
                item.href !== "/admin" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dispatch(setSidebarOpen(false))}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {session?.user?.name || "User"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-900/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(setSidebarOpen(true))}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Secure Banking Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => dispatch(toggleDarkMode())}
              title="Toggle theme"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markRead()}
                        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && markRead({ id: n.id })}
                          className={`cursor-pointer p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !n.isRead ? "bg-brand-50/40 dark:bg-brand-500/5" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
