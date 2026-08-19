"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Todo, TodoPriority, TodoStatus, isOverdue } from "@/lib/todos";

const COLUMNS: { status: TodoStatus; label: string; dot: string }[] = [
  { status: "todo", label: "To Do", dot: "bg-zinc-400" },
  { status: "doing", label: "Doing", dot: "bg-amber-400" },
  { status: "done", label: "Done", dot: "bg-emerald-500" },
];

const PRIORITY_BADGE: Record<TodoPriority, string> = {
  High: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Low: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200",
};

const PRIORITY_BORDER: Record<TodoPriority, string> = {
  High: "border-l-rose-400",
  Medium: "border-l-amber-400",
  Low: "border-l-zinc-300",
};

export default function TodosPage({
  todos,
  today,
  onTodosChange,
}: {
  todos: Todo[];
  today: Date;
  onTodosChange: (todos: Todo[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("Medium");
  const [dueDate, setDueDate] = useState("");

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("todos")
      .insert({ title: title.trim(), priority, due_date: dueDate || null })
      .select()
      .single();
    if (!error && data) {
      onTodosChange([...todos, data as Todo]);
      setTitle("");
      setPriority("Medium");
      setDueDate("");
    }
  }

  async function updateTodo(id: string, patch: Partial<Todo>) {
    onTodosChange(todos.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const supabase = createClient();
    await supabase.from("todos").update(patch).eq("id", id);
  }

  async function deleteTodo(id: string) {
    onTodosChange(todos.filter((t) => t.id !== id));
    const supabase = createClient();
    await supabase.from("todos").delete().eq("id", id);
  }

  return (
    <div>
      <form
        onSubmit={addTodo}
        className="mb-6 flex flex-col gap-2 rounded-md border border-zinc-300 bg-white p-4 shadow-2xs sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-500">
          Task
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Renew domain"
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add task
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = todos
            .filter((t) => t.status === col.status)
            .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
          return (
            <div key={col.status} className="rounded-md border border-zinc-200 bg-zinc-50/60">
              <div className="flex items-center gap-2 px-3.5 py-3">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{col.label}</span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-500 shadow-2xs">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5 px-3 pb-3">
                {items.length === 0 && (
                  <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-xs text-zinc-400">
                    Nothing here.
                  </p>
                )}
                {items.map((t) => (
                  <div
                    key={t.id}
                    className={`group rounded-md border-l-4 border-y border-r border-zinc-200 bg-white p-3 shadow-2xs transition-shadow hover:shadow-sm ${PRIORITY_BORDER[t.priority]}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug text-zinc-800">{t.title}</span>
                      <button
                        onClick={() => deleteTodo(t.id)}
                        aria-label="Delete task"
                        className="shrink-0 cursor-pointer text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE[t.priority]}`}>
                        {t.priority}
                      </span>
                      {t.due_date && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isOverdue(t, today)
                              ? "bg-rose-100 text-rose-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {isOverdue(t, today) ? (
                            <svg className="h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : (
                            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                            </svg>
                          )}
                          {t.due_date}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5 border-t border-zinc-100 pt-2">
                      {COLUMNS.filter((c) => c.status !== t.status).map((c) => (
                        <button
                          key={c.status}
                          onClick={() => updateTodo(t.id, { status: c.status })}
                          className="cursor-pointer rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          {c.label} →
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
