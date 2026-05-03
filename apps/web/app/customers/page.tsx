'use client';

import AppShell from '../components/AppShell';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';

type CustomerType = 'personal' | 'corporate' | 'government';

type CustomerRow = {
  id: string;
  customer_name?: string | null;
  customer_legal_name?: string | null;
  billing_address?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

type QuotationRow = {
  id: string;
  quotation_number?: string | null;
  quote_date?: string | null;
  customer_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type CustomerPoRow = {
  id: string;
  quotation_id?: string | null;
  status?: string | null;
};

type CustomerForm = {
  id?: string;
  customer_type: CustomerType;
  customer_name: string;
  company_name: string;
  address: string;
  email: string;
  phone: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emptyForm: CustomerForm = {
  customer_type: 'personal',
  customer_name: '',
  company_name: '',
  address: '',
  email: '',
  phone: '',
};

export default function CustomersPage() {
  const addressEditorRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [customerPOs, setCustomerPOs] = useState<CustomerPoRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setMessage('');

    const [customersRes, quotationsRes, poRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, customer_name, customer_legal_name, billing_address, email, phone, created_at')
        .order('created_at', { ascending: false }),

      supabase
        .from('quotations')
        .select('id, quotation_number, quote_date, customer_id, status, created_at')
        .order('created_at', { ascending: false }),

      supabase.from('customer_purchase_orders').select('id, quotation_id, status'),
    ]);

    if (customersRes.error) {
      setMessage(customersRes.error.message);
      setCustomers([]);
    } else {
      setCustomers((customersRes.data || []) as CustomerRow[]);
    }

    if (!quotationsRes.error) {
      setQuotations((quotationsRes.data || []) as QuotationRow[]);
    }

    if (!poRes.error) {
      setCustomerPOs((poRes.data || []) as CustomerPoRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return customers;

    return customers.filter((item) => {
      return [
        item.customer_name,
        item.customer_legal_name,
        item.billing_address,
        item.email,
        item.phone,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [customers, search]);

  function getLatestQuotation(customerId: string) {
    return quotations.find((q) => q.customer_id === customerId);
  }

  function getPoStatus(quotationId?: string | null) {
    if (!quotationId) return 'None';

    const po = customerPOs.find((item) => item.quotation_id === quotationId);

    return po ? 'Approve' : 'None';
  }

  function updateForm<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function focusAddressEditor() {
    if (!addressEditorRef.current) return;
    addressEditorRef.current.focus();
  }

  function runAddressCommand(command: string, value?: string) {
    focusAddressEditor();
    document.execCommand(command, false, value);

    if (addressEditorRef.current) {
      updateForm('address', addressEditorRef.current.innerHTML);
      addressEditorRef.current.focus();
    }
  }

  function editCustomer(customer: CustomerRow) {
    const addressValue = customer.billing_address || '';

    setForm({
      id: customer.id,
      customer_type: 'corporate',
      customer_name: customer.customer_name || '',
      company_name: customer.customer_legal_name || '',
      address: addressValue,
      email: customer.email || '',
      phone: customer.phone || '',
    });

    setTimeout(() => {
      if (addressEditorRef.current) {
        addressEditorRef.current.innerHTML = addressValue;
        addressEditorRef.current.focus();
      }
    }, 0);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage('');

    if (addressEditorRef.current) {
      addressEditorRef.current.innerHTML = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const addressValue = addressEditorRef.current?.innerHTML || form.address || '';

    const payload = {
      customer_name: form.customer_name.trim(),
      customer_legal_name: form.company_name.trim() || null,
      billing_address: addressValue.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = form.id
      ? await supabase.from('customers').update(payload).eq('id', form.id)
      : await supabase.from('customers').insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(form.id ? 'Customer berhasil di-update.' : 'Customer berhasil disimpan.');
      resetForm();
      await loadData();
    }

    setSaving(false);
  }

  function renderAddressPreview(address?: string | null) {
    if (!address) return '-';

    return <div style={styles.addressPreview} dangerouslySetInnerHTML={{ __html: address }} />;
  }

  return (
    <AppShell activeMenu="Customers">
      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>SALES-APP / Customers</div>
            <h1 style={styles.title}>Customers</h1>
            <p style={styles.subtitle}>Kelola data customer Personal, Corporate, dan Government.</p>
          </div>

          <button type="button" onClick={loadData} style={styles.secondaryButton}>
            Refresh
          </button>
        </section>

        {message ? (
          <div style={message.toLowerCase().includes('berhasil') ? styles.successBox : styles.errorBox}>
            {message}
          </div>
        ) : null}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Customer Details</h2>
              <p style={styles.sectionText}>Isi data customer baru atau edit data customer yang sudah ada.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.checkGroup}>
              {(['personal', 'corporate', 'government'] as CustomerType[]).map((type) => (
                <label key={type} style={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={form.customer_type === type}
                    onChange={() => updateForm('customer_type', type)}
                  />
                  <span>
                    {type === 'personal' ? 'Personal' : type === 'corporate' ? 'Corporate' : 'Government'}
                  </span>
                </label>
              ))}
            </div>

            <div style={styles.grid2}>
              <label style={styles.label}>
                Name
                <input
                  style={styles.input}
                  value={form.customer_name}
                  onChange={(e) => updateForm('customer_name', e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </label>

              <label style={styles.label}>
                Company
                <input
                  style={styles.input}
                  value={form.company_name}
                  onChange={(e) => updateForm('company_name', e.target.value)}
                  placeholder="Company name"
                />
              </label>
            </div>

            <div style={styles.grid2AlignTop}>
              <div style={styles.label}>
                <span>Address</span>

                <div style={styles.wordToolbar}>
                  <select
                    style={styles.fontSelect}
                    defaultValue="Arial"
                    onChange={(e) => runAddressCommand('fontName', e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>

                  <select
                    style={styles.sizeSelect}
                    defaultValue="3"
                    onChange={(e) => runAddressCommand('fontSize', e.target.value)}
                  >
                    <option value="2">10</option>
                    <option value="3">12</option>
                    <option value="4">14</option>
                    <option value="5">18</option>
                    <option value="6">24</option>
                  </select>

                  <span style={styles.toolbarDivider} />

                  <button type="button" title="Bold" style={styles.toolbarButton} onClick={() => runAddressCommand('bold')}>
                    B
                  </button>

                  <button type="button" title="Italic" style={styles.toolbarButton} onClick={() => runAddressCommand('italic')}>
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>

                  <button
                    type="button"
                    title="Underline"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('underline')}
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>

                  <button
                    type="button"
                    title="Strike"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('strikeThrough')}
                  >
                    <span style={{ textDecoration: 'line-through' }}>ab</span>
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Bullets"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('insertUnorderedList')}
                  >
                    •
                  </button>

                  <button
                    type="button"
                    title="Numbering"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('insertOrderedList')}
                  >
                    1.
                  </button>

                  <button type="button" title="Outdent" style={styles.toolbarButton} onClick={() => runAddressCommand('outdent')}>
                    ←
                  </button>

                  <button type="button" title="Indent" style={styles.toolbarButton} onClick={() => runAddressCommand('indent')}>
                    →
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Align Left"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('justifyLeft')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Center"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('justifyCenter')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Right"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('justifyRight')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Justify"
                    style={styles.toolbarButton}
                    onClick={() => runAddressCommand('justifyFull')}
                  >
                    ≣
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Heading"
                    style={styles.textToolButton}
                    onClick={() => runAddressCommand('formatBlock', 'h3')}
                  >
                    Heading
                  </button>

                  <button
                    type="button"
                    title="Paragraph"
                    style={styles.textToolButton}
                    onClick={() => runAddressCommand('formatBlock', 'p')}
                  >
                    Paragraph
                  </button>

                  <button
                    type="button"
                    title="Clear Format"
                    style={styles.textToolButton}
                    onClick={() => runAddressCommand('removeFormat')}
                  >
                    Clear
                  </button>
                </div>

                <div
                  ref={addressEditorRef}
                  contentEditable
                  tabIndex={0}
                  role="textbox"
                  aria-label="Customer address"
                  style={styles.editor}
                  suppressContentEditableWarning
                  onMouseDown={(e) => {
                    e.currentTarget.focus();
                  }}
                  onClick={(e) => {
                    e.currentTarget.focus();
                  }}
                  onKeyUp={(e) => updateForm('address', e.currentTarget.innerHTML)}
                  onInput={(e) => updateForm('address', e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: form.address }}
                />
              </div>

              <div style={styles.sideFields}>
                <label style={styles.label}>
                  Email
                  <input
                    style={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="email@company.com"
                  />
                </label>

                <label style={styles.label}>
                  Phone
                  <input
                    style={styles.input}
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </label>
              </div>
            </div>

            <div style={styles.actions}>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update Customer' : 'Save Customer'}
              </button>

              {form.id ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>List Customers</h2>
              <p style={styles.sectionText}>Status Approve artinya PO sudah masuk, None artinya belum PO.</p>
            </div>

            <input
              style={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
            />
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Address</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Quote No.</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td style={styles.td} colSpan={9}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={9}>
                      Belum ada data customer.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const latestQuotation = getLatestQuotation(customer.id);
                    const poStatus = getPoStatus(latestQuotation?.id);

                    return (
                      <tr key={customer.id}>
                        <td style={styles.td}>{customer.customer_name || '-'}</td>
                        <td style={styles.td}>{customer.customer_legal_name || '-'}</td>
                        <td style={styles.td}>{renderAddressPreview(customer.billing_address)}</td>
                        <td style={styles.td}>{customer.email || '-'}</td>
                        <td style={styles.td}>{customer.phone || '-'}</td>
                        <td style={styles.td}>{latestQuotation?.quotation_number || '-'}</td>
                        <td style={styles.td}>{latestQuotation?.quote_date || '-'}</td>
                        <td style={styles.td}>
                          <span style={poStatus === 'Approve' ? styles.statusApprove : styles.statusNone}>
                            {poStatus}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button type="button" style={styles.editButton} onClick={() => editCustomer(customer)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100%',
    background: '#dfe8f2',
    padding: 0,
    color: '#082b52',
    fontFamily: 'Arial, sans-serif',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  breadcrumb: {
    fontSize: 13,
    fontWeight: 400,
    color: '#1d64a0',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.05,
    color: '#062b52',
    fontWeight: 400,
  },
  subtitle: {
    margin: '10px 0 0',
    color: '#516f8f',
    fontSize: 18,
    lineHeight: 1.35,
    fontWeight: 400,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #d8e3ef',
    borderRadius: 22,
    padding: 28,
    marginBottom: 20,
    boxShadow: 'none',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 27,
    lineHeight: 1.15,
    color: '#062b52',
    fontWeight: 700,
  },
  sectionText: {
    margin: '8px 0 0',
    color: '#4f6f90',
    fontSize: 16,
    lineHeight: 1.35,
    fontWeight: 400,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  checkGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: '1px solid #d6e3f0',
    borderRadius: 12,
    background: '#f6faff',
    fontWeight: 700,
    color: '#0d3764',
    cursor: 'pointer',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
  },
  grid2AlignTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    alignItems: 'start',
  },
  sideFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: '#0b315a',
  },
  input: {
    height: 46,
    borderRadius: 12,
    border: '1px solid #cfdeeb',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
    color: '#0b315a',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  wordToolbar: {
    minHeight: 52,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    border: '1px solid #cbd9e8',
    borderBottom: 0,
    borderRadius: '12px 12px 0 0',
    background: 'linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%)',
    boxShadow: 'inset 0 -1px 0 rgba(9, 49, 90, 0.05)',
  },
  fontSelect: {
    height: 34,
    width: 128,
    border: '1px solid #bfcfe0',
    borderRadius: 8,
    background: '#ffffff',
    color: '#0b315a',
    padding: '0 8px',
    fontSize: 13,
    fontWeight: 400,
    outline: 'none',
  },
  sizeSelect: {
    height: 34,
    width: 58,
    border: '1px solid #bfcfe0',
    borderRadius: 8,
    background: '#ffffff',
    color: '#0b315a',
    padding: '0 6px',
    fontSize: 13,
    fontWeight: 400,
    outline: 'none',
  },
  toolbarDivider: {
    width: 1,
    height: 30,
    background: '#c8d7e6',
    margin: '0 4px',
  },
  toolbarButton: {
    width: 30,
    height: 32,
    border: '1px solid transparent',
    background: 'transparent',
    color: '#0b315a',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 400,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    lineHeight: 1,
  },
  textToolButton: {
    height: 34,
    border: '1px solid #c8d7e6',
    background: '#ffffff',
    color: '#0b315a',
    borderRadius: 8,
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  editor: {
    minHeight: 116,
    border: '1px solid #cfdeeb',
    borderRadius: '0 0 12px 12px',
    padding: 14,
    fontSize: 14,
    fontWeight: 400,
    outline: 'none',
    color: '#0b315a',
    background: '#ffffff',
    lineHeight: 1.7,
    boxSizing: 'border-box',
    cursor: 'text',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    border: 0,
    background: '#0876cf',
    color: '#ffffff',
    borderRadius: 12,
    padding: '13px 18px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #cbdceb',
    background: '#ffffff',
    color: '#075a9f',
    borderRadius: 12,
    padding: '12px 16px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  search: {
    width: 280,
    height: 42,
    borderRadius: 12,
    border: '1px solid #cfdeeb',
    padding: '0 14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'hidden',
    border: '1px solid #e0e9f2',
    borderRadius: 14,
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    background: '#f2f7fc',
    color: '#173b5f',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    borderBottom: '1px solid #e0e9f2',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #edf2f7',
    color: '#173b5f',
    verticalAlign: 'top',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  addressPreview: {
    maxWidth: 260,
    lineHeight: 1.5,
    color: '#173b5f',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  editButton: {
    border: 0,
    background: '#0b78d0',
    color: '#ffffff',
    borderRadius: 10,
    padding: '9px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  statusApprove: {
    background: '#e8f8ef',
    color: '#067a3c',
    padding: '6px 10px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
  },
  statusNone: {
    background: '#f1f4f8',
    color: '#73849a',
    padding: '6px 10px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
  },
  successBox: {
    background: '#e9f9ef',
    border: '1px solid #bdebcf',
    color: '#08753b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontWeight: 700,
  },
  errorBox: {
    background: '#fff0f0',
    border: '1px solid #ffc8c8',
    color: '#b00020',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontWeight: 700,
  },
};