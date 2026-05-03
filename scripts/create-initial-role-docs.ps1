# =========================================================
# CREATE INITIAL ROLE DOCUMENTATION FOR QUOTE-APP
# File: D:\QUOTE-APP\scripts\create-initial-role-docs.ps1
# Roles:
# - Admin / SuperAdmin
# - Marketing / Sales
# =========================================================

$Root = "D:\QUOTE-APP"

$Folders = @(
    "$Root\docs",
    "$Root\docs\database",
    "$Root\docs\api",
    "$Root\docs\ui",
    "$Root\docs\workflow",
    "$Root\docs\deployment"
)

foreach ($Folder in $Folders) {
    if (!(Test-Path $Folder)) {
        New-Item -ItemType Directory -Path $Folder -Force | Out-Null
        Write-Host "Created: $Folder" -ForegroundColor Green
    } else {
        Write-Host "Exists:  $Folder" -ForegroundColor Yellow
    }
}

# =========================================================
# DATABASE DOCUMENTATION
# =========================================================

$DatabaseDoc = @'
# Database Role Scenario - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan skenario awal role aplikasi QUOTE-APP.

Pada tahap awal, aplikasi hanya menggunakan 2 role utama:

1. Admin / SuperAdmin
2. Marketing / Sales

Fokus awal aplikasi:

- Admin memberikan akses aplikasi kepada banyak user Marketing/Sales.
- Marketing/Sales menginput data operasional quotation.
- Semua data yang diinput langsung tersimpan ke database Supabase/PostgreSQL.

---

## Role Awal

### 1. Admin / SuperAdmin

Admin adalah user utama yang bertugas mengatur akses aplikasi.

Tugas Admin:

- Login ke aplikasi sebagai SuperAdmin.
- Membuat user Marketing/Sales.
- Memberikan akses login kepada Marketing/Sales.
- Mengaktifkan user Marketing/Sales.
- Menonaktifkan user Marketing/Sales.
- Melihat daftar user.
- Melihat data yang dibuat oleh Marketing/Sales.
- Memiliki akses penuh pada tahap awal.

### 2. Marketing / Sales

Marketing/Sales adalah user operasional yang menggunakan aplikasi untuk membuat dokumen penawaran.

Tugas Marketing/Sales:

- Login ke aplikasi.
- Input customer baru.
- Input contact person / PIC customer.
- Input produk.
- Membuat quotation.
- Edit quotation.
- Upload PO masuk dari customer.
- Membuat Proforma Invoice berdasarkan PO yang sudah diupload.

---

## Tabel Role dan User

### public.users

Menyimpan data user internal aplikasi.

Kolom awal yang disarankan:

- id
- auth_user_id
- full_name
- email
- phone
- status
- created_by
- created_at
- updated_at

Catatan:

- auth_user_id terhubung ke Supabase Auth.
- created_by digunakan untuk mencatat Admin yang membuat user Marketing/Sales.
- status digunakan untuk active / inactive / suspended.

---

### public.roles

Menyimpan daftar role aplikasi.

Role awal:

- super_admin
- marketing

Contoh data:

| role_code | role_name | Keterangan |
|---|---|---|
| super_admin | Super Admin | Pengelola utama aplikasi |
| marketing | Marketing / Sales | User operasional quotation |

---

### public.user_roles

Relasi antara user dan role.

Rule:

- Satu user minimal memiliki satu role.
- Untuk tahap awal, satu user cukup satu role.
- Admin bisa membuat banyak user Marketing/Sales.

---

### public.permissions

Menyimpan daftar permission aplikasi.

Format permission:

- module.action

Permission awal:

Admin / SuperAdmin:

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

Marketing / Sales:

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

Marketing tidak boleh:

- users.view
- users.create
- users.update
- users.disable
- roles.view
- roles.create
- roles.update
- permissions.view
- settings.update

---

### public.role_permissions

Relasi antara role dan permission.

Rule:

- super_admin mendapatkan semua permission tahap awal.
- marketing hanya mendapatkan permission operasional quotation.

---

## Data Operasional Marketing

### Customers

Table:

- public.customers

Data customer langsung tersimpan ke database saat tombol Save Customer diklik.

Field penting:

- customer_name
- customer_legal_name
- customer_code
- billing_address
- shipping_address
- city
- phone
- email
- npwp
- status
- created_by

---

### Customer Contacts / PIC

Table:

- public.customer_contacts

Field penting:

- customer_id
- contact_name
- job_title
- phone
- email
- is_primary

---

### Products

Table yang disarankan:

- public.products

Field awal:

- id
- product_code
- product_name
- description
- brand
- category
- unit
- default_price
- status
- created_by
- created_at
- updated_at

---

### Quotations

Table:

- public.quotations
- public.quotation_items
- public.quotation_revisions

Field penting:

- quotation_number
- quote_date
- customer_id
- customer_name_snapshot
- attention_snapshot
- subtotal
- discount_value
- tax_percent
- tax_value
- grand_total
- status
- created_by

Catatan penting:

- quotation_items menggunakan line_no.
- Jangan menggunakan item_no jika schema memakai line_no.

---

### Customer PO

Table:

- public.customer_purchase_orders

File PO masuk disimpan ke Supabase Storage.

Metadata PO disimpan ke database.

Field penting:

- quotation_id
- po_number
- po_date
- customer_id
- status
- primary_attachment_id
- uploaded_by
- uploaded_at
- verification_notes

---

### Proforma Invoices

Table:

- public.proforma_invoices

Proforma Invoice dibuat berdasarkan PO masuk yang sudah diupload.

Field penting:

- proforma_number
- customer_id
- quotation_id
- customer_po_id
- customer_name_snapshot
- billing_address_snapshot
- quotation_number_snapshot
- status
- issue_date
- due_date
- subtotal
- discount_value
- tax_percent
- tax_value
- grand_total
- notes
- created_by

---

## Rule Database Awal

1. Semua data yang dibuat Marketing wajib memiliki created_by.
2. Semua upload file wajib memiliki uploaded_by.
3. Semua dokumen penting wajib menyimpan snapshot data customer.
4. Semua nomor dokumen dibuat otomatis.
5. Semua perubahan penting sebaiknya masuk ke audit_logs.
6. Backend menggunakan Supabase service role.
7. Frontend tidak boleh menyimpan service role key.
8. Validasi role dan permission tetap dilakukan di backend.
'@

Set-Content -Path "$Root\docs\database\initial-role-database.md" -Value $DatabaseDoc -Encoding UTF8


# =========================================================
# API DOCUMENTATION
# =========================================================

$ApiDoc = @'
# API Role Scenario - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan skenario awal API untuk role:

1. Admin / SuperAdmin
2. Marketing / Sales

Backend menggunakan NestJS dan Supabase Auth.

---

## Alur Login

User login di frontend.

Alur:

1. Supabase Auth memvalidasi email/password.
2. Frontend mendapat access token.
3. Frontend mengirim token ke backend.
4. Backend verifikasi token.
5. Backend mengambil data user internal dari public.users.
6. Backend mengambil role dan permission user.
7. Backend mengembalikan profile user ke frontend.

---

## Header Authorization

Semua endpoint private wajib menggunakan:

Authorization: Bearer <supabase_access_token>

---

## Endpoint Auth

### GET /api/auth/health

Untuk mengecek auth module aktif.

Response:

{
  "status": "ok",
  "module": "auth"
}

---

### GET /api/auth/me

Untuk mengambil user login, role, dan permission.

Response contoh Admin:

{
  "user": {
    "id": "uuid-user",
    "email": "admin@marketing-app.local",
    "full_name": "Super Admin",
    "status": "active"
  },
  "roles": [
    {
      "role_code": "super_admin",
      "role_name": "Super Admin"
    }
  ],
  "permissions": [
    "users.view",
    "users.create",
    "customers.view",
    "quotations.create"
  ]
}

Response contoh Marketing:

{
  "user": {
    "id": "uuid-user",
    "email": "sales1@company.com",
    "full_name": "Sales 1",
    "status": "active"
  },
  "roles": [
    {
      "role_code": "marketing",
      "role_name": "Marketing / Sales"
    }
  ],
  "permissions": [
    "customers.view",
    "customers.create",
    "products.create",
    "quotations.create",
    "customer_po.upload",
    "proforma_invoices.create"
  ]
}

---

## Admin / SuperAdmin API

Admin bertugas membuat dan mengatur user Marketing/Sales.

### GET /api/users

Melihat daftar user.

Permission:

- users.view

---

### POST /api/users/marketing

Membuat user Marketing/Sales baru.

Permission:

- users.create

Body contoh:

{
  "full_name": "Sales 1",
  "email": "sales1@company.com",
  "phone": "08123456789",
  "password": "Sales@12345",
  "status": "active"
}

Proses backend:

1. Buat user di Supabase Auth.
2. Buat data user di public.users.
3. Assign role marketing di public.user_roles.
4. Return data user.

---

### PATCH /api/users/:id

Update data user.

Permission:

- users.update

---

### PATCH /api/users/:id/disable

Menonaktifkan user Marketing/Sales.

Permission:

- users.disable

Rule:

- User inactive tidak boleh menggunakan aplikasi.

---

## Customers API

### GET /api/customers

Permission:

- customers.view

### POST /api/customers

Permission:

- customers.create

Rule:

- created_by diambil dari user login, bukan dari frontend.

### PATCH /api/customers/:id

Permission:

- customers.update

---

## Customer Contacts API

### POST /api/customer-contacts

Permission:

- customer_contacts.create

Rule:

- PIC customer langsung tersimpan ke database.

---

## Products API

### GET /api/products

Permission:

- products.view

### POST /api/products

Permission:

- products.create

Rule:

- Produk yang diinput Marketing langsung tersimpan ke database.
- Produk bisa dipilih ulang saat membuat quotation.

### PATCH /api/products/:id

Permission:

- products.update

---

## Quotations API

### GET /api/quotations

Permission:

- quotations.view

### POST /api/quotations

Permission:

- quotations.create

Rule:

1. Generate quotation number otomatis.
2. Simpan header quotation ke public.quotations.
3. Simpan item ke public.quotation_items.
4. Simpan revisi awal ke public.quotation_revisions.
5. Status setelah save: Simpan.
6. created_by diambil dari user login.

### PATCH /api/quotations/:id

Permission:

- quotations.update

Rule:

1. Update quotation header.
2. Update quotation items.
3. Simpan quotation revision.
4. updated_by jika kolom tersedia.

### GET /api/quotations/:id/print

Permission:

- quotations.print

---

## Customer PO API

### GET /api/customer-purchase-orders

Permission:

- customer_po.view

### POST /api/customer-purchase-orders/upload

Permission:

- customer_po.upload

Content type:

- multipart/form-data

Field:

- quotation_id
- po_number
- po_date
- file

Rule:

1. File PO diupload ke Supabase Storage.
2. Metadata file disimpan ke attachments.
3. Data PO disimpan ke customer_purchase_orders.
4. uploaded_by diambil dari user login.
5. Status PO berubah menjadi Sudah Ada.

### PATCH /api/customer-purchase-orders/:id

Permission:

- customer_po.update

---

## Proforma Invoice API

### GET /api/proforma-invoices

Permission:

- proforma_invoices.view

### POST /api/proforma-invoices

Permission:

- proforma_invoices.create

Rule:

1. Proforma dibuat berdasarkan quotation dan customer PO.
2. customer_po_id wajib ada jika skenario berdasarkan PO masuk.
3. Data customer dan quotation disimpan sebagai snapshot.
4. created_by diambil dari user login.
5. Grand total dihitung di backend.

### PATCH /api/proforma-invoices/:id

Permission:

- proforma_invoices.update

### GET /api/proforma-invoices/:id/print

Permission:

- proforma_invoices.print

---

## Guard API

### AuthGuard

Dipakai untuk semua endpoint private.

Tugas:

1. Baca token.
2. Verifikasi token ke Supabase.
3. Ambil user internal.
4. Tolak jika user inactive.

### PermissionGuard

Dipakai untuk endpoint yang butuh permission.

Rule:

1. Jangan percaya created_by dari frontend.
2. created_by, uploaded_by, dan verified_by harus dari token login.
3. Admin boleh mengelola user Marketing.
4. Marketing tidak boleh mengakses endpoint /api/users.
5. Semua endpoint private wajib AuthGuard.
6. Semua endpoint operasional wajib PermissionGuard.
7. Upload file wajib lewat backend.
8. Service role Supabase hanya ada di backend.
'@

Set-Content -Path "$Root\docs\api\initial-role-api.md" -Value $ApiDoc -Encoding UTF8


# =========================================================
# UI DOCUMENTATION
# =========================================================

$UiDoc = @'
# UI Role Scenario - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan tampilan UI awal berdasarkan 2 role:

1. Admin / SuperAdmin
2. Marketing / Sales

Frontend menggunakan Next.js App Router.

---

## Prinsip UI

1. Sidebar tampil sesuai role.
2. Tombol action tampil sesuai permission.
3. User yang tidak punya akses diarahkan ke halaman 403.
4. UI hanya membantu menyembunyikan menu.
5. Keamanan utama tetap di backend.

---

## UI Admin / SuperAdmin

Admin bertugas memberikan akses aplikasi kepada Marketing/Sales.

Sidebar Admin:

- Dashboard
- Users / Marketing Access
- Customers
- Products
- Quotations
- Customer PO
- Proforma Invoice
- Settings

Menu utama Admin tahap awal:

- Users / Marketing Access

Fungsi halaman Users / Marketing Access:

1. Lihat daftar Marketing/Sales.
2. Tambah user Marketing/Sales.
3. Edit data user Marketing/Sales.
4. Aktifkan user.
5. Nonaktifkan user.
6. Reset password jika dibutuhkan.

---

## UI Marketing / Sales

Marketing/Sales bertugas menginput data operasional quotation.

Sidebar Marketing:

- Dashboard
- Customers
- Products
- Quotations
- Customer PO
- Proforma Invoice

Marketing tidak melihat menu:

- Users / Marketing Access
- Roles
- Permissions
- Settings

---

## Halaman Login

Semua user login dari halaman yang sama:

- /login

Setelah login:

- Jika role super_admin, redirect ke /dashboard atau /users.
- Jika role marketing, redirect ke /dashboard atau /quotations.

---

## Route Admin

- /dashboard
- /users
- /users/new
- /users/[id]/edit

Permission:

- users.view
- users.create
- users.update
- users.disable

---

## Route Marketing

- /dashboard
- /customers
- /products
- /quotations
- /quotations/new
- /quotations/[id]/edit
- /quotations/[id]/print
- /customer-po
- /proforma-invoices
- /proforma-invoices/new
- /proforma-invoices/[id]/edit
- /proforma-invoices/[id]/print

---

## Customers UI

Fungsi:

1. Input customer baru.
2. Save Customer langsung masuk database.
3. Tambah PIC / Contact Person.
4. Save PIC langsung masuk database.
5. Customer baru langsung muncul di Customer List.
6. Customer baru langsung bisa dipilih di Quotation.

Tombol dan permission:

| Tombol | Permission |
|---|---|
| Add Customer | customers.create |
| Save Customer | customers.create |
| Edit Customer | customers.update |
| Save PIC | customer_contacts.create |

---

## Products UI

Fungsi:

1. Input produk baru.
2. Produk langsung masuk database.
3. Produk bisa dipilih saat membuat quotation.
4. Marketing bisa edit data produk jika ada perubahan.

Tombol dan permission:

| Tombol | Permission |
|---|---|
| Add Product | products.create |
| Save Product | products.create |
| Edit Product | products.update |

Field awal produk:

- Product Code
- Product Name
- Description
- Brand
- Category
- Unit
- Default Price
- Status

---

## Quotations UI

Fungsi:

1. Add New Quote membuka form quotation.
2. Pilih customer dari database.
3. Attention otomatis mengambil PIC customer.
4. Pilih atau input produk.
5. Save Quotation langsung masuk database.
6. Edit Quotation langsung update database.
7. Print Layout hanya untuk preview/print.
8. Setelah Save/Update kembali ke Quotation List.

Tombol dan permission:

| Tombol | Permission |
|---|---|
| Add New Quote | quotations.create |
| Save Quotation | quotations.create |
| Edit | quotations.update |
| Update | quotations.update |
| Print Layout | quotations.print |

Rule UI:

- Form dan Print Layout dipisah.
- List dan Form dipisah.
- Setelah Save/Update, redirect ke Quotation List.

---

## Customer PO UI

Fungsi:

1. Menampilkan list quotation yang menunggu PO.
2. Marketing klik Insert PO.
3. Upload file PO.
4. Isi PO Number.
5. Save PO langsung masuk database dan storage.
6. Status PO berubah menjadi Sudah Ada.
7. Tombol Insert PO berubah menjadi Update PO.
8. Tombol Lihat File PO muncul.

Tombol dan permission:

| Tombol | Permission |
|---|---|
| Insert PO | customer_po.upload |
| Update PO | customer_po.update |
| Lihat File PO | customer_po.view_file |

---

## Proforma Invoice UI

Fungsi:

1. Proforma Invoice dibuat berdasarkan PO masuk yang sudah diupload.
2. Pilih data quotation/customer PO.
3. Data customer otomatis masuk sebagai snapshot.
4. Data quotation otomatis masuk sebagai snapshot.
5. Save Proforma langsung masuk database.
6. Print Layout untuk cetak Proforma.

Tombol dan permission:

| Tombol | Permission |
|---|---|
| Create Proforma | proforma_invoices.create |
| Save Proforma | proforma_invoices.create |
| Edit Proforma | proforma_invoices.update |
| Print Layout | proforma_invoices.print |

---

## Rule UI Awal

1. Admin melihat menu Users / Marketing Access.
2. Marketing tidak melihat menu Users.
3. Marketing bisa input customer, product, quotation, PO, dan proforma.
4. Setiap tombol disembunyikan jika permission tidak ada.
5. Jika API return 403, tampilkan halaman Access Denied.
6. Jangan tampilkan halaman kosong jika user tidak punya akses.
7. Setelah proses Save/Update berhasil, kembali ke halaman list.
'@

Set-Content -Path "$Root\docs\ui\initial-role-ui.md" -Value $UiDoc -Encoding UTF8


# =========================================================
# WORKFLOW DOCUMENTATION
# =========================================================

$WorkflowDoc = @'
# Workflow Role Scenario - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan workflow awal aplikasi QUOTE-APP berdasarkan 2 role:

1. Admin / SuperAdmin
2. Marketing / Sales

---

## Role 1: Admin / SuperAdmin

Admin adalah pengelola akses aplikasi.

Tugas utama Admin:

1. Login ke aplikasi.
2. Membuat user Marketing/Sales.
3. Memberikan akses login kepada Marketing/Sales.
4. Mengaktifkan user Marketing/Sales.
5. Menonaktifkan user Marketing/Sales.
6. Melihat data yang dibuat Marketing/Sales.

---

## Workflow Admin

Admin Login
→ Dashboard Admin
→ Users / Marketing Access
→ Add Marketing User
→ Isi nama, email, password, status
→ Save
→ User Marketing dibuat di Supabase Auth
→ Data user tersimpan di public.users
→ Role marketing tersimpan di public.user_roles
→ Marketing bisa login

---

## Role 2: Marketing / Sales

Marketing adalah user operasional quotation.

Tugas utama Marketing:

1. Login ke aplikasi.
2. Input customer.
3. Input PIC / Contact Person.
4. Input produk.
5. Membuat quotation.
6. Edit quotation.
7. Upload PO masuk dari customer.
8. Membuat Proforma Invoice berdasarkan PO masuk.

---

## Workflow Marketing Utama

Marketing Login
→ Dashboard Marketing
→ Input Customer
→ Input PIC Customer
→ Input Product
→ Create Quotation
→ Save Quotation
→ Customer PO Masuk
→ Upload Customer PO
→ Create Proforma Invoice
→ Save Proforma Invoice
→ Print Proforma Invoice

---

## 1. Customer Workflow

Dilakukan oleh:

- Marketing / Sales
- Admin / SuperAdmin

Alur:

Marketing buka menu Customers
→ Klik Add Customer
→ Isi data customer
→ Klik Save Customer
→ Data customer tersimpan ke public.customers
→ Marketing tambah PIC / Contact Person
→ Klik Save PIC
→ Data PIC tersimpan ke public.customer_contacts
→ Customer muncul di Customer List
→ Customer bisa dipilih di Quotation

Rule:

1. Customer harus langsung tersimpan ke database.
2. PIC harus langsung tersimpan ke database.
3. Customer baru harus langsung bisa dipilih di Quotation.
4. Attention di Quotation mengambil PIC customer.

---

## 2. Product Workflow

Dilakukan oleh:

- Marketing / Sales
- Admin / SuperAdmin

Alur:

Marketing buka menu Products
→ Klik Add Product
→ Isi Product Code, Product Name, Description, Brand, Category, Unit, Price
→ Klik Save Product
→ Produk tersimpan ke public.products
→ Produk bisa dipilih di Quotation

Rule:

1. Produk yang diinput langsung masuk database.
2. Produk bisa digunakan ulang di Quotation.
3. Produk tetap bisa diedit jika ada revisi data.

---

## 3. Quotation Workflow

Dilakukan oleh:

- Marketing / Sales
- Admin / SuperAdmin

Alur:

Marketing buka menu Quotations
→ Klik Add New Quote
→ Pilih Customer
→ Attention otomatis terisi dari PIC customer
→ Pilih/input produk
→ Isi qty, unit price, discount, tax
→ Klik Save Quotation
→ Header quotation tersimpan ke public.quotations
→ Item quotation tersimpan ke public.quotation_items
→ Revision tersimpan ke public.quotation_revisions
→ Status menjadi Simpan
→ Sistem kembali ke Quotation List

Edit quotation:

Marketing klik Edit
→ Form terbuka dengan data quotation
→ Marketing ubah data
→ Klik Update
→ Data database terupdate
→ Revision baru tersimpan
→ Sistem kembali ke Quotation List

Print quotation:

Marketing klik Print Layout
→ Sistem membuka halaman print preview
→ Tidak membuka form input

Rule:

1. Add New Quote hanya form.
2. Edit hanya form.
3. Print Layout hanya preview.
4. Save/Update langsung tersimpan ke database.
5. Setelah Save/Update kembali ke list.
6. Nomor quotation otomatis.

---

## 4. Customer PO Workflow

Dilakukan oleh:

- Marketing / Sales
- Admin / SuperAdmin

Alur:

Customer mengirim PO
→ Marketing buka menu Customer PO
→ Pilih quotation terkait
→ Klik Insert PO
→ Isi PO Number dan PO Date
→ Upload file PO
→ Klik Save
→ File PO masuk Supabase Storage
→ Metadata file masuk attachments
→ Data PO masuk customer_purchase_orders
→ Status PO berubah menjadi Sudah Ada
→ Tombol berubah menjadi Update PO
→ Tombol Lihat File PO tersedia

Rule:

1. PO wajib terkait dengan quotation.
2. File PO tidak disimpan permanen di folder local.
3. File PO masuk Supabase Storage.
4. Metadata file masuk database.
5. uploaded_by diambil dari user login.
6. Jika upload sukses, form upload otomatis tertutup.

---

## 5. Proforma Invoice Workflow

Dilakukan oleh:

- Marketing / Sales
- Admin / SuperAdmin

Alur:

PO customer sudah diupload
→ Marketing buka menu Proforma Invoice
→ Klik Create Proforma
→ Pilih data PO / Quotation
→ Sistem mengambil data customer, quotation, item, subtotal, tax, grand total
→ Marketing review data
→ Klik Save Proforma
→ Data tersimpan ke public.proforma_invoices
→ Marketing klik Print Layout
→ Sistem membuka print preview Proforma Invoice

Rule:

1. Proforma Invoice dibuat berdasarkan PO masuk.
2. customer_po_id wajib tersimpan.
3. quotation_id wajib tersimpan.
4. Data customer disimpan sebagai snapshot.
5. Data quotation disimpan sebagai snapshot.
6. created_by diambil dari user login.
7. Print Layout dipisah dari form.

---

## Batasan Tahap Awal

Pada tahap awal, belum fokus ke:

- Finance role
- Invoice final
- Delivery Order
- Payment verification
- Advanced approval
- Multi-branch company

Tahap awal hanya sampai:

- Admin membuat akses Marketing
- Marketing input Customer
- Marketing input Product
- Marketing buat Quotation
- Marketing upload Customer PO
- Marketing buat Proforma Invoice

---

## Flow Ringkas

Admin
→ Buat akses Marketing/Sales

Marketing
→ Customer
→ Product
→ Quotation
→ Customer PO
→ Proforma Invoice

---

## Rule Workflow Awal

1. Semua data harus langsung tersimpan ke database.
2. Semua proses create/update mengambil user login sebagai created_by.
3. Marketing tidak bisa membuat user baru.
4. Marketing tidak bisa mengatur role.
5. Admin bisa melihat dan mengelola user Marketing.
6. Admin memiliki akses penuh tahap awal.
7. Backend tetap menjadi pengaman utama role dan permission.
'@

Set-Content -Path "$Root\docs\workflow\initial-role-workflow.md" -Value $WorkflowDoc -Encoding UTF8


# =========================================================
# DEPLOYMENT DOCUMENTATION
# =========================================================

$DeploymentDoc = @'
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
'@

Set-Content -Path "$Root\docs\deployment\initial-role-deployment.md" -Value $DeploymentDoc -Encoding UTF8


# =========================================================
# FINISH
# =========================================================

Write-Host ""
Write-Host "Initial role documentation created successfully." -ForegroundColor Cyan
Write-Host ""
Write-Host "Created files:" -ForegroundColor Green
Write-Host "1. docs\database\initial-role-database.md"
Write-Host "2. docs\api\initial-role-api.md"
Write-Host "3. docs\ui\initial-role-ui.md"
Write-Host "4. docs\workflow\initial-role-workflow.md"
Write-Host "5. docs\deployment\initial-role-deployment.md"
Write-Host ""
Write-Host "Check files with:" -ForegroundColor Yellow
Write-Host "dir D:\QUOTE-APP\docs -Recurse"