"use client";

import { BudgetData, computeTotals, fmtK } from "@/lib/budget";
import { Todo, isDueToday, isOverdue } from "@/lib/todos";
import { Habit, HabitLog, currentStreak } from "@/lib/habits";
import { LearningItem } from "@/lib/learning";

function Card({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-5 text-left shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </button>
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card title="Finance" onClick={() => onNavigate("overview")}>
        <p className="text-2xl font-bold tracking-tight text-zinc-900">{fmtK(totals.accountsTotalCurrent)}</p>
        <p className="mt-1 text-sm text-zinc-500">in accounts · {fmtK(totals.spentThisMonth)} spent this month</p>
      </Card>

      <Card title="Todos" onClick={() => onNavigate("todos")}>
        <p className="text-2xl font-bold tracking-tight text-zinc-900">
          {overdue > 0 ? (
            <span className="text-rose-600">{overdue} overdue</span>
          ) : (
            `${dueToday} due today`
          )}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {inProgress} in progress · {done} done
        </p>
      </Card>

      <Card title="Habits" onClick={() => onNavigate("habits")}>
        {habits.length === 0 ? (
          <>
            <p className="text-2xl font-bold tracking-tight text-zinc-400">No habits yet</p>
            <p className="mt-1 text-sm text-zinc-500">Start tracking a bad habit to break</p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-2xl font-bold tracking-tight text-zinc-900">
              <svg className="h-6 w-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.08 1.83-6.1 4.5-8.5.38-.34.97-.04.93.47-.2 2.37.7 4.23 2.57 5.03 2.14.91 3.5-1.07 3.5-3 0-1.74-.78-3.41-1.73-4.71-.24-.33.02-.8.42-.74 3.75.56 7.81 3.65 7.81 8.45 0 5.42-4.03 11-9 11z" />
              </svg>
              {bestStreak} day best streak
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {activeStreaks}/{habits.length} habits on an active streak
            </p>
          </>
        )}
      </Card>

      <Card title="Learning" onClick={() => onNavigate("learning")}>
        {learningItems.length === 0 ? (
          <>
            <p className="text-2xl font-bold tracking-tight text-zinc-400">Nothing yet</p>
            <p className="mt-1 text-sm text-zinc-500">Add a course, book, or skill to track</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tracking-tight text-zinc-900">
              {learningItems.filter((i) => i.status === "in_progress").length} in progress
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {Math.round(
                learningItems.reduce((s, i) => s + i.progress, 0) / learningItems.length,
              )}
              % avg completion · {learningItems.filter((i) => i.status === "done").length} done
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
