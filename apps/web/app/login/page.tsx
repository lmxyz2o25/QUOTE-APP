'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default function LoginPage() {
  const router = useRouter();

  const supabase = useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage(error.message || 'Login gagal.');
        return;
      }

      if (!data.session?.access_token) {
        setMessage('Login gagal. Token tidak ditemukan.');
        return;
      }

      localStorage.setItem('quote_app_access_token', data.session.access_token);
      localStorage.setItem('quote_app_user_email', data.user.email || email);

      if ((data.user.email || email).toLowerCase() === 'admin@sales-app.local') {
        router.push('/password-reset-requests');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setMessage('Login gagal. Periksa koneksi backend/frontend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundPanel}>
        <div style={styles.blobTop} />
        <div style={styles.blobLeft} />
        <div style={styles.blobBottom} />
        <div style={styles.blobCircle} />
        <div style={styles.leftOrnamentOne} />
        <div style={styles.leftOrnamentTwo} />
        <div style={styles.rightWaveOne} />
        <div style={styles.rightWaveTwo} />

        <section style={styles.card}>
          <div style={styles.logoBox}>
            <div style={styles.logoMark}>CBI</div>
            <div style={styles.logoText}>SALES-APP</div>
          </div>

          <h1 style={styles.title}>Login</h1>

          <p style={styles.subtitle}>
            Masuk untuk mengelola quotation, customer, PO, dan invoice.
          </p>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              placeholder="type your email"
              onChange={(event) => setEmail(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="type your password"
                onChange={(event) => setPassword(event.target.value)}
                style={styles.passwordInput}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={styles.eyeButton}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/request-password-reset')}
              style={styles.forgotButton}
            >
              Forgot/Request New Password
            </button>

            {message ? <div style={styles.message}>{message}</div> : null}

            <button type="submit" disabled={loading} style={styles.signInButton}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100dvh',
    maxWidth: '100%',
    overflow: 'hidden',
    background:
      'radial-gradient(circle at 18% 8%, #29bfff 0, transparent 30%), linear-gradient(135deg, #00345f 0%, #0076d9 52%, #004272 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    boxSizing: 'border-box',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  backgroundPanel: {
    width: '100%',
    height: '100%',
    maxWidth: 1360,
    maxHeight: 760,
    borderRadius: 30,
    background:
      'linear-gradient(135deg, rgba(0, 62, 120, 0.82), rgba(0, 126, 226, 0.46))',
    boxShadow: '0 30px 95px rgba(0, 18, 55, 0.36)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.13)',
    boxSizing: 'border-box',
  },

  blobTop: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: '50%',
    border: '24px solid rgba(82, 210, 255, 0.25)',
    top: -46,
    left: '31%',
    filter: 'blur(1px)',
  },

  blobLeft: {
    position: 'absolute',
    width: 390,
    height: 250,
    borderRadius: 150,
    left: -100,
    bottom: -26,
    transform: 'rotate(-24deg)',
    background: 'rgba(150, 220, 255, 0.13)',
  },

  blobBottom: {
    position: 'absolute',
    width: 360,
    height: 132,
    borderRadius: 90,
    right: -38,
    bottom: -4,
    background: 'rgba(185, 232, 255, 0.26)',
    filter: 'blur(1px)',
  },

  blobCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: '50%',
    border: '32px solid rgba(141, 218, 255, 0.18)',
    left: '27%',
    bottom: 58,
    filter: 'blur(2px)',
  },

  leftOrnamentOne: {
    position: 'absolute',
    width: 128,
    height: 34,
    borderRadius: 999,
    background:
      'linear-gradient(90deg, rgba(238,248,255,0.9), rgba(106,196,255,0.62))',
    left: '22%',
    top: '31%',
    transform: 'rotate(-42deg)',
    boxShadow: '0 16px 36px rgba(0, 48, 100, 0.24)',
  },

  leftOrnamentTwo: {
    position: 'absolute',
    width: 92,
    height: 28,
    borderRadius: 999,
    background:
      'linear-gradient(90deg, rgba(238,248,255,0.72), rgba(106,196,255,0.46))',
    left: '23%',
    top: '41%',
    transform: 'rotate(-42deg)',
    boxShadow: '0 14px 30px rgba(0, 48, 100, 0.2)',
  },

  rightWaveOne: {
    position: 'absolute',
    width: 112,
    height: 28,
    borderRadius: 999,
    background: 'rgba(198, 235, 255, 0.52)',
    right: '22%',
    top: '65%',
    filter: 'blur(1px)',
    transform: 'rotate(12deg)',
  },

  rightWaveTwo: {
    position: 'absolute',
    width: 126,
    height: 28,
    borderRadius: 999,
    background: 'rgba(198, 235, 255, 0.38)',
    right: '17%',
    top: '71%',
    filter: 'blur(1px)',
    transform: 'rotate(12deg)',
  },

  card: {
    width: 430,
    maxWidth: 'calc(100vw - 72px)',
    padding: '34px 42px 40px',
    borderRadius: 26,
    background:
      'linear-gradient(155deg, rgba(255,255,255,0.26), rgba(255,255,255,0.09))',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 28px 72px rgba(0, 34, 82, 0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    color: 'white',
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  },

  logoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },

  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #ffffff, #a9e3ff)',
    color: '#0065bc',
    fontWeight: 950,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 26px rgba(0,0,0,0.18)',
    fontSize: 17,
  },

  logoText: {
    fontSize: 23,
    fontWeight: 900,
    letterSpacing: 0.8,
  },

  title: {
    fontSize: 34,
    lineHeight: 1.1,
    margin: '0 0 10px',
    fontWeight: 500,
  },

  subtitle: {
    margin: '0 0 28px',
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 1.5,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 700,
  },

  input: {
    height: 48,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.36)',
    padding: '0 15px',
    outline: 'none',
    fontSize: 15,
    marginBottom: 10,
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.94)',
    color: '#102033',
    width: '100%',
  },

  passwordWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.94)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.36)',
    marginBottom: 4,
    overflow: 'hidden',
  },

  passwordInput: {
    flex: 1,
    height: 48,
    border: 'none',
    padding: '0 15px',
    outline: 'none',
    fontSize: 15,
    borderRadius: 10,
    background: 'transparent',
    color: '#102033',
    minWidth: 0,
  },

  eyeButton: {
    border: 'none',
    background: 'transparent',
    color: '#0065bc',
    fontWeight: 800,
    padding: '0 14px',
    cursor: 'pointer',
    fontSize: 13,
    height: 48,
  },

  forgotButton: {
    alignSelf: 'flex-start',
    border: 'none',
    background: 'transparent',
    color: 'white',
    padding: 0,
    margin: '4px 0 18px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 400,
  },

  signInButton: {
    height: 50,
    borderRadius: 10,
    border: 'none',
    background: '#003f7a',
    color: 'white',
    fontWeight: 900,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 14px 28px rgba(0, 35, 74, 0.36)',
  },

  message: {
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.4,
    marginBottom: 8,
  },
};