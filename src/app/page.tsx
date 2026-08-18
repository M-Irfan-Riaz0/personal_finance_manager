"use client";

import { useEffect, useRef, useState } from "react";
import BudgetSheet from "@/components/BudgetSheet";
import ExpensesSheet from "@/components/ExpensesSheet";
import SettingsPage from "@/components/SettingsPage";
import { createClient } from "@/lib/supabase/client";
import { BudgetData, DEFAULT_BUDGET, computeTotals, fmtPKR, fmtK } from "@/lib/budget";

const SHEET_ID = "default";
const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fixed, SSR-safe fallback so the server-rendered HTML and the client's first
// render agree; the real client date is applied after mount (see useEffect below).
const SSR_SAFE_TODAY = new Date(2026, 7, 18);

type Tab = "overview" | "expenses" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Budget Overview" },
  { id: "expenses", label: "Daily Expenses" },
  { id: "settings", label: "Settings" },
];

export default function Home() {
  const [data, setData] = useState<BudgetData>(DEFAULT_BUDGET);
  const [today, setToday] = useState<Date>(SSR_SAFE_TODAY);
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error" | "no-backend">(
    hasSupabaseConfig ? "loading" : "no-backend",
  );
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const supabase = createClient();
    (async () => {
      const { data: row, error } = await supabase
        .from("budget_sheets")
        .select("data")
        .eq("id", SHEET_ID)
        .maybeSingle();

      if (error) {
        setStatus("error");
        return;
      }
      if (row?.data) {
        const loaded = row.data as BudgetData;
        setData({ ...DEFAULT_BUDGET, ...loaded, expenses: loaded.expenses ?? DEFAULT_BUDGET.expenses });
      } else {
        await supabase.from("budget_sheets").insert({ id: SHEET_ID, data: DEFAULT_BUDGET });
      }
      setStatus("ready");
    })();
  }, []);

  function handleDataChange(next: BudgetData) {
    setData(next);
    if (!hasSupabaseConfig) return;

    setStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("budget_sheets")
        .upsert({ id: SHEET_ID, data: next, updated_at: new Date().toISOString() });
      setStatus(error ? "error" : "saved");
    }, 600);
  }

  const statusDot =
    status === "saved" || status === "ready"
      ? "bg-emerald-500"
      : status === "saving" || status === "loading"
        ? "bg-amber-400"
        : "bg-red-400";

  const statusLabel =
    status === "loading"
      ? "Loading…"
      : status === "saving"
        ? "Saving…"
        : status === "saved"
          ? "Saved"
          : status === "error"
            ? "Couldn't reach Supabase"
            : status === "no-backend"
              ? "Supabase not configured"
              : "Up to date";

  const totals = computeTotals(data, today);
  const statCards = [
    {
      label: "Money in accounts",
      value: fmtK(totals.accountsTotalCurrent),
      isNegative: totals.accountsTotalCurrent < 0,
    },
    {
      label: "Spent this month",
      value: fmtK(totals.spentThisMonth),
      isNegative: false,
    },
    {
      label: "Still owed to me",
      value: fmtK(totals.peopleTotalRemaining),
      isNegative: totals.peopleTotalRemaining < 0,
    },
    {
      label: "Estimated net worth",
      value: fmtK(totals.estimatedNetWorth),
      isNegative: totals.estimatedNetWorth < 0,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white shadow-2xs">
              📊
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-zinc-900">Personal Budget</p>
              <p className="text-xs font-medium text-zinc-500">{data.month}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-zinc-200 px-5 py-4 text-xs font-medium text-zinc-500">
          <span className={`h-2 w-2 rounded-full ${statusDot}`} />
          {statusLabel}
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
          {TABS.find((t) => t.id === tab)?.label}
        </h1>

        {/* Summary stat cards */}
        {tab !== "settings" && (
          <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {statCards.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-2xs transition-all hover:shadow-xs"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{c.label}</p>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${
                    c.isNegative ? "text-rose-600" : "text-zinc-900"
                  }`}
                >
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "overview" && <BudgetSheet data={data} today={today} onDataChange={handleDataChange} />}
        {tab === "expenses" && (
          <ExpensesSheet
            expenses={data.expenses}
            today={today}
            onExpensesChange={(expenses) => handleDataChange({ ...data, expenses })}
          />
        )}
        {tab === "settings" && <SettingsPage data={data} onDataChange={handleDataChange} />}
      </main>
    </div>
  );
}
