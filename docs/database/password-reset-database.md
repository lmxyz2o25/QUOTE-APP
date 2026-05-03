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
