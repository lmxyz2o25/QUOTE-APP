# Role Aplikasi

Sistem hak akses menggunakan **RBAC**: role → banyak permission. Data role dan permission ada di PostgreSQL (`public.roles`, `public.permissions`, junction `public.role_permissions`, assignment ke user lewat `public.user_roles`).

---

## Role inti (seed migrasi)

| `role_code` | Nama | Gambaran tugas |
|-------------|------|----------------|
| `super_admin` | Super Admin | Mengelola user Marketing/Sales, melihat/menyetujui request reset password (permission terkait), akses penuh operasional sesuai permission yang di-seed. |
| `marketing` | Marketing / Sales | Operasional harian: customer, produk, quotation, upload Customer PO, proforma invoice. |

---

## Hubungan user ↔ Auth Supabase

- **`auth.users`** (schema Supabase Auth): identitas login (email, hash password dikelola Supabase).
- **`public.users`**: profil bisnis aplikasi; **`auth_user_id`** menautkan ke `auth.users.id`.
- **`public.user_roles`**: user bisa punya satu atau lebih role (desain mendukung banyak role; praktik awal sering satu role per user).

Migrasi **`003_assign_super_admin.sql`** menjadi contoh penautan pertama untuk akun admin internal (email default di skrip: `admin@sales-app.local`) — user tersebut harus **sudah ada** di Supabase Authentication sebelum skrip dijalankan.

---

## Permission (format `module.action`)

Permission di-seed di **`001_initial_rbac.sql`** dan ditambah di **`002_password_reset_requests.sql`**. Ringkasan modul:

- **users:** `users.view`, `users.create`, `users.update`, `users.disable`
- **customers:** `customers.view`, `customers.create`, `customers.update`
- **customer_contacts:** `customer_contacts.view/create/update`
- **products:** `products.view`, `products.create`, `products.update`
- **quotations:** `quotations.view`, `quotations.create`, `quotations.update`, `quotations.print`
- **customer_po:** `customer_po.view`, `customer_po.upload`, `customer_po.update`, `customer_po.view_file`
- **proforma_invoices:** `proforma_invoices.view`, `create`, `update`, `print`
- **password_resets** (hanya di-assign ke super_admin): `password_resets.view`, `password_resets.approve`, `password_resets.reject`

---

## Pemetaan seed (sesuai migrasi)

- **`super_admin`:** mendapat **semua** permission yang ada di tabel `permissions` pada saat seed (termasuk permission reset password setelah migrasi 002 dijalankan).
- **`marketing`:** subset operasional (tanpa `users.*` dan tanpa `password_resets.*`).

---

## View bantuan (query)

- **`public.v_user_permissions`:** user + role + daftar permission per baris.
- **`public.v_users_with_roles`:** user dengan agregat `roles` (JSON).

---

## UI vs database role

Menu dan perilaku di shell aplikasi dapat memakai heuristik sementara (mis. membedakan admin berdasarkan email) sementara sumber kebenaran authorization idealnya **role/permission di backend** — selaraskan dengan tabel RBAC saat API auth aktif penuh.

Lihat juga `docs/api/initial-role-api.md` untuk skenario endpoint `/api/auth/me` (jika diimplementasikan di Nest).

---

## Ringkasan

| Aspek | Nilai di proyek ini |
|--------|---------------------|
| Model | RBAC: roles + permissions + mapping |
| Role aplikasi | `super_admin`, `marketing` |
| Supabase Auth | `auth.users` + link ke `public.users.auth_user_id` |
| Super Admin pertama | Dibantu skrip `003_assign_super_admin.sql` (setelah user Auth dibuat) |
