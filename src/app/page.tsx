"use client";

import { useEffect, useRef, useState } from "react";
import BudgetSheet from "@/components/BudgetSheet";
import ExpensesSheet from "@/components/ExpensesSheet";
import SettingsPage from "@/components/SettingsPage";
import FutureSpendingSheet from "@/components/FutureSpendingSheet";
import PasswordGate from "@/components/PasswordGate";
import HomePage from "@/components/HomePage";
import TodosPage from "@/components/TodosPage";
import HabitsPage from "@/components/HabitsPage";
import LearningPage from "@/components/LearningPage";
import { createClient } from "@/lib/supabase/client";
import {
  BudgetData,
  DEFAULT_BUDGET,
  computeTotals,
  fmtK,
  monthKey,
  monthLabel,
  nextMonthKey,
  lastDayOfMonthKey,
  createNextMonthData,
} from "@/lib/budget";
import { Todo } from "@/lib/todos";
import { Habit, HabitLog } from "@/lib/habits";
import { LearningFile, LearningItem } from "@/lib/learning";

const LEGACY_SHEET_ID = "default";
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fixed, SSR-safe fallback so the server-rendered HTML and the client's first
// render agree; the real client date is applied after mount (see useEffect below).
const SSR_SAFE_TODAY = new Date(2026, 7, 18);

type Tab = "home" | "overview" | "expenses" | "future" | "todos" | "habits" | "learning" | "settings";

const NAV_SECTIONS: { title?: string; items: { id: Tab; label: string }[] }[] = [
  { items: [{ id: "home", label: "Home" }] },
  {
    title: "Finance",
    items: [
      { id: "overview", label: "Budget Overview" },
      { id: "expenses", label: "Daily Expenses" },
      { id: "future", label: "Future Spending" },
    ],
  },
  {
    title: "Productivity",
    items: [
      { id: "todos", label: "Todos" },
      { id: "habits", label: "Habits" },
      { id: "learning", label: "Learning" },
    ],
  },
  { items: [{ id: "settings", label: "Settings" }] },
];

const ALL_TABS = NAV_SECTIONS.flatMap((s) => s.items);

export default function Home() {
  const [data, setData] = useState<BudgetData>(DEFAULT_BUDGET);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [learningFiles, setLearningFiles] = useState<LearningFile[]>([]);
  const [today, setToday] = useState<Date>(SSR_SAFE_TODAY);
  const [tab, setTab] = useState<Tab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error" | "no-backend">(
    hasSupabaseConfig ? "loading" : "no-backend",
  );
  const [activeMonthKey, setActiveMonthKey] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [creatingMonth, setCreatingMonth] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  function applyLoadedBudget(loaded: BudgetData) {
    setData({ ...DEFAULT_BUDGET, ...loaded, expenses: loaded.expenses ?? DEFAULT_BUDGET.expenses });
  }

  async function switchToMonth(key: string) {
    setMonthMenuOpen(false);
    if (key === activeMonthKey) return;
    const supabase = createClient();
    const { data: row, error } = await supabase.from("budget_sheets").select("data").eq("id", key).maybeSingle();
    if (error || !row?.data) {
      setStatus("error");
      return;
    }
    applyLoadedBudget(row.data as BudgetData);
    setActiveMonthKey(key);
  }

  async function createNewMonth() {
    const latestKey = availableMonths[0] ?? activeMonthKey;
    const newKey = nextMonthKey(latestKey);
    if (availableMonths.includes(newKey)) {
      switchToMonth(newKey);
      return;
    }
    setCreatingMonth(true);
    const supabase = createClient();

    let baseBudget = data;
    if (latestKey !== activeMonthKey) {
      const { data: row } = await supabase.from("budget_sheets").select("data").eq("id", latestKey).maybeSingle();
      baseBudget = (row?.data as BudgetData) ?? data;
    }
    const baseTotals = computeTotals(baseBudget, new Date());
    const fresh = createNextMonthData(baseBudget, baseTotals, newKey);
    await supabase.from("budget_sheets").insert({ id: newKey, data: fresh });

    setAvailableMonths([newKey, ...availableMonths]);
    setData(fresh);
    setActiveMonthKey(newKey);
    setCreatingMonth(false);
    setMonthMenuOpen(false);
  }

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const supabase = createClient();
    (async () => {
      const nowKey = monthKey(new Date());
      const { data: rows, error } = await supabase.from("budget_sheets").select("id").order("id", { ascending: false });

      if (error) {
        setStatus("error");
        return;
      }

      const ids = (rows ?? []).map((r) => r.id as string);
      const months = ids.filter((id) => MONTH_KEY_RE.test(id));

      if (months.includes(nowKey)) {
        const { data: row } = await supabase.from("budget_sheets").select("data").eq("id", nowKey).maybeSingle();
        if (row?.data) applyLoadedBudget(row.data as BudgetData);
        setActiveMonthKey(nowKey);
        setAvailableMonths(months);
      } else if (ids.includes(LEGACY_SHEET_ID)) {
        // Pre-multi-month data lived under a single fixed row — adopt it as this month's
        // data without deleting the original, so nothing is lost.
        const { data: legacyRow } = await supabase
          .from("budget_sheets")
          .select("data")
          .eq("id", LEGACY_SHEET_ID)
          .maybeSingle();
        const legacyData = (legacyRow?.data as BudgetData) ?? DEFAULT_BUDGET;
        await supabase.from("budget_sheets").insert({ id: nowKey, data: legacyData });
        applyLoadedBudget(legacyData);
        setActiveMonthKey(nowKey);
        setAvailableMonths([nowKey, ...months]);
      } else if (months.length > 0) {
        const latestKey = months[0];
        const { data: latestRow } = await supabase.from("budget_sheets").select("data").eq("id", latestKey).maybeSingle();
        const latestData = (latestRow?.data as BudgetData) ?? DEFAULT_BUDGET;
        const latestTotals = computeTotals(latestData, new Date());
        const fresh = createNextMonthData(latestData, latestTotals, nowKey);
        await supabase.from("budget_sheets").insert({ id: nowKey, data: fresh });
        setData(fresh);
        setActiveMonthKey(nowKey);
        setAvailableMonths([nowKey, ...months]);
      } else {
        await supabase.from("budget_sheets").insert({ id: nowKey, data: DEFAULT_BUDGET });
        setData(DEFAULT_BUDGET);
        setActiveMonthKey(nowKey);
        setAvailableMonths([nowKey]);
      }

      setStatus("ready");
    })();

    (async () => {
      const { data: rows } = await supabase.from("todos").select("*").order("created_at", { ascending: true });
      if (rows) setTodos(rows as Todo[]);
    })();

    (async () => {
      const { data: rows } = await supabase.from("habits").select("*").order("created_at", { ascending: true });
      if (rows) setHabits(rows as Habit[]);
    })();

    (async () => {
      const { data: rows } = await supabase.from("habit_logs").select("*");
      if (rows) setHabitLogs(rows as HabitLog[]);
    })();

    (async () => {
      const { data: rows } = await supabase
        .from("learning_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (rows) setLearningItems(rows as LearningItem[]);
    })();

    (async () => {
      const { data: rows } = await supabase.from("learning_files").select("*");
      if (rows) setLearningFiles(rows as LearningFile[]);
    })();
  }, []);

  function handleDataChange(next: BudgetData) {
    setData(next);
    if (!hasSupabaseConfig || !activeMonthKey) return;

    setStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    const key = activeMonthKey;
    saveTimeout.current = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("budget_sheets")
        .upsert({ id: key, data: next, updated_at: new Date().toISOString() });
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

  const isCurrentMonth = !activeMonthKey || activeMonthKey === monthKey(today);
  const referenceDate = isCurrentMonth ? today : lastDayOfMonthKey(activeMonthKey);

  const totals = computeTotals(data, referenceDate);
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
      label: "Money given to people",
      value: fmtK(totals.peopleTotalRemaining),
      isNegative: totals.peopleTotalRemaining < 0,
    },
    {
      label: "Available Savings",
      value: fmtK(totals.safeToSpendNow),
      isNegative: totals.safeToSpendNow < 0,
    },
  ];

  const showStatCards = tab === "overview" || tab === "expenses";

  return (
    <PasswordGate>
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 shadow-2xs">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 1312 4-4 4 4 4-11" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 15l4-4 4 4 5-5" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-zinc-900">Personal Hub</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="cursor-pointer text-zinc-400 hover:text-zinc-700 sm:hidden"
          >
            ✕
          </button>
        </div>

        {/* Month switcher */}
        <div className="relative border-b border-zinc-200 px-3 py-3">
          <button
            onClick={() => setMonthMenuOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {activeMonthKey ? monthLabel(activeMonthKey) : data.month}
              {!isCurrentMonth && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  Archive
                </span>
              )}
            </span>
            <span className="text-zinc-400">{monthMenuOpen ? "▲" : "▼"}</span>
          </button>

          {monthMenuOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
              {availableMonths.map((key) => (
                <button
                  key={key}
                  onClick={() => switchToMonth(key)}
                  className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                    key === activeMonthKey ? "bg-indigo-50 font-semibold text-indigo-700" : "text-zinc-700"
                  }`}
                >
                  {monthLabel(key)}
                  {key === monthKey(today) && <span className="text-[10px] text-zinc-400">current</span>}
                </button>
              ))}
              <button
                onClick={createNewMonth}
                disabled={creatingMonth}
                className="flex w-full cursor-pointer items-center gap-1.5 border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
              >
                {creatingMonth ? "Creating…" : "+ New Month"}
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="mb-1 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-all ${
                      tab === t.id
                        ? "bg-zinc-900 text-white shadow-2xs"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-zinc-200 px-5 py-4 text-xs font-medium text-zinc-500">
          <span className={`h-2 w-2 rounded-full ${statusDot}`} />
          {statusLabel}
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="cursor-pointer rounded-md border border-zinc-200 bg-white p-2 text-zinc-600 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {ALL_TABS.find((t) => t.id === tab)?.label}
          </h1>
        </div>

        {/* Summary stat cards */}
        {showStatCards && (
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
                <p className="mt-0.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">PKR</p>
              </div>
            ))}
          </div>
        )}

        {tab === "home" && (
          <HomePage
            data={data}
            todos={todos}
            habits={habits}
            habitLogs={habitLogs}
            learningItems={learningItems}
            today={today}
            onNavigate={(t) => setTab(t)}
          />
        )}
        {tab === "overview" && <BudgetSheet data={data} today={referenceDate} onDataChange={handleDataChange} />}
        {tab === "expenses" && (
          <ExpensesSheet
            expenses={data.expenses}
            today={referenceDate}
            onExpensesChange={(expenses) => handleDataChange({ ...data, expenses })}
          />
        )}
        {tab === "future" && (
          <FutureSpendingSheet
            futureExpenses={data.futureExpenses ?? []}
            onFutureExpensesChange={(futureExpenses) => handleDataChange({ ...data, futureExpenses })}
          />
        )}
        {tab === "todos" && <TodosPage todos={todos} today={today} onTodosChange={setTodos} />}
        {tab === "habits" && (
          <HabitsPage
            habits={habits}
            logs={habitLogs}
            today={today}
            onHabitsChange={setHabits}
            onLogsChange={setHabitLogs}
          />
        )}
        {tab === "learning" && (
          <LearningPage
            items={learningItems}
            files={learningFiles}
            onItemsChange={setLearningItems}
            onFilesChange={setLearningFiles}
          />
        )}
        {tab === "settings" && <SettingsPage data={data} onDataChange={handleDataChange} />}
      </main>
    </div>
    </PasswordGate>
  );
}
