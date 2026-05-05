# Aplikasi — Infrastruktur dan Struktur

Dokumen ini merangkum **stack**, **komponen utama**, dan **alur data** proyek QUOTE-APP berdasarkan struktur repositori saat ini.

---

## Ringkasan stack

| Lapisan | Teknologi | Lokasi kode |
|--------|-----------|-------------|
| Frontend | Next.js 15, React 19, TypeScript | `apps/web/` |
| Backend API | NestJS 11, Express | `apps/api/` |
| Database & Auth | Supabase (PostgreSQL + Auth) | Skema di `supabase/migrations/` |
| Client DB/Auth | `@supabase/supabase-js` | Web & API |

---

## Struktur folder repositori (tingkat tinggi)

```
QUOTE-APP/
├── apps/
│   ├── web/          # UI Next.js (halaman quotation, customer PO, dll.)
│   └── api/          # NestJS (modul terpasang bertahap; saat ini mis. password-reset)
├── supabase/
│   └── migrations/   # Skrip SQL versi database (sumber kebenaran skema)
├── docs/             # Dokumentasi tambahan (API, deployment, workflow)
└── Book/             # Buku referensi ringkas (folder ini)
```

---

## `apps/web` — aplikasi web

- **Framework:** Next.js dengan App Router (`apps/web/app/`).
- **Port dev default:** `3000` (lihat skrip `npm run dev` di `apps/web/package.json`).
- **Integrasi Supabase:** client dibuat dengan URL dan anon key dari environment (lihat halaman yang memakai `createClient`).
- **PWA / mobile:** UI dapat diakses dari browser atau instal sebagai PWA; konektivitas mengikuti deployment/host yang menjalankan Next.js.

---

## `apps/api` — backend NestJS

- **Peran:** endpoint REST, validasi bisnis, dan operasi yang membutuhkan **service role** Supabase (jangan diekspos ke browser).
- **Modul aktif:** sesuai `apps/api/src/app.module.ts` — modul lain dapat ditambahkan secara bertahap (auth, customers, dll. kemungkinan masih dalam pengembangan).

---

## Supabase sebagai pusat data

- **PostgreSQL:** tabel domain penjualan + RBAC ada di skema `public` (migrasi `001`–`004`).
- **Authentication:** pengguna login melalui Supabase Auth (`auth.users`). Profil aplikasi di **`public.users`** dihubungkan lewat kolom **`auth_user_id`**.
- **Storage:** file Customer PO diupload ke bucket Storage; path file dicatat di tabel `customer_purchase_orders.storage_path` (detail di dokumen struktur database).

---

## Alur request (konsep)

1. Pengguna membuka `apps/web`, login via Supabase Auth (email/password).
2. Frontend memanggil Supabase (anon key + RLS/policy sesuai setup) atau API Nest untuk operasi tertentu.
3. Data persisten berada di PostgreSQL Supabase; file besar di Storage.

---

## Variabel lingkungan (konsep)

Aplikasi mengandalkan URL Supabase dan kunci (**anon** untuk web, **service role** hanya server-side API). Pastikan kunci service role **tidak** ikut di-bundle ke client Next.js.

---

## Deploy / akses jarak jauh

- **Lokal + Tailscale / VPN:** mengarahkan browser ke host yang menjalankan Next.js (mis. port 3000).
- **Produksi:** umumnya frontend di hosting statis/Node (Vercel, VPS, dll.) dan Supabase tetap sebagai backend terkelola.

Untuk skrip SQL lengkap dan daftar tabel, lihat **`03-struktur-database.md`** dan **`sql/schema-lengkap-supabase.sql`**.
