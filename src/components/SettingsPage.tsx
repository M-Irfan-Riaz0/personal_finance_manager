"use client";

import { useState } from "react";
import { Account, BudgetData, Category, Person } from "@/lib/budget";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-300 bg-white shadow-2xs">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
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
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      <input
        {...props}
        className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function ListRow({ label, sub, onRemove }: { label: string; sub?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
      <div>
        <span className="font-medium text-zinc-800">{label}</span>
        {sub && <span className="ml-2 text-zinc-500">{sub}</span>}
      </div>
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="cursor-pointer text-zinc-400 hover:text-red-500"
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Accounts">
        <form onSubmit={addAccount} className="mb-4 flex items-end gap-2">
          <Input
            label="Account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. HBL"
          />
          <Input
            label="Starting balance"
            type="number"
            value={accountStarting}
            onChange={(e) => setAccountStarting(e.target.value)}
            placeholder="0"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </form>
        {data.accounts.map((a, i) => (
          <ListRow key={i} label={a.name} sub={`Starting: ${a.starting}`} onRemove={() => removeAccount(i)} />
        ))}
      </Card>

      <Card title="People Who Owe Me">
        <form onSubmit={addPerson} className="mb-4 flex items-end gap-2">
          <Input
            label="Person name"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="e.g. Ahmed"
          />
          <Input
            label="Amount owed"
            type="number"
            value={personOwed}
            onChange={(e) => setPersonOwed(e.target.value)}
            placeholder="0"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </form>
        {data.people.map((p, i) => (
          <ListRow key={i} label={p.name} sub={`Owed: ${p.owed}`} onRemove={() => removePerson(i)} />
        ))}
      </Card>

      <Card title="Spending Categories">
        <form onSubmit={addCategory} className="mb-4 flex items-end gap-2">
          <Input
            label="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Utilities"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </form>
        {data.categories.map((c, i) => (
          <ListRow key={i} label={c.name} onRemove={() => removeCategory(i)} />
        ))}
      </Card>
    </div>
  );
}
