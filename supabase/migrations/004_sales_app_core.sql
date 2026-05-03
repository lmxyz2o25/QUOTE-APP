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