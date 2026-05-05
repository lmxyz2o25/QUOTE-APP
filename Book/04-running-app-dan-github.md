# Menjalankan aplikasi & sinkronisasi ke GitHub

Panduan untuk lingkungan pengembangan lokal (Windows / PowerShell). Monorepo ini memiliki **dua aplikasi terpisah**: `apps/web` (Next.js) dan `apps/api` (NestJS); keduanya punya **`pnpm-lock.yaml`** sendiri.

---

## Prasyarat

- **Node.js** LTS (mis. 20.x atau 22.x).
- **pnpm** (`npm install -g pnpm`). Proyek ini memakai pnpm per folder `apps/web` dan `apps/api`.
- Akun **Supabase** dengan URL project dan **anon key** (untuk web). Untuk API password-reset: **service role key** hanya di server — jangan dibundel ke frontend.

---

## 1. Variabel lingkungan

### Web — `apps/web/.env.local` (disarankan)

Buat file ini **di dalam folder** `apps/web/` (tidak di-commit; sudah di-ignore).

Contoh isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Tanpa `NEXT_PUBLIC_SUPABASE_*`, halaman yang memakai Supabase akan error atau tidak bisa login.

### API — `apps/web` tidak membutuhkan service role; API — `apps/api/.env`

Buat **`apps/api/.env`** untuk modul yang memakai Supabase service role (mis. password reset):

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
APP_WEB_URL=http://localhost:3000
PORT=4000
```

`SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia — hanya di mesin/server backend.

---

## 2. Instal dependensi

Dari root repo (atau lintas folder):

```powershell
cd D:\QUOTE-APP\apps\web
pnpm install

cd D:\QUOTE-APP\apps\api
pnpm install
```

---

## 3. Menjalankan aplikasi (development)

### Hanya frontend (umum untuk quotation, dashboard, dll.)

```powershell
cd D:\QUOTE-APP\apps\web
pnpm dev
```

- Buka **http://localhost:3000**
- Port default Next.js: **3000** (lihat `package.json`).

### Frontend + API (fitur yang memanggil `NEXT_PUBLIC_API_URL`)

Terminal 1 — API:

```powershell
cd D:\QUOTE-APP\apps\api
pnpm run start:dev
```

Terminal 2 — Web:

```powershell
cd D:\QUOTE-APP\apps\web
pnpm dev
```

- Web: **http://localhost:3000**
- API: **http://localhost:4000** (default `PORT` di `apps/api/src/main.ts`), prefix `/api` sesuai pemakaian di halaman password reset.

---

## 4. Build produksi (ringkas)

### Web

```powershell
cd D:\QUOTE-APP\apps\web
pnpm run build
pnpm run start
```

### API

```powershell
cd D:\QUOTE-APP\apps\api
pnpm run build
pnpm run start
```

Set variabel lingkungan yang sama seperti di development pada host deployment.

---

## 5. Sinkronisasi ke GitHub

### Persiapan sekali (belum ada remote GitHub)

1. Buat repository kosong di GitHub (tanpa README jika repo lokal sudah punya commit).
2. Di folder proyek:

```powershell
cd D:\QUOTE-APP
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME` dan `REPO` sesuai akun Anda. Untuk SSH: `git@github.com:USERNAME/REPO.git`.

### Alur kerja harian (commit & push)

```powershell
cd D:\QUOTE-APP
git status
git add -A
git commit -m "Deskripsi perubahan yang jelas"
git pull --rebase origin main
git push origin main
```

Gunakan branch fitur jika tim memakai Git Flow:

```powershell
git checkout -b feature/nama-fitur
# ... edit ...
git add -A
git commit -m "..."
git push -u origin feature/nama-fitur
```

Lalu buat **Pull Request** di GitHub ke `main`.

### Yang tidak boleh di-push

Jangan commit **`.env`**, **`.env.local`**, kunci **service role**, atau folder **`node_modules`** / **`.next`** — sudah diatur di `.gitignore`.

---

## 6. Ringkasan port & peran

| Layanan | Port default | Peran |
|---------|----------------|--------|
| Next.js (`apps/web`) | 3000 | UI aplikasi |
| NestJS (`apps/api`) | 4000 | API (password reset, modul lain ke depan) |

---

## 7. Setup dari `.env.example`

Template sudah disediakan (aman untuk di-commit):

| File | Salin menjadi |
|------|----------------|
| `apps/web/.env.example` | `apps/web/.env.local` |
| `apps/api/.env.example` | `apps/api/.env` |

Isi URL dan kunci dari **Supabase Dashboard → Project Settings → API**. Restart dev server setelah mengubah env.

---

## 8. Skrip dari folder root repo

Di root ada `package.json` dengan pintasan (butuh **pnpm** terpasang):

| Perintah | Arti |
|----------|------|
| `pnpm run install:all` | `pnpm install` di `apps/web` lalu `apps/api` |
| `pnpm run dev:web` | Jalankan Next.js (port 3000) |
| `pnpm run dev:api` | Jalankan NestJS watch (port 4000) |
| `pnpm run build:web` / `pnpm run build:api` | Build produksi per app |

---

## 9. Troubleshooting (dev)

- **“Supabase ENV belum lengkap” / login gagal** — pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `apps/web/.env.local` benar; tidak ada spasi atau tanda kutip salah.
- **API tidak jalan / error env saat start** — pastikan `apps/api/.env` ada berisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (bukan anon key).
- **Next error atau halaman aneh setelah upgrade** — hapus cache build lalu jalankan lagi:
  ```powershell
  Remove-Item -Recurse -Force D:\QUOTE-APP\apps\web\.next -ErrorAction SilentlyContinue
  cd D:\QUOTE-APP\apps\web
  pnpm dev
  ```
- **Upload / buka file Customer PO gagal** — di Supabase buat bucket **`customer-purchase-orders`** dan atur policy Storage (lihat [03-struktur-database.md](03-struktur-database.md)).
- **Port sudah dipakai** — ubah port Next (`next dev -p 3001`) atau set `PORT` lain untuk API di `.env`.

---

## 10. Deploy produksi (gambaran)

- **Frontend:** hosting Node/static untuk Next.js (mis. **Vercel**, VPS dengan Node). Set env production sama seperti `.env.local` tetapi dengan URL Supabase production dan **`NEXT_PUBLIC_API_URL`** mengarah ke URL API publik Anda (HTTPS).
- **Backend:** jalankan NestJS di VPS/container; set `SUPABASE_*`, `APP_WEB_URL` ke domain UI production, `PORT` atau reverse proxy (nginx).
- **Supabase:** satu project untuk prod; jalankan migrasi SQL; bucket Storage + policy; jangan expose **service role** ke browser.

Panduan lebih panjang ada di folder **`docs/deployment/`**, misalnya:

- [initial-role-deployment.md](../docs/deployment/initial-role-deployment.md)
- [password-reset-deployment.md](../docs/deployment/password-reset-deployment.md)

---

## Referensi terkait di repo

- Skema database & migrasi: [03-struktur-database.md](03-struktur-database.md), folder `supabase/migrations/`
- Indeks dokumen Book: [README.md](README.md)
