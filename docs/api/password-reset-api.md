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
