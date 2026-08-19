"use client";

import { useState } from "react";
import { BudgetData, computeTotals, fmtK } from "@/lib/budget";
import { Todo, isDueToday, isOverdue } from "@/lib/todos";
import { Habit, HabitLog, currentStreak } from "@/lib/habits";
import { LearningItem } from "@/lib/learning";
import { StatTile, IconEye, IconLock } from "@/components/ui";
import { APP_PASSWORD } from "@/lib/auth";

function FinanceStatTile({
  accountsTotal,
  spentThisMonth,
  onNavigate,
}: {
  accountsTotal: number;
  spentThisMonth: number;
  onNavigate: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function submitReveal(e: React.FormEvent) {
    e.preventDefault();
    if (input === APP_PASSWORD) {
      setRevealed(true);
      setPromptOpen(false);
      setInput("");
      setError(false);
    } else {
      setError(true);
    }
  }

  if (promptOpen) {
    return (
      <div className="rounded-lg border border-indigo-200 bg-white px-5 py-4 shadow-2xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Finance</p>
        <form onSubmit={submitReveal} className="mt-2.5 flex items-center gap-1.5">
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className={`w-full rounded-sm border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
              error ? "border-red-400" : "border-zinc-300 focus:border-indigo-500"
            }`}
          />
          <button
            type="submit"
            className="cursor-pointer rounded-sm bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Go
          </button>
        </form>
        {error && <p className="mt-1.5 text-[11px] text-red-600">Incorrect password.</p>}
        <button
          type="button"
          onClick={() => {
            setPromptOpen(false);
            setInput("");
            setError(false);
          }}
          className="mt-1.5 cursor-pointer text-[11px] font-medium text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-2xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Finance</p>
        <p className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-300">
          <IconLock className="h-4 w-4" /> ••••••
        </p>
        <button
          type="button"
          onClick={() => setPromptOpen(true)}
          className="mt-1.5 flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <IconEye className="h-3.5 w-3.5" /> View amounts
        </button>
      </div>
    );
  }

  return (
    <StatTile
      label="Finance"
      onClick={onNavigate}
      value={fmtK(accountsTotal)}
      sub={`in accounts · ${fmtK(spentThisMonth)} spent this month`}
    />
  );
}

export default function HomePage({
  data,
  todos,
  habits,
  habitLogs,
  learningItems,
  today,
  onNavigate,
}: {
  data: BudgetData;
  todos: Todo[];
  habits: Habit[];
  habitLogs: HabitLog[];
  learningItems: LearningItem[];
  today: Date;
  onNavigate: (tab: "overview" | "expenses" | "todos" | "habits" | "learning") => void;
}) {
  const totals = computeTotals(data, today);
  const dueToday = todos.filter((t) => isDueToday(t, today) && t.status !== "done").length;
  const overdue = todos.filter((t) => isOverdue(t, today)).length;
  const inProgress = todos.filter((t) => t.status === "doing").length;
  const done = todos.filter((t) => t.status === "done").length;

  const habitStreaks = habits.map((h) => currentStreak(habitLogs.filter((l) => l.habit_id === h.id), today));
  const activeStreaks = habitStreaks.filter((s) => s > 0).length;
  const bestStreak = habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;

  const avgLearningCompletion =
    learningItems.length > 0
      ? Math.round(learningItems.reduce((s, i) => s + i.progress, 0) / learningItems.length)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <FinanceStatTile
        accountsTotal={totals.accountsTotalCurrent}
        spentThisMonth={totals.spentThisMonth}
        onNavigate={() => onNavigate("overview")}
      />

      <StatTile
        label="Todos"
        onClick={() => onNavigate("todos")}
        value={overdue > 0 ? <span className="text-rose-600">{overdue} overdue</span> : `${dueToday} due today`}
        sub={`${inProgress} in progress · ${done} done`}
      />

      <StatTile
        label="Habits"
        onClick={() => onNavigate("habits")}
        value={
          habits.length === 0 ? (
            "No habits yet"
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="h-6 w-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.08 1.83-6.1 4.5-8.5.38-.34.97-.04.93.47-.2 2.37.7 4.23 2.57 5.03 2.14.91 3.5-1.07 3.5-3 0-1.74-.78-3.41-1.73-4.71-.24-.33.02-.8.42-.74 3.75.56 7.81 3.65 7.81 8.45 0 5.42-4.03 11-9 11z" />
              </svg>
              {bestStreak} day best streak
            </span>
          )
        }
        sub={habits.length === 0 ? "Start tracking a bad habit to break" : `${activeStreaks}/${habits.length} habits on an active streak`}
      />

      <StatTile
        label="Learning"
        onClick={() => onNavigate("learning")}
        value={learningItems.length === 0 ? "Nothing yet" : `${learningItems.filter((i) => i.status === "in_progress").length} in progress`}
        sub={
          learningItems.length === 0
            ? "Add a course, book, or skill to track"
            : `${avgLearningCompletion}% avg completion · ${learningItems.filter((i) => i.status === "done").length} done`
        }
      />
    </div>
  );
}
