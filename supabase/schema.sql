-- Personal Budget Overview schema
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.budget_sheets (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.budget_sheets enable row level security;

-- Single-user personal app: allow the anon key full access to this one row.
-- Tighten this (e.g. require auth.uid()) if you add multi-user support later.
create policy "anon full access to budget_sheets"
  on public.budget_sheets
  for all
  using (true)
  with check (true);
