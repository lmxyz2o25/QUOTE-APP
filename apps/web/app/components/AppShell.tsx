'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UserRole = 'super_admin' | 'marketing';

type AppShellProps = {
  children: ReactNode;
  activeMenu?: string;
};

type MenuItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['super_admin', 'marketing'] },
  { label: 'Customers', href: '/customers', roles: ['super_admin', 'marketing'] },
  { label: 'Products', href: '/products', roles: ['super_admin', 'marketing'] },
  { label: 'Quotations', href: '/quotations', roles: ['super_admin', 'marketing'] },
  { label: 'Customer PO', href: '/customer-po', roles: ['super_admin', 'marketing'] },
  { label: 'Proforma Invoice', href: '/proforma-invoice', roles: ['super_admin', 'marketing'] },
];

const advancedItems: MenuItem[] = [
  { label: 'Settings', href: '/settings', roles: ['super_admin', 'marketing'] },
  { label: 'Notifications', href: '/notifications', roles: ['super_admin', 'marketing'] },
];

function getRoleFromEmail(email: string): UserRole {
  return email.toLowerCase() === 'admin@sales-app.local' ? 'super_admin' : 'marketing';
}

function DivisionIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <circle cx="12" cy="7.5" r="2.5" stroke="#0b5fa8" strokeWidth="2" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" stroke="#0b5fa8" strokeWidth="2" strokeLinecap="round" />

      <circle cx="5.5" cy="9" r="2" stroke="#0b5fa8" strokeWidth="2" />
      <path d="M2.5 17a3.7 3.7 0 0 1 4-3.1" stroke="#0b5fa8" strokeWidth="2" strokeLinecap="round" />

      <circle cx="18.5" cy="9" r="2" stroke="#0b5fa8" strokeWidth="2" />
      <path d="M17.5 13.9a3.7 3.7 0 0 1 4 3.1" stroke="#0b5fa8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ label, active }: { label: string; active: boolean }) {
  const stroke = active ? '#2563eb' : '#0f5f9f';

  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  } as const;

  if (label === 'Dashboard') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (label === 'Customers') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth="2" />
        <path d="M4 20a5 5 0 0 1 10 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M16 11a3 3 0 1 0 0-6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M17 20a4.6 4.6 0 0 0-3-4.4" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (label === 'Products') {
    return (
      <svg {...common}>
        <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" stroke={stroke} strokeWidth="2" />
        <path d="M4.5 7.2 12 11.4l7.5-4.2M12 11.4V21" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (label === 'Quotations') {
    return (
      <svg {...common}>
        <path
          d="M7 3.8h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5.3a1.5 1.5 0 0 1 1-1.5Z"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M14 4v4h4M9 12h6M9 16h5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (label === 'Customer PO') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="16" rx="2.5" stroke={stroke} strokeWidth="2" />
        <path d="M8 3v5M16 3v5M4 10h16M8 15h5M8 18h8" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (label === 'Proforma Invoice') {
    return (
      <svg {...common}>
        <rect x="5" y="3.5" width="14" height="17" rx="2.2" stroke={stroke} strokeWidth="2" />
        <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (label === 'Settings') {
    return (
      <svg {...common}>
        <path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" stroke={stroke} strokeWidth="2" />
        <path
          d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (label === 'Notifications') {
    return (
      <svg {...common}>
        <path
          d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 21h4" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="5" r="3" fill="#ef4444" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="#082b52" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function AppShell({ children, activeMenu = 'Dashboard' }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('marketing');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#dfe8f2';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('quote_app_access_token');
    const storedEmail = localStorage.getItem('quote_app_user_email') || '';

    if (!token) {
      router.replace('/login');
      return;
    }

    setEmail(storedEmail);
    setRole(getRoleFromEmail(storedEmail));
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const visibleMenus = useMemo(() => {
    return menuItems.filter((item) => item.roles.includes(role));
  }, [role]);

  const visibleAdvanced = useMemo(() => {
    return advancedItems.filter((item) => item.roles.includes(role));
  }, [role]);

  function isActive(item: MenuItem) {
    if (activeMenu && activeMenu.toLowerCase() === item.label.toLowerCase()) return true;
    return pathname === item.href;
  }

  function handleLogout() {
    localStorage.removeItem('quote_app_access_token');
    localStorage.removeItem('quote_app_user_email');
    router.replace('/login');
  }

  function handleNavigate(href: string) {
    router.push(href);
    setSidebarOpen(false);
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #dfe8f2;
        }

        button,
        input,
        textarea,
        select {
          font-family: Arial, sans-serif;
        }

        .app-shell {
          width: 100%;
          max-width: 100%;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          display: flex;
          background: #dfe8f2;
          color: #082b52;
          font-family: Arial, sans-serif;
        }

        .app-shell__sidebar {
          width: 300px;
          min-width: 300px;
          max-width: 300px;
          height: 100vh;
          height: 100dvh;
          background: #edf3f8;
          border-right: 1px solid #cdd9e6;
          padding: 18px 18px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          z-index: 60;
        }

        .app-shell__sidebar::-webkit-scrollbar {
          width: 8px;
        }

        .app-shell__sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .app-shell__sidebar::-webkit-scrollbar-thumb {
          background: rgba(8, 43, 82, 0.18);
          border-radius: 999px;
        }

        .app-shell__content {
          flex: 1;
          width: calc(100% - 300px);
          min-width: 0;
          max-width: calc(100% - 300px);
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          background: #dfe8f2;
          padding: 18px;
        }

        .app-shell__mobile-topbar {
          display: none;
        }

        .app-shell__overlay {
          display: none;
        }

        @media (max-width: 1024px) {
          .app-shell__sidebar {
            width: 278px;
            min-width: 278px;
            max-width: 278px;
          }

          .app-shell__content {
            width: calc(100% - 278px);
            max-width: calc(100% - 278px);
            padding: 16px;
          }
        }

        @media (max-width: 820px) {
          .app-shell {
            display: block;
            position: relative;
          }

          .app-shell__mobile-topbar {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 62px;
            z-index: 70;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 14px;
            background: rgba(237, 243, 248, 0.96);
            border-bottom: 1px solid #cdd9e6;
            backdrop-filter: blur(10px);
          }

          .app-shell__mobile-brand {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .app-shell__mobile-title {
            color: #071f3c;
            font-size: 17px;
            font-weight: 900;
            line-height: 1.05;
          }

          .app-shell__mobile-subtitle {
            color: #46627d;
            font-size: 12px;
            line-height: 1.1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .app-shell__hamburger {
            width: 42px;
            height: 42px;
            border: 1px solid #cdd9e6;
            background: #ffffff;
            border-radius: 12px;
            display: grid;
            place-items: center;
            cursor: pointer;
            box-shadow: 0 8px 18px rgba(8, 43, 82, 0.08);
          }

          .app-shell__sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(82vw, 300px);
            min-width: 0;
            max-width: min(82vw, 300px);
            height: 100vh;
            height: 100dvh;
            transform: translateX(-105%);
            transition: transform 220ms ease;
            box-shadow: 20px 0 45px rgba(8, 43, 82, 0.18);
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            touch-action: pan-y;
            padding-bottom: 24px;
          }

          .app-shell__sidebar--open {
            transform: translateX(0);
          }

          .app-shell__overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 55;
            background: rgba(7, 31, 60, 0.42);
            border: 0;
            padding: 0;
            cursor: pointer;
          }

          .app-shell__content {
            width: 100%;
            max-width: 100%;
            height: 100vh;
            height: 100dvh;
            padding: 78px 14px 18px;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 520px) {
          .app-shell__content {
            padding: 74px 10px 14px;
          }

          .app-shell__mobile-title {
            font-size: 16px;
          }

          .app-shell__mobile-subtitle {
            font-size: 11px;
          }
        }
      `}</style>

      <main className="app-shell">
        <header className="app-shell__mobile-topbar">
          <button
            type="button"
            className="app-shell__hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>

          <div className="app-shell__mobile-brand">
            <div className="app-shell__mobile-title">SALES-APP</div>
            <div className="app-shell__mobile-subtitle">
              {activeMenu} • {role === 'super_admin' ? 'SuperAdmin' : 'Marketing / Sales'}
            </div>
          </div>
        </header>

        {sidebarOpen ? (
          <button
            type="button"
            className="app-shell__overlay"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu overlay"
          />
        ) : null}

        <aside className={`app-shell__sidebar ${sidebarOpen ? 'app-shell__sidebar--open' : ''}`}>
          <div style={styles.brand}>
            <img src="/images/logo_company.png" alt="SALES-APP Logo" style={styles.brandLogoImage} />

            <div style={styles.brandTextWrap}>
              <div style={styles.brandTitle}>SALES-APP</div>
              <div style={styles.brandSubtitle}>{role === 'super_admin' ? 'SuperAdmin' : 'Marketing / Sales'}</div>
            </div>
          </div>

          <button type="button" style={styles.divisionButton}>
            <span style={styles.divisionIconWrap}>
              <DivisionIcon />
            </span>
            <span style={styles.divisionText}>Sales Division</span>
          </button>

          <div style={styles.groupTitle}>CONTENT</div>

          <nav style={styles.menuList}>
            {visibleMenus.map((item) => {
              const active = isActive(item);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  style={{
                    ...styles.menuButton,
                    ...(active ? styles.menuButtonActive : {}),
                  }}
                >
                  <span style={styles.menuIcon}>
                    <MenuIcon label={item.label} active={active} />
                  </span>
                  <span style={styles.menuText}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={styles.divider} />

          <div style={styles.groupTitle}>ADVANCED</div>

          <nav style={styles.menuList}>
            {visibleAdvanced.map((item) => {
              const active = isActive(item);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  style={{
                    ...styles.menuButton,
                    ...(active ? styles.menuButtonActive : {}),
                  }}
                >
                  <span style={styles.menuIcon}>
                    <MenuIcon label={item.label} active={active} />
                  </span>
                  <span style={styles.menuText}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={styles.sidebarSpacer} />

          <div style={styles.userBox}>
            <div style={styles.userAvatar}>CB</div>

            <div style={styles.userCopy}>
              <strong style={styles.userRole}>{role === 'super_admin' ? 'SuperAdmin' : 'Marketing / Sales'}</strong>
              <span style={styles.userEmail}>{email || '-'}</span>
            </div>

            <button type="button" onClick={handleLogout} style={styles.logoutMini} title="Logout">
              ⌄
            </button>
          </div>
        </aside>

        <section className="app-shell__content">{children}</section>
      </main>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  brandLogoImage: {
    width: '100%',
    maxWidth: 214,
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
  },
  brandTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 1,
  },
  brandTitle: {
    color: '#071f3c',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0.2,
    lineHeight: 1.1,
  },
  brandSubtitle: {
    color: '#46627d',
    fontSize: 13,
    lineHeight: 1.2,
  },
  divisionButton: {
    height: 44,
    border: 0,
    background: 'transparent',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 4px 0 0',
    color: '#062b52',
    cursor: 'pointer',
    marginBottom: 18,
  },
  divisionIconWrap: {
    width: 36,
    minWidth: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    flexShrink: 0,
  },
  divisionText: {
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1,
    color: '#082b52',
    textAlign: 'left',
  },
  groupTitle: {
    color: '#6f8195',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.3,
    margin: '0 0 10px',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  menuButton: {
    width: '100%',
    height: 52,
    border: 0,
    background: 'transparent',
    color: '#082b52',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 12px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuButtonActive: {
    background: '#ffffff',
    boxShadow: '0 12px 24px rgba(8, 43, 82, 0.08)',
  },
  menuIcon: {
    width: 40,
    minWidth: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    background: 'transparent',
    border: 0,
    flexShrink: 0,
  },
  menuText: {
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1,
    color: '#082b52',
  },
  divider: {
    height: 1,
    background: '#cdd9e6',
    margin: '18px 0',
  },
  sidebarSpacer: {
    flex: 1,
  },
  userBox: {
    borderTop: '1px solid #cdd9e6',
    paddingTop: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: '#071f3c',
    color: '#ffffff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
    fontSize: 12,
    flexShrink: 0,
  },
  userCopy: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  userRole: {
    fontSize: 13,
    fontWeight: 600,
    color: '#071f3c',
  },
  userEmail: {
    fontSize: 12,
    color: '#46627d',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutMini: {
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    color: '#6f8195',
    fontWeight: 700,
  },
};