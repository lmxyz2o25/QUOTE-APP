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
