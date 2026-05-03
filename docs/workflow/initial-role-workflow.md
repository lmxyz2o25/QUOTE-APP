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
