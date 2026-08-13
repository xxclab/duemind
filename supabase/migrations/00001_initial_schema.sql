-- DueMind Database Schema
-- Supabase (PostgreSQL)

-- ============================================
-- 1. profiles (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. notification_channels
-- ============================================
create table public.notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('email', 'telegram', 'webhook', 'wecom', 'feishu', 'dingtalk')),
  name text not null,
  config jsonb not null default '{}',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notification_channels enable row level security;

create policy "Users can view own channels"
  on public.notification_channels for select
  using (auth.uid() = user_id);

create policy "Users can insert own channels"
  on public.notification_channels for insert
  with check (auth.uid() = user_id);

create policy "Users can update own channels"
  on public.notification_channels for update
  using (auth.uid() = user_id);

create policy "Users can delete own channels"
  on public.notification_channels for delete
  using (auth.uid() = user_id);

-- ============================================
-- 3. things
-- ============================================
create table public.things (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in (
      'domain', 'certificate', 'token', 'subscription',
      'service', 'license', 'warranty', 'food',
      'birthday', 'anniversary', 'document', 'other'
    )),
  due_at timestamptz not null,
  description text,
  action text default 'other',
  status text not null default 'pending'
    check (status in ('pending', 'done', 'dismissed', 'expired')),
  tags text[] default '{}',
  recurrence_rule text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_things_user_id on public.things(user_id);
create index idx_things_user_status on public.things(user_id, status);
create index idx_things_due_at on public.things(due_at);

alter table public.things enable row level security;

create policy "Users can view own things"
  on public.things for select
  using (auth.uid() = user_id);

create policy "Users can insert own things"
  on public.things for insert
  with check (auth.uid() = user_id);

create policy "Users can update own things"
  on public.things for update
  using (auth.uid() = user_id);

create policy "Users can delete own things"
  on public.things for delete
  using (auth.uid() = user_id);

-- ============================================
-- 4. reminders
-- ============================================
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  thing_id uuid not null references public.things(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  offset_minutes integer not null,
  channel_id uuid not null references public.notification_channels(id) on delete cascade,
  enabled boolean default true,
  next_trigger_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz default now()
);

create index idx_reminders_next_trigger on public.reminders(next_trigger_at) where next_trigger_at is not null and enabled = true;

alter table public.reminders enable row level security;

create policy "Users can view own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- ============================================
-- 5. Auto-update updated_at
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger notification_channels_updated_at
  before update on public.notification_channels
  for each row execute procedure public.update_updated_at_column();

create trigger things_updated_at
  before update on public.things
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 6. Compute next_trigger_at on reminder insert/update
-- ============================================
create or replace function public.compute_next_trigger()
returns trigger as $$
declare
  v_due_at timestamptz;
begin
  select due_at into v_due_at from public.things where id = new.thing_id;
  if v_due_at is not null then
    new.next_trigger_at = v_due_at + (new.offset_minutes || ' minutes')::interval;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger reminders_compute_trigger
  before insert or update on public.reminders
  for each row execute procedure public.compute_next_trigger();

-- ============================================
-- 7. notification_logs (phase 2, but create now)
-- ============================================
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid references public.reminders(id) on delete set null,
  thing_id uuid references public.things(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid not null references public.notification_channels(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'failed', 'pending')),
  error_message text,
  sent_at timestamptz default now()
);

create index idx_notification_logs_user on public.notification_logs(user_id);
create index idx_notification_logs_sent_at on public.notification_logs(sent_at);

alter table public.notification_logs enable row level security;

create policy "Users can view own notification_logs"
  on public.notification_logs for select
  using (auth.uid() = user_id);
