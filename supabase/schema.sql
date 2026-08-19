-- Personal Budget Overview schema
-- Run this in the Supabase SQL editor for your project.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.budget_sheets (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.budget_sheets enable row level security;

-- Single-user personal app: allow the anon key full access to this one row.
-- Tighten this (e.g. require auth.uid()) if you add multi-user support later.
drop policy if exists "anon full access to budget_sheets" on public.budget_sheets;
create policy "anon full access to budget_sheets"
  on public.budget_sheets
  for all
  using (true)
  with check (true);

-- Todos module
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text not null default '',
  status text not null default 'todo', -- todo | doing | done
  priority text not null default 'Medium', -- Low | Medium | High
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "anon full access to todos" on public.todos;
create policy "anon full access to todos"
  on public.todos
  for all
  using (true)
  with check (true);

-- Habits module (bad-habit removal tracking)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

drop policy if exists "anon full access to habits" on public.habits;
create policy "anon full access to habits"
  on public.habits
  for all
  using (true)
  with check (true);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  status text not null, -- clean | slipped
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

alter table public.habit_logs enable row level security;

drop policy if exists "anon full access to habit_logs" on public.habit_logs;
create policy "anon full access to habit_logs"
  on public.habit_logs
  for all
  using (true)
  with check (true);

-- Learning module (personal learning management)
create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'course', -- course | book | skill
  status text not null default 'planned', -- planned | in_progress | done
  progress int not null default 0, -- 0-100
  notes text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

alter table public.learning_items enable row level security;

drop policy if exists "anon full access to learning_items" on public.learning_items;
create policy "anon full access to learning_items"
  on public.learning_items
  for all
  using (true)
  with check (true);

-- Files attached to a learning item (PDFs, slides, notes exports, etc.)
create table if not exists public.learning_files (
  id uuid primary key default gen_random_uuid(),
  learning_item_id uuid not null references public.learning_items(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.learning_files enable row level security;

drop policy if exists "anon full access to learning_files" on public.learning_files;
create policy "anon full access to learning_files"
  on public.learning_files
  for all
  using (true)
  with check (true);

-- Storage bucket for the actual uploaded files (public bucket: single-user personal app)
insert into storage.buckets (id, name, public)
values ('learning-files', 'learning-files', true)
on conflict (id) do nothing;

drop policy if exists "anon full access to learning-files bucket" on storage.objects;
create policy "anon full access to learning-files bucket"
  on storage.objects
  for all
  using (bucket_id = 'learning-files')
  with check (bucket_id = 'learning-files');
