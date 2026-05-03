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
