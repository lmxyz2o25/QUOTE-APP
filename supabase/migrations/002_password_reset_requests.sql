-- =========================================================
-- QUOTE-APP PASSWORD RESET REQUEST MIGRATION
-- File:
-- supabase/migrations/002_password_reset_requests.sql
--
-- Purpose:
-- - Sales / Marketing bisa request new password
-- - Request masuk ke dashboard SuperAdmin
-- - SuperAdmin bisa approve / reject
-- - Sales membuat password baru sendiri setelah approved
-- - Password asli TIDAK disimpan di database
-- - SuperAdmin TIDAK bisa melihat password user
-- =========================================================


-- =========================================================
-- REQUIRED EXTENSION
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- ENSURE UPDATED_AT FUNCTION EXISTS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================================
-- TABLE: public.password_reset_requests
-- =========================================================

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),

  -- Email user yang meminta reset password
  email text not null,

  -- Relasi ke public.users jika user sudah terdaftar
  user_id uuid null references public.users(id) on delete set null,

  -- Role saat request dibuat, contoh: marketing / super_admin
  role_code text null,

  -- pending | approved | rejected | completed | expired | cancelled
  status text not null default 'pending',

  -- Catatan dari user ketika request
  request_note text,

  -- Catatan dari SuperAdmin ketika approve / reject
  admin_note text,

  -- SuperAdmin yang approve request
  approved_by uuid null references public.users(id) on delete set null,
  approved_at timestamptz null,

  -- SuperAdmin yang reject request
  rejected_by uuid null references public.users(id) on delete set null,
  rejected_at timestamptz null,

  -- Waktu user selesai membuat password baru
  completed_at timestamptz null,

  -- Token reset internal
  -- Catatan penting:
  -- Jangan simpan token asli.
  -- Simpan hash token saja.
  reset_token_hash text null,
  reset_token_expires_at timestamptz null,

  -- Audit ringan
  request_ip text null,
  request_user_agent text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint password_reset_requests_status_check
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'completed',
        'expired',
        'cancelled'
      )
    )
);

create index if not exists idx_password_reset_requests_email
  on public.password_reset_requests(email);

create index if not exists idx_password_reset_requests_user_id
  on public.password_reset_requests(user_id);

create index if not exists idx_password_reset_requests_status
  on public.password_reset_requests(status);

create index if not exists idx_password_reset_requests_created_at
  on public.password_reset_requests(created_at desc);

create index if not exists idx_password_reset_requests_reset_token_hash
  on public.password_reset_requests(reset_token_hash);


-- =========================================================
-- TRIGGER: updated_at
-- =========================================================

drop trigger if exists trg_password_reset_requests_set_updated_at
on public.password_reset_requests;

create trigger trg_password_reset_requests_set_updated_at
before update on public.password_reset_requests
for each row
execute function public.set_updated_at();


-- =========================================================
-- PERMISSIONS: password reset
-- =========================================================

insert into public.permissions (
  permission_code,
  permission_name,
  module_name,
  description
)
values
  (
    'password_resets.view',
    'View Password Reset Requests',
    'password_resets',
    'Melihat daftar request reset password dari Marketing/Sales.'
  ),
  (
    'password_resets.approve',
    'Approve Password Reset Requests',
    'password_resets',
    'Menyetujui request reset password Marketing/Sales.'
  ),
  (
    'password_resets.reject',
    'Reject Password Reset Requests',
    'password_resets',
    'Menolak request reset password Marketing/Sales.'
  )
on conflict (permission_code)
do update set
  permission_name = excluded.permission_name,
  module_name = excluded.module_name,
  description = excluded.description;


-- =========================================================
-- ROLE PERMISSIONS
-- SuperAdmin only.
-- Marketing tidak mendapat permission ini.
-- =========================================================

insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id as role_id,
  p.id as permission_id
from public.roles r
join public.permissions p
  on p.permission_code in (
    'password_resets.view',
    'password_resets.approve',
    'password_resets.reject'
  )
where r.role_code = 'super_admin'
on conflict (role_id, permission_id)
do nothing;


-- =========================================================
-- VIEW: public.v_password_reset_requests
-- Untuk dashboard SuperAdmin.
-- Password TIDAK ditampilkan.
-- Token asli TIDAK ditampilkan.
-- =========================================================

create or replace view public.v_password_reset_requests as
select
  prr.id,
  prr.email,
  prr.user_id,
  u.full_name,
  u.status as user_status,
  prr.role_code,
  prr.status as request_status,
  prr.request_note,
  prr.admin_note,

  prr.approved_by,
  approver.full_name as approved_by_name,
  approver.email as approved_by_email,
  prr.approved_at,

  prr.rejected_by,
  rejector.full_name as rejected_by_name,
  rejector.email as rejected_by_email,
  prr.rejected_at,

  prr.completed_at,
  prr.reset_token_expires_at,

  prr.request_ip,
  prr.request_user_agent,

  prr.created_at,
  prr.updated_at
from public.password_reset_requests prr
left join public.users u
  on u.id = prr.user_id
left join public.users approver
  on approver.id = prr.approved_by
left join public.users rejector
  on rejector.id = prr.rejected_by;


-- =========================================================
-- VIEW: public.v_pending_password_reset_requests
-- Untuk menampilkan pending request lebih mudah.
-- =========================================================

create or replace view public.v_pending_password_reset_requests as
select
  *
from public.v_password_reset_requests
where request_status = 'pending'
order by created_at desc;


-- =========================================================
-- OPTIONAL FUNCTION:
-- expire old approved/pending requests.
--
-- Catatan:
-- Ini hanya fungsi manual.
-- Nanti bisa dipanggil backend secara berkala.
-- =========================================================

create or replace function public.expire_old_password_reset_requests()
returns integer
language plpgsql
as $$
declare
  affected_count integer;
begin
  update public.password_reset_requests
  set status = 'expired',
      updated_at = now()
  where status in ('pending', 'approved')
    and (
      created_at < now() - interval '24 hours'
      or (
        reset_token_expires_at is not null
        and reset_token_expires_at < now()
      )
    );

  get diagnostics affected_count = row_count;

  return affected_count;
end;
$$;


-- =========================================================
-- RLS INITIAL SETTING
-- Untuk tahap awal backend NestJS menggunakan Supabase service role.
-- Karena itu RLS dibuat disabled dulu.
-- Nanti setelah flow stabil, RLS bisa diaktifkan bertahap.
-- =========================================================

alter table public.password_reset_requests disable row level security;


-- =========================================================
-- CHECK RESULT
-- =========================================================

do $$
declare
  password_reset_permission_count int;
  super_admin_password_reset_permission_count int;
begin
  select count(*)
  into password_reset_permission_count
  from public.permissions
  where module_name = 'password_resets';

  select count(*)
  into super_admin_password_reset_permission_count
  from public.role_permissions rp
  join public.roles r
    on r.id = rp.role_id
  join public.permissions p
    on p.id = rp.permission_id
  where r.role_code = 'super_admin'
    and p.module_name = 'password_resets';

  raise notice 'Password reset migration completed.';
  raise notice 'Password reset permissions: %', password_reset_permission_count;
  raise notice 'SuperAdmin password reset permissions: %', super_admin_password_reset_permission_count;
end $$;