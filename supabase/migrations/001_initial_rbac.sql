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