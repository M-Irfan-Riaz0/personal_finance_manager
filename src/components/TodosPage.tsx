"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Subtask, Todo, TodoPriority, TodoStatus, isOverdue, subtaskProgress } from "@/lib/todos";
import { Panel, EmptyState, TextField, SelectField, DateField, PrimaryButton, IconRemoveButton, IconX } from "@/components/ui";

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
  const [dueDate, setDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<TodoPriority | "All">("All");
  const [sortBy, setSortBy] = useState<SortBy>("due");
  const [hideDone, setHideDone] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
      const row = data as Todo;
      onTodosChange([...todos, { ...row, tags: row.tags ?? [], subtasks: row.subtasks ?? [] }]);
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

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSubtask(todo: Todo, text: string) {
    if (!text.trim()) return;
    const subtasks: Subtask[] = [...todo.subtasks, { id: newId(), text: text.trim(), done: false }];
    updateTodo(todo.id, { subtasks });
  }

  function toggleSubtask(todo: Todo, subId: string) {
    const subtasks = todo.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    updateTodo(todo.id, { subtasks });
  }

  function removeSubtask(todo: Todo, subId: string) {
    updateTodo(todo.id, { subtasks: todo.subtasks.filter((s) => s.id !== subId) });
  }

  function addTag(todo: Todo, tag: string) {
    const clean = tag.trim();
    if (!clean || todo.tags.includes(clean)) return;
    updateTodo(todo.id, { tags: [...todo.tags, clean] });
  }

  function removeTag(todo: Todo, tag: string) {
    updateTodo(todo.id, { tags: todo.tags.filter((t) => t !== tag) });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter((t) => {
      if (hideDone && t.status === "done") return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (q) {
        const inTitle = t.title.toLowerCase().includes(q);
        const inTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
        const inNotes = t.notes.toLowerCase().includes(q);
        if (!inTitle && !inTags && !inNotes) return false;
      }
      return true;
    });
  }, [todos, search, filterPriority, hideDone]);

  function sortItems(items: Todo[]) {
    return [...items].sort((a, b) => {
      if (sortBy === "due") return (a.due_date ?? "9999-99-99").localeCompare(b.due_date ?? "9999-99-99");
      if (sortBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return b.created_at.localeCompare(a.created_at);
    });
  }

  const allTags = useMemo(() => Array.from(new Set(todos.flatMap((t) => t.tags))).sort(), [todos]);

  return (
    <div>
      <Panel className="mb-4 p-4">
        <form onSubmit={addTodo} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Renew domain"
            />
          </div>
          <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </SelectField>
          <DateField label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <PrimaryButton type="submit">+ Add task</PrimaryButton>
        </form>
      </Panel>

      <Panel className="mb-6 flex flex-wrap items-end gap-2 p-3">
        <div className="flex-1 basis-48">
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, tag, or notes…"
          />
        </div>
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
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-medium text-zinc-500">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="cursor-pointer" />
          Hide done
        </label>
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pb-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearch(search === tag ? "" : tag)}
                className={`cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  search === tag ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = sortItems(filtered.filter((t) => t.status === col.status));
          return (
            <Panel key={col.status} className="border-zinc-200 bg-zinc-50/60">
              <div className="flex items-center gap-2 px-3.5 py-3">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{col.label}</span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-500 shadow-2xs">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5 px-3 pb-3">
                {items.length === 0 && <EmptyState>Nothing here.</EmptyState>}
                {items.map((t) => {
                  const progress = subtaskProgress(t);
                  const expanded = expandedIds.has(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`group rounded-md border-l-4 border-y border-r border-zinc-200 bg-white p-3 shadow-2xs transition-shadow hover:shadow-sm ${PRIORITY_BORDER[t.priority]}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <button
                          onClick={() => toggleExpanded(t.id)}
                          className="cursor-pointer text-left text-sm font-semibold leading-snug text-zinc-800 hover:text-indigo-700"
                        >
                          {t.title}
                        </button>
                        <IconRemoveButton
                          onClick={() => deleteTodo(t.id)}
                          label="Delete task"
                          className="shrink-0 opacity-0 group-hover:opacity-100"
                        />
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE[t.priority]}`}>
                          {t.priority}
                        </span>
                        {t.due_date && (
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              isOverdue(t, today) ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-600"
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
                        {progress.total > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              progress.done === progress.total ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            ✓ {progress.done}/{progress.total}
                          </span>
                        )}
                        {t.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {expanded && (
                        <TodoDetails
                          todo={t}
                          onNotesBlur={(notes) => updateTodo(t.id, { notes })}
                          onAddSubtask={(text) => addSubtask(t, text)}
                          onToggleSubtask={(subId) => toggleSubtask(t, subId)}
                          onRemoveSubtask={(subId) => removeSubtask(t, subId)}
                          onAddTag={(tag) => addTag(t, tag)}
                          onRemoveTag={(tag) => removeTag(t, tag)}
                        />
                      )}

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

function TodoDetails({
  todo,
  onNotesBlur,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
  onAddTag,
  onRemoveTag,
}: {
  todo: Todo;
  onNotesBlur: (notes: string) => void;
  onAddSubtask: (text: string) => void;
  onToggleSubtask: (subId: string) => void;
  onRemoveSubtask: (subId: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}) {
  const [notes, setNotes] = useState(todo.notes);
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");

  return (
    <div className="mb-3 space-y-3 rounded-md border border-zinc-100 bg-zinc-50/70 p-2.5">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Subtasks</p>
        <div className="space-y-1">
          {todo.subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onToggleSubtask(s.id)}
                className="cursor-pointer"
              />
              <span className={`flex-1 text-xs ${s.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{s.text}</span>
              <button
                onClick={() => onRemoveSubtask(s.id)}
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
            onAddSubtask(newSubtask);
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
              <button onClick={() => onRemoveTag(tag)} aria-label="Remove tag" className="cursor-pointer hover:text-indigo-900">
                <IconX className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddTag(newTag);
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
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onNotesBlur(notes)}
          rows={3}
          placeholder="Add notes…"
          className="w-full resize-none rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}
