export type TodoStatus = "todo" | "doing" | "done";
export type TodoPriority = "Low" | "Medium" | "High";
export type TodoCategory = "Work" | "Learning" | "Personal" | "Other";
export type Subtask = { id: string; text: string; done: boolean };

export const TODO_CATEGORIES: TodoCategory[] = ["Work", "Learning", "Personal", "Other"];

export type Todo = {
  id: string;
  title: string;
  notes: string;
  status: TodoStatus;
  priority: TodoPriority;
  category: TodoCategory;
  due_date: string | null; // ISO date, YYYY-MM-DD
  tags: string[];
  subtasks: Subtask[];
  created_at: string;
};

export function subtaskProgress(todo: Todo): { done: number; total: number } {
  const subtasks = todo.subtasks ?? [];
  return { done: subtasks.filter((s) => s.done).length, total: subtasks.length };
}

export function isOverdue(todo: Todo, today: Date) {
  if (!todo.due_date || todo.status === "done") return false;
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return todo.due_date < todayIso;
}

export function isDueToday(todo: Todo, today: Date) {
  if (!todo.due_date) return false;
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return todo.due_date === todayIso;
}
