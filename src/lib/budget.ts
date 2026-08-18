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
  personalSpendingCap?: number;
};

export type FutureExpense = {
  id: string;
  title: string;
  category: string;
  estimatedAmount: number;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Planned" | "Reserved" | "Done";
};

export type BudgetData = {
  month: string;
  accounts: Account[];
  people: Person[];
  categories: Category[];
  plan: MonthlyPlan;
  expenses: Expense[];
  futureExpenses?: FutureExpense[];
};

export const DEFAULT_BUDGET: BudgetData = {
  month: "August 2026",
  accounts: [
    { name: "Meezan Bank", starting: 70000, current: 49000 },
    { name: "Cash", starting: 0, current: 0 },
    { name: "JazzCash", starting: 0, current: 0 },
    { name: "UBL", starting: 0, current: 0 },
  ],
  people: [
    { name: "Ghazi", owed: 10000, received: 0 },
    { name: "Abdullah", owed: 1300, received: 0 },
    { name: "Rizwan", owed: 1300, received: 0 },
    { name: "Amir", owed: 1000, received: 0 },
  ],
  categories: [
    { name: "Food", actual: 0 },
    { name: "Transport", actual: 0 },
    { name: "Mobile & Internet", actual: 0 },
    { name: "Work & Tools", actual: 0 },
    { name: "Education", actual: 0 },
    { name: "Family", actual: 0 },
    { name: "Health", actual: 0 },
    { name: "Personal", actual: 0 },
    { name: "Other", actual: 0 },
  ],
  plan: {
    incomeReceived: 70000,
    monthlySpendingBudget: 30000,
    weeklySpendingLimit: 7500,
    minBalanceBuffer: 5000,
    personalSpendingCap: 5000,
  },
  expenses: [
    { date: "2026-08-01", category: "Other", description: "Money given to Ghazi", account: "Meezan Bank", amount: 10000 },
    { date: "2026-08-02", category: "Other", description: "Money given to Abdullah", account: "Meezan Bank", amount: 1300 },
    { date: "2026-08-03", category: "Other", description: "Money given to Rizwan", account: "Meezan Bank", amount: 1300 },
    { date: "2026-08-04", category: "Other", description: "Money given to Amir", account: "Meezan Bank", amount: 1000 },
    { date: "2026-08-05", category: "Work & Tools", description: "Claude Subscription", account: "Meezan Bank", amount: 5400 },
    { date: "2026-08-06", category: "Food", description: "Online Food", account: "Meezan Bank", amount: 1500 },
    { date: "2026-08-07", category: "Personal", description: "Clothing", account: "Meezan Bank", amount: 500 },
  ],
  futureExpenses: [
    { id: "1", title: "Internet Bill", category: "Mobile & Internet", estimatedAmount: 3500, dueDate: "2026-08-28", priority: "High", status: "Planned" },
    { id: "2", title: "Hosting & Domain Renewals", category: "Work & Tools", estimatedAmount: 12000, dueDate: "2026-09-15", priority: "Medium", status: "Planned" },
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
  // Auto-calculate account current balances dynamically: Starting - Expenses from account
  const accountsComputed = data.accounts.map((a) => {
    const spentFromAccount = data.expenses
      .filter((e) => e.account.trim().toLowerCase() === a.name.trim().toLowerCase())
      .reduce((s, e) => s + e.amount, 0);
    return {
      ...a,
      current: a.starting - spentFromAccount,
    };
  });

  const accountsTotalStarting = accountsComputed.reduce((s, a) => s + a.starting, 0);
  const accountsTotalCurrent = accountsComputed.reduce((s, a) => s + a.current, 0);
  const peopleTotalRemaining = data.people.reduce((s, p) => s + (p.owed - p.received), 0);

  // Auto-calculate category actual spending dynamically from logged expenses
  const categoriesComputed = data.categories.map((c) => {
    const spentForCategory = data.expenses
      .filter((e) => e.category.trim().toLowerCase() === c.name.trim().toLowerCase())
      .reduce((s, e) => s + e.amount, 0);
    return {
      ...c,
      actual: spentForCategory > 0 ? spentForCategory : c.actual,
    };
  });

  // Money given / transferred to people is a receivable, not personal spending
  const isGivenMoney = (e: Expense) =>
    e.category.trim().toLowerCase() === "other" ||
    e.description.toLowerCase().includes("given") ||
    e.description.toLowerCase().includes("transfer") ||
    data.people.some((p) => p.name.length > 1 && e.description.toLowerCase().includes(p.name.toLowerCase()));

  const actualSpendingExpenses = data.expenses.filter((e) => !isGivenMoney(e));
  const spentThisMonth = actualSpendingExpenses.length > 0
    ? actualSpendingExpenses.reduce((s, e) => s + e.amount, 0)
    : categoriesComputed.filter((c) => c.name.trim().toLowerCase() !== "other").reduce((s, c) => s + c.actual, 0);

  const estimatedNetWorth = accountsTotalCurrent;
  const safeToSpendNow = accountsTotalCurrent - data.plan.minBalanceBuffer;
  const budgetDifference = data.plan.monthlySpendingBudget - spentThisMonth;

  const daysLeft = Math.max(daysInMonth(today) - today.getDate(), 0);
  const safeToSpendPerDay = daysLeft > 0 ? Math.max(safeToSpendNow / daysLeft, 0) : 0;
  const dailyAverageSpent = today.getDate() > 0 ? spentThisMonth / today.getDate() : 0;

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const spentThisWeek = data.expenses
    .filter((e) => e.date >= isoDate(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()) && e.date <= isoDate(today.getFullYear(), today.getMonth(), today.getDate()))
    .reduce((s, e) => s + e.amount, 0);

  const personalSpent = data.expenses
    .filter((e) => !isGivenMoney(e) && (e.category.trim().toLowerCase() === "personal" || e.category.trim().toLowerCase() === "food"))
    .reduce((s, e) => s + e.amount, 0);
  const personalCap = data.plan.personalSpendingCap ?? 5000;
  const personalCapRemaining = personalCap - personalSpent;

  return {
    accountsComputed,
    categoriesComputed,
    accountsTotalStarting,
    accountsTotalCurrent,
    peopleTotalRemaining,
    spentThisMonth,
    estimatedNetWorth,
    safeToSpendNow,
    safeToSpendPerDay,
    dailyAverageSpent,
    budgetDifference,
    daysLeftInMonth: daysLeft,
    spentThisWeek,
    personalSpent,
    personalCap,
    personalCapRemaining,
  };
}

/** Sum of expenses logged within the calendar month containing `today`. */
export function currentMonthExpensesTotal(expenses: Expense[], today: Date) {
  const key = monthKey(today);
  return expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
}

export function fmtPKR(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs < 1000) {
    return `${sign}${abs.toLocaleString("en-PK")}`;
  }
  if (abs >= 100000) {
    const absLac = abs / 100000;
    const formatted = absLac % 1 === 0 ? absLac.toFixed(0) : absLac.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}${formatted} lac`;
  }
  const absK = abs / 1000;
  const formatted = absK % 1 === 0 ? absK.toFixed(0) : absK.toFixed(1).replace(/\.?0+$/, "");
  return `${sign}${formatted}k`;
}

export const fmtK = fmtPKR;

export function fmtDayLabel(iso: string) {
  const [, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]}`;
}
