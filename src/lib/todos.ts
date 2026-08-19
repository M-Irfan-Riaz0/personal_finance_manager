export type TodoStatus = "todo" | "doing" | "done";
export type TodoPriority = "Low" | "Medium" | "High";

export type Todo = {
  id: string;
  title: string;
  notes: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date: string | null; // ISO date, YYYY-MM-DD
  created_at: string;
};

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
