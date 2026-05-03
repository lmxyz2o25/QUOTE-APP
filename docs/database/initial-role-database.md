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
