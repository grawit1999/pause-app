-- Pause. — Leave Approval System
-- Run this in your Supabase SQL editor

-- ── Extensions ──────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  initial     text not null,          -- display initial, e.g. "น"
  avatar_tone text not null default 'brand', -- brand | amber | sky | lilac | rose | olive
  role        text not null check (role in ('employee','approver','hr','admin')),
  department  text not null default '',
  approver_id uuid references public.profiles(id), -- employee's direct approver
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── leave_quotas ─────────────────────────────────────────────────────────
create table public.leave_quotas (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.profiles(id) on delete cascade,
  year         int  not null,
  leave_type   text not null check (leave_type in ('ลาพักร้อน','ลากิจ','ลาป่วย')),
  total_days   int  not null default 0,
  used_days    numeric(5,1) not null default 0,
  unique (employee_id, year, leave_type)
);
alter table public.leave_quotas enable row level security;

create policy "Employees can read own quotas"
  on public.leave_quotas for select
  using (auth.uid() = employee_id);

create policy "HR and admins can read all quotas"
  on public.leave_quotas for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('hr','admin','approver')
  ));

create policy "HR and admins can modify quotas"
  on public.leave_quotas for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('hr','admin')
  ));

-- ── leave_requests ───────────────────────────────────────────────────────
create table public.leave_requests (
  id                  uuid primary key default uuid_generate_v4(),
  ref_no              text unique not null,        -- e.g. REQ-0042
  employee_id         uuid not null references public.profiles(id),
  leave_type          text not null check (leave_type in ('ลาพักร้อน','ลากิจ','ลาป่วย')),
  start_date          date not null,
  end_date            date not null,
  days                numeric(5,1) not null,
  reason              text not null default '',
  status              text not null default 'pending'
                        check (status in ('pending','approved','rejected','cancelled')),
  -- AI fields
  ai_score            int,                         -- 0–100 confidence
  ai_recommendation   text check (ai_recommendation in ('อนุมัติ','ปฏิเสธ','ตรวจสอบเพิ่มเติม')),
  ai_summary          text,
  ai_flags            text[] default '{}',         -- e.g. {"quota_low","peak_period"}
  -- Approval
  approver_id         uuid references public.profiles(id),
  approver_comment    text,
  approved_at         timestamptz,
  -- Timestamps
  submitted_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.leave_requests enable row level security;

create policy "Employees can read own requests"
  on public.leave_requests for select
  using (auth.uid() = employee_id);

create policy "Employees can insert own requests"
  on public.leave_requests for insert
  with check (auth.uid() = employee_id);

create policy "Employees can cancel own pending requests"
  on public.leave_requests for update
  using (auth.uid() = employee_id and status = 'pending');

create policy "Approvers can read their team requests"
  on public.leave_requests for select
  using (exists (
    select 1 from public.profiles p
    where p.id = leave_requests.employee_id and p.approver_id = auth.uid()
  ));

create policy "Approvers can update team requests"
  on public.leave_requests for update
  using (exists (
    select 1 from public.profiles p
    where p.id = leave_requests.employee_id and p.approver_id = auth.uid()
  ));

create policy "HR and admins can read all requests"
  on public.leave_requests for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('hr','admin')
  ));

create policy "HR and admins can update all requests"
  on public.leave_requests for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('hr','admin')
  ));

-- ── updated_at trigger ───────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_leave_request_updated
  before update on public.leave_requests
  for each row execute procedure public.handle_updated_at();

-- ── ref_no sequence ──────────────────────────────────────────────────────
create sequence if not exists leave_request_seq start 1;

create or replace function public.gen_ref_no()
returns trigger language plpgsql as $$
begin
  new.ref_no = 'REQ-' || lpad(nextval('leave_request_seq')::text, 4, '0');
  return new;
end;
$$;

create trigger on_leave_request_insert
  before insert on public.leave_requests
  for each row execute procedure public.gen_ref_no();

-- ── Seed: quota defaults (called via RPC when new user joins) ────────────
create or replace function public.create_default_quotas(p_employee_id uuid, p_year int)
returns void language plpgsql security definer as $$
begin
  insert into public.leave_quotas (employee_id, year, leave_type, total_days)
  values
    (p_employee_id, p_year, 'ลาพักร้อน', 10),
    (p_employee_id, p_year, 'ลากิจ',    3),
    (p_employee_id, p_year, 'ลาป่วย',   30)
  on conflict do nothing;
end;
$$;
