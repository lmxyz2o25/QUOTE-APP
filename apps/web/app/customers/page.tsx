'use client';

import AppShell from '../components/AppShell';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
      return [item.customer_name, item.customer_legal_name, item.billing_address, item.email, item.phone]
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

  function syncAddressEditorToForm() {
    if (!addressEditorRef.current) return;
    updateForm('address', addressEditorRef.current.innerHTML);
  }

  function runAddressCommand(command: string, value?: string) {
    focusAddressEditor();
    document.execCommand(command, false, value);

    if (addressEditorRef.current) {
      syncAddressEditorToForm();
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

    return <div className="address-preview" dangerouslySetInnerHTML={{ __html: address }} />;
  }

  return (
    <AppShell activeMenu="Customers">
      <main className="customers-page">
        <section className="page-header">
          <div className="page-title-wrap">
            <div className="breadcrumb">SALES-APP / Customers</div>
            <h1>Customers</h1>
            <p>Kelola data customer Personal, Corporate, dan Government.</p>
          </div>

          <button type="button" onClick={loadData} className="secondary-button">
            Refresh
          </button>
        </section>

        {message ? (
          <div className={message.toLowerCase().includes('berhasil') ? 'success-box' : 'error-box'}>{message}</div>
        ) : null}

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Customer Details</h2>
              <p>Isi data customer baru atau edit data customer yang sudah ada.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="customer-form">
            <div className="check-group">
              {(['personal', 'corporate', 'government'] as CustomerType[]).map((type) => (
                <label key={type} className="check-item">
                  <input
                    type="checkbox"
                    checked={form.customer_type === type}
                    onChange={() => updateForm('customer_type', type)}
                  />
                  <span>{type === 'personal' ? 'Personal' : type === 'corporate' ? 'Corporate' : 'Government'}</span>
                </label>
              ))}
            </div>

            <div className="grid-2">
              <label className="field-label">
                Name
                <input
                  className="input"
                  value={form.customer_name}
                  onChange={(e) => updateForm('customer_name', e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </label>

              <label className="field-label">
                Company
                <input
                  className="input"
                  value={form.company_name}
                  onChange={(e) => updateForm('company_name', e.target.value)}
                  placeholder="Company name"
                />
              </label>
            </div>

            <div className="grid-2 align-top">
              <div className="field-label">
                <span>Address</span>

                <div className="word-toolbar">
                  <select
                    className="font-select"
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
                    className="size-select"
                    defaultValue="3"
                    onChange={(e) => runAddressCommand('fontSize', e.target.value)}
                  >
                    <option value="2">10</option>
                    <option value="3">12</option>
                    <option value="4">14</option>
                    <option value="5">18</option>
                    <option value="6">24</option>
                  </select>

                  <span className="toolbar-divider" />

                  <button type="button" title="Bold" className="toolbar-button" onClick={() => runAddressCommand('bold')}>
                    B
                  </button>

                  <button type="button" title="Italic" className="toolbar-button" onClick={() => runAddressCommand('italic')}>
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>

                  <button
                    type="button"
                    title="Underline"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('underline')}
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>

                  <button
                    type="button"
                    title="Strike"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('strikeThrough')}
                  >
                    <span style={{ textDecoration: 'line-through' }}>ab</span>
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Bullets"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('insertUnorderedList')}
                  >
                    •
                  </button>

                  <button
                    type="button"
                    title="Numbering"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('insertOrderedList')}
                  >
                    1.
                  </button>

                  <button type="button" title="Outdent" className="toolbar-button" onClick={() => runAddressCommand('outdent')}>
                    ←
                  </button>

                  <button type="button" title="Indent" className="toolbar-button" onClick={() => runAddressCommand('indent')}>
                    →
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Align Left"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('justifyLeft')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Center"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('justifyCenter')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Right"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('justifyRight')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Justify"
                    className="toolbar-button"
                    onClick={() => runAddressCommand('justifyFull')}
                  >
                    ≣
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Heading"
                    className="text-tool-button"
                    onClick={() => runAddressCommand('formatBlock', 'h3')}
                  >
                    Heading
                  </button>

                  <button
                    type="button"
                    title="Paragraph"
                    className="text-tool-button"
                    onClick={() => runAddressCommand('formatBlock', 'p')}
                  >
                    Paragraph
                  </button>

                  <button
                    type="button"
                    title="Clear Format"
                    className="text-tool-button"
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
                  className="editor"
                  suppressContentEditableWarning
                  onMouseDown={(e) => e.currentTarget.focus()}
                  onClick={(e) => e.currentTarget.focus()}
                  onInput={syncAddressEditorToForm}
                  onBlur={syncAddressEditorToForm}
                />
              </div>

              <div className="side-fields">
                <label className="field-label">
                  Email
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="Email customer"
                  />
                </label>

                <label className="field-label">
                  Phone
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="Phone customer"
                  />
                </label>
              </div>
            </div>

            <div className="actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update Customer' : 'Save Customer'}
              </button>

              {form.id ? (
                <button type="button" onClick={resetForm} className="secondary-button">
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card-header list-header">
            <div>
              <h2>List Customers</h2>
              <p>Status Approve artinya PO sudah masuk, None artinya belum PO.</p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
            />
          </div>

          <div className="table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Quote No.</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>Loading...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>Belum ada data customer.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const latestQuotation = getLatestQuotation(customer.id);
                    const poStatus = getPoStatus(latestQuotation?.id);

                    return (
                      <tr key={customer.id}>
                        <td data-label="Name">{customer.customer_name || '-'}</td>
                        <td data-label="Company">{customer.customer_legal_name || '-'}</td>
                        <td data-label="Address">{renderAddressPreview(customer.billing_address)}</td>
                        <td data-label="Email">{customer.email || '-'}</td>
                        <td data-label="Phone">{customer.phone || '-'}</td>
                        <td data-label="Quote No.">{latestQuotation?.quotation_number || '-'}</td>
                        <td data-label="Date">{latestQuotation?.quote_date || '-'}</td>
                        <td data-label="Status">
                          <span className={poStatus === 'Approve' ? 'status-approve' : 'status-none'}>{poStatus}</span>
                        </td>
                        <td data-label="Action">
                          <button type="button" className="edit-button" onClick={() => editCustomer(customer)}>
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

        <style jsx>{`
          .customers-page {
            min-height: 100%;
            background: #dfe8f2;
            padding: 0;
            color: #082b52;
            font-family: Arial, sans-serif;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            margin-bottom: 18px;
          }

          .page-title-wrap {
            min-width: 0;
          }

          .breadcrumb {
            font-size: 13px;
            font-weight: 400;
            color: #1d64a0;
            letter-spacing: 0.2px;
            margin-bottom: 8px;
          }

          .page-header h1 {
            margin: 0;
            font-size: 40px;
            line-height: 1.05;
            color: #062b52;
            font-weight: 400;
          }

          .page-header p {
            margin: 10px 0 0;
            color: #516f8f;
            font-size: 18px;
            line-height: 1.35;
            font-weight: 400;
          }

          .card {
            background: #ffffff;
            border: 1px solid #d8e3ef;
            border-radius: 22px;
            padding: 28px;
            margin-bottom: 20px;
            box-shadow: none;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            margin-bottom: 18px;
          }

          .card-header h2 {
            margin: 0;
            font-size: 27px;
            line-height: 1.15;
            color: #062b52;
            font-weight: 700;
          }

          .card-header p {
            margin: 8px 0 0;
            color: #4f6f90;
            font-size: 16px;
            line-height: 1.35;
            font-weight: 400;
          }

          .customer-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .check-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .check-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border: 1px solid #d6e3f0;
            border-radius: 12px;
            background: #f6faff;
            font-weight: 700;
            color: #0d3764;
            cursor: pointer;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .align-top {
            align-items: start;
          }

          .side-fields {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .field-label {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 13px;
            font-weight: 800;
            color: #0b315a;
          }

          .input,
          .search-input {
            height: 46px;
            border-radius: 12px;
            border: 1px solid #cfdeeb;
            padding: 0 14px;
            font-size: 14px;
            outline: none;
            color: #0b315a;
            background: #ffffff;
            box-sizing: border-box;
          }

          .word-toolbar {
            min-height: 52px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            padding: 8px 10px;
            border: 1px solid #cbd9e8;
            border-bottom: 0;
            border-radius: 12px 12px 0 0;
            background: linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%);
            box-shadow: inset 0 -1px 0 rgba(9, 49, 90, 0.05);
          }

          .font-select {
            height: 34px;
            width: 128px;
            border: 1px solid #bfcfe0;
            border-radius: 8px;
            background: #ffffff;
            color: #0b315a;
            padding: 0 8px;
            font-size: 13px;
            font-weight: 400;
            outline: none;
          }

          .size-select {
            height: 34px;
            width: 58px;
            border: 1px solid #bfcfe0;
            border-radius: 8px;
            background: #ffffff;
            color: #0b315a;
            padding: 0 6px;
            font-size: 13px;
            font-weight: 400;
            outline: none;
          }

          .toolbar-divider {
            width: 1px;
            height: 30px;
            background: #c8d7e6;
            margin: 0 4px;
          }

          .toolbar-button {
            width: 30px;
            height: 32px;
            border: 1px solid transparent;
            background: transparent;
            color: #0b315a;
            border-radius: 7px;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            display: grid;
            place-items: center;
            line-height: 1;
          }

          .text-tool-button {
            height: 34px;
            border: 1px solid #c8d7e6;
            background: #ffffff;
            color: #0b315a;
            border-radius: 8px;
            padding: 0 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }

          .editor {
            min-height: 116px;
            border: 1px solid #cfdeeb;
            border-radius: 0 0 12px 12px;
            padding: 14px;
            font-size: 14px;
            font-weight: 400;
            outline: none;
            color: #0b315a;
            background: #ffffff;
            line-height: 1.7;
            box-sizing: border-box;
            cursor: text;
            user-select: text;
            white-space: pre-wrap;
          }

          .actions {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .primary-button {
            border: 0;
            background: #0876cf;
            color: #ffffff;
            border-radius: 12px;
            padding: 13px 18px;
            font-weight: 800;
            cursor: pointer;
          }

          .secondary-button {
            border: 1px solid #cbdceb;
            background: #ffffff;
            color: #075a9f;
            border-radius: 12px;
            padding: 12px 16px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }

          .search-input {
            width: 280px;
            flex-shrink: 0;
          }

          .table-wrap {
            width: 100%;
            overflow-x: hidden;
            border: 1px solid #e0e9f2;
            border-radius: 14px;
          }

          .customers-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 14px;
          }

          .customers-table th {
            text-align: left;
            padding: 14px 16px;
            background: #f2f7fc;
            color: #173b5f;
            font-size: 12px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            border-bottom: 1px solid #e0e9f2;
            white-space: nowrap;
          }

          .customers-table td {
            padding: 14px 16px;
            border-bottom: 1px solid #edf2f7;
            color: #173b5f;
            vertical-align: top;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .address-preview {
            max-width: 260px;
            line-height: 1.5;
            color: #173b5f;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .edit-button {
            border: 0;
            background: #0b78d0;
            color: #ffffff;
            border-radius: 10px;
            padding: 9px 14px;
            font-weight: 800;
            cursor: pointer;
          }

          .status-approve {
            background: #e8f8ef;
            color: #067a3c;
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 800;
            font-size: 12px;
          }

          .status-none {
            background: #f1f4f8;
            color: #73849a;
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 800;
            font-size: 12px;
          }

          .success-box {
            background: #e9f9ef;
            border: 1px solid #bdebcf;
            color: #08753b;
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 16px;
            font-weight: 700;
          }

          .error-box {
            background: #fff0f0;
            border: 1px solid #ffc8c8;
            color: #b00020;
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 16px;
            font-weight: 700;
          }

          @media (max-width: 1100px) {
            .grid-2 {
              grid-template-columns: 1fr;
            }

            .card {
              padding: 22px;
            }
          }

          @media (max-width: 820px) {
            .page-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
              margin-bottom: 14px;
            }

            .breadcrumb {
              font-size: 12px;
              margin-bottom: 6px;
            }

            .page-header h1 {
              font-size: 34px;
            }

            .page-header p {
              font-size: 15px;
              line-height: 1.3;
              margin-top: 8px;
            }

            .secondary-button {
              width: 100%;
              height: 42px;
              padding: 0 14px;
            }

            .card {
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 14px;
            }

            .card-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
              margin-bottom: 14px;
            }

            .card-header h2 {
              font-size: 22px;
            }

            .card-header p {
              font-size: 14px;
              line-height: 1.35;
            }

            .check-group {
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .check-item {
              min-height: 42px;
              padding: 10px 12px;
            }

            .grid-2 {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .input {
              width: 100%;
              height: 44px;
            }

            .word-toolbar {
              flex-wrap: nowrap;
              overflow-x: auto;
              overflow-y: hidden;
              padding: 8px;
              gap: 6px;
              -webkit-overflow-scrolling: touch;
            }

            .font-select {
              min-width: 126px;
            }

            .size-select {
              min-width: 58px;
            }

            .toolbar-button {
              min-width: 32px;
            }

            .text-tool-button {
              min-width: max-content;
            }

            .toolbar-divider {
              min-width: 1px;
            }

            .editor {
              min-height: 140px;
              font-size: 14px;
              line-height: 1.6;
            }

            .actions {
              flex-direction: column;
              align-items: stretch;
              gap: 10px;
            }

            .primary-button,
            .secondary-button {
              width: 100%;
              height: 44px;
              padding: 0 14px;
            }

            .search-input {
              width: 100%;
              height: 44px;
            }

            .table-wrap {
              border: 0;
              border-radius: 0;
              overflow: visible;
            }

            .customers-table {
              display: block;
              width: 100%;
              font-size: 13px;
            }

            .customers-table thead {
              display: none;
            }

            .customers-table tbody {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .customers-table tr {
              display: block;
              border: 1px solid #d8e3ef;
              border-radius: 14px;
              background: #f8fbff;
              overflow: hidden;
              box-shadow: 0 8px 18px rgba(34, 79, 126, 0.05);
            }

            .customers-table td {
              display: grid;
              grid-template-columns: 96px minmax(0, 1fr);
              gap: 10px;
              align-items: start;
              border-bottom: 1px solid #e4edf6;
              padding: 10px 12px;
              white-space: normal;
              overflow: visible;
              text-overflow: unset;
              line-height: 1.35;
              word-break: break-word;
            }

            .customers-table td:last-child {
              border-bottom: 0;
            }

            .customers-table td::before {
              content: attr(data-label);
              color: #5d7186;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .address-preview {
              max-width: 100%;
              line-height: 1.45;
              overflow: visible;
              text-overflow: unset;
            }

            .edit-button {
              width: 100%;
              height: 38px;
              padding: 0 12px;
            }
          }

          @media (max-width: 520px) {
            .page-header h1 {
              font-size: 32px;
            }

            .card {
              padding: 14px;
            }

            .card-header h2 {
              font-size: 21px;
            }

            .field-label {
              font-size: 12px;
            }

            .customers-table td {
              grid-template-columns: 88px minmax(0, 1fr);
              padding: 10px;
              gap: 8px;
            }

            .customers-table td::before {
              font-size: 11px;
            }
          }

          @media (max-width: 380px) {
            .customers-table td {
              grid-template-columns: 1fr;
              gap: 5px;
            }

            .customers-table td::before {
              display: block;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}