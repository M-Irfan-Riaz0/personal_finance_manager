"use client";

import { BudgetData, computeTotals, fmtPKR, monthDates, fmtDayLabel } from "@/lib/budget";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-900">{children}</h2>;
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-300 bg-white shadow-2xs">
      {children}
    </div>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-r border-zinc-200 bg-zinc-100/90 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 last:border-r-0 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-r border-zinc-200 px-2 py-1 text-sm last:border-r-0 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-sm px-2.5 py-1 text-sm text-indigo-700 outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const isNegative = value < 0;
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      className={`w-full rounded-sm px-2.5 py-1 text-right tabular-nums outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 ${
        isNegative ? "font-semibold text-rose-600" : "font-medium text-indigo-700"
      }`}
    />
  );
}

function Computed({ children, value }: { children: React.ReactNode; value?: number }) {
  const isNegative = value !== undefined ? value < 0 : false;
  return (
    <span
      className={`block px-2.5 py-1 text-right font-semibold tabular-nums ${
        isNegative ? "text-rose-600" : "text-zinc-900"
      }`}
    >
      {children}
    </span>
  );
}

export default function BudgetSheet({
  data,
  today,
  onDataChange,
}: {
  data: BudgetData;
  today: Date;
  onDataChange: (data: BudgetData) => void;
}) {
  const t = computeTotals(data, today);

  function updateAccount(index: number, patch: Partial<BudgetData["accounts"][number]>) {
    const accounts = data.accounts.map((a, i) => (i === index ? { ...a, ...patch } : a));
    onDataChange({ ...data, accounts });
  }
  function updatePerson(index: number, patch: Partial<BudgetData["people"][number]>) {
    const people = data.people.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onDataChange({ ...data, people });
  }
  function updateCategory(index: number, patch: Partial<BudgetData["categories"][number]>) {
    const categories = data.categories.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onDataChange({ ...data, categories });
  }
  function updatePlan(patch: Partial<BudgetData["plan"]>) {
    onDataChange({ ...data, plan: { ...data.plan, ...patch } });
  }

  return (
    <div className="space-y-8 p-5">
      {/* Account Balances + People Who Owe Me */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle>Account Balances</SectionTitle>
          <TableShell>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th align="right" className="w-28 sm:w-32">Starting</Th>
                  <Th align="right" className="w-28 sm:w-32">Current</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {t.accountsComputed.map((a, i) => (
                  <tr key={i} className="odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                    <Td>
                      <TextInput value={a.name} onChange={(v) => updateAccount(i, { name: v })} />
                    </Td>
                    <Td className="w-28 sm:w-32">
                      <NumberInput value={a.starting} onChange={(v) => updateAccount(i, { starting: v })} />
                    </Td>
                    <Td className="w-28 sm:w-32">
                      <Computed value={a.current}>{fmtPKR(a.current)}</Computed>
                    </Td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-200 bg-zinc-50 font-medium">
                  <Td className="py-2 text-sm font-semibold text-zinc-700">Total</Td>
                  <Td className="w-28 sm:w-32">
                    <Computed value={t.accountsTotalStarting}>{fmtPKR(t.accountsTotalStarting)}</Computed>
                  </Td>
                  <Td className="w-28 sm:w-32">
                    <Computed value={t.accountsTotalCurrent}>{fmtPKR(t.accountsTotalCurrent)}</Computed>
                  </Td>
                </tr>
              </tbody>
            </table>
          </TableShell>
        </div>

        <div>
          <SectionTitle>People Who Owe Me</SectionTitle>
          <TableShell>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <Th>Person</Th>
                  <Th align="right" className="w-24 sm:w-28">Owed</Th>
                  <Th align="right" className="w-24 sm:w-28">Received</Th>
                  <Th align="right" className="w-28 sm:w-32">Remaining</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.people.map((p, i) => (
                  <tr key={i} className="odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                    <Td>
                      <TextInput value={p.name} onChange={(v) => updatePerson(i, { name: v })} />
                    </Td>
                    <Td className="w-24 sm:w-28">
                      <NumberInput value={p.owed} onChange={(v) => updatePerson(i, { owed: v })} />
                    </Td>
                    <Td className="w-24 sm:w-28">
                      <NumberInput value={p.received} onChange={(v) => updatePerson(i, { received: v })} />
                    </Td>
                    <Td className="w-28 sm:w-32">
                      <Computed value={p.owed - p.received}>{fmtPKR(p.owed - p.received)}</Computed>
                    </Td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-200 bg-zinc-50 font-medium">
                  <Td className="py-2 text-sm font-semibold text-zinc-700">Total</Td>
                  <Td className="w-24 sm:w-28" />
                  <Td className="w-24 sm:w-28" />
                  <Td className="w-28 sm:w-32">
                    <Computed value={t.peopleTotalRemaining}>{fmtPKR(t.peopleTotalRemaining)}</Computed>
                  </Td>
                </tr>
              </tbody>
            </table>
          </TableShell>
        </div>
      </div>

      {/* Monthly Plan + Spending by Category */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle>Monthly Plan</SectionTitle>
          <TableShell>
            <table className="w-full border-collapse text-sm">
              <tbody className="divide-y divide-zinc-100">
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Income received</Td>
                  <Td className="w-32 sm:w-36">
                    <NumberInput
                      value={data.plan.incomeReceived}
                      onChange={(v) => updatePlan({ incomeReceived: v })}
                    />
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Monthly spending budget</Td>
                  <Td className="w-32 sm:w-36">
                    <NumberInput
                      value={data.plan.monthlySpendingBudget}
                      onChange={(v) => updatePlan({ monthlySpendingBudget: v })}
                    />
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Weekly spending limit</Td>
                  <Td className="w-32 sm:w-36">
                    <NumberInput
                      value={data.plan.weeklySpendingLimit}
                      onChange={(v) => updatePlan({ weeklySpendingLimit: v })}
                    />
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Actual spending</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.spentThisMonth}>{fmtPKR(t.spentThisMonth)}</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Spent this week</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.spentThisWeek}>{fmtPKR(t.spentThisWeek)}</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Minimum balance buffer</Td>
                  <Td className="w-32 sm:w-36">
                    <NumberInput
                      value={data.plan.minBalanceBuffer}
                      onChange={(v) => updatePlan({ minBalanceBuffer: v })}
                    />
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Available Savings</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.safeToSpendNow}>{fmtPKR(t.safeToSpendNow)}</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Daily Expense Ceiling</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.safeToSpendPerDay}>{fmtPKR(t.safeToSpendPerDay)} / day</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Daily average spent</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.dailyAverageSpent}>{fmtPKR(t.dailyAverageSpent)} / day</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Budget difference</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed value={t.budgetDifference}>{fmtPKR(t.budgetDifference)}</Computed>
                  </Td>
                </tr>
                <tr className="odd:bg-white even:bg-zinc-50/50">
                  <Td className="text-zinc-600">Days left in month</Td>
                  <Td className="w-32 sm:w-36">
                    <Computed>{t.daysLeftInMonth} days</Computed>
                  </Td>
                </tr>
              </tbody>
            </table>
          </TableShell>
        </div>

        <div>
          <SectionTitle>Spending by Category</SectionTitle>
          <TableShell>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th align="right" className="w-32 sm:w-36">Actual</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {t.categoriesComputed.map((c, i) => (
                  <tr key={i} className="odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                    <Td>
                      <TextInput value={c.name} onChange={(v) => updateCategory(i, { name: v })} />
                    </Td>
                    <Td className="w-32 sm:w-36">
                      <Computed value={c.actual}>{fmtPKR(c.actual)}</Computed>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      </div>

      {/* Daily Spending */}
      <div>
        <SectionTitle>Daily Spending — {data.month}</SectionTitle>
        <TableShell>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0">
                <tr>
                  <Th className="w-28 sm:w-32">Day</Th>
                  <Th align="right" className="w-32 sm:w-40">Spending</Th>
                  <Th>{""}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {monthDates(today).map((iso) => {
                  const daySpending = data.expenses
                    .filter((e) => e.date === iso)
                    .reduce((s, e) => s + e.amount, 0);
                  return (
                    <tr key={iso} className="odd:bg-white even:bg-zinc-50/50 hover:bg-indigo-50/40">
                      <Td className="w-28 sm:w-32 font-medium text-zinc-600">{fmtDayLabel(iso)}</Td>
                      <Td className="w-32 sm:w-40">
                        <Computed value={daySpending}>{daySpending > 0 ? fmtPKR(daySpending) : "—"}</Computed>
                      </Td>
                      <Td />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      {/* Legend */}
      <div className="bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
        <p>
          <span className="font-medium text-indigo-700">Indigo</span> fields are editable · other values are
          calculated automatically.
        </p>
        <p className="mt-1">Current balance = Starting balance minus all expenses from that account.</p>
      </div>
    </div>
  );
}
