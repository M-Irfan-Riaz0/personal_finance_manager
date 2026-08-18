"use client";

import { useState } from "react";
import { FutureExpense, fmtPKR } from "@/lib/budget";

export default function FutureSpendingSheet({
  futureExpenses = [],
  onFutureExpensesChange,
}: {
  futureExpenses: FutureExpense[];
  onFutureExpensesChange: (items: FutureExpense[]) => void;
}) {
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const newItem: FutureExpense = {
      id: Date.now().toString(),
      title: text.trim(),
      category: "General",
      estimatedAmount: Number(amount) || 0,
      dueDate: "",
      priority: "Medium",
      status: "Planned",
    };
    onFutureExpensesChange([...futureExpenses, newItem]);
    setText("");
    setAmount("");
  }

  function toggleDone(id: string) {
    onFutureExpensesChange(
      futureExpenses.map((item) =>
        item.id === id ? { ...item, status: item.status === "Done" ? "Planned" : "Done" } : item,
      ),
    );
  }

  function updateTitle(id: string, title: string) {
    onFutureExpensesChange(futureExpenses.map((item) => (item.id === id ? { ...item, title } : item)));
  }

  function updateAmount(id: string, estimatedAmount: number) {
    onFutureExpensesChange(
      futureExpenses.map((item) => (item.id === id ? { ...item, estimatedAmount } : item)),
    );
  }

  function deleteItem(id: string) {
    onFutureExpensesChange(futureExpenses.filter((item) => item.id !== id));
  }

  const totalAmount = futureExpenses
    .filter((i) => i.status !== "Done")
    .reduce((s, i) => s + (i.estimatedAmount || 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Notebook Header Card */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Future Spending Notebook</h2>
          <p className="text-xs text-zinc-500">Simple notes for planned expenses and upcoming bills</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase font-semibold text-zinc-400">Total Planned</p>
          <p className="text-2xl font-bold text-zinc-900">{fmtPKR(totalAmount)}</p>
        </div>
      </div>

      {/* Notebook Container */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
        {/* Quick Add Row */}
        <form onSubmit={addItem} className="flex items-center gap-3 border-b border-zinc-200 pb-4">
          <input
            type="text"
            placeholder="Write future expense note (e.g. Internet bill, Laptop)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-right"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-2xs hover:bg-zinc-800 transition-colors"
          >
            + Add Note
          </button>
        </form>

        {/* Notebook Lines List */}
        <div className="divide-y divide-zinc-100">
          {futureExpenses.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400 italic">
              Notebook is empty. Type a note above to plan upcoming expenses!
            </div>
          ) : (
            futureExpenses.map((item) => {
              const isDone = item.status === "Done";
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 py-3 transition-colors ${
                    isDone ? "opacity-40" : "hover:bg-zinc-50/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleDone(item.id)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateTitle(item.id, e.target.value)}
                    className={`flex-1 bg-transparent text-sm text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 ${
                      isDone ? "line-through text-zinc-400" : ""
                    }`}
                  />

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-400">PKR</span>
                    <input
                      type="number"
                      value={item.estimatedAmount || ""}
                      onChange={(e) => updateAmount(item.id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className={`w-28 bg-transparent text-right font-mono text-sm font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 ${
                        isDone ? "line-through text-zinc-400" : "text-zinc-900"
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="cursor-pointer text-zinc-300 hover:text-rose-500 transition-colors p-1"
                    aria-label="Delete note"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
