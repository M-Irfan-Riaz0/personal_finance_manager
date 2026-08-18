"use client";

import { Expense, expensesTotal, fmtPKR } from "@/lib/budget";

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

export default function ExpensesSheet({
  expenses,
  onExpensesChange,
}: {
  expenses: Expense[];
  onExpensesChange: (expenses: Expense[]) => void;
}) {
  function update(index: number, patch: Partial<Expense>) {
    onExpensesChange(expenses.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addRow() {
    onExpensesChange([...expenses, { date: "", category: "", description: "", account: "", amount: 0 }]);
  }

  function removeRow(index: number) {
    onExpensesChange(expenses.filter((_, i) => i !== index));
  }

  return (
    <div className="p-5">
      <TableShell>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Description</Th>
              <Th>Account</Th>
              <Th align="right">Amount</Th>
              <th className="w-10 border-b border-zinc-200 bg-zinc-100/90 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {expenses.map((e, i) => (
              <tr key={i} className="group odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.date} onChange={(v) => update(i, { date: v })} />
                </td>
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.category} onChange={(v) => update(i, { category: v })} />
                </td>
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.description} onChange={(v) => update(i, { description: v })} />
                </td>
                <td className="border-b border-r border-zinc-200 px-2 py-1">
                  <TextInput value={e.account} onChange={(v) => update(i, { account: v })} />
                </td>
                <td className="w-36 border-b border-r border-zinc-200 px-2 py-1">
                  <NumberInput value={e.amount} onChange={(v) => update(i, { amount: v })} />
                </td>
                <td className="border-b border-zinc-200 px-2 py-1 text-center">
                  <button
                    onClick={() => removeRow(i)}
                    aria-label="Remove expense"
                    className="cursor-pointer text-zinc-400 transition-colors group-hover:text-red-500 hover:scale-110"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-100/70 font-medium">
              <td className="border-r border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700" colSpan={4}>
                Total
              </td>
              <td className="w-36 border-r border-zinc-200 px-3 py-2.5 text-right font-mono text-sm font-bold text-zinc-900">
                {fmtPKR(expensesTotal(expenses))}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </TableShell>

      <button
        onClick={addRow}
        className="mt-4 cursor-pointer rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-2xs hover:bg-indigo-700"
      >
        + Add expense
      </button>
    </div>
  );
}
