-- KaizenOS Supabase Schema
-- Run this entire script once in your Supabase Dashboard -> SQL Editor.

-- 1. User settings, domain curricula, weekly cadence, and entrepreneurship tasks
create table if not exists public.planner_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  domains jsonb not null default '{}'::jsonb,
  weekly_template jsonb not null default '[]'::jsonb,
  entrepreneur_tasks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_profiles enable row level security;

drop policy if exists "Users manage own planner_profiles" on public.planner_profiles;
create policy "Users manage own planner_profiles"
  on public.planner_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Daily plans & check-ins (merged per date_key so phone and laptop edits never clobber other days)
create table if not exists public.planner_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  date_key text not null,
  checkin jsonb not null default '{}'::jsonb,
  blocks jsonb not null default '[]'::jsonb,
  summary_notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key)
);

alter table public.planner_days enable row level security;

drop policy if exists "Users manage own planner_days" on public.planner_days;
create policy "Users manage own planner_days"
  on public.planner_days
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Completed deliberate-practice session logs (merged per session id)
create table if not exists public.planner_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date_key text not null,
  domain_id text not null,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists idx_planner_sessions_user_date
  on public.planner_sessions (user_id, date_key desc);

alter table public.planner_sessions enable row level security;

drop policy if exists "Users manage own planner_sessions" on public.planner_sessions;
create policy "Users manage own planner_sessions"
  on public.planner_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
