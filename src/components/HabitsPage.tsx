"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { monthDates, fmtDayLabel } from "@/lib/budget";
import { Habit, HabitLog, HabitLogStatus, currentStreak, longestStreak, isoDateOf } from "@/lib/habits";

const CYCLE: (HabitLogStatus | null)[] = [null, "clean", "slipped"];

function cellClass(status: HabitLogStatus | null, isToday: boolean) {
  const base = "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[10px] font-medium transition-colors";
  const ring = isToday ? "ring-2 ring-indigo-400" : "";
  if (status === "clean") return `${base} ${ring} bg-emerald-500 text-white hover:bg-emerald-600`;
  if (status === "slipped") return `${base} ${ring} bg-rose-500 text-white hover:bg-rose-600`;
  return `${base} ${ring} bg-zinc-100 text-zinc-400 hover:bg-zinc-200`;
}

export default function HabitsPage({
  habits,
  logs,
  today,
  onHabitsChange,
  onLogsChange,
}: {
  habits: Habit[];
  logs: HabitLog[];
  today: Date;
  onHabitsChange: (habits: Habit[]) => void;
  onLogsChange: (logs: HabitLog[]) => void;
}) {
  const [name, setName] = useState("");
  const dates = monthDates(today);
  const todayIso = isoDateOf(today);

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("habits").insert({ name: name.trim() }).select().single();
    if (!error && data) {
      onHabitsChange([...habits, data as Habit]);
      setName("");
    }
  }

  async function removeHabit(id: string) {
    onHabitsChange(habits.filter((h) => h.id !== id));
    onLogsChange(logs.filter((l) => l.habit_id !== id));
    const supabase = createClient();
    await supabase.from("habits").delete().eq("id", id);
  }

  async function cycleDay(habitId: string, date: string, current: HabitLogStatus | null) {
    const currentIndex = CYCLE.indexOf(current);
    const next = CYCLE[(currentIndex + 1) % CYCLE.length];
    const supabase = createClient();

    if (next === null) {
      onLogsChange(logs.filter((l) => !(l.habit_id === habitId && l.date === date)));
      await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("date", date);
      return;
    }

    const existing = logs.find((l) => l.habit_id === habitId && l.date === date);
    const optimistic: HabitLog = existing
      ? { ...existing, status: next }
      : { id: `optimistic-${habitId}-${date}`, habit_id: habitId, date, status: next, created_at: new Date().toISOString() };
    const optimisticLogs = existing
      ? logs.map((l) => (l === existing ? optimistic : l))
      : [...logs, optimistic];
    onLogsChange(optimisticLogs);

    const { data } = await supabase
      .from("habit_logs")
      .upsert({ habit_id: habitId, date, status: next }, { onConflict: "habit_id,date" })
      .select()
      .single();
    if (data) {
      onLogsChange(optimisticLogs.map((l) => (l.id === optimistic.id ? (data as HabitLog) : l)));
    }
  }

  return (
    <div>
      <form
        onSubmit={addHabit}
        className="mb-6 flex items-end gap-2 rounded-md border border-zinc-300 bg-white p-4 shadow-2xs"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-500">
          Habit to break
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. No smoking"
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add habit
        </button>
      </form>

      {habits.length === 0 && (
        <p className="text-sm text-zinc-500">No habits yet. Add one above to start tracking.</p>
      )}

      <div className="space-y-4">
        {habits.map((h) => {
          const habitLogs = logs.filter((l) => l.habit_id === h.id);
          const streak = currentStreak(habitLogs, today);
          const longest = longestStreak(habitLogs);
          return (
            <div key={h.id} className="rounded-md border border-zinc-300 bg-white p-4 shadow-2xs">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">{h.name}</h2>
                  <p className="flex items-center gap-1 text-xs text-zinc-500">
                    <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.08 1.83-6.1 4.5-8.5.38-.34.97-.04.93.47-.2 2.37.7 4.23 2.57 5.03 2.14.91 3.5-1.07 3.5-3 0-1.74-.78-3.41-1.73-4.71-.24-.33.02-.8.42-.74 3.75.56 7.81 3.65 7.81 8.45 0 5.42-4.03 11-9 11z" />
                    </svg>
                    {streak} day streak · longest {longest}
                  </p>
                </div>
                <button
                  onClick={() => removeHabit(h.id)}
                  aria-label={`Remove ${h.name}`}
                  className="cursor-pointer text-zinc-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {dates.map((date) => {
                  const log = habitLogs.find((l) => l.date === date);
                  return (
                    <button
                      key={date}
                      onClick={() => cycleDay(h.id, date, log?.status ?? null)}
                      title={`${fmtDayLabel(date)} — ${log?.status ?? "no log"}`}
                      className={cellClass(log?.status ?? null, date === todayIso)}
                    >
                      {date.slice(-2)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                Click a day to cycle: no log → clean → slipped → no log.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
