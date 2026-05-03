'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = useMemo(() => searchParams.get('request_id') || '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('SalesNew@12345');
  const [confirmPassword, setConfirmPassword] = useState('SalesNew@12345');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    if (!requestId || !token) {
      setMessage('Link reset password tidak valid.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/complete-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          reset_token: token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Gagal mengganti password.');
        return;
      }

      setSuccess(true);
      setMessage(result.message || 'Password berhasil diganti.');
    } catch (error) {
      setMessage('Gagal mengganti password. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Create New Password</h1>
        <p style={styles.subtitle}>
          Buat password baru. Password akan disimpan aman oleh Supabase Auth, tidak ditampilkan ke SuperAdmin.
        </p>

        {!requestId || !token ? (
          <div style={styles.errorBox}>Link reset password tidak valid atau token tidak ditemukan.</div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              style={styles.input}
              required
            />

            {message ? (
              <div style={success ? styles.successBox : styles.errorBox}>{message}</div>
            ) : null}

            <button type="submit" disabled={loading || success} style={styles.primaryButton}>
              {loading ? 'Menyimpan password...' : success ? 'Password Berhasil Diganti' : 'Save New Password'}
            </button>

            {success ? (
              <button type="button" onClick={() => router.push('/login')} style={styles.secondaryButton}>
                Kembali ke Login
              </button>
            ) : null}
          </form>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #00396f 0%, #0076d9 60%, #00467f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: 'min(520px, 92vw)',
    borderRadius: 22,
    background: 'white',
    padding: 32,
    boxShadow: '0 28px 70px rgba(0, 35, 80, 0.28)',
  },
  title: {
    margin: 0,
    color: '#0b2f57',
    fontSize: 30,
    fontWeight: 900,
  },
  subtitle: {
    margin: '10px 0 26px',
    color: '#5f7184',
    lineHeight: 1.6,
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  label: {
    color: '#0b2f57',
    fontWeight: 800,
    fontSize: 13,
  },
  input: {
    height: 44,
    borderRadius: 10,
    border: '1px solid #d5e2ef',
    padding: '0 14px',
    outline: 'none',
    fontSize: 14,
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    border: 'none',
    background: '#006dcc',
    color: 'white',
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 10,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    border: '1px solid #cfe0ef',
    background: '#f6fbff',
    color: '#005ca8',
    fontWeight: 900,
    cursor: 'pointer',
  },
  successBox: {
    background: '#ecfdf3',
    border: '1px solid #b7f0c9',
    color: '#087a35',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  errorBox: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#be123c',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
};