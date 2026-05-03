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
