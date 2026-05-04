'use client';

import AppShell from '../components/AppShell';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';
import PrintLayout from './printlayout';

type CustomerRow = {
  id: string;
  customer_name?: string | null;
  customer_legal_name?: string | null;
  billing_address?: string | null;
  email?: string | null;
  phone?: string | null;
};

type CustomerContactRow = {
  id: string;
  customer_id?: string | null;
  contact_name?: string | null;
  name?: string | null;
  full_name?: string | null;
};

type ProductRow = {
  id: string;
  product_code?: string | null;
  product_name?: string | null;
  product_details?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  default_price?: number | null;
  unit_price?: number | null;
};

type QuoteItem = {
  id: string;
  productId?: string;
  description: string;
  qty: number;
  price: number;
  status: string;
};

type QuotationRow = {
  id: string;
  quotation_number?: string | null;
  quote_date?: string | null;
  customer_id?: string | null;
  customer_name_snapshot?: string | null;
  attention_snapshot?: string | null;
  customer_address_snapshot?: string | null;
  subtotal?: number | null;
  discount_value?: number | null;
  tax_percent?: number | null;
  tax_value?: number | null;
  grand_total?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type QuotationItemRow = {
  id: string;
  quotation_id?: string | null;
  line_no?: number | null;
  product_name_snapshot?: string | null;
  product_description_snapshot?: string | null;
  qty?: number | null;
  unit_price?: number | null;
  line_total?: number | null;
};

type ImageOption = {
  label: string;
  value: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COMPANY_INITIAL = 'CBI';

const LOGO_OPTIONS: ImageOption[] = [
  { label: 'CBI Logo Default', value: '/images/Logo-CBI.png' },
  { label: 'Logo Company', value: '/images/logo_company.png' },
  { label: 'Quotation Header', value: '/images/quotation.png' },
  { label: 'Layout Image', value: '/images/Layout.png' },
];

const ADDRESS_OPTIONS: ImageOption[] = [
  { label: 'Address CBI', value: '/images/address-cbi.png' },
  { label: 'Address Default', value: '/images/address.png' },
];

const DEFAULT_TERMS =
  'Item availability status : Indent 2-3 Weeks\n\nPAYMENT TERMS:\n• Price Offer valid: 7 Days.\n• 70% down payment upon receipt of the purchase order.\n• We will send a proforma invoice for the down payment.\n• The remaining 30% is due upon receipt of the goods in good condition.\n• The delivery process for pre-order items is usually faster than the stated time, but depends on field conditions.';

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getTodayDisplayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `${day}-${month}-${year}`;
}

function displayDateToDbDate(value: string) {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parts = value.split('-');

  if (parts.length !== 3) return value;

  const [day, month, year] = parts;

  return `${year}-${month}-${day}`;
}

function dbDateToDisplayDate(value?: string | null) {
  if (!value) return '-';

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;

  const dateOnly = value.split('T')[0];
  const parts = dateOnly.split('-');

  if (parts.length !== 3) return value;

  const [year, month, day] = parts;

  return `${day}-${month}-${year}`;
}

function romanMonth(month: number) {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month - 1] || '';
}

function getCustomerInitials(value: string) {
  const cleaned = value
    .replace(/\bPT\b/gi, '')
    .replace(/\bCV\b/gi, '')
    .replace(/\bTBK\b/gi, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return 'XX';
}

function generateQuotationNumber(displayDate: string, sequence: number, customerName: string) {
  const [dayText, monthText, yearText] = displayDate.split('-');
  const day = String(Number(dayText || 1)).padStart(2, '0');
  const month = Number(monthText || 1);
  const year = Number(yearText || new Date().getFullYear());
  const dateCode = `${month}${day}`;
  const customerInitial = getCustomerInitials(customerName);

  return `${COMPANY_INITIAL}-${dateCode}.${sequence}-${customerInitial}/${romanMonth(month)}/${year}`;
}

function decodeHtmlEntities(value: string) {
  if (typeof window === 'undefined') {
    return value
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;

  return textarea.value;
}

function stripHtmlToText(value?: string | null) {
  const raw = value || '';

  const withBreaks = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '');

  return decodeHtmlEntities(withBreaks)
    .replace(/\u00a0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ ]{2,}/g, ' ').trim())
    .filter((line, index, arr) => line || arr[index - 1])
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatAddressForQuotation(value?: string | null) {
  const text = stripHtmlToText(value);

  if (!text) return '';

  return text
    .replace(/,\s*(Jl\.|Jalan)\s+/gi, ',\n$1 ')
    .replace(/,\s*(Tanah\s+Abang|Kota\s+Jakarta|Jakarta|Kabupaten|Kab\.|Provinsi)/gi, ',\n$1')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainTextToHtml(value: string) {
  return escapeHtml(value || '').replace(/\n/g, '<br>');
}

function sanitizeHtml(value: string) {
  if (typeof window === 'undefined') return value || '';

  const wrapper = document.createElement('div');
  wrapper.innerHTML = value || '';

  wrapper.querySelectorAll('*').forEach((element) => {
    const tag = element.tagName.toLowerCase();
    const allowed = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'div', 'p', 'ul', 'ol', 'li', 'span'];

    if (!allowed.includes(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      if (attr.name !== 'style') {
        element.removeAttribute(attr.name);
      }
    });
  });

  return wrapper.innerHTML;
}

function toRichHtml(value: string) {
  const text = (value || '').toString();

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return sanitizeHtml(text);
  }

  return plainTextToHtml(text);
}

function toWordsId(value: number) {
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function spell(n: number): string {
    n = Math.floor(n);

    if (n < 12) return units[n];
    if (n < 20) return `${units[n - 10]} Belas`;
    if (n < 100) return `${spell(Math.floor(n / 10))} Puluh ${spell(n % 10)}`.trim();
    if (n < 200) return `Seratus ${spell(n - 100)}`.trim();
    if (n < 1000) return `${spell(Math.floor(n / 100))} Ratus ${spell(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${spell(n - 1000)}`.trim();
    if (n < 1_000_000) return `${spell(Math.floor(n / 1000))} Ribu ${spell(n % 1000)}`.trim();
    if (n < 1_000_000_000) return `${spell(Math.floor(n / 1_000_000))} Juta ${spell(n % 1_000_000)}`.trim();
    if (n < 1_000_000_000_000) return `${spell(Math.floor(n / 1_000_000_000))} Miliar ${spell(n % 1_000_000_000)}`.trim();

    return `${spell(Math.floor(n / 1_000_000_000_000))} Triliun ${spell(n % 1_000_000_000_000)}`.trim();
  }

  const rounded = Math.round(value);

  if (rounded === 0) return 'Nol Rupiah';

  return `${spell(rounded)} Rupiah`.replace(/\s+/g, ' ').trim();
}

function getItemProductName(item: QuoteItem, productsById: Map<string, ProductRow>) {
  if (item.productId) {
    const product = productsById.get(item.productId);
    const productName = product?.product_name?.trim();

    if (productName) return productName;
  }

  const plain = stripHtmlToText(item.description);

  return plain.split('\n').filter(Boolean)[0] || 'Manual Product';
}

function getItemDetailSpec(item: QuoteItem) {
  return sanitizeHtml(item.description || '');
}

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) return;

    const normalized = sanitizeHtml(value || '');

    if (editor.innerHTML !== normalized) {
      editor.innerHTML = normalized;
    }
  }, [value]);

  function saveSelection() {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();

    if (!selection) return;

    selection.removeAllRanges();

    if (selectionRef.current) {
      selection.addRange(selectionRef.current);
    }
  }

  function emitChange() {
    const html = sanitizeHtml(editorRef.current?.innerHTML || '');
    onChange(html);
  }

  function exec(command: string, valueArg?: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, valueArg);
    saveSelection();
    emitChange();
  }

  function toggleAllCaps() {
    editorRef.current?.focus();
    restoreSelection();

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const upper = selection.toString().toUpperCase();
    document.execCommand('insertHTML', false, `<span>${escapeHtml(upper)}</span>`);
    saveSelection();
    emitChange();
  }

  function handleInput() {
    emitChange();
    saveSelection();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();

    const text = event.clipboardData.getData('text/plain');

    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, plainTextToHtml(text));
    saveSelection();
    emitChange();
  }

  const showPlaceholder = !stripHtmlToText(value) && !focused;

  return (
    <div style={styles.richEditorBox}>
      <div
        style={styles.richToolbar}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        <button type="button" style={styles.editorButton} onClick={() => exec('bold')}>
          <b>B</b>
        </button>
        <button type="button" style={styles.editorButton} onClick={() => exec('italic')}>
          <i>I</i>
        </button>
        <button type="button" style={styles.editorButton} onClick={() => exec('underline')}>
          <u>U</u>
        </button>
        <button type="button" style={styles.editorButton} onClick={() => exec('strikeThrough')}>
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <button type="button" style={styles.editorTextButton} onClick={() => exec('insertUnorderedList')}>
          • List
        </button>
        <button type="button" style={styles.editorTextButton} onClick={() => exec('insertOrderedList')}>
          1. List
        </button>
        <button type="button" style={styles.editorTextButton} onClick={toggleAllCaps}>
          ABC
        </button>
      </div>

      <div style={styles.editorContentWrap}>
        {showPlaceholder ? <div style={styles.editorPlaceholder}>{placeholder}</div> : null}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={() => {
            saveSelection();
            setFocused(false);
            emitChange();
          }}
          onFocus={() => setFocused(true)}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onPaste={handlePaste}
          style={styles.richEditor}
        />
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [contacts, setContacts] = useState<CustomerContactRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [quotationList, setQuotationList] = useState<QuotationRow[]>([]);
  const [quotationItems, setQuotationItems] = useState<QuotationItemRow[]>([]);

  const productsById = useMemo(() => {
    const map = new Map<string, ProductRow>();

    products.forEach((product) => {
      map.set(product.id, product);
    });

    return map;
  }, [products]);

  const [quoteNo, setQuoteNo] = useState('');
  const [quoteDate, setQuoteDate] = useState(getTodayDisplayDate());
  const [customerId, setCustomerId] = useState('');
  const [attention, setAttention] = useState('');
  const [address, setAddress] = useState('');
  const [priority, setPriority] = useState('CUSTOMER PRIORITY');
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [logoPrintSrc, setLogoPrintSrc] = useState(LOGO_OPTIONS[0].value);
  const [addressImageSrc, setAddressImageSrc] = useState(ADDRESS_OPTIONS[0].value);

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 'item-1',
      productId: '',
      description: '',
      qty: 1,
      price: 0,
      status: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === customerId), [customers, customerId]);
  const selectedContact = useMemo(() => contacts.find((contact) => contact.customer_id === customerId), [contacts, customerId]);

  const customerName = selectedCustomer?.customer_legal_name || selectedCustomer?.customer_name || '';
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items]);
  const discountValue = useMemo(() => Math.min(discountAmount, subtotal), [discountAmount, subtotal]);
  const taxValue = useMemo(() => ((subtotal - discountValue) * taxPercent) / 100, [subtotal, discountValue, taxPercent]);
  const grandTotal = useMemo(() => subtotal - discountValue + taxValue, [subtotal, discountValue, taxValue]);
  const inWords = useMemo(() => toWordsId(grandTotal), [grandTotal]);

  async function loadData() {
    setLoading(true);
    setMessage('');

    const [customerRes, contactRes, productRes, quotationRes, quotationItemRes] = await Promise.all([
      supabase.from('customers').select('*').order('customer_name', { ascending: true }),
      supabase.from('customer_contacts').select('*'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(25),
      supabase.from('quotation_items').select('*'),
    ]);

    if (customerRes.error) setMessage(customerRes.error.message);
    if (productRes.error) setMessage(productRes.error.message);
    if (quotationRes.error) setMessage(quotationRes.error.message);

    setCustomers((customerRes.data || []) as CustomerRow[]);
    setContacts((contactRes.data || []) as CustomerContactRow[]);
    setProducts((productRes.data || []) as ProductRow[]);
    setQuotationList((quotationRes.data || []) as QuotationRow[]);
    setQuotationItems((quotationItemRes.data || []) as QuotationItemRow[]);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const contactName =
      selectedContact?.contact_name ||
      selectedContact?.full_name ||
      selectedContact?.name ||
      selectedCustomer?.customer_name ||
      '';

    if (customerId) {
      setAttention(contactName);
      setAddress(formatAddressForQuotation(selectedCustomer?.billing_address || ''));
    }
  }, [customerId, selectedContact, selectedCustomer]);

  useEffect(() => {
    const status = items.find((item) => item.status.trim())?.status.trim();

    if (!status) return;

    setTerms((prev) => {
      const lines = prev.split('\n');
      lines[0] = `Item availability status : ${status}`;
      return lines.join('\n');
    });
  }, [items]);

  async function updateAutoQuoteNo(nextCustomerId = customerId, nextDisplayDate = quoteDate) {
    const customer = customers.find((row) => row.id === nextCustomerId);
    const name = customer?.customer_legal_name || customer?.customer_name || '';

    if (!name || !nextDisplayDate) return;

    const dbDate = displayDateToDbDate(nextDisplayDate);

    const { count } = await supabase
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('quote_date', dbDate);

    setQuoteNo(generateQuotationNumber(nextDisplayDate, (count || 0) + 1, name));
  }

  useEffect(() => {
    if (customerId && customers.length > 0 && !quoteNo) {
      updateAutoQuoteNo(customerId, quoteDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, customers.length]);

  function handleCustomerChange(value: string) {
    setCustomerId(value);

    const customer = customers.find((row) => row.id === value);
    const contact = contacts.find((row) => row.customer_id === value);

    if (customer) {
      setAttention(contact?.contact_name || contact?.full_name || contact?.name || customer.customer_name || '');
      setAddress(formatAddressForQuotation(customer.billing_address || ''));
      setTimeout(() => updateAutoQuoteNo(value, quoteDate), 0);
      return;
    }

    setAttention('');
    setAddress('');
  }

  function handleDateChange(value: string) {
    setQuoteDate(value);
    setTimeout(() => updateAutoQuoteNo(customerId, value), 0);
  }

  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find((row) => row.id === productId);

    if (!product) {
      updateItem(itemId, { productId: '', description: '', price: 0 });
      return;
    }

    const details = product.product_details || product.description || '';
    const price = Number(product.unit_price || product.default_price || 0);

    updateItem(itemId, {
      productId,
      description: toRichHtml(details),
      price,
      qty: Number(product.quantity || 1),
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: '',
        description: '',
        qty: 1,
        price: 0,
        status: '',
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          productId: '',
          description: '',
          qty: 1,
          price: 0,
          status: '',
        },
      ]);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function saveQuotation() {
    if (!selectedCustomer) {
      setMessage('Pilih customer terlebih dahulu.');
      return;
    }

    const validItems = items.filter((item) => item.productId || stripHtmlToText(item.description));

    if (validItems.length === 0) {
      setMessage('Quotation items required.');
      return;
    }

    setQuoteLoading(true);
    setMessage('');

    let finalQuoteNo = quoteNo.trim();

    if (!finalQuoteNo) {
      const dbDate = displayDateToDbDate(quoteDate);

      const { count } = await supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .eq('quote_date', dbDate);

      finalQuoteNo = generateQuotationNumber(quoteDate, (count || 0) + 1, customerName);
      setQuoteNo(finalQuoteNo);
    }

    const quotePayload = {
      quotation_number: finalQuoteNo,
      quote_date: displayDateToDbDate(quoteDate),
      customer_id: selectedCustomer.id,
      customer_name_snapshot: customerName,
      customer_address_snapshot: address,
      attention_snapshot: attention,
      currency: 'IDR',
      subtotal,
      discount_value: discountValue,
      tax_percent: taxPercent,
      tax_value: taxValue,
      grand_total: grandTotal,
      status: 'Simpan',
      updated_at: new Date().toISOString(),
    };

    let quotationId = editingId;

    if (editingId) {
      const { error } = await supabase.from('quotations').update(quotePayload).eq('id', editingId);

      if (error) {
        setQuoteLoading(false);
        setMessage(error.message);
        return;
      }

      await supabase.from('quotation_items').delete().eq('quotation_id', editingId);
    } else {
      const { data, error } = await supabase
        .from('quotations')
        .insert({
          ...quotePayload,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        setQuoteLoading(false);
        setMessage(error.message);
        return;
      }

      quotationId = data.id;
    }

    const itemRows = validItems.map((item, index) => ({
      quotation_id: quotationId,
      line_no: index + 1,
      product_name_snapshot: getItemProductName(item, productsById),
      product_description_snapshot: stripHtmlToText(item.description),
      qty: item.qty,
      unit: 'Unit',
      unit_price: item.price,
      discount_value: 0,
      line_total: item.qty * item.price,
    }));

    const { error: itemError } = await supabase.from('quotation_items').insert(itemRows);

    if (itemError) {
      setQuoteLoading(false);
      setMessage(itemError.message);
      return;
    }

    setQuoteLoading(false);
    setEditingId(null);
    setMessage(editingId ? 'Quotation berhasil di-update.' : 'Quotation berhasil disimpan.');
    await loadData();
  }

  function resetForm() {
    setQuoteNo('');
    setQuoteDate(getTodayDisplayDate());
    setCustomerId('');
    setAttention('');
    setAddress('');
    setPriority('CUSTOMER PRIORITY');
    setTerms(DEFAULT_TERMS);
    setDiscountAmount(0);
    setTaxPercent(0);
    setEditingId(null);
    setItems([
      {
        id: `item-${Date.now()}`,
        productId: '',
        description: '',
        qty: 1,
        price: 0,
        status: '',
      },
    ]);
    setMessage('');
  }

  async function loadQuotationByQuoteNo() {
    const trimmed = quoteNo.trim();

    if (!trimmed) return;

    const { data, error } = await supabase.from('quotations').select('*').eq('quotation_number', trimmed).single();

    if (error || !data) {
      setMessage(error?.message || 'Quotation tidak ditemukan.');
      return;
    }

    applyQuotation(data as QuotationRow);
  }

  function applyQuotation(quotation: QuotationRow) {
    setEditingId(quotation.id);
    setQuoteNo(quotation.quotation_number || '');
    setQuoteDate(dbDateToDisplayDate(quotation.quote_date));
    setCustomerId(quotation.customer_id || '');
    setAttention(quotation.attention_snapshot || '');
    setDiscountAmount(Number(quotation.discount_value || 0));
    setTaxPercent(Number(quotation.tax_percent || 0));

    const customer = customers.find((row) => row.id === quotation.customer_id);

    if (customer) {
      setAddress(formatAddressForQuotation(customer.billing_address || ''));
    } else {
      setAddress(formatAddressForQuotation(quotation.customer_address_snapshot || ''));
    }

    const relatedItems = quotationItems
      .filter((row) => row.quotation_id === quotation.id)
      .sort((a, b) => Number(a.line_no || 0) - Number(b.line_no || 0));

    setItems(
      relatedItems.length > 0
        ? relatedItems.map((row) => ({
            id: row.id,
            productId: '',
            description: toRichHtml(row.product_description_snapshot || ''),
            qty: Number(row.qty || 1),
            price: Number(row.unit_price || 0),
            status: 'Indent 2-3 Weeks',
          }))
        : [
            {
              id: `item-${Date.now()}`,
              productId: '',
              description: '',
              qty: 1,
              price: 0,
              status: '',
            },
          ]
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function printQuotation(quotation: QuotationRow) {
    applyQuotation(quotation);

    setTimeout(() => {
      window.print();
    }, 250);
  }

  async function handlePrint() {
    if (!selectedCustomer) {
      setMessage('Pilih customer terlebih dahulu.');
      return;
    }

    if (items.filter((item) => item.productId || stripHtmlToText(item.description)).length === 0) {
      setMessage('Minimal isi 1 item.');
      return;
    }

    window.print();
  }

  return (
    <AppShell activeMenu="Quotations">
      <main style={styles.page}>
        <section style={styles.topHeader}>
          <div>
            <div style={styles.kicker}>SALES-APP / MARKETING / SALES</div>
            <h1 style={styles.title}>Quotation</h1>
          </div>
        </section>

        {message ? (
          <div style={message.toLowerCase().includes('berhasil') ? styles.successBox : styles.errorBox}>
            {message}
          </div>
        ) : null}

        <section style={styles.card}>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              QUOTE NO.#
              <div style={styles.quoteInputRow}>
                <input
                  value={quoteNo}
                  onChange={(event) => setQuoteNo(event.target.value)}
                  style={styles.input}
                  placeholder="Auto jika kosong"
                />
                <button type="button" onClick={loadQuotationByQuoteNo} style={styles.loadButton}>
                  Load
                </button>
              </div>
            </label>

            <label style={styles.label}>
              DATE
              <input value={quoteDate} onChange={(event) => handleDateChange(event.target.value)} style={styles.input} />
            </label>

            <label style={styles.label}>
              CUSTOMER
              <select value={customerId} onChange={(event) => handleCustomerChange(event.target.value)} style={styles.input}>
                <option value="">Pilih customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_legal_name || customer.customer_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              LOGO PRINT
              <select value={logoPrintSrc} onChange={(event) => setLogoPrintSrc(event.target.value)} style={styles.input}>
                {LOGO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              ADDRESS IMAGE
              <select value={addressImageSrc} onChange={(event) => setAddressImageSrc(event.target.value)} style={styles.input}>
                {ADDRESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              DEAR
              <input value={attention} onChange={(event) => setAttention(event.target.value)} style={styles.input} />
            </label>

            <label style={styles.label}>
              CUSTOMER PRIORITY
              <input value={priority} onChange={(event) => setPriority(event.target.value)} style={styles.input} />
            </label>

            <label style={styles.label}>
              ADDRESS
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} style={styles.addressTextarea} />
            </label>
          </div>

          <section style={styles.itemsSection}>
            <div style={styles.sectionLabel}>Items</div>

            <div style={styles.itemsTableWrap}>
              <table style={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={styles.thNo}>No</th>
                    <th style={styles.thProduct}>Product</th>
                    <th style={styles.thSpec}>Detail Spec</th>
                    <th style={styles.thQty}>Qty</th>
                    <th style={styles.thPrice}>Price (IDR)</th>
                    <th style={styles.thTotal}>Total (IDR)</th>
                    <th style={styles.thStatus}>Status</th>
                    <th style={styles.thAction}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td style={styles.td}>{index + 1}</td>

                      <td style={styles.td}>
                        <select value={item.productId || ''} onChange={(event) => selectProduct(item.id, event.target.value)} style={styles.productSelect}>
                          <option value="">Manual</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.tdSpec}>
                        <RichTextEditor
                          value={item.description}
                          onChange={(nextValue) => updateItem(item.id, { description: nextValue })}
                          placeholder="Akan terisi otomatis dari Products setelah pilih product"
                        />
                      </td>

                      <td style={styles.td}>
                        <input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, { qty: toNumber(event.target.value) })}
                          style={styles.qtyInput}
                        />
                      </td>

                      <td style={styles.td}>
                        <input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(event) => updateItem(item.id, { price: toNumber(event.target.value) })}
                          style={styles.priceInput}
                        />
                      </td>

                      <td style={styles.tdTotalValue}>{formatCurrency(item.qty * item.price)}</td>

                      <td style={styles.td}>
                        <input value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value })} style={styles.statusInput} />
                      </td>

                      <td style={styles.tdAction}>
                        <button type="button" onClick={() => removeItem(item.id)} style={styles.removeButton}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.addItemWrap}>
              <button type="button" onClick={addItem} style={styles.addItemButton}>
                Add Item
              </button>
            </div>
          </section>

          <section style={styles.bottomGrid}>
            <div>
              <div style={styles.sectionLabel}>Terms & Conditions</div>
              <textarea value={terms} onChange={(event) => setTerms(event.target.value)} style={styles.termsTextarea} />
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <b>{formatCurrency(subtotal)}</b>
              </div>

              <div style={styles.summaryRow}>
                <span>Discount</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(toNumber(event.target.value))}
                  style={styles.summaryInput}
                />
              </div>

              <div style={styles.summaryRow}>
                <span>Tax (%)</span>
                <input
                  type="number"
                  min={0}
                  value={taxPercent}
                  onChange={(event) => setTaxPercent(toNumber(event.target.value))}
                  style={styles.summaryInput}
                />
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.grandRow}>
                <span>Grand Total</span>
                <b>{formatCurrency(grandTotal)}</b>
              </div>

              <div style={styles.inWordsLabel}>In words</div>
              <div style={styles.inWordsBox}>{inWords}</div>

              <div style={styles.summaryActions}>
                <button type="button" onClick={saveQuotation} style={styles.secondaryButton} disabled={quoteLoading || loading}>
                  {editingId ? 'Update' : 'Save'}
                </button>

                <button type="button" onClick={resetForm} style={styles.secondaryButton} disabled={quoteLoading}>
                  New
                </button>

                <button type="button" onClick={handlePrint} style={styles.printButton}>
                  Print
                </button>
              </div>
            </div>
          </section>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>Quotation List</div>

          <div style={styles.quoteListWrap}>
            <table style={styles.quoteListTable}>
              <thead>
                <tr>
                  <th style={styles.quoteTh}>Quote No</th>
                  <th style={styles.quoteTh}>Date</th>
                  <th style={styles.quoteTh}>Customer</th>
                  <th style={styles.quoteTh}>Total</th>
                  <th style={styles.quoteThAction}>Action</th>
                </tr>
              </thead>

              <tbody>
                {quotationList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyTd}>
                      Belum ada quotation tersimpan.
                    </td>
                  </tr>
                ) : (
                  quotationList.map((quotation) => (
                    <tr key={quotation.id}>
                      <td style={styles.quoteTdBold}>{quotation.quotation_number || '-'}</td>
                      <td style={styles.quoteTd}>{dbDateToDisplayDate(quotation.quote_date)}</td>
                      <td style={styles.quoteTd}>{quotation.customer_name_snapshot || '-'}</td>
                      <td style={styles.quoteTdBold}>{formatCurrency(Number(quotation.grand_total || 0))}</td>
                      <td style={styles.quoteTdAction}>
                        <button type="button" onClick={() => applyQuotation(quotation)} style={styles.listEditButton}>
                          Edit
                        </button>
                        <button type="button" onClick={() => printQuotation(quotation)} style={styles.listPrintButton}>
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PrintLayout
          quoteNo={quoteNo}
          quoteDate={quoteDate}
          customerName={customerName}
          attention={attention}
          address={address}
          priority={priority}
          terms={terms}
          logoSrc={logoPrintSrc}
          addressImageSrc={addressImageSrc}
          items={items}
          subtotal={subtotal}
          discountValue={discountValue}
          taxPercent={taxPercent}
          taxValue={taxValue}
          grandTotal={grandTotal}
          inWords={inWords}
          formatCurrency={formatCurrency}
          getProductName={(item) => getItemProductName(item, productsById)}
          getDetailSpec={getItemDetailSpec}
        />
      </main>
    </AppShell>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100%',
    background: 'transparent',
    padding: 0,
    color: '#1f2937',
    fontFamily: 'Arial, sans-serif',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  topHeader: {
    display: 'block',
    marginBottom: 22,
    background: 'transparent',
    padding: 0,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
    color: '#111827',
    fontWeight: 700,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.04)',
    boxSizing: 'border-box',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '22px 20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    fontSize: 12,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  input: {
    height: 42,
    borderRadius: 11,
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    textTransform: 'none',
    fontWeight: 400,
  },
  quoteInputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 56px',
    gap: 8,
  },
  loadButton: {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    borderRadius: 11,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  addressTextarea: {
    minHeight: 96,
    borderRadius: 11,
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    width: '100%',
    textTransform: 'none',
    fontWeight: 400,
  },
  itemsSection: {
    marginTop: 28,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 12,
  },
  itemsTableWrap: {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflowX: 'auto',
    background: '#ffffff',
  },
  itemsTable: {
    width: '100%',
    minWidth: 1120,
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    fontSize: 14,
  },
  thNo: {
    width: 54,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thProduct: {
    width: 230,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thSpec: {
    width: 380,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thQty: {
    width: 110,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thPrice: {
    width: 150,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thTotal: {
    width: 150,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thStatus: {
    width: 170,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  thAction: {
    width: 115,
    padding: '14px 14px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'right',
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px 14px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    color: '#111827',
  },
  tdSpec: {
    padding: '16px 14px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'top',
    color: '#111827',
  },
  tdTotalValue: {
    padding: '16px 14px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    color: '#111827',
    fontWeight: 700,
  },
  tdAction: {
    padding: '16px 14px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    textAlign: 'right',
  },
  productSelect: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    padding: '0 12px',
    background: '#ffffff',
    color: '#111827',
    outline: 'none',
  },
  qtyInput: {
    width: 84,
    height: 42,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    padding: '0 12px',
    outline: 'none',
  },
  priceInput: {
    width: 140,
    height: 42,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    padding: '0 12px',
    outline: 'none',
  },
  statusInput: {
    width: 160,
    height: 42,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    padding: '0 12px',
    outline: 'none',
  },
  removeButton: {
    border: '1px solid #fee2e2',
    background: '#ffffff',
    color: '#dc2626',
    borderRadius: 9,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  addItemWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  addItemButton: {
    border: 0,
    background: '#17324d',
    color: '#ffffff',
    borderRadius: 12,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 520px',
    gap: 24,
    marginTop: 28,
    alignItems: 'start',
  },
  termsTextarea: {
    width: '100%',
    minHeight: 180,
    borderRadius: 12,
    border: '1px solid #d1d5db',
    padding: 14,
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
    boxSizing: 'border-box',
  },
  summaryBox: {
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 18,
    boxSizing: 'border-box',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 14,
    fontSize: 14,
    color: '#4b5563',
  },
  summaryInput: {
    width: 130,
    height: 36,
    textAlign: 'right',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: '0 10px',
    outline: 'none',
    background: '#ffffff',
  },
  summaryDivider: {
    height: 1,
    background: '#e5e7eb',
    margin: '18px 0',
  },
  grandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  inWordsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  inWordsBox: {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    borderRadius: 9,
    padding: '8px 10px',
    fontSize: 14,
    color: '#111827',
  },
  summaryActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    borderRadius: 11,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  printButton: {
    border: 0,
    background: '#17324d',
    color: '#ffffff',
    borderRadius: 11,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
  quoteListWrap: {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflowX: 'auto',
  },
  quoteListTable: {
    width: '100%',
    minWidth: 760,
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  quoteTh: {
    padding: '14px 16px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
  },
  quoteThAction: {
    padding: '14px 16px',
    background: '#fafafa',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'right',
    borderBottom: '1px solid #f1f5f9',
  },
  quoteTd: {
    padding: '16px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#111827',
  },
  quoteTdBold: {
    padding: '16px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#111827',
    fontWeight: 800,
  },
  quoteTdAction: {
    padding: '16px 16px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  listEditButton: {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  listPrintButton: {
    border: 0,
    background: '#17324d',
    color: '#ffffff',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  emptyTd: {
    padding: 24,
    textAlign: 'center',
    color: '#6b7280',
    borderBottom: '1px solid #f1f5f9',
  },
  richEditorBox: {
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: '#ffffff',
    overflow: 'hidden',
  },
  richToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 9px',
    background: '#ffffff',
  },
  editorButton: {
    minWidth: 28,
    height: 28,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    borderRadius: 6,
    color: '#374151',
    cursor: 'pointer',
  },
  editorTextButton: {
    height: 28,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    borderRadius: 6,
    color: '#374151',
    padding: '0 8px',
    fontSize: 12,
    cursor: 'pointer',
  },
  editorContentWrap: {
    position: 'relative',
  },
  editorPlaceholder: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 1.6,
    pointerEvents: 'none',
  },
  richEditor: {
    minHeight: 112,
    padding: '12px 12px',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#111827',
    whiteSpace: 'pre-wrap',
  },
  successBox: {
    background: '#ecfdf3',
    color: '#08753b',
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontWeight: 700,
  },
  errorBox: {
    background: '#fff0f0',
    color: '#b00020',
    border: '1px solid #fecaca',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontWeight: 700,
  },
};