# CREATE PASSWORD RESET DOCUMENTATION FOR QUOTE-APP

$Root = "D:\QUOTE-APP"

$Folders = @(
    "$Root\docs",
    "$Root\docs\api",
    "$Root\docs\database",
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
# API DOC
# =========================================================

$ApiDoc = @"
# Password Reset API - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan desain API untuk fitur Password Reset pada QUOTE-APP.

Rule utama:

1. Sales/Marketing dapat membuat request reset password.
2. Request masuk ke dashboard SuperAdmin.
3. SuperAdmin dapat approve atau reject request.
4. Jika approved, Sales/Marketing membuat password baru sendiri.
5. Password baru langsung disimpan ke Supabase Auth.
6. Password tidak disimpan di database.
7. SuperAdmin tidak dapat melihat password Sales/Marketing.

## Endpoint

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | /api/auth/request-password-reset | Public | Sales/Marketing membuat request reset password |
| GET | /api/password-reset-requests | SuperAdmin | Melihat daftar request reset password |
| POST | /api/password-reset-requests/:id/approve | SuperAdmin | Approve request reset password |
| POST | /api/password-reset-requests/:id/reject | SuperAdmin | Reject request reset password |
| POST | /api/auth/complete-password-reset | Public dengan token | Sales/Marketing membuat password baru |

## POST /api/auth/request-password-reset

Digunakan oleh Sales/Marketing ketika lupa password.

Body:

{
  "email": "sales1@sales-app.local",
  "request_note": "Saya lupa password login"
}

Proses backend:

1. Validasi email.
2. Cari user di public.users.
3. Pastikan user aktif.
4. Pastikan role user adalah marketing.
5. Cek request pending atau approved yang belum selesai.
6. Buat data di public.password_reset_requests.
7. Status awal pending.

## GET /api/password-reset-requests

Digunakan oleh SuperAdmin.

Permission:

password_resets.view

Data source:

public.v_password_reset_requests

Response tidak boleh menampilkan password, new_password, atau reset_token_hash.

## POST /api/password-reset-requests/:id/approve

Digunakan oleh SuperAdmin untuk approve request.

Permission:

password_resets.approve

Proses backend:

1. Validasi request id.
2. Cek status masih pending.
3. Generate reset token.
4. Simpan hash token ke reset_token_hash.
5. Set expired token.
6. Set status approved.
7. Isi approved_by dan approved_at.
8. Return reset URL.

## POST /api/password-reset-requests/:id/reject

Digunakan oleh SuperAdmin untuk reject request.

Permission:

password_resets.reject

Proses backend:

1. Validasi request id.
2. Cek status masih pending.
3. Set status rejected.
4. Isi rejected_by dan rejected_at.
5. Simpan admin_note.

## POST /api/auth/complete-password-reset

Digunakan Sales/Marketing untuk membuat password baru.

Body:

{
  "request_id": "uuid-request",
  "reset_token": "plain-token",
  "new_password": "PasswordBaru@12345",
  "confirm_password": "PasswordBaru@12345"
}

Proses backend:

1. Validasi request_id.
2. Validasi reset_token.
3. Cocokkan hash token.
4. Cek status approved.
5. Cek token belum expired.
6. Validasi password.
7. Update password ke Supabase Auth.
8. Set status completed.
9. Isi completed_at.

## Module NestJS

Lokasi module:

apps/api/src/modules/password-reset-requests

File yang disarankan:

- password-reset-requests.module.ts
- password-reset-requests.controller.ts
- password-reset-requests.service.ts
- dto/request-password-reset.dto.ts
- dto/approve-password-reset.dto.ts
- dto/reject-password-reset.dto.ts
- dto/complete-password-reset.dto.ts

## Rule API

1. Password tidak boleh disimpan di database.
2. Token asli tidak boleh disimpan di database.
3. Simpan hash token saja.
4. SuperAdmin hanya melihat metadata request.
5. Password diupdate ke Supabase Auth.
6. Service role key hanya boleh ada di backend.
"@

Set-Content -Path "$Root\docs\api\password-reset-api.md" -Value $ApiDoc -Encoding UTF8


# =========================================================
# DATABASE DOC
# =========================================================

$DatabaseDoc = @"
# Password Reset Database - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan struktur database untuk fitur Password Reset Request.

## Prinsip Keamanan

Password tidak boleh disimpan di database.

Database hanya menyimpan:

- email user
- user_id
- role_code
- status request
- request_note
- admin_note
- approved_by
- approved_at
- rejected_by
- rejected_at
- completed_at
- reset_token_hash
- reset_token_expires_at
- request_ip
- request_user_agent

SuperAdmin tidak boleh melihat password user.

## Table public.password_reset_requests

Table ini menyimpan request reset password dari Sales/Marketing.

Kolom penting:

| Kolom | Fungsi |
|---|---|
| id | Primary key |
| email | Email user |
| user_id | Relasi ke public.users |
| role_code | Role user |
| status | Status request |
| request_note | Catatan user |
| admin_note | Catatan SuperAdmin |
| approved_by | SuperAdmin yang approve |
| approved_at | Waktu approve |
| rejected_by | SuperAdmin yang reject |
| rejected_at | Waktu reject |
| completed_at | Waktu selesai |
| reset_token_hash | Hash token reset |
| reset_token_expires_at | Waktu expired token |

## Status Request

Status yang digunakan:

- pending
- approved
- rejected
- completed
- expired
- cancelled

## View public.v_password_reset_requests

View untuk dashboard SuperAdmin.

View ini tidak menampilkan password dan tidak menampilkan reset_token_hash.

## View public.v_pending_password_reset_requests

View khusus request yang masih pending.

## Permission

Permission baru:

- password_resets.view
- password_resets.approve
- password_resets.reject

Permission hanya diberikan ke:

- super_admin

Marketing/Sales tidak mendapat permission ini.

## Rule Database

1. Jangan buat kolom password.
2. Jangan simpan password baru.
3. Jangan simpan token asli.
4. Simpan hash token saja.
5. Simpan status request.
6. Simpan audit approval dan completion.
7. Password hanya dikelola Supabase Auth.
"@

Set-Content -Path "$Root\docs\database\password-reset-database.md" -Value $DatabaseDoc -Encoding UTF8


# =========================================================
# UI DOC
# =========================================================

$UiDoc = @"
# Password Reset UI - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan desain UI untuk fitur Password Reset.

## Halaman Login

Route:

/login

Tambahkan tombol:

Request New Password

Jika diklik, arahkan ke:

/request-password

## Halaman Request New Password

Route:

/request-password

Form:

- Email
- Catatan atau alasan
- Submit Request

Setelah berhasil, tampilkan pesan:

Request reset password sudah dikirim ke SuperAdmin. Silakan tunggu approval.

## Dashboard SuperAdmin Password Reset

Route:

/password-reset-requests

Menu sidebar:

Password Reset Requests

Menu hanya tampil untuk:

- super_admin
- permission password_resets.view

## Tabel Password Reset Requests

Kolom tabel:

| Kolom | Keterangan |
|---|---|
| Request Date | Tanggal request |
| Name | Nama user |
| Email | Email user |
| Role | Role user |
| Status | Pending, Approved, Rejected, Completed |
| Request Note | Catatan user |
| Approved By | Nama SuperAdmin |
| Approved At | Waktu approve |
| Completed At | Waktu selesai |
| Action | Approve atau Reject |

## Action Approve

SuperAdmin klik Approve.

Sistem akan:

1. Update status menjadi approved.
2. Generate reset URL.
3. Sales/Marketing dapat membuat password baru.

## Action Reject

SuperAdmin klik Reject.

Sistem akan:

1. Update status menjadi rejected.
2. Simpan admin_note.

## Halaman Create New Password

Route:

/create-new-password

Query parameter:

- request_id
- token

Form:

- New Password
- Confirm New Password
- Save New Password

Setelah berhasil:

Password berhasil diganti. Silakan login kembali.

## Yang Tidak Boleh Ditampilkan

UI tidak boleh menampilkan:

- password lama
- password baru
- hash password
- reset_token_hash
- service role key

## Rule UI

1. Sales/Marketing hanya bisa request password reset.
2. SuperAdmin bisa melihat dashboard request.
3. SuperAdmin bisa approve atau reject.
4. SuperAdmin tidak melihat password.
5. Setelah password reset berhasil, redirect ke login.
"@

Set-Content -Path "$Root\docs\ui\password-reset-ui.md" -Value $UiDoc -Encoding UTF8


# =========================================================
# WORKFLOW DOC
# =========================================================

$WorkflowDoc = @"
# Password Reset Workflow - QUOTE-APP

## Tujuan

Dokumen ini menjelaskan workflow Password Reset untuk QUOTE-APP.

## Prinsip Utama

SuperAdmin tidak boleh mengetahui password asli Sales/Marketing.

Password tidak boleh disimpan di database.

Password baru hanya disimpan ke Supabase Auth.

## Workflow Sales/Marketing Lupa Password

Flow:

Sales buka halaman login
→ Klik Request New Password
→ Isi email dan catatan
→ Submit request
→ Request masuk ke dashboard SuperAdmin
→ Status request pending

Setelah SuperAdmin approve:

SuperAdmin klik Approve
→ Status request approved
→ Reset token dibuat
→ Sales membuka halaman Create New Password
→ Sales membuat password baru
→ Password baru disimpan ke Supabase Auth
→ Status request completed
→ Sales login dengan password baru

## Workflow SuperAdmin

SuperAdmin login
→ Buka menu Password Reset Requests
→ Melihat request pending
→ Klik Approve atau Reject

Jika approve:

- status menjadi approved
- approved_by diisi SuperAdmin login
- approved_at diisi waktu approval
- reset_token_hash disimpan
- reset_token_expires_at diisi

Jika reject:

- status menjadi rejected
- rejected_by diisi SuperAdmin login
- rejected_at diisi waktu reject
- admin_note tersimpan

## Status Lifecycle

Normal:

pending → approved → completed

Rejected:

pending → rejected

Expired:

pending → expired
approved → expired

## Batas Waktu Token

Rekomendasi tahap awal:

30 menit

Setelah 30 menit, token dianggap expired dan Sales harus membuat request baru.

## Rule Sistem

1. Cegah request spam.
2. Cegah multiple pending request untuk email yang sama.
3. Token harus random.
4. Token asli tidak boleh disimpan.
5. Hash token disimpan di database.
6. Update password hanya lewat Supabase Auth Admin API.
"@

Set-Content -Path "$Root\docs\workflow\password-reset-workflow.md" -Value $WorkflowDoc -Encoding UTF8


# =========================================================
# DEPLOYMENT DOC
# =========================================================

$DeploymentDoc = @"
# Password Reset Deployment - QUOTE-APP

## Tujuan

Dokumen ini berisi catatan deployment untuk fitur Password Reset.

## Database Migration

File migration:

supabase/migrations/002_password_reset_requests.sql

Migration membuat:

- public.password_reset_requests
- public.v_password_reset_requests
- public.v_pending_password_reset_requests
- permission password_resets.view
- permission password_resets.approve
- permission password_resets.reject

## Environment Backend

File:

apps/api/.env

Isi penting:

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_WEB_URL=http://localhost:3000
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30

Rule:

- SUPABASE_SERVICE_ROLE_KEY hanya boleh ada di backend.
- Jangan taruh service role key di frontend.

## Environment Frontend

File:

apps/web/.env.local

Isi penting:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Backend Module

Module yang perlu dibuat:

apps/api/src/modules/password-reset-requests

File:

- password-reset-requests.module.ts
- password-reset-requests.controller.ts
- password-reset-requests.service.ts
- dto/request-password-reset.dto.ts
- dto/approve-password-reset.dto.ts
- dto/reject-password-reset.dto.ts
- dto/complete-password-reset.dto.ts

Endpoint:

- POST /api/auth/request-password-reset
- GET /api/password-reset-requests
- POST /api/password-reset-requests/:id/approve
- POST /api/password-reset-requests/:id/reject
- POST /api/auth/complete-password-reset

## Frontend Pages

Pages yang perlu dibuat:

- apps/web/src/app/request-password/page.tsx
- apps/web/src/app/create-new-password/page.tsx
- apps/web/src/app/password-reset-requests/page.tsx

## Admin Pertama

Catatan penting:

Sampai saat ini user berikut belum dibuat di Supabase Authentication:

Email    : admin@sales-app.local
Password : Admin@12345
Role     : super_admin

Sebelum test login aplikasi, buat dulu user tersebut di Supabase Authentication.

Aktifkan Auto Confirm User.

Setelah itu jalankan SQL assign role super_admin ke public.users dan public.user_roles.

## Checklist Backend

- Service role client Supabase tersedia
- Endpoint request-password-reset tersedia
- Endpoint list request tersedia
- Endpoint approve tersedia
- Endpoint reject tersedia
- Endpoint complete-password-reset tersedia
- Token reset dibuat random
- Token reset disimpan sebagai hash
- Password diupdate ke Supabase Auth
- Password tidak disimpan ke database
- SuperAdmin guard aktif untuk list/approve/reject

## Security Checklist

1. Jangan simpan password di database.
2. Jangan tampilkan password ke SuperAdmin.
3. Jangan simpan token asli di database.
4. Hash token sebelum disimpan.
5. Batasi masa berlaku token.
6. Jangan taruh service role key di frontend.
7. Endpoint approve/reject hanya untuk SuperAdmin.
8. Endpoint complete harus validasi token dan status approved.
9. Setelah completed, token tidak bisa dipakai lagi.
"@

Set-Content -Path "$Root\docs\deployment\password-reset-deployment.md" -Value $DeploymentDoc -Encoding UTF8


Write-Host ""
Write-Host "Password reset documentation created successfully." -ForegroundColor Cyan
Write-Host ""
Write-Host "Created files:" -ForegroundColor Green
Write-Host "1. docs\api\password-reset-api.md"
Write-Host "2. docs\database\password-reset-database.md"
Write-Host "3. docs\ui\password-reset-ui.md"
Write-Host "4. docs\workflow\password-reset-workflow.md"
Write-Host "5. docs\deployment\password-reset-deployment.md"
Write-Host ""
Write-Host "Check files with:" -ForegroundColor Yellow
Write-Host "dir D:\QUOTE-APP\docs -Recurse"