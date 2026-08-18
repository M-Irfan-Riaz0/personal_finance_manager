"use client";

import { Expense, currentMonthExpensesTotal, fmtDayLabel, fmtPKR, monthDates } from "@/lib/budget";

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-300 bg-white shadow-2xs">
      {children}
    </div>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-r border-zinc-200 bg-zinc-100/90 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 last:border-r-0 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-sm px-2.5 py-1 text-sm text-indigo-700 outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const isNegative = value < 0;
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      className={`w-full rounded-sm px-2.5 py-1 text-right tabular-nums outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 ${
        isNegative ? "font-semibold text-rose-600" : "font-medium text-indigo-700"
      }`}
    />
  );
}

const BLANK: Omit<Expense, "date"> = { category: "", description: "", account: "", amount: 0 };

export default function ExpensesSheet({
  expenses,
  today,
  onExpensesChange,
}: {
  expenses: Expense[];
  today: Date;
  onExpensesChange: (expenses: Expense[]) => void;
}) {
  const dates = monthDates(today);
  const todayIso = dates.find((d) => d === isoOf(today));

  function isoOf(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function update(date: string, patch: Partial<Expense>) {
    const exists = expenses.some((e) => e.date === date);
    if (exists) {
      onExpensesChange(expenses.map((e) => (e.date === date ? { ...e, ...patch } : e)));
    } else {
      onExpensesChange([...expenses, { date, ...BLANK, ...patch }]);
    }
  }

  function clearDay(date: string) {
    onExpensesChange(expenses.filter((e) => e.date !== date));
  }

  const rows = dates.map((date) => expenses.find((e) => e.date === date) ?? { date, ...BLANK });

  return (
    <div>
      <TableShell>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <Th className="w-28 sm:w-32">Date</Th>
              <Th className="w-36 sm:w-44">Category</Th>
              <Th>Description</Th>
              <Th className="w-36 sm:w-44">Account</Th>
              <Th align="right" className="w-32 sm:w-36">
                Amount
              </Th>
              <th className="w-10 border-b border-zinc-200 bg-zinc-100/90 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.map((e) => (
              <tr
                key={e.date}
                className={`group hover:bg-indigo-50/40 ${
                  e.date === todayIso ? "bg-indigo-50/60" : "odd:bg-white even:bg-zinc-50/50"
                }`}
              >
                <td className="w-28 sm:w-32 border-b border-r border-zinc-200 px-3 py-1 font-medium text-zinc-600">
                  {fmtDayLabel(e.date)}
                </td>
                <td className="w-36 sm:w-44 border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.category} onChange={(v) => update(e.date, { category: v })} />
                </td>
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.description} onChange={(v) => update(e.date, { description: v })} />
                </td>
                <td className="w-36 sm:w-44 border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.account} onChange={(v) => update(e.date, { account: v })} />
                </td>
                <td className="w-32 sm:w-36 border-b border-r border-zinc-200 px-2 py-1">
                  <NumberInput value={e.amount} onChange={(v) => update(e.date, { amount: v })} />
                </td>
                <td className="border-b border-zinc-200 px-2 py-1 text-center">
                  <button
                    onClick={() => clearDay(e.date)}
                    aria-label="Clear day"
                    className="cursor-pointer text-zinc-400 transition-colors group-hover:text-red-500 hover:scale-110"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-100/70 font-medium">
              <td className="border-r border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700" colSpan={4}>
                Total — {today.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </td>
              <td className="w-36 border-r border-zinc-200 px-3 py-2.5 text-right font-mono text-sm font-bold text-zinc-900">
                {fmtPKR(currentMonthExpensesTotal(expenses, today))}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </TableShell>
      <p className="mt-3 text-xs text-zinc-500">
        A row exists for every day of the current month automatically. Once the month changes, this list switches to
        the new month&apos;s days — past months stay saved, just not shown here.
      </p>
    </div>
  );
}
