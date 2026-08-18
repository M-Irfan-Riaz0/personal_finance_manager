export type Account = { name: string; starting: number; current: number };
export type Person = { name: string; owed: number; received: number };
export type Category = { name: string; actual: number };
export type Expense = {
  date: string; // ISO date, YYYY-MM-DD
  category: string;
  description: string;
  account: string;
  amount: number;
};
export type MonthlyPlan = {
  incomeReceived: number;
  monthlySpendingBudget: number;
  weeklySpendingLimit: number;
  minBalanceBuffer: number;
};

export type BudgetData = {
  month: string;
  accounts: Account[];
  people: Person[];
  categories: Category[];
  plan: MonthlyPlan;
  expenses: Expense[];
};

export const DEFAULT_BUDGET: BudgetData = {
  month: "August 2026",
  accounts: [
    { name: "Meezan Bank", starting: 69000, current: 69000 },
    { name: "UBL", starting: 0, current: 0 },
    { name: "JazzCash", starting: 3391, current: -2609 },
    { name: "Cash", starting: 0, current: -10000 },
  ],
  people: [{ name: "Dummy", owed: 1300, received: 0 }],
  categories: [
    { name: "Food", actual: 1000 },
    { name: "Transport", actual: 10000 },
    { name: "Mobile & Internet", actual: 0 },
    { name: "Work & Tools", actual: 0 },
    { name: "Education", actual: 0 },
    { name: "Family", actual: 0 },
    { name: "Health", actual: 0 },
    { name: "Personal", actual: 5000 },
    { name: "Other", actual: 0 },
  ],
  plan: {
    incomeReceived: 0,
    monthlySpendingBudget: 0,
    weeklySpendingLimit: 0,
    minBalanceBuffer: 0,
  },
  expenses: [
    { date: "2026-08-07", category: "Food", description: "Groceries", account: "Cash", amount: 550 },
    { date: "2026-08-08", category: "Personal", description: "Shopping", account: "Cash", amount: 5450 },
    { date: "2026-08-11", category: "Transport", description: "Fuel", account: "JazzCash", amount: 10000 },
  ],
};

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** All ISO dates (YYYY-MM-DD) for the calendar month containing `date`. */
export function monthDates(date: Date): string[] {
  const count = daysInMonth(date);
  return Array.from({ length: count }, (_, i) => isoDate(date.getFullYear(), date.getMonth(), i + 1));
}

export function expensesTotal(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function computeTotals(data: BudgetData, today: Date) {
  const accountsTotalStarting = data.accounts.reduce((s, a) => s + a.starting, 0);
  const accountsTotalCurrent = data.accounts.reduce((s, a) => s + a.current, 0);
  const peopleTotalRemaining = data.people.reduce((s, p) => s + (p.owed - p.received), 0);
  const spentThisMonth = data.categories.reduce((s, c) => s + c.actual, 0);
  const estimatedNetWorth = accountsTotalCurrent + peopleTotalRemaining;
  const safeToSpendNow = accountsTotalCurrent - data.plan.minBalanceBuffer;
  const budgetDifference = data.plan.monthlySpendingBudget - spentThisMonth;

  const daysLeftInMonth = Math.max(daysInMonth(today) - today.getDate(), 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const spentThisWeek = data.expenses
    .filter((e) => e.date >= isoDate(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()) && e.date <= isoDate(today.getFullYear(), today.getMonth(), today.getDate()))
    .reduce((s, e) => s + e.amount, 0);

  return {
    accountsTotalStarting,
    accountsTotalCurrent,
    peopleTotalRemaining,
    spentThisMonth,
    estimatedNetWorth,
    safeToSpendNow,
    budgetDifference,
    daysLeftInMonth,
    spentThisWeek,
  };
}

/** Sum of expenses logged within the calendar month containing `today`. */
export function currentMonthExpensesTotal(expenses: Expense[], today: Date) {
  const key = monthKey(today);
  return expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
}

export function fmtPKR(n: number) {
  const abs = Math.abs(n).toLocaleString("en-PK");
  return `${n < 0 ? "-" : ""}PKR ${abs}`;
}

export function fmtK(n: number) {
  const abs = Math.abs(n);
  if (abs < 1000) {
    return fmtPKR(n);
  }
  if (abs >= 100000) {
    const absLac = abs / 100000;
    const formatted = absLac % 1 === 0 ? absLac.toFixed(0) : absLac.toFixed(2).replace(/\.?0+$/, "");
    return `${n < 0 ? "-" : ""}PKR ${formatted} lac`;
  }
  const absK = abs / 1000;
  const formatted = absK % 1 === 0 ? absK.toFixed(0) : absK.toFixed(1);
  return `${n < 0 ? "-" : ""}PKR ${formatted}k`;
}

export function fmtDayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]}`;
}
