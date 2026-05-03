'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type PasswordResetRequest = {
  id: string;
  email: string;
  user_id: string;
  full_name: string;
  user_status: string;
  role_code: string;
  request_status: string;
  request_note: string | null;
  admin_note: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export default function PasswordResetRequestsPage() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [items, setItems] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastResetUrl, setLastResetUrl] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('quote_app_access_token') || '';
    setToken(accessToken);

    if (!accessToken) {
      router.push('/login');
      return;
    }

    fetchRequests(accessToken, '');
  }, [router]);

  async function fetchRequests(accessToken = token, status = statusFilter) {
    setLoading(true);
    setMessage('');

    try {
      const url = status
        ? `${apiUrl}/password-reset-requests?status=${encodeURIComponent(status)}`
        : `${apiUrl}/password-reset-requests`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Gagal mengambil data request.');
        return;
      }

      setItems(result.data || []);
    } catch (error) {
      setMessage('Gagal konek ke backend. Pastikan API port 4000 berjalan.');
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(id: string) {
    setMessage('');
    setLastResetUrl('');

    try {
      const response = await fetch(`${apiUrl}/password-reset-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_note: 'Approved by SuperAdmin',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Approve gagal.');
        return;
      }

      setLastResetUrl(result.reset_url || '');
      setMessage(result.message || 'Request berhasil di-approve.');
      await fetchRequests(token, statusFilter);
    } catch (error) {
      setMessage('Approve gagal. Pastikan backend berjalan.');
    }
  }

  async function rejectRequest(id: string) {
    setMessage('');
    setLastResetUrl('');

    try {
      const response = await fetch(`${apiUrl}/password-reset-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_note: 'Rejected by SuperAdmin',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Reject gagal.');
        return;
      }

      setMessage(result.message || 'Request berhasil ditolak.');
      await fetchRequests(token, statusFilter);
    } catch (error) {
      setMessage('Reject gagal. Pastikan backend berjalan.');
    }
  }

  async function copyResetUrl() {
    if (!lastResetUrl) return;
    await navigator.clipboard.writeText(lastResetUrl);
    setMessage('Reset URL berhasil dicopy.');
  }

  function handleLogout() {
    localStorage.removeItem('quote_app_access_token');
    localStorage.removeItem('quote_app_user_email');
    router.push('/login');
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Password Reset Requests</h1>
          <p style={styles.subtitle}>Dashboard SuperAdmin untuk approve/reject reset password Sales/Marketing.</p>
        </div>

        <div style={styles.headerActions}>
          <button type="button" onClick={() => fetchRequests(token, statusFilter)} style={styles.secondaryButton}>
            Refresh
          </button>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </section>

      <section style={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            fetchRequests(token, event.target.value);
          }}
          style={styles.select}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>

        {message ? <div style={styles.messageBox}>{message}</div> : null}
      </section>

      {lastResetUrl ? (
        <section style={styles.resetUrlBox}>
          <div>
            <strong>Reset URL terbaru:</strong>
            <p style={styles.resetUrlText}>{lastResetUrl}</p>
          </div>
          <button type="button" onClick={copyResetUrl} style={styles.copyButton}>
            Copy Reset Link
          </button>
        </section>
      ) : null}

      <section style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Loading data...</div>
        ) : items.length === 0 ? (
          <div style={styles.emptyState}>Belum ada request password reset.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Note</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.email}</td>
                    <td style={styles.td}>{item.full_name}</td>
                    <td style={styles.td}>{item.role_code}</td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(item.request_status)}>
                        {item.request_status}
                      </span>
                    </td>
                    <td style={styles.td}>{item.request_note || '-'}</td>
                    <td style={styles.td}>{formatDate(item.created_at)}</td>
                    <td style={styles.td}>
                      {item.request_status === 'pending' ? (
                        <div style={styles.actionGroup}>
                          <button type="button" onClick={() => approveRequest(item.id)} style={styles.approveButton}>
                            Approve
                          </button>
                          <button type="button" onClick={() => rejectRequest(item.id)} style={styles.rejectButton}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={styles.mutedText}>No Action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID');
}

function getStatusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'capitalize',
  };

  if (status === 'pending') {
    return { ...base, background: '#fff7ed', color: '#c2410c' };
  }

  if (status === 'approved') {
    return { ...base, background: '#eff6ff', color: '#1d4ed8' };
  }

  if (status === 'completed') {
    return { ...base, background: '#ecfdf3', color: '#087a35' };
  }

  if (status === 'rejected') {
    return { ...base, background: '#fff1f2', color: '#be123c' };
  }

  return { ...base, background: '#f3f4f6', color: '#374151' };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f3f8fc',
    padding: 28,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 22,
  },
  title: {
    margin: 0,
    color: '#0b2f57',
    fontSize: 30,
    fontWeight: 950,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#65798c',
    fontSize: 14,
  },
  headerActions: {
    display: 'flex',
    gap: 10,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  select: {
    height: 42,
    borderRadius: 10,
    border: '1px solid #cfe0ef',
    padding: '0 12px',
    fontWeight: 700,
    background: 'white',
  },
  card: {
    background: 'white',
    borderRadius: 18,
    boxShadow: '0 18px 50px rgba(15, 50, 90, 0.08)',
    border: '1px solid #e5edf5',
    overflow: 'hidden',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 980,
  },
  th: {
    textAlign: 'left',
    background: '#f6fbff',
    color: '#31516c',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: '14px 16px',
    borderBottom: '1px solid #e5edf5',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #edf2f7',
    color: '#1f3548',
    fontSize: 14,
    verticalAlign: 'top',
  },
  actionGroup: {
    display: 'flex',
    gap: 8,
  },
  approveButton: {
    border: 'none',
    background: '#087a35',
    color: 'white',
    borderRadius: 8,
    padding: '8px 12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  rejectButton: {
    border: 'none',
    background: '#be123c',
    color: 'white',
    borderRadius: 8,
    padding: '8px 12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #cfe0ef',
    background: 'white',
    color: '#005ca8',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  logoutButton: {
    border: 'none',
    background: '#0b2f57',
    color: 'white',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  messageBox: {
    background: 'white',
    border: '1px solid #d5e2ef',
    color: '#0b2f57',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
  },
  resetUrlBox: {
    background: '#ecfdf3',
    border: '1px solid #b7f0c9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  resetUrlText: {
    margin: '6px 0 0',
    color: '#0f5132',
    fontSize: 13,
    wordBreak: 'break-all',
  },
  copyButton: {
    border: 'none',
    background: '#087a35',
    color: 'white',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: 36,
    color: '#65798c',
    textAlign: 'center',
    fontWeight: 700,
  },
  mutedText: {
    color: '#94a3b8',
    fontWeight: 700,
  },
};