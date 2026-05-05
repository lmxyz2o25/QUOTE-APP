-- =============================================================================
-- QUOTE-APP — Skrip gabungan untuk Supabase SQL Editor
-- Sumber: supabase/migrations/001 … 004 (jalankan berurutan sama seperti migrasi)
-- Catatan: Bagian 003_assign_super_admin menautkan email tertentu ke auth.users;
--          sesuaikan email atau jalankan hanya setelah user Auth dibuat.
-- =============================================================================

-- =========================================================
-- QUOTE-APP INITIAL RBAC MIGRATION
-- File:
-- supabase/migrations/001_initial_rbac.sql
--
-- Roles:
-- - super_admin
-- - marketing
--
-- Tables:
-- - public.users
-- - public.roles
-- - public.permissions
-- - public.user_roles
-- - public.role_permissions
--
-- Notes:
-- - Supabase Auth user is linked through public.users.auth_user_id
-- - Backend must use service role key for admin operations
-- - Frontend must never store service role key
-- =========================================================


-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
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
-- TABLE: public.users
-- =========================================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),

  -- Link to Supabase Auth user id
  auth_user_id uuid unique,

  full_name text not null,
  email text not null unique,
  phone text,

  -- active | inactive | suspended
  status text not null default 'active',

  -- Admin who created this user
  created_by uuid null references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint users_status_check
    check (status in ('active', 'inactive', 'suspended'))
);

create index if not exists idx_users_auth_user_id
  on public.users(auth_user_id);

create index if not exists idx_users_email
  on public.users(email);

create index if not exists idx_users_status
  on public.users(status);

drop trigger if exists trg_users_set_updated_at on public.users;

create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();


-- =========================================================
-- TABLE: public.roles
-- =========================================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),

  role_code text not null unique,
  role_name text not null,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_roles_role_code
  on public.roles(role_code);

drop trigger if exists trg_roles_set_updated_at on public.roles;

create trigger trg_roles_set_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();


-- =========================================================
-- TABLE: public.permissions
-- =========================================================

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),

  permission_code text not null unique,
  permission_name text not null,
  module_name text not null,
  description text,

  created_at timestamptz not null default now()
);

create index if not exists idx_permissions_permission_code
  on public.permissions(permission_code);

create index if not exists idx_permissions_module_name
  on public.permissions(module_name);


-- =========================================================
-- TABLE: public.user_roles
-- =========================================================

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint user_roles_user_role_unique unique(user_id, role_id)
);

create index if not exists idx_user_roles_user_id
  on public.user_roles(user_id);

create index if not exists idx_user_roles_role_id
  on public.user_roles(role_id);


-- =========================================================
-- TABLE: public.role_permissions
-- =========================================================

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),

  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint role_permissions_role_permission_unique unique(role_id, permission_id)
);

create index if not exists idx_role_permissions_role_id
  on public.role_permissions(role_id);

create index if not exists idx_role_permissions_permission_id
  on public.role_permissions(permission_id);


-- =========================================================
-- SEED: ROLES
-- =========================================================

insert into public.roles (
  role_code,
  role_name,
  description
)
values
  (
    'super_admin',
    'Super Admin',
    'Pengelola utama aplikasi. Bertugas membuat dan mengatur akses Marketing/Sales.'
  ),
  (
    'marketing',
    'Marketing / Sales',
    'User operasional untuk input customer, produk, quotation, customer PO, dan proforma invoice.'
  )
on conflict (role_code)
do update set
  role_name = excluded.role_name,
  description = excluded.description,
  updated_at = now();


-- =========================================================
-- SEED: PERMISSIONS
-- =========================================================

insert into public.permissions (
  permission_code,
  permission_name,
  module_name,
  description
)
values

  -- USERS / MARKETING ACCESS
  (
    'users.view',
    'View Users',
    'users',
    'Melihat daftar user Marketing/Sales.'
  ),
  (
    'users.create',
    'Create Users',
    'users',
    'Membuat user Marketing/Sales baru.'
  ),
  (
    'users.update',
    'Update Users',
    'users',
    'Mengubah data user Marketing/Sales.'
  ),
  (
    'users.disable',
    'Disable Users',
    'users',
    'Menonaktifkan user Marketing/Sales.'
  ),

  -- CUSTOMERS
  (
    'customers.view',
    'View Customers',
    'customers',
    'Melihat daftar customer.'
  ),
  (
    'customers.create',
    'Create Customers',
    'customers',
    'Membuat customer baru.'
  ),
  (
    'customers.update',
    'Update Customers',
    'customers',
    'Mengubah data customer.'
  ),

  -- CUSTOMER CONTACTS / PIC
  (
    'customer_contacts.view',
    'View Customer Contacts',
    'customer_contacts',
    'Melihat PIC / contact person customer.'
  ),
  (
    'customer_contacts.create',
    'Create Customer Contacts',
    'customer_contacts',
    'Membuat PIC / contact person customer.'
  ),
  (
    'customer_contacts.update',
    'Update Customer Contacts',
    'customer_contacts',
    'Mengubah PIC / contact person customer.'
  ),

  -- PRODUCTS
  (
    'products.view',
    'View Products',
    'products',
    'Melihat daftar produk.'
  ),
  (
    'products.create',
    'Create Products',
    'products',
    'Membuat produk baru.'
  ),
  (
    'products.update',
    'Update Products',
    'products',
    'Mengubah data produk.'
  ),

  -- QUOTATIONS
  (
    'quotations.view',
    'View Quotations',
    'quotations',
    'Melihat daftar quotation.'
  ),
  (
    'quotations.create',
    'Create Quotations',
    'quotations',
    'Membuat quotation baru.'
  ),
  (
    'quotations.update',
    'Update Quotations',
    'quotations',
    'Mengubah quotation.'
  ),
  (
    'quotations.print',
    'Print Quotations',
    'quotations',
    'Membuka dan mencetak print layout quotation.'
  ),

  -- CUSTOMER PO
  (
    'customer_po.view',
    'View Customer PO',
    'customer_po',
    'Melihat daftar customer purchase order.'
  ),
  (
    'customer_po.upload',
    'Upload Customer PO',
    'customer_po',
    'Upload file customer purchase order.'
  ),
  (
    'customer_po.update',
    'Update Customer PO',
    'customer_po',
    'Mengubah data customer purchase order.'
  ),
  (
    'customer_po.view_file',
    'View Customer PO File',
    'customer_po',
    'Melihat file customer purchase order yang sudah diupload.'
  ),

  -- PROFORMA INVOICES
  (
    'proforma_invoices.view',
    'View Proforma Invoices',
    'proforma_invoices',
    'Melihat daftar proforma invoice.'
  ),
  (
    'proforma_invoices.create',
    'Create Proforma Invoices',
    'proforma_invoices',
    'Membuat proforma invoice berdasarkan PO masuk.'
  ),
  (
    'proforma_invoices.update',
    'Update Proforma Invoices',
    'proforma_invoices',
    'Mengubah proforma invoice.'
  ),
  (
    'proforma_invoices.print',
    'Print Proforma Invoices',
    'proforma_invoices',
    'Membuka dan mencetak print layout proforma invoice.'
  )

on conflict (permission_code)
do update set
  permission_name = excluded.permission_name,
  module_name = excluded.module_name,
  description = excluded.description;


-- =========================================================
-- SEED: ROLE PERMISSIONS
-- =========================================================

-- Super Admin gets all permissions
insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id as role_id,
  p.id as permission_id
from public.roles r
cross join public.permissions p
where r.role_code = 'super_admin'
on conflict (role_id, permission_id)
do nothing;


-- Marketing gets operational permissions only
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
    'customers.view',
    'customers.create',
    'customers.update',

    'customer_contacts.view',
    'customer_contacts.create',
    'customer_contacts.update',

    'products.view',
    'products.create',
    'products.update',

    'quotations.view',
    'quotations.create',
    'quotations.update',
    'quotations.print',

    'customer_po.view',
    'customer_po.upload',
    'customer_po.update',
    'customer_po.view_file',

    'proforma_invoices.view',
    'proforma_invoices.create',
    'proforma_invoices.update',
    'proforma_invoices.print'
  )
where r.role_code = 'marketing'
on conflict (role_id, permission_id)
do nothing;


-- =========================================================
-- OPTIONAL VIEW: public.v_user_permissions
-- =========================================================

create or replace view public.v_user_permissions as
select
  u.id as user_id,
  u.auth_user_id,
  u.full_name,
  u.email,
  u.status,
  r.role_code,
  r.role_name,
  p.permission_code,
  p.permission_name,
  p.module_name
from public.users u
join public.user_roles ur
  on ur.user_id = u.id
join public.roles r
  on r.id = ur.role_id
join public.role_permissions rp
  on rp.role_id = r.id
join public.permissions p
  on p.id = rp.permission_id;


-- =========================================================
-- OPTIONAL VIEW: public.v_users_with_roles
-- =========================================================

create or replace view public.v_users_with_roles as
select
  u.id,
  u.auth_user_id,
  u.full_name,
  u.email,
  u.phone,
  u.status,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'role_code', r.role_code,
        'role_name', r.role_name
      )
    ) filter (where r.id is not null),
    '[]'::jsonb
  ) as roles,
  u.created_by,
  u.created_at,
  u.updated_at
from public.users u
left join public.user_roles ur
  on ur.user_id = u.id
left join public.roles r
  on r.id = ur.role_id
group by
  u.id,
  u.auth_user_id,
  u.full_name,
  u.email,
  u.phone,
  u.status,
  u.created_by,
  u.created_at,
  u.updated_at;


-- =========================================================
-- RLS INITIAL SETTING
-- =========================================================
-- Untuk tahap awal, karena backend NestJS akan menggunakan Supabase
-- service role, RLS bisa dibiarkan disabled dulu untuk table RBAC.
--
-- Nanti setelah flow stabil, RLS bisa diaktifkan bertahap.
-- =========================================================

alter table public.users disable row level security;
alter table public.roles disable row level security;
alter table public.permissions disable row level security;
alter table public.user_roles disable row level security;
alter table public.role_permissions disable row level security;


-- =========================================================
-- CHECK RESULT
-- =========================================================

do $$
declare
  role_count int;
  permission_count int;
  super_admin_permission_count int;
  marketing_permission_count int;
begin
  select count(*) into role_count
  from public.roles;

  select count(*) into permission_count
  from public.permissions;

  select count(*) into super_admin_permission_count
  from public.role_permissions rp
  join public.roles r on r.id = rp.role_id
  where r.role_code = 'super_admin';

  select count(*) into marketing_permission_count
  from public.role_permissions rp
  join public.roles r on r.id = rp.role_id
  where r.role_code = 'marketing';

  raise notice 'RBAC migration completed.';
  raise notice 'Roles: %', role_count;
  raise notice 'Permissions: %', permission_count;
  raise notice 'Super Admin Permissions: %', super_admin_permission_count;
  raise notice 'Marketing Permissions: %', marketing_permission_count;
end $$;


-- ========== 002_password_reset_requests.sql ==========


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


-- ========== 003_assign_super_admin.sql ==========


-- =========================================================
-- QUOTE-APP ASSIGN FIRST SUPER ADMIN
-- File:
-- supabase/migrations/003_assign_super_admin.sql
--
-- Purpose:
-- - Link Supabase Auth user admin@sales-app.local
--   to public.users
-- - Assign role super_admin
--
-- Important:
-- - Auth user must already exist in Supabase Authentication
-- - Password is NOT stored here
-- =========================================================

do $$
declare
  v_auth_user_id uuid;
  v_public_user_id uuid;
  v_super_admin_role_id uuid;
begin
  -- Ambil user dari Supabase Auth
  select id
  into v_auth_user_id
  from auth.users
  where email = 'admin@sales-app.local'
  limit 1;

  if v_auth_user_id is null then
    raise exception 'Auth user admin@sales-app.local belum ada di Supabase Authentication.';
  end if;

  -- Ambil role super_admin
  select id
  into v_super_admin_role_id
  from public.roles
  where role_code = 'super_admin'
  limit 1;

  if v_super_admin_role_id is null then
    raise exception 'Role super_admin belum ada. Jalankan migration RBAC terlebih dahulu.';
  end if;

  -- Insert / update user internal
  insert into public.users (
    auth_user_id,
    full_name,
    email,
    phone,
    status,
    created_by
  )
  values (
    v_auth_user_id,
    'Super Admin',
    'admin@sales-app.local',
    null,
    'active',
    null
  )
  on conflict (email)
  do update set
    auth_user_id = excluded.auth_user_id,
    full_name = excluded.full_name,
    status = 'active',
    updated_at = now()
  returning id into v_public_user_id;

  -- Assign role super_admin
  insert into public.user_roles (
    user_id,
    role_id
  )
  values (
    v_public_user_id,
    v_super_admin_role_id
  )
  on conflict (user_id, role_id)
  do nothing;

  raise notice 'admin@sales-app.local berhasil di-assign sebagai SuperAdmin.';
  raise notice 'auth_user_id: %', v_auth_user_id;
  raise notice 'public_user_id: %', v_public_user_id;
end $$;


-- ========== 004_sales_app_core.sql ==========


-- =========================================================
-- SALES-APP CORE TABLES
-- File: supabase/migrations/004_sales_app_core.sql
-- Tables:
--   customers
--   customer_contacts
--   products
--   quotations
--   quotation_items
--   customer_purchase_orders
--   proforma_invoices
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- UPDATED AT TRIGGER FUNCTION
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
-- 1. CUSTOMERS
-- =========================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),

  customer_name text not null,
  customer_legal_name text,
  customer_code text unique,

  billing_address text,
  shipping_address text,
  city text,
  phone text,
  email text,
  npwp text,

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  created_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_customers_updated_at on public.customers;

create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create index if not exists idx_customers_customer_name
on public.customers(customer_name);

create index if not exists idx_customers_status
on public.customers(status);

-- =========================================================
-- 2. CUSTOMER CONTACTS / PIC
-- =========================================================

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null references public.customers(id) on delete cascade,

  contact_name text not null,
  job_title text,
  phone text,
  email text,

  is_primary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_customer_contacts_updated_at on public.customer_contacts;

create trigger trg_customer_contacts_updated_at
before update on public.customer_contacts
for each row
execute function public.set_updated_at();

create index if not exists idx_customer_contacts_customer_id
on public.customer_contacts(customer_id);

create index if not exists idx_customer_contacts_is_primary
on public.customer_contacts(customer_id, is_primary);

-- =========================================================
-- 3. PRODUCTS
-- =========================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  product_code text unique,
  product_name text not null,
  brand text,
  category text,
  description text,

  unit text not null default 'Unit',
  default_price numeric(18,2) not null default 0,

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  created_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;

create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create index if not exists idx_products_product_name
on public.products(product_name);

create index if not exists idx_products_status
on public.products(status);

-- =========================================================
-- 4. QUOTATIONS
-- =========================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),

  quotation_number text not null unique,
  quote_date date not null default current_date,

  customer_id uuid references public.customers(id) on delete set null,

  customer_name_snapshot text,
  attention_snapshot text,
  billing_address_snapshot text,
  shipping_address_snapshot text,

  status text not null default 'draft'
    check (status in ('draft', 'saved', 'sent', 'approved', 'rejected', 'cancelled')),

  subtotal numeric(18,2) not null default 0,
  discount_value numeric(18,2) not null default 0,
  tax_percent numeric(5,2) not null default 11,
  tax_value numeric(18,2) not null default 0,
  grand_total numeric(18,2) not null default 0,

  notes text,
  terms_conditions text,
  terms_payment text,

  created_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_quotations_updated_at on public.quotations;

create trigger trg_quotations_updated_at
before update on public.quotations
for each row
execute function public.set_updated_at();

create index if not exists idx_quotations_quote_date
on public.quotations(quote_date);

create index if not exists idx_quotations_customer_id
on public.quotations(customer_id);

create index if not exists idx_quotations_status
on public.quotations(status);

create index if not exists idx_quotations_created_at
on public.quotations(created_at);

-- =========================================================
-- 5. QUOTATION ITEMS
-- =========================================================

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),

  quotation_id uuid not null references public.quotations(id) on delete cascade,

  line_no integer not null default 1,

  product_id uuid references public.products(id) on delete set null,

  product_name_snapshot text not null,
  product_description_snapshot text,

  qty numeric(18,2) not null default 1,
  unit text not null default 'Unit',
  unit_price numeric(18,2) not null default 0,
  discount_value numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quotation_items_line_unique unique (quotation_id, line_no)
);

drop trigger if exists trg_quotation_items_updated_at on public.quotation_items;

create trigger trg_quotation_items_updated_at
before update on public.quotation_items
for each row
execute function public.set_updated_at();

create index if not exists idx_quotation_items_quotation_id
on public.quotation_items(quotation_id);

create index if not exists idx_quotation_items_product_id
on public.quotation_items(product_id);

-- =========================================================
-- 6. CUSTOMER PURCHASE ORDERS
-- =========================================================

create table if not exists public.customer_purchase_orders (
  id uuid primary key default gen_random_uuid(),

  quotation_id uuid references public.quotations(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,

  po_number text,
  po_date date,

  status text not null default 'pending'
    check (status in ('pending', 'uploaded', 'verified', 'rejected', 'cancelled')),

  file_name text,
  storage_path text,
  mime_type text,
  file_size bigint,

  verification_notes text,

  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz,

  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_customer_purchase_orders_updated_at on public.customer_purchase_orders;

create trigger trg_customer_purchase_orders_updated_at
before update on public.customer_purchase_orders
for each row
execute function public.set_updated_at();

create index if not exists idx_customer_purchase_orders_quotation_id
on public.customer_purchase_orders(quotation_id);

create index if not exists idx_customer_purchase_orders_customer_id
on public.customer_purchase_orders(customer_id);

create index if not exists idx_customer_purchase_orders_status
on public.customer_purchase_orders(status);

create index if not exists idx_customer_purchase_orders_po_number
on public.customer_purchase_orders(po_number);

-- =========================================================
-- 7. PROFORMA INVOICES
-- =========================================================

create table if not exists public.proforma_invoices (
  id uuid primary key default gen_random_uuid(),

  proforma_number text not null unique,
  issue_date date not null default current_date,
  due_date date,

  customer_id uuid references public.customers(id) on delete set null,
  quotation_id uuid references public.quotations(id) on delete set null,
  customer_po_id uuid references public.customer_purchase_orders(id) on delete set null,

  customer_name_snapshot text,
  billing_address_snapshot text,
  quotation_number_snapshot text,
  po_number_snapshot text,

  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'partial_paid', 'cancelled')),

  subtotal numeric(18,2) not null default 0,
  discount_value numeric(18,2) not null default 0,
  tax_percent numeric(5,2) not null default 11,
  tax_value numeric(18,2) not null default 0,
  grand_total numeric(18,2) not null default 0,

  notes text,
  terms_payment text,

  created_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_proforma_invoices_updated_at on public.proforma_invoices;

create trigger trg_proforma_invoices_updated_at
before update on public.proforma_invoices
for each row
execute function public.set_updated_at();

create index if not exists idx_proforma_invoices_customer_id
on public.proforma_invoices(customer_id);

create index if not exists idx_proforma_invoices_quotation_id
on public.proforma_invoices(quotation_id);

create index if not exists idx_proforma_invoices_customer_po_id
on public.proforma_invoices(customer_po_id);

create index if not exists idx_proforma_invoices_status
on public.proforma_invoices(status);

create index if not exists idx_proforma_invoices_issue_date
on public.proforma_invoices(issue_date);

-- =========================================================
-- DASHBOARD HELPER VIEWS
-- =========================================================

create or replace view public.v_dashboard_summary as
select
  (select count(*) from public.customers) as total_customers,
  (select count(*) from public.products) as total_products,
  (select count(*) from public.quotations) as total_quotations,
  (select count(*) from public.customer_purchase_orders) as total_customer_purchase_orders,
  (select count(*) from public.proforma_invoices) as total_proforma_invoices,
  (select coalesce(sum(grand_total), 0) from public.quotations) as total_quotation_value,
  (select coalesce(sum(grand_total), 0) from public.proforma_invoices) as total_proforma_value;

create or replace view public.v_recent_quotations as
select
  q.id,
  q.quotation_number,
  q.quote_date,
  q.customer_id,
  coalesce(q.customer_name_snapshot, c.customer_name) as customer_name,
  q.attention_snapshot,
  q.status,
  q.grand_total,
  q.created_at
from public.quotations q
left join public.customers c on c.id = q.customer_id
order by q.created_at desc;

create or replace view public.v_quote_status_summary as
select
  q.status,
  count(*) as total
from public.quotations q
group by q.status;

create or replace view public.v_top_customers_by_quotations as
select
  c.id as customer_id,
  c.customer_name,
  count(q.id) as total_quotations,
  coalesce(sum(q.grand_total), 0) as total_value
from public.customers c
left join public.quotations q on q.customer_id = c.id
group by c.id, c.customer_name
order by total_quotations desc, total_value desc;

-- =========================================================
-- OPTIONAL SAMPLE DATA FOR TEST DASHBOARD
-- Aman karena ON CONFLICT.
-- Bisa dihapus kalau tidak mau data contoh.
-- =========================================================

insert into public.customers (
  customer_name,
  customer_legal_name,
  customer_code,
  billing_address,
  city,
  phone,
  email,
  status
)
values
  (
    'GreenTech Ltd',
    'PT GreenTech Indonesia',
    'CUST-001',
    'Jakarta',
    'Jakarta',
    '021-000000',
    'contact@greentech.local',
    'active'
  ),
  (
    'Nusantara Data Center',
    'PT Nusantara Data Center',
    'CUST-002',
    'Jakarta',
    'Jakarta',
    '021-111111',
    'contact@ndc.local',
    'active'
  ),
  (
    'Metro Infrastruktur',
    'PT Metro Infrastruktur',
    'CUST-003',
    'Jakarta',
    'Jakarta',
    '021-222222',
    'contact@metroinfra.local',
    'active'
  )
on conflict (customer_code) do nothing;

insert into public.products (
  product_code,
  product_name,
  brand,
  category,
  description,
  unit,
  default_price,
  status
)
values
  (
    'PRD-001',
    'Dell PowerEdge R450',
    'Dell',
    'Server',
    'Rack server for enterprise workload.',
    'Unit',
    79000,
    'active'
  ),
  (
    'PRD-002',
    'Dell Latitude 7350',
    'Dell',
    'Laptop',
    'Premium business detachable laptop.',
    'Unit',
    68000,
    'active'
  ),
  (
    'PRD-003',
    'Dell Precision 7960',
    'Dell',
    'Workstation',
    'Enterprise workstation for high performance workload.',
    'Unit',
    53000,
    'active'
  ),
  (
    'PRD-004',
    'Server Memory DDR4',
    'Dell',
    'Server Part',
    'Enterprise server memory module.',
    'Pcs',
    38000,
    'active'
  ),
  (
    'PRD-005',
    'Enterprise SSD',
    'Dell',
    'Storage',
    'Enterprise grade SSD storage.',
    'Pcs',
    20000,
    'active'
  )
on conflict (product_code) do nothing;

-- =========================================================
-- FINISH
-- =========================================================

do $$
begin
  raise notice '004_sales_app_core.sql completed successfully.';
  raise notice 'Created/checked tables: customers, customer_contacts, products, quotations, quotation_items, customer_purchase_orders, proforma_invoices.';
  raise notice 'Created/updated dashboard views.';
end $$;
