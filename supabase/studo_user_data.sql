create extension if not exists pgcrypto;

create table if not exists public.studo_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studo_user_data enable row level security;

create or replace function public.set_studo_user_data_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_studo_user_data_updated_at on public.studo_user_data;
create trigger trg_studo_user_data_updated_at
before update on public.studo_user_data
for each row execute function public.set_studo_user_data_updated_at();

drop policy if exists "studo_user_data_select_own" on public.studo_user_data;
create policy "studo_user_data_select_own"
  on public.studo_user_data
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "studo_user_data_upsert_own" on public.studo_user_data;
create policy "studo_user_data_upsert_own"
  on public.studo_user_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "studo_user_data_update_own" on public.studo_user_data;
create policy "studo_user_data_update_own"
  on public.studo_user_data
  for update
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.studo_user_data from anon;
