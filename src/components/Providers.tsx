"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuthUser } from "@/store/slices/authSlice";
import { clearToast, setDarkMode } from "@/store/slices/uiSlice";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function StateSynchronizer({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((s) => s.ui.darkMode);
  const toast = useAppSelector((s) => s.ui.toast);

  useEffect(() => {
    const savedTheme = localStorage.getItem("nexusbank-theme");
    if (savedTheme === "dark") {
      dispatch(setDarkMode(true));
    }
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("nexusbank-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("nexusbank-theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (session?.user) {
      dispatch(
        setAuthUser({
          id: session.user.id,
          name: session.user.name || "",
          email: session.user.email || "",
          role: session.user.role,
          twoFactorEnabled: session.user.twoFactorEnabled,
        })
      );
    }
  }, [session, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), 4500);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <>
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />}
          {toast.type === "info" && <Info className="h-5 w-5 shrink-0 text-brand-500" />}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
          <button
            onClick={() => dispatch(clearToast())}
            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <StateSynchronizer>{children}</StateSynchronizer>
      </Provider>
    </SessionProvider>
  );
}
