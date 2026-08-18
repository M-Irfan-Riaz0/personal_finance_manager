"use client";

import { useEffect, useRef, useState } from "react";
import BudgetSheet from "@/components/BudgetSheet";
import ExpensesSheet from "@/components/ExpensesSheet";
import { createClient } from "@/lib/supabase/client";
import { BudgetData, DEFAULT_BUDGET, computeTotals, fmtPKR } from "@/lib/budget";

const SHEET_ID = "default";
const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fixed, SSR-safe fallback so the server-rendered HTML and the client's first
// render agree; the real client date is applied after mount (see useEffect below).
const SSR_SAFE_TODAY = new Date(2026, 7, 18);

type Tab = "overview" | "expenses";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Budget Overview" },
  { id: "expenses", label: "Daily Expenses" },
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
    { label: "Money in accounts", value: fmtPKR(totals.accountsTotalCurrent) },
    { label: "Spent this month", value: fmtPKR(totals.spentThisMonth) },
    { label: "Still owed to me", value: fmtPKR(totals.peopleTotalRemaining) },
    { label: "Estimated net worth", value: fmtPKR(totals.estimatedNetWorth) },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8] py-8 px-4 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Personal Budget</h1>
            <p className="text-sm text-zinc-500">{data.month}</p>
          </div>
          <div className="flex items-center gap-2 border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500">
            <span className={`h-2 w-2 ${statusDot}`} />
            {statusLabel}
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((c) => (
            <div key={c.label} className="border border-zinc-200 bg-white px-4 py-4">
              <p className="text-xs font-medium text-zinc-500">{c.label}</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-6 border-b border-zinc-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative -mb-px cursor-pointer pb-3 text-sm font-medium transition-colors ${
                tab === t.id ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="overflow-hidden border border-zinc-200 bg-white">
          {tab === "overview" && <BudgetSheet data={data} today={today} onDataChange={handleDataChange} />}
          {tab === "expenses" && (
            <ExpensesSheet
              expenses={data.expenses}
              onExpensesChange={(expenses) => handleDataChange({ ...data, expenses })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
