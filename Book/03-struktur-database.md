# Struktur Database (Tabel, Authentication, Storage, Skrip SQL)

Sumber skema: folder **`supabase/migrations/`**. Urutan eksekusi: **`001` → `002` → `003` → `004`**.

---

## 1. Authentication (Supabase)

| Komponen | Keterangan |
|----------|------------|
| **Supabase Auth** | Tabel sistem **`auth.users`**: email, id user auth, manajemen password oleh Supabase. |
| **Profil aplikasi** | **`public.users`**: `id`, `auth_user_id` (FK logis ke `auth.users.id`), `full_name`, `email`, `phone`, `status` (`active` / `inactive` / `suspended`), `created_by`, timestamp. |
| **Role** | **`public.user_roles`**: pasangan `user_id` + `role_id`. |
| **RLS** | Pada migrasi awal, RLS pada tabel RBAC dan `password_reset_requests` **dimatikan**; rencana ke depan mengaktifkan RLS bertahap. Operasi admin sebaiknya lewat backend dengan **service role** dan kebijakan jelas. |

**Skrip penautan admin pertama:** `003_assign_super_admin.sql` — mencari `auth.users` ber-email `admin@sales-app.local`, lalu insert/update `public.users` dan `user_roles` untuk `super_admin`. Gagal jika user belum dibuat di Authentication.

---

## 2. Storage (file)

| Item | Nilai di kode / skema |
|------|------------------------|
| **Bucket** | `customer-purchase-orders` (konstanta di `apps/web/app/customer-po/page.tsx`) |
| **Path file** | Disimpan di **`public.customer_purchase_orders.storage_path`** (contoh pola: `{po_id}/{timestamp}-{namafile}`) |
| **Metadata** | Kolom `file_name`, `mime_type`, `file_size` pada tabel yang sama |
| **Akses** | Client memakai Supabase Storage API (`upload`, `createSignedUrl`, `remove`, dll.) dengan user yang terautentikasi; kebijakan bucket harus disetel di dashboard Supabase (public vs signed URL). |

Tidak ada definisi bucket di dalam file migrasi SQL di repo ini — bucket dibuat di **Supabase Dashboard → Storage** (atau Infrastructure as Code terpisah), konsisten dengan nama di atas.

---

## 3. Tabel — RBAC & utilitas

| Tabel | Fungsi singkat |
|-------|----------------|
| `public.roles` | Daftar role (`role_code`, `role_name`, …) |
| `public.permissions` | Daftar permission (`permission_code`, `module_name`, …) |
| `public.role_permissions` | Permission per role |
| `public.user_roles` | Role yang dipunyai user |
| `public.password_reset_requests` | Alur reset password: status, catatan, hash token, audit |
| `public.v_user_permissions` | View: user + permission |
| `public.v_users_with_roles` | View: user + agregat roles (JSON) |
| `public.v_password_reset_requests` | View dashboard reset password |
| `public.v_pending_password_reset_requests` | View pending saja |
| `public.expire_old_password_reset_requests()` | Fungsi bantu kedaluwarsa request |

---

## 4. Tabel — domain penjualan (core)

| Tabel | Fungsi singkat |
|-------|----------------|
| `public.customers` | Master customer + alamat + NPWP + status |
| `public.customer_contacts` | PIC per customer (`is_primary`) |
| `public.products` | Master produk, harga default, status |
| `public.quotations` | Header quotation + snapshot customer + total |
| `public.quotation_items` | Baris item quotation + snapshot produk |
| `public.customer_purchase_orders` | PO dari customer: tautan ke quotation/customer, **storage_path**, status verifikasi |
| `public.proforma_invoices` | Proforma: nomor, tanggal, snapshot, tautan ke quotation/PO |

**View bantu (dashboard):** `v_dashboard_summary`, `v_recent_quotations`, `v_quote_status_summary`, `v_top_customers_by_quotations` (didefinisikan di `004_sales_app_core.sql`).

Migrasi `004` juga menyisipkan **data contoh** customer/produk (`ON CONFLICT DO NOTHING`) — opsional untuk UAT.

---

## 5. Skrip untuk Supabase SQL Editor

| File | Isi |
|------|-----|
| **`Book/sql/schema-lengkap-supabase.sql`** | Gabungan **`001` + `002` + `003` + `004`** dalam satu berkas untuk tempel di SQL Editor (urutan sama dengan migrasi). |
| **`supabase/migrations/*.sql`** | Sumber per versi; lebih baik untuk kontrol rilis bertahap. |

**Cara pakai aman:**

1. Di project Supabase baru, jalankan migrasi **001**, lalu **002**, lalu **004** untuk struktur inti.
2. Buat user admin di **Authentication** sesuai kebutuhan.
3. Sesuaikan **`003_assign_super_admin.sql`** (email) atau jalankan logika insert manual, lalu jalankan **003**.
4. Buat bucket Storage **`customer-purchase-orders`** dan set policy yang sesuai.
5. Verifikasi seed role/permission dengan query ke `roles`, `permissions`, `role_permissions`.

---

## 6. Diagram relasi (teks)

```
auth.users
    ↑ (auth_user_id)
public.users ──< user_roles >── roles
                    │              │
                    │              └──< role_permissions >── permissions

customers ──< customer_contacts
    │
    ├──< quotations ──< quotation_items >── products
    │         │
    │         └──< customer_purchase_orders (storage_path → Storage bucket)
    │                        │
    └──< proforma_invoices ───┘ (opsional link ke quotation / PO)
```

---

## Referensi cepat file migrasi

| Berkas | Isi utama |
|--------|-----------|
| `001_initial_rbac.sql` | RBAC + views user/permission + seed role & permission |
| `002_password_reset_requests.sql` | Tabel & view reset password + permission tambahan |
| `003_assign_super_admin.sql` | Tautkan satu akun Auth ke super_admin |
| `004_sales_app_core.sql` | Tabel bisnis + view dashboard + sample seed |

Untuk **salinan satu berkas** siap tempel, buka **`Book/sql/schema-lengkap-supabase.sql`**.
