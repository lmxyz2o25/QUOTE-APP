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
