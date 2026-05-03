'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function RequestPasswordResetPage() {
  const router = useRouter();

  const [email, setEmail] = useState('sales1@sales-app.local');
  const [requestNote, setRequestNote] = useState('Saya lupa password login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          request_note: requestNote,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Request reset password gagal.');
        return;
      }

      setSuccess(true);
      setMessage(result.message || 'Request reset password berhasil dikirim.');
    } catch (error) {
      setMessage('Request gagal. Pastikan backend berjalan di port 4000.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <button type="button" onClick={() => router.push('/login')} style={styles.backButton}>
          ← Kembali ke Login
        </button>

        <h1 style={styles.title}>Request New Password</h1>
        <p style={styles.subtitle}>
          Masukkan email Sales/Marketing. Request akan masuk ke dashboard SuperAdmin untuk approval.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            placeholder="sales@email.com"
            onChange={(event) => setEmail(event.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Catatan</label>
          <textarea
            value={requestNote}
            onChange={(event) => setRequestNote(event.target.value)}
            style={styles.textarea}
            placeholder="Contoh: Saya lupa password login"
          />

          {message ? (
            <div style={success ? styles.successBox : styles.errorBox}>{message}</div>
          ) : null}

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Mengirim request...' : 'Kirim Request ke SuperAdmin'}
          </button>
        </form>
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
  backButton: {
    border: 'none',
    background: '#eff6ff',
    color: '#005ca8',
    borderRadius: 999,
    padding: '9px 14px',
    fontWeight: 800,
    cursor: 'pointer',
    marginBottom: 18,
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
  textarea: {
    minHeight: 110,
    borderRadius: 10,
    border: '1px solid #d5e2ef',
    padding: 14,
    outline: 'none',
    fontSize: 14,
    resize: 'vertical',
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