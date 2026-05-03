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
