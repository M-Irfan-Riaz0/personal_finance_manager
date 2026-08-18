"use client";

import { Expense, expensesTotal, fmtPKR } from "@/lib/budget";

function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden border border-zinc-200">{children}</div>;
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
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
      className="w-full px-2 py-1.5 text-indigo-700 outline-none focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      className="w-full px-2 py-1.5 text-right tabular-nums text-indigo-700 outline-none focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
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
              <th className="w-8 bg-zinc-50" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {expenses.map((e, i) => (
              <tr key={i} className="group odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                <td className="px-1 py-1">
                  <TextInput value={e.date} onChange={(v) => update(i, { date: v })} />
                </td>
                <td className="px-1 py-1">
                  <TextInput value={e.category} onChange={(v) => update(i, { category: v })} />
                </td>
                <td className="px-1 py-1">
                  <TextInput value={e.description} onChange={(v) => update(i, { description: v })} />
                </td>
                <td className="px-1 py-1">
                  <TextInput value={e.account} onChange={(v) => update(i, { account: v })} />
                </td>
                <td className="w-32 px-1 py-1">
                  <NumberInput value={e.amount} onChange={(v) => update(i, { amount: v })} />
                </td>
                <td className="text-center">
                  <button
                    onClick={() => removeRow(i)}
                    aria-label="Remove expense"
                    className="cursor-pointer text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50">
              <td className="px-3 py-2 text-sm font-medium text-zinc-700" colSpan={4}>
                Total
              </td>
              <td className="w-32 px-1 py-2">
                <span className="block px-2 py-1.5 text-right font-semibold tabular-nums text-zinc-900">
                  {fmtPKR(expensesTotal(expenses))}
                </span>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </TableShell>

      <button
        onClick={addRow}
        className="mt-4 cursor-pointer bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        + Add expense
      </button>
    </div>
  );
}
