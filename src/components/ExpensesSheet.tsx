"use client";

import { Expense, currentMonthExpensesTotal, fmtDayLabel, fmtPKR, monthDates } from "@/lib/budget";
import { TableShell, Th, CellTextInput as TextInput, CellNumberInput as NumberInput, IconRemoveButton } from "@/components/ui";

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
      {/* Mobile: stacked cards, one per day */}
      <div className="space-y-3 sm:hidden">
        {rows.map((e) => (
          <div
            key={e.date}
            className={`rounded-md border p-3 ${
              e.date === todayIso ? "border-indigo-300 bg-indigo-50/60" : "border-zinc-300 bg-white"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700">{fmtDayLabel(e.date)}</span>
              <IconRemoveButton onClick={() => clearDay(e.date)} label="Clear day" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Amount
                <NumberInput value={e.amount} onChange={(v) => update(e.date, { amount: v })} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Category
                <TextInput
                  value={e.category}
                  list="category-list"
                  onChange={(v) => update(e.date, { category: v })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Account
                <TextInput value={e.account} list="account-list" onChange={(v) => update(e.date, { account: v })} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Description
                <TextInput value={e.description} onChange={(v) => update(e.date, { description: v })} />
              </label>
            </div>
          </div>
        ))}
        <div className="rounded-md border border-zinc-300 bg-zinc-100/70 p-3 text-sm font-semibold text-zinc-700">
          Total — {today.toLocaleString("en-US", { month: "long", year: "numeric" })}:{" "}
          {fmtPKR(currentMonthExpensesTotal(expenses, today))}
        </div>
      </div>

      {/* Desktop / tablet: full table */}
      <TableShell className="hidden sm:block">
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
                  <TextInput
                    value={e.category}
                    list="category-list"
                    onChange={(v) => update(e.date, { category: v })}
                  />
                </td>
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.description} onChange={(v) => update(e.date, { description: v })} />
                </td>
                <td className="w-36 sm:w-44 border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput
                    value={e.account}
                    list="account-list"
                    onChange={(v) => update(e.date, { account: v })}
                  />
                </td>
                <td className="w-32 sm:w-36 border-b border-r border-zinc-200 px-2 py-1">
                  <NumberInput value={e.amount} onChange={(v) => update(e.date, { amount: v })} />
                </td>
                <td className="border-b border-zinc-200 px-2 py-1 text-center">
                  <IconRemoveButton
                    onClick={() => clearDay(e.date)}
                    label="Clear day"
                    className="opacity-60 transition-opacity group-hover:opacity-100"
                  />
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
      <datalist id="category-list">
        <option value="Food" />
        <option value="Transport" />
        <option value="Mobile & Internet" />
        <option value="Work & Tools" />
        <option value="Education" />
        <option value="Family" />
        <option value="Health" />
        <option value="Personal" />
        <option value="Other" />
      </datalist>

      <datalist id="account-list">
        <option value="Cash" />
        <option value="JazzCash" />
        <option value="Meezan Bank" />
        <option value="UBL" />
      </datalist>

      <p className="mt-3 text-xs text-zinc-500">
        A row exists for every day of the current month automatically. Once the month changes, this list switches to
        the new month&apos;s days — past months stay saved, just not shown here.
      </p>
    </div>
  );
}
