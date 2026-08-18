export type Account = { name: string; starting: number; current: number };
export type Person = { name: string; owed: number; received: number };
export type Category = { name: string; actual: number };
export type DailyEntry = { day: string; spending: number };
export type Expense = {
  date: string;
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
  daily: DailyEntry[];
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
  daily: Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const spendingByDay: Record<number, number> = { 7: 550, 8: 5450, 11: 10000 };
    return {
      day: `${String(day).padStart(2, "0")} Aug`,
      spending: spendingByDay[day] ?? 0,
    };
  }),
  plan: {
    incomeReceived: 0,
    monthlySpendingBudget: 0,
    weeklySpendingLimit: 0,
    minBalanceBuffer: 0,
  },
  expenses: [
    { date: "07 Aug", category: "Food", description: "Groceries", account: "Cash", amount: 550 },
    { date: "08 Aug", category: "Personal", description: "Shopping", account: "Cash", amount: 5450 },
    { date: "11 Aug", category: "Transport", description: "Fuel", account: "JazzCash", amount: 10000 },
  ],
};

export function expensesTotal(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function computeTotals(data: BudgetData, today: Date) {
  const accountsTotalStarting = data.accounts.reduce((s, a) => s + a.starting, 0);
  const accountsTotalCurrent = data.accounts.reduce((s, a) => s + a.current, 0);
  const peopleTotalRemaining = data.people.reduce((s, p) => s + (p.owed - p.received), 0);
  const spentThisMonth = data.categories.reduce((s, c) => s + c.actual, 0);
  const estimatedNetWorth = accountsTotalCurrent + peopleTotalRemaining;
  const safeToSpendNow = accountsTotalCurrent - data.plan.minBalanceBuffer;
  const budgetDifference = data.plan.monthlySpendingBudget - spentThisMonth;

  const daysInMonth = data.daily.length;
  const todayDay = today.getDate();
  const currentDayIndex = Math.min(todayDay, daysInMonth);
  const daysLeftInMonth = Math.max(daysInMonth - currentDayIndex, 0);

  const weekStart = Math.max(currentDayIndex - 6, 1);
  const spentThisWeek = data.daily
    .slice(weekStart - 1, currentDayIndex)
    .reduce((s, d) => s + d.spending, 0);

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

export function fmtPKR(n: number) {
  const abs = Math.abs(n).toLocaleString("en-PK");
  return `${n < 0 ? "-" : ""}PKR ${abs}`;
}
