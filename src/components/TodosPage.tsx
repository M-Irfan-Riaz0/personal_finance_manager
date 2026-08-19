"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Subtask, Todo, TodoCategory, TodoPriority, TodoStatus, TODO_CATEGORIES, isOverdue, subtaskProgress } from "@/lib/todos";
import { Panel, EmptyState, TextField, SelectField, DateField, PrimaryButton, IconX } from "@/components/ui";

const COLUMNS: { status: TodoStatus; label: string; dot: string }[] = [
  { status: "todo", label: "To Do", dot: "bg-zinc-400" },
  { status: "doing", label: "Doing", dot: "bg-amber-400" },
  { status: "done", label: "Done", dot: "bg-emerald-500" },
];

const PRIORITY_DOT: Record<TodoPriority, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-zinc-400",
};

const CATEGORY_BADGE: Record<TodoCategory, string> = {
  Work: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
  Learning: "bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-200",
  Personal: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  Other: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
};

function IconGrip({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function IconKebab({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function IconPencil({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const PRIORITY_RANK: Record<TodoPriority, number> = { High: 0, Medium: 1, Low: 2 };

type SortBy = "due" | "priority" | "newest";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random());
}

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
  const [category, setCategory] = useState<TodoCategory>("Personal");
  const [dueDate, setDueDate] = useState("");

  const [filterPriority, setFilterPriority] = useState<TodoPriority | "All">("All");
  const [filterCategory, setFilterCategory] = useState<TodoCategory | "All">("All");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("due");
  const [showDoneColumn, setShowDoneColumn] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TodoStatus | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    let { data, error } = await supabase
      .from("todos")
      .insert({ title: title.trim(), priority, category, due_date: dueDate || null })
      .select()
      .single();
    if (error) {
      // Fallback for databases where the `category` migration hasn't been run yet.
      ({ data, error } = await supabase
        .from("todos")
        .insert({ title: title.trim(), priority, due_date: dueDate || null })
        .select()
        .single());
    }
    if (!error && data) {
      const row = data as Todo;
      onTodosChange([
        ...todos,
        { ...row, tags: row.tags ?? [], subtasks: row.subtasks ?? [], category: row.category ?? "Personal" },
      ]);
      setTitle("");
      setPriority("Medium");
      setCategory("Personal");
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

  const filtered = useMemo(() => {
    return todos.filter((t) => {
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (filterCategory !== "All" && t.category !== filterCategory) return false;
      if (filterTag && !t.tags.includes(filterTag)) return false;
      return true;
    });
  }, [todos, filterPriority, filterCategory, filterTag]);

  function sortItems(items: Todo[]) {
    return [...items].sort((a, b) => {
      if (sortBy === "due") return (a.due_date ?? "9999-99-99").localeCompare(b.due_date ?? "9999-99-99");
      if (sortBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return b.created_at.localeCompare(a.created_at);
    });
  }

  const allTags = useMemo(() => Array.from(new Set(todos.flatMap((t) => t.tags))).sort(), [todos]);
  const editingTodo = editingId ? todos.find((t) => t.id === editingId) ?? null : null;

  return (
    <div>
      <div ref={formRef} />
      <Panel className="mb-4 p-4">
        {editingTodo ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900">Editing task</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    deleteTodo(editingTodo.id);
                    setEditingId(null);
                  }}
                  className="cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  Delete task
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="cursor-pointer rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Done
                </button>
              </div>
            </div>
            <TodoDetails todo={editingTodo} onUpdate={(patch) => updateTodo(editingTodo.id, patch)} />
          </div>
        ) : (
          <form onSubmit={addTodo} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField
                label="Task"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Renew domain"
              />
            </div>
            <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as TodoCategory)}>
              {TODO_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectField>
            <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </SelectField>
            <DateField label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <PrimaryButton type="submit">+ Add task</PrimaryButton>
          </form>
        )}
      </Panel>

      <div className="mb-3 flex items-center justify-end">
        <div className="relative">
          <button
            onClick={() => setFilterMenuOpen((v) => !v)}
            aria-label="Filter and sort options"
            title="Filter and sort"
            className="cursor-pointer rounded-md border border-zinc-300 bg-white p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <IconKebab className="h-4 w-4" />
          </button>
          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-72 space-y-3 rounded-md border border-zinc-200 bg-white p-3.5 shadow-lg">
                <SelectField
                  label="Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as TodoCategory | "All")}
                >
                  <option value="All">All</option>
                  {TODO_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="Priority"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as TodoPriority | "All")}
                >
                  <option value="All">All</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </SelectField>
                <SelectField label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                  <option value="due">Due date</option>
                  <option value="priority">Priority</option>
                  <option value="newest">Newest first</option>
                </SelectField>
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  <input
                    type="checkbox"
                    checked={showDoneColumn}
                    onChange={(e) => setShowDoneColumn(e.target.checked)}
                    className="cursor-pointer"
                  />
                  Show Done column
                </label>
                {allTags.length > 0 && (
                  <div className="border-t border-zinc-100 pt-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                          className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            filterTag === tag
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${showDoneColumn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {(showDoneColumn ? COLUMNS : COLUMNS.filter((c) => c.status !== "done")).map((col) => {
          const items = sortItems(filtered.filter((t) => t.status === col.status));
          const isDragOver = dragOverStatus === col.status;
          return (
            <Panel
              key={col.status}
              className={`border-zinc-300 bg-zinc-100/80 transition-colors ${isDragOver ? "ring-2 ring-indigo-400 bg-indigo-50/50" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(col.status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStatus(null);
                if (draggedId) updateTodo(draggedId, { status: col.status });
                setDraggedId(null);
              }}
            >
              <div className="flex items-center gap-2 px-3.5 py-3">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{col.label}</span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-500 shadow-2xs">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5 px-3 pb-3">
                {items.length === 0 && (
                  <EmptyState>{isDragOver ? "Drop here" : "Nothing here."}</EmptyState>
                )}
                {items.map((t) => {
                  const progress = subtaskProgress(t);
                  const overdue = isOverdue(t, today);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedId(t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverStatus(null);
                      }}
                      className={`cursor-grab overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                        draggedId === t.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="p-4">
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <span className="flex items-start gap-1.5">
                            <IconGrip className="mt-1.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            <span
                              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`}
                              title={`${t.priority} priority`}
                              aria-label={`${t.priority} priority`}
                            />
                            <span className="text-lg font-bold leading-snug text-zinc-900">{t.title}</span>
                          </span>

                          <div className="relative shrink-0">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)}
                              aria-label="Task options"
                              className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                            >
                              <IconKebab className="h-4 w-4" />
                            </button>
                            {menuOpenId === t.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setEditingId(t.id);
                                      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                  >
                                    <IconPencil className="h-3.5 w-3.5" /> Edit task
                                  </button>
                                  <div className="my-1 border-t border-zinc-100" />
                                  {COLUMNS.filter((c) => c.status !== t.status).map((c) => (
                                    <button
                                      key={c.status}
                                      onClick={() => {
                                        updateTodo(t.id, { status: c.status });
                                        setMenuOpenId(null);
                                      }}
                                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} /> Move to {c.label}
                                    </button>
                                  ))}
                                  <div className="my-1 border-t border-zinc-100" />
                                  <button
                                    onClick={() => {
                                      deleteTodo(t.id);
                                      setMenuOpenId(null);
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    <IconX className="h-3.5 w-3.5" /> Delete task
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {t.notes.trim() && (
                          <p className="mb-2.5 line-clamp-2 pl-5 text-[13px] leading-snug text-zinc-600">{t.notes}</p>
                        )}

                        <div className="mb-3 flex flex-wrap items-center gap-1.5 pl-5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[t.category]}`}>
                            {t.category}
                          </span>
                          {t.due_date && (
                            <span
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                overdue ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {overdue ? (
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
                          {t.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {progress.total > 0 && (
                          <div className="mb-3 flex items-center gap-2 pl-5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className={`h-full rounded-full ${progress.done === progress.total ? "bg-emerald-500" : "bg-indigo-500"}`}
                                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs font-medium text-zinc-600">
                              {progress.done}/{progress.total} subtasks
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function TodoDetails({ todo, onUpdate }: { todo: Todo; onUpdate: (patch: Partial<Todo>) => void }) {
  const [titleDraft, setTitleDraft] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");

  function addSubtask(text: string) {
    if (!text.trim()) return;
    const subtasks: Subtask[] = [...todo.subtasks, { id: newId(), text: text.trim(), done: false }];
    onUpdate({ subtasks });
  }

  function toggleSubtask(subId: string) {
    onUpdate({ subtasks: todo.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) });
  }

  function removeSubtask(subId: string) {
    onUpdate({ subtasks: todo.subtasks.filter((s) => s.id !== subId) });
  }

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || todo.tags.includes(clean)) return;
    onUpdate({ tags: [...todo.tags, clean] });
  }

  function removeTag(tag: string) {
    onUpdate({ tags: todo.tags.filter((t) => t !== tag) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 sm:col-span-2">
          Title
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              if (titleDraft.trim() && titleDraft !== todo.title) onUpdate({ title: titleDraft.trim() });
              else setTitleDraft(todo.title);
            }}
            className="rounded-sm border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium normal-case text-zinc-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Category
          <select
            value={todo.category}
            onChange={(e) => onUpdate({ category: e.target.value as TodoCategory })}
            className="rounded-sm border border-zinc-300 bg-white px-2.5 py-1.5 text-sm normal-case text-zinc-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          >
            {TODO_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Priority
          <select
            value={todo.priority}
            onChange={(e) => onUpdate({ priority: e.target.value as TodoPriority })}
            className="rounded-sm border border-zinc-300 bg-white px-2.5 py-1.5 text-sm normal-case text-zinc-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Status
          <select
            value={todo.status}
            onChange={(e) => onUpdate({ status: e.target.value as TodoStatus })}
            className="rounded-sm border border-zinc-300 bg-white px-2.5 py-1.5 text-sm normal-case text-zinc-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          >
            {COLUMNS.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Due date
          <input
            type="date"
            value={todo.due_date ?? ""}
            onChange={(e) => onUpdate({ due_date: e.target.value || null })}
            className="rounded-sm border border-zinc-300 bg-white px-2.5 py-1.5 text-sm normal-case text-zinc-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </label>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Subtasks</p>
        <div className="space-y-1">
          {todo.subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(s.id)} className="cursor-pointer" />
              <span className={`flex-1 text-xs ${s.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{s.text}</span>
              <button
                onClick={() => removeSubtask(s.id)}
                aria-label="Remove subtask"
                className="cursor-pointer text-zinc-300 hover:text-red-500"
              >
                <IconX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSubtask(newSubtask);
            setNewSubtask("");
          }}
          className="mt-1.5 flex gap-1"
        >
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add subtask…"
            className="w-full rounded-sm border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-sm bg-zinc-200 px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-300"
          >
            Add
          </button>
        </form>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Tags</p>
        <div className="mb-1.5 flex flex-wrap gap-1">
          {todo.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              #{tag}
              <button onClick={() => removeTag(tag)} aria-label="Remove tag" className="cursor-pointer hover:text-indigo-900">
                <IconX className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTag(newTag);
            setNewTag("");
          }}
          className="flex gap-1"
        >
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag…"
            className="w-full rounded-sm border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-sm bg-zinc-200 px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-300"
          >
            Add
          </button>
        </form>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Description</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onUpdate({ notes })}
          rows={4}
          placeholder="Add a longer description or notes for this task…"
          className="w-full resize-none rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}
