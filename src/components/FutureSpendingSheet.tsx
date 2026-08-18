"use client";

import { useState } from "react";
import { FutureExpense, fmtPKR } from "@/lib/budget";

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-2xs">
      {children}
    </div>
  );
}

function Th({ children, align = "left", className = "" }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th className={`border-b border-zinc-200 bg-zinc-100/90 px-3 py-2.5 text-${align} text-xs font-semibold uppercase tracking-wider text-zinc-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-r border-zinc-200 px-2 py-1 text-sm text-zinc-800 last:border-r-0 ${className}`}>{children}</td>;
}

export default function FutureSpendingSheet({
  futureExpenses = [],
  onFutureExpensesChange,
}: {
  futureExpenses: FutureExpense[];
  onFutureExpensesChange: (items: FutureExpense[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    const newItem: FutureExpense = {
      id: Date.now().toString(),
      title: title.trim(),
      category: category.trim() || "Other",
      estimatedAmount: Number(amount) || 0,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      priority,
      status: "Planned",
    };
    onFutureExpensesChange([...futureExpenses, newItem]);
    setTitle("");
    setAmount("");
  }

  function updateItem(id: string, patch: Partial<FutureExpense>) {
    onFutureExpensesChange(futureExpenses.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function deleteItem(id: string) {
    onFutureExpensesChange(futureExpenses.filter((item) => item.id !== id));
  }

  const totalPlanned = futureExpenses.reduce((s, i) => s + i.estimatedAmount, 0);
  const highPriorityTotal = futureExpenses.filter((i) => i.priority === "High").reduce((s, i) => s + i.estimatedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Planned Future Spending</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{fmtPKR(totalPlanned)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">High Priority Commitment</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">{fmtPKR(highPriorityTotal)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Upcoming Items</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{futureExpenses.length} items</p>
        </div>
      </div>

      {/* Add Future Expense Form */}
      <form onSubmit={addItem} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">+ Plan New Future Expense</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Expense title (e.g. Laptop Upgrade)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="text"
            list="category-list"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="number"
            placeholder="Estimated Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
        >
          Add to Future Plan
        </button>
      </form>

      {/* Future Spending Spreadsheet Table */}
      <TableShell>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <Th>Title</Th>
              <Th className="w-36">Category</Th>
              <Th className="w-32">Due Date</Th>
              <Th className="w-28">Priority</Th>
              <Th className="w-28">Status</Th>
              <Th align="right" className="w-32">Estimated Amount</Th>
              <th className="w-10 border-b border-zinc-200 bg-zinc-100/90" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {futureExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-zinc-500">
                  No future expenses planned yet. Use the form above to add upcoming expenses!
                </td>
              </tr>
            ) : (
              futureExpenses.map((item) => (
                <tr key={item.id} className="group hover:bg-indigo-50/30 odd:bg-white even:bg-zinc-50/50">
                  <Td>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                  </Td>
                  <Td className="w-36">
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, { category: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                  </Td>
                  <Td className="w-32">
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => updateItem(item.id, { dueDate: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1 text-xs"
                    />
                  </Td>
                  <Td className="w-28">
                    <select
                      value={item.priority}
                      onChange={(e) => updateItem(item.id, { priority: e.target.value as "High" | "Medium" | "Low" })}
                      className="w-full bg-transparent text-xs font-semibold outline-none focus:bg-white"
                    >
                      <option value="High" className="text-amber-600">High</option>
                      <option value="Medium" className="text-blue-600">Medium</option>
                      <option value="Low" className="text-zinc-600">Low</option>
                    </select>
                  </Td>
                  <Td className="w-28">
                    <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, { status: e.target.value as "Planned" | "Reserved" | "Done" })}
                      className="w-full bg-transparent text-xs font-semibold outline-none focus:bg-white"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Done">Done</option>
                    </select>
                  </Td>
                  <Td className="w-32 text-right">
                    <input
                      type="number"
                      value={item.estimatedAmount}
                      onChange={(e) => updateItem(item.id, { estimatedAmount: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent text-right font-mono font-medium outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                  </Td>
                  <Td className="w-10 text-center">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="cursor-pointer text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
