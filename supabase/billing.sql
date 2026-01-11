create extension if not exists pgcrypto;

create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  subscription_status text not null default 'trialing',
  razorpay_customer_id text,
  razorpay_subscription_id text,
  current_period_end timestamptz
);

alter table public.user_billing enable row level security;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_billing_updated_at on public.user_billing;
create trigger trg_user_billing_updated_at
before update on public.user_billing
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_billing()
returns trigger as $$
begin
  insert into public.user_billing (user_id, trial_ends_at, subscription_status)
  values (new.id, new.created_at + interval '7 days', 'trialing')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_billing on auth.users;
create trigger on_auth_user_created_billing
after insert on auth.users
for each row execute function public.handle_new_user_billing();

drop policy if exists "user_billing_select_own" on public.user_billing;
create policy "user_billing_select_own"
  on public.user_billing
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_billing_update_own" on public.user_billing;
create policy "user_billing_update_own"
  on public.user_billing
  for update
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.user_billing from anon;
