export type Habit = {
  id: string;
  name: string;
  created_at: string;
};

export type HabitLogStatus = "clean" | "slipped";

export type HabitLog = {
  id: string;
  habit_id: string;
  date: string; // ISO date, YYYY-MM-DD
  status: HabitLogStatus;
  created_at: string;
};

export function isoDateOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Current streak: consecutive "clean" days walking back from today; stops at a slip or a gap. */
export function currentStreak(logs: HabitLog[], today: Date) {
  const byDate = new Map(logs.map((l) => [l.date, l.status]));
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const iso = isoDateOf(cursor);
    const status = byDate.get(iso);
    if (status !== "clean") break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest ever streak of consecutive clean days across all logged dates. */
export function longestStreak(logs: HabitLog[]) {
  const cleanDates = logs
    .filter((l) => l.status === "clean")
    .map((l) => l.date)
    .sort();
  if (cleanDates.length === 0) return 0;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < cleanDates.length; i++) {
    const prev = new Date(cleanDates[i - 1]);
    const cur = new Date(cleanDates[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }
  return longest;
}
