# Deployment Role Scenario - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan catatan deployment awal untuk skenario role:

1. Admin / SuperAdmin
2. Marketing / Sales

---

## Runtime

Development menggunakan:

- Node.js LTS 22
- npm
- pnpm
- Next.js App Router
- NestJS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

---

## Environment Frontend

Lokasi:

apps/web/.env.local

Contoh:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

Rule:

- Frontend hanya boleh menyimpan public key.
- Frontend tidak boleh menyimpan service role key.

---

## Environment Backend

Lokasi:

apps/api/.env

Contoh:

NODE_ENV=development
PORT=4000

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CORS_ORIGIN=http://localhost:3000

Rule:

- Service role key hanya boleh ada di backend.

---

## Supabase Setup Awal

Yang harus disiapkan:

1. Supabase Auth
2. Database tables
3. Storage bucket
4. Initial admin user
5. Role super_admin
6. Role marketing
7. Permission awal
8. Role permission mapping

---

## Storage Bucket Awal

Bucket yang dibutuhkan pada tahap awal:

- customer-purchase-orders
- proforma-invoices

Opsional:

- quotation-exports
- attachments

Rule:

1. Upload file dilakukan lewat backend.
2. Backend menyimpan file ke Supabase Storage.
3. Backend menyimpan metadata file ke database.
4. Frontend hanya menerima URL file atau signed URL.

---

## Initial Seed Data

Role awal:

- super_admin
- marketing

Permission awal Admin:

- users.view
- users.create
- users.update
- users.disable
- customers.view
- customers.create
- customers.update
- customer_contacts.view
- customer_contacts.create
- customer_contacts.update
- products.view
- products.create
- products.update
- quotations.view
- quotations.create
- quotations.update
- quotations.print
- customer_po.view
- customer_po.upload
- customer_po.update
- customer_po.view_file
- proforma_invoices.view
- proforma_invoices.create
- proforma_invoices.update
- proforma_invoices.print

Permission awal Marketing:

- customers.view
- customers.create
- customers.update
- customer_contacts.view
- customer_contacts.create
- customer_contacts.update
- products.view
- products.create
- products.update
- quotations.view
- quotations.create
- quotations.update
- quotations.print
- customer_po.view
- customer_po.upload
- customer_po.update
- customer_po.view_file
- proforma_invoices.view
- proforma_invoices.create
- proforma_invoices.update
- proforma_invoices.print

---

## Admin Pertama

Admin pertama dibuat manual melalui Supabase atau SQL seed.

Contoh login awal development:

Email    : admin@marketing-app.local
Password : Admin@12345
Role     : super_admin

Catatan:

- Password hanya contoh development.
- Untuk production wajib diganti.

---

## Local Development Commands

Cek versi:

node -v
npm -v
pnpm -v

Install dependency:

cd D:\QUOTE-APP
pnpm install

Jalankan frontend:

cd D:\QUOTE-APP\apps\web
pnpm dev

Jalankan backend:

cd D:\QUOTE-APP\apps\api
pnpm start:dev

---

## Deployment Checklist Backend

- apps/api/.env sudah dibuat
- SUPABASE_URL sudah benar
- SUPABASE_ANON_KEY sudah benar
- SUPABASE_SERVICE_ROLE_KEY sudah benar
- CORS_ORIGIN sudah benar
- AuthGuard aktif
- PermissionGuard aktif
- Endpoint /api/auth/health aktif
- Endpoint /api/auth/me aktif
- Endpoint users hanya bisa diakses Admin
- Endpoint customers bisa diakses Marketing
- Endpoint products bisa diakses Marketing
- Endpoint quotations bisa diakses Marketing
- Endpoint customer PO bisa upload file
- Endpoint proforma bisa membuat invoice berdasarkan PO

---

## Deployment Checklist Frontend

- apps/web/.env.local sudah dibuat
- Login berhasil
- Token Supabase berhasil didapat
- /api/auth/me berhasil
- Sidebar Admin tampil sesuai role
- Sidebar Marketing tampil sesuai role
- Marketing tidak melihat menu Users
- Admin bisa buka menu Users
- Customer bisa disimpan
- Product bisa disimpan
- Quotation bisa disimpan
- PO bisa diupload
- Proforma bisa dibuat

---

## Deployment Checklist Database

- public.users tersedia
- public.roles tersedia
- public.permissions tersedia
- public.user_roles tersedia
- public.role_permissions tersedia
- public.customers tersedia
- public.customer_contacts tersedia
- public.products tersedia
- public.quotations tersedia
- public.quotation_items tersedia
- public.quotation_revisions tersedia
- public.customer_purchase_orders tersedia
- public.proforma_invoices tersedia
- public.attachments tersedia
- Role super_admin sudah ada
- Role marketing sudah ada
- Admin pertama sudah ada

---

## Security Rule

1. Jangan commit .env.
2. Jangan taruh service role key di frontend.
3. Jangan validasi role hanya di sidebar.
4. Semua endpoint private wajib AuthGuard.
5. Semua endpoint operasional wajib PermissionGuard.
6. Marketing tidak boleh akses endpoint users.
7. created_by wajib diambil dari token login.
8. uploaded_by wajib diambil dari token login.
9. File upload wajib lewat backend.
10. Admin pertama wajib ganti password sebelum production.
