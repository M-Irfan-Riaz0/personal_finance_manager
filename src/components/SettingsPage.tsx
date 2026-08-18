"use client";

import { useState } from "react";
import { Account, BudgetData, Category, DEFAULT_BUDGET, Person } from "@/lib/budget";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs">
      <div className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <input
        {...props}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
    </label>
  );
}

function ListRow({ label, sub, onRemove }: { label: string; sub?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
      <div>
        <span className="font-medium text-zinc-800">{label}</span>
        {sub && <span className="ml-2 text-xs font-mono text-zinc-500">{sub}</span>}
      </div>
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="cursor-pointer text-zinc-400 hover:text-rose-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

export default function SettingsPage({
  data,
  onDataChange,
}: {
  data: BudgetData;
  onDataChange: (data: BudgetData) => void;
}) {
  const [accountName, setAccountName] = useState("");
  const [accountStarting, setAccountStarting] = useState("");
  const [personName, setPersonName] = useState("");
  const [personOwed, setPersonOwed] = useState("");
  const [categoryName, setCategoryName] = useState("");

  function updateMonth(month: string) {
    onDataChange({ ...data, month });
  }

  function updatePlan(patch: Partial<BudgetData["plan"]>) {
    onDataChange({ ...data, plan: { ...data.plan, ...patch } });
  }

  function addAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return;
    const starting = Number(accountStarting) || 0;
    const account: Account = { name: accountName.trim(), starting, current: starting };
    onDataChange({ ...data, accounts: [...data.accounts, account] });
    setAccountName("");
    setAccountStarting("");
  }

  function removeAccount(index: number) {
    onDataChange({ ...data, accounts: data.accounts.filter((_, i) => i !== index) });
  }

  function addPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!personName.trim()) return;
    const person: Person = { name: personName.trim(), owed: Number(personOwed) || 0, received: 0 };
    onDataChange({ ...data, people: [...data.people, person] });
    setPersonName("");
    setPersonOwed("");
  }

  function removePerson(index: number) {
    onDataChange({ ...data, people: data.people.filter((_, i) => i !== index) });
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const category: Category = { name: categoryName.trim(), actual: 0 };
    onDataChange({ ...data, categories: [...data.categories, category] });
    setCategoryName("");
  }

  function removeCategory(index: number) {
    onDataChange({ ...data, categories: data.categories.filter((_, i) => i !== index) });
  }

  function exportJSON() {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `budget_backup_${data.month.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.expenses)) {
            onDataChange(parsed);
          } else {
            alert("Invalid budget JSON file format.");
          }
        } catch {
          alert("Error parsing JSON file.");
        }
      };
    }
  }

  function handleResetToDefault() {
    if (confirm("Are you sure you want to reset all budget data to default settings?")) {
      onDataChange(DEFAULT_BUDGET);
    }
  }

  return (
    <div className="space-y-6">
      {/* Month & Monthly Plan Settings */}
      <Card title="General & Monthly Plan Settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Active Month"
            value={data.month}
            onChange={(e) => updateMonth(e.target.value)}
            placeholder="e.g. August 2026"
          />
          <Input
            label="Income Received"
            type="number"
            value={data.plan.incomeReceived || ""}
            onChange={(e) => updatePlan({ incomeReceived: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <Input
            label="Monthly Spending Budget"
            type="number"
            value={data.plan.monthlySpendingBudget || ""}
            onChange={(e) => updatePlan({ monthlySpendingBudget: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <Input
            label="Weekly Spending Limit"
            type="number"
            value={data.plan.weeklySpendingLimit || ""}
            onChange={(e) => updatePlan({ weeklySpendingLimit: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <Input
            label="Min Balance Buffer"
            type="number"
            value={data.plan.minBalanceBuffer || ""}
            onChange={(e) => updatePlan({ minBalanceBuffer: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <Input
            label="Personal Spending Cap (Max Self)"
            type="number"
            value={data.plan.personalSpendingCap || ""}
            onChange={(e) => updatePlan({ personalSpendingCap: Number(e.target.value) || 0 })}
            placeholder="5000"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Accounts Management */}
        <Card title="Accounts Management">
          <form onSubmit={addAccount} className="mb-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Nayapay"
              />
              <Input
                label="Starting Balance"
                type="number"
                value={accountStarting}
                onChange={(e) => setAccountStarting(e.target.value)}
                placeholder="0"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              + Add Account
            </button>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.accounts.map((a, i) => (
              <ListRow key={i} label={a.name} sub={`Starting: PKR ${a.starting}`} onRemove={() => removeAccount(i)} />
            ))}
          </div>
        </Card>

        {/* Money Given to People */}
        <Card title="Money Given to People">
          <form onSubmit={addPerson} className="mb-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Person Name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Ali"
              />
              <Input
                label="Amount Owed"
                type="number"
                value={personOwed}
                onChange={(e) => setPersonOwed(e.target.value)}
                placeholder="0"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              + Add Person
            </button>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.people.map((p, i) => (
              <ListRow key={i} label={p.name} sub={`Owed: PKR ${p.owed}`} onRemove={() => removePerson(i)} />
            ))}
          </div>
        </Card>

        {/* Categories Management */}
        <Card title="Spending Categories">
          <form onSubmit={addCategory} className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Bills"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              + Add
            </button>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.categories.map((c, i) => (
              <ListRow key={i} label={c.name} onRemove={() => removeCategory(i)} />
            ))}
          </div>
        </Card>
      </div>

      {/* Backup, Restore & Reset */}
      <Card title="Data Backup, Import & Reset">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportJSON}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            📥 Export Backup (JSON)
          </button>
          <label className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50">
            📤 Import Backup (JSON)
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
          <button
            onClick={handleResetToDefault}
            className="cursor-pointer rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100"
          >
            ⚠️ Reset to Default Template
          </button>
        </div>
      </Card>
    </div>
  );
}
