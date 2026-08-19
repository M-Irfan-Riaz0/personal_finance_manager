"use client";

import { useState } from "react";
import { Account, BudgetData, Category, DEFAULT_BUDGET, Person } from "@/lib/budget";
import { TitledPanel, TextField, NumberField, PrimaryButton, IconRemoveButton, IconDownload, IconUpload, IconWarning } from "@/components/ui";

function ListRow({ label, sub, onRemove }: { label: string; sub?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
      <div>
        <span className="font-medium text-zinc-800">{label}</span>
        {sub && <span className="ml-2 text-xs font-mono text-zinc-500">{sub}</span>}
      </div>
      <IconRemoveButton onClick={onRemove} label={`Remove ${label}`} />
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
      <TitledPanel title="General & Monthly Plan Settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <TextField
            label="Active Month"
            value={data.month}
            onChange={(e) => updateMonth(e.target.value)}
            placeholder="e.g. August 2026"
          />
          <NumberField
            label="Income Received"
            value={data.plan.incomeReceived || ""}
            onChange={(e) => updatePlan({ incomeReceived: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <NumberField
            label="Monthly Spending Budget"
            value={data.plan.monthlySpendingBudget || ""}
            onChange={(e) => updatePlan({ monthlySpendingBudget: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <NumberField
            label="Weekly Spending Limit"
            value={data.plan.weeklySpendingLimit || ""}
            onChange={(e) => updatePlan({ weeklySpendingLimit: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <NumberField
            label="Min Balance Buffer"
            value={data.plan.minBalanceBuffer || ""}
            onChange={(e) => updatePlan({ minBalanceBuffer: Number(e.target.value) || 0 })}
            placeholder="0"
          />
          <NumberField
            label="Personal Spending Cap (Max Self)"
            value={data.plan.personalSpendingCap || ""}
            onChange={(e) => updatePlan({ personalSpendingCap: Number(e.target.value) || 0 })}
            placeholder="5000"
          />
        </div>
      </TitledPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Accounts Management */}
        <TitledPanel title="Accounts Management">
          <form onSubmit={addAccount} className="mb-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Nayapay"
              />
              <NumberField
                label="Starting Balance"
                value={accountStarting}
                onChange={(e) => setAccountStarting(e.target.value)}
                placeholder="0"
              />
            </div>
            <PrimaryButton type="submit">+ Add Account</PrimaryButton>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.accounts.map((a, i) => (
              <ListRow key={i} label={a.name} sub={`Starting: PKR ${a.starting}`} onRemove={() => removeAccount(i)} />
            ))}
          </div>
        </TitledPanel>

        {/* Money Given to People */}
        <TitledPanel title="Money Given to People">
          <form onSubmit={addPerson} className="mb-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Person Name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Ali"
              />
              <NumberField
                label="Amount Owed"
                value={personOwed}
                onChange={(e) => setPersonOwed(e.target.value)}
                placeholder="0"
              />
            </div>
            <PrimaryButton type="submit">+ Add Person</PrimaryButton>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.people.map((p, i) => (
              <ListRow key={i} label={p.name} sub={`Owed: PKR ${p.owed}`} onRemove={() => removePerson(i)} />
            ))}
          </div>
        </TitledPanel>

        {/* Categories Management */}
        <TitledPanel title="Spending Categories">
          <form onSubmit={addCategory} className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <TextField
                label="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Bills"
              />
            </div>
            <PrimaryButton type="submit">+ Add</PrimaryButton>
          </form>
          <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
            {data.categories.map((c, i) => (
              <ListRow key={i} label={c.name} onRemove={() => removeCategory(i)} />
            ))}
          </div>
        </TitledPanel>
      </div>

      {/* Backup, Restore & Reset */}
      <TitledPanel title="Data Backup, Import & Reset">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportJSON}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            <IconDownload className="h-3.5 w-3.5" /> Export Backup (JSON)
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50">
            <IconUpload className="h-3.5 w-3.5" /> Import Backup (JSON)
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
          <button
            onClick={handleResetToDefault}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100"
          >
            <IconWarning className="h-3.5 w-3.5" /> Reset to Default Template
          </button>
        </div>
      </TitledPanel>
    </div>
  );
}
