'use client';

import AppShell from '../components/AppShell';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  customer_address_snapshot?: string | null;
  attention_snapshot?: string | null;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COMPANY_INITIAL = 'CBI';
const LOGO_SRC = '/images/Logo-CBI.png';
const ADDRESS_IMAGE_SRC = '/images/address-cbi.png';

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
  if (!value) return getTodayDisplayDate();

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

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
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
    <div className="rich-editor-box">
      <div
        className="rich-toolbar"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        <button type="button" className="editor-button" onClick={() => exec('bold')}>
          <b>B</b>
        </button>
        <button type="button" className="editor-button" onClick={() => exec('italic')}>
          <i>I</i>
        </button>
        <button type="button" className="editor-button" onClick={() => exec('underline')}>
          <u>U</u>
        </button>
        <button type="button" className="editor-button" onClick={() => exec('strikeThrough')}>
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <button type="button" className="editor-text-button" onClick={() => exec('insertUnorderedList')}>
          • List
        </button>
        <button type="button" className="editor-text-button" onClick={() => exec('insertOrderedList')}>
          1. List
        </button>
        <button type="button" className="editor-text-button" onClick={toggleAllCaps}>
          ABC
        </button>
      </div>

      <div className="editor-content-wrap">
        {showPlaceholder ? <div className="editor-placeholder">{placeholder}</div> : null}

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
          className="rich-editor"
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
  const [taxPercent, setTaxPercent] = useState(11);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setTaxPercent(11);
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
    setTaxPercent(Number(quotation.tax_percent ?? 11));

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
    }, 350);
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
      <main className="quotation-page">
        <section className="top-header">
          <div>
            <div className="kicker">SALES-APP / MARKETING / SALES</div>
            <h1 className="page-title">Quotation</h1>
            <p className="page-subtitle">Buat quotation dari customer dan product master.</p>
          </div>

          <img src={LOGO_SRC} alt="Company Logo" className="header-logo" />
        </section>

        {message ? (
          <div className={message.toLowerCase().includes('berhasil') ? 'success-box' : 'error-box'}>
            {message}
          </div>
        ) : null}

        <section className="content-card">
          <div className="form-grid">
            <label className="field-label">
              QUOTE NO.#
              <div className="quote-input-row">
                <input
                  value={quoteNo}
                  onChange={(event) => setQuoteNo(event.target.value)}
                  className="input"
                  placeholder="Auto jika kosong"
                />
                <button type="button" onClick={loadQuotationByQuoteNo} className="load-button">
                  Load
                </button>
              </div>
            </label>

            <label className="field-label">
              DATE
              <input value={quoteDate} onChange={(event) => handleDateChange(event.target.value)} className="input" />
            </label>

            <label className="field-label">
              CUSTOMER
              <select value={customerId} onChange={(event) => handleCustomerChange(event.target.value)} className="input">
                <option value="">Pilih customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_legal_name || customer.customer_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              LOGO PRINT
              <select value={LOGO_SRC} className="input" disabled>
                <option value={LOGO_SRC}>CBI Logo Default</option>
              </select>
            </label>

            <label className="field-label">
              ADDRESS IMAGE
              <select value={ADDRESS_IMAGE_SRC} className="input" disabled>
                <option value={ADDRESS_IMAGE_SRC}>Address Default</option>
              </select>
            </label>

            <label className="field-label">
              DEAR
              <input value={attention} onChange={(event) => setAttention(event.target.value)} className="input" />
            </label>

            <label className="field-label">
              CUSTOMER PRIORITY
              <input value={priority} onChange={(event) => setPriority(event.target.value)} className="input" />
            </label>

            <label className="field-label field-full">
              ADDRESS
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="address-textarea" />
            </label>
          </div>

          <section className="items-section">
            <div className="section-title">Items</div>

            <div className="items-table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Product</th>
                    <th>Detail Spec</th>
                    <th>Qty</th>
                    <th>Price IDR</th>
                    <th>Total IDR</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td data-label="No" className="td-no">
                        {index + 1}
                      </td>

                      <td data-label="Product">
                        <select
                          value={item.productId || ''}
                          onChange={(event) => selectProduct(item.id, event.target.value)}
                          className="product-select"
                        >
                          <option value="">Manual</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td data-label="Detail Spec" className="td-spec">
                        <RichTextEditor
                          value={item.description}
                          onChange={(nextValue) => updateItem(item.id, { description: nextValue })}
                          placeholder="Akan terisi otomatis dari Products setelah pilih product"
                        />
                      </td>

                      <td data-label="Qty">
                        <input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, { qty: toNumber(event.target.value) })}
                          className="number-input"
                        />
                      </td>

                      <td data-label="Price IDR">
                        <input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(event) => updateItem(item.id, { price: toNumber(event.target.value) })}
                          className="price-input"
                        />
                      </td>

                      <td data-label="Total IDR" className="total-cell">
                        {formatCurrency(item.qty * item.price)}
                      </td>

                      <td data-label="Status">
                        <input
                          value={item.status}
                          onChange={(event) => updateItem(item.id, { status: event.target.value })}
                          className="status-input"
                          placeholder="Indent 2-3 Weeks"
                        />
                      </td>

                      <td data-label="Action">
                        <button type="button" onClick={() => removeItem(item.id)} className="remove-button">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="add-item-wrap">
              <button type="button" onClick={addItem} className="add-item-button">
                Add Item
              </button>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="terms-panel">
              <div className="section-title">Terms & Conditions</div>
              <textarea value={terms} onChange={(event) => setTerms(event.target.value)} className="terms-textarea" />
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span>Subtotal</span>
                <b>{formatCurrency(subtotal)}</b>
              </div>

              <div className="summary-row">
                <span>Discount</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(toNumber(event.target.value))}
                  className="summary-input"
                />
              </div>

              <div className="summary-row">
                <span>Tax (%)</span>
                <input
                  type="number"
                  min={0}
                  value={taxPercent}
                  onChange={(event) => setTaxPercent(toNumber(event.target.value))}
                  className="summary-input"
                />
              </div>

              <div className="summary-divider" />

              <div className="grand-row">
                <span>Grand Total</span>
                <b>{formatCurrency(grandTotal)}</b>
              </div>

              <div className="in-words-label">In words</div>
              <div className="in-words-box">{inWords}</div>

              <div className="summary-actions">
                <button type="button" onClick={saveQuotation} className="secondary-button" disabled={quoteLoading || loading}>
                  {quoteLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>

                <button type="button" onClick={resetForm} className="secondary-button" disabled={quoteLoading}>
                  New
                </button>

                <button type="button" onClick={handlePrint} className="print-button">
                  Print
                </button>
              </div>
            </div>
          </section>
        </section>

        <section className="content-card">
          <div className="list-header">
            <div>
              <h2>Quotation List</h2>
              <p>Daftar quotation yang sudah tersimpan.</p>
            </div>

            <button type="button" onClick={loadData} className="refresh-button" disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="quotation-list-wrap">
            <table className="quotation-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Quotation No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Attention</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {quotationList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      Belum ada quotation.
                    </td>
                  </tr>
                ) : (
                  quotationList.map((quotation, index) => (
                    <tr key={quotation.id}>
                      <td data-label="No">{index + 1}</td>
                      <td data-label="Quotation No">
                        <strong>{quotation.quotation_number || '-'}</strong>
                      </td>
                      <td data-label="Date">{dbDateToDisplayDate(quotation.quote_date)}</td>
                      <td data-label="Customer">{quotation.customer_name_snapshot || '-'}</td>
                      <td data-label="Attention">{quotation.attention_snapshot || '-'}</td>
                      <td data-label="Grand Total">Rp {formatCurrency(Number(quotation.grand_total || 0))}</td>
                      <td data-label="Status">
                        <span className="status-pill">{quotation.status || 'Simpan'}</span>
                      </td>
                      <td data-label="Action">
                        <div className="list-actions">
                          <button type="button" onClick={() => applyQuotation(quotation)} className="edit-button">
                            Edit
                          </button>
                          <button type="button" onClick={() => printQuotation(quotation)} className="print-small-button">
                            Print
                          </button>
                        </div>
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
          logoSrc={LOGO_SRC}
          addressImageSrc={ADDRESS_IMAGE_SRC}
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

        <style jsx>{`
          .quotation-page {
            min-height: 100%;
            background: #dfe8f2;
            color: #062b52;
            font-family: Arial, Helvetica, sans-serif;
            overflow-x: hidden;
          }

          .top-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 18px;
          }

          .kicker {
            color: #3b6fa5;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .page-title {
            margin: 0;
            font-size: 40px;
            line-height: 1;
            font-weight: 400;
            color: #062b52;
          }

          .page-subtitle {
            margin: 10px 0 0;
            color: #506f90;
            font-size: 17px;
            line-height: 1.35;
          }

          .header-logo {
            width: 150px;
            max-width: 28%;
            height: auto;
            object-fit: contain;
          }

          .success-box,
          .error-box {
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 16px;
            font-weight: 800;
            line-height: 1.35;
          }

          .success-box {
            background: #e9f9ef;
            border: 1px solid #bce8ce;
            color: #08753b;
          }

          .error-box {
            background: #fff0f0;
            border: 1px solid #ffc5c5;
            color: #b00020;
          }

          .content-card {
            background: #ffffff;
            border: 1px solid #d8e3ef;
            border-radius: 22px;
            padding: 24px;
            margin-bottom: 20px;
            overflow: hidden;
            box-sizing: border-box;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 22px;
          }

          .field-full {
            grid-column: span 3;
          }

          .field-label {
            display: flex;
            flex-direction: column;
            gap: 8px;
            color: #4f6480;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            min-width: 0;
          }

          .input,
          .address-textarea,
          .terms-textarea,
          .summary-input,
          .product-select,
          .number-input,
          .price-input,
          .status-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #cfdceb;
            border-radius: 13px;
            background: #ffffff;
            color: #062b52;
            outline: none;
            font-size: 15px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .input {
            height: 48px;
            padding: 0 14px;
          }

          .quote-input-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 76px;
            gap: 10px;
          }

          .load-button,
          .refresh-button,
          .secondary-button,
          .print-button,
          .edit-button,
          .print-small-button,
          .remove-button,
          .add-item-button {
            border: 0;
            cursor: pointer;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 900;
            border-radius: 13px;
            transition: 0.15s ease;
          }

          .load-button {
            background: #ffffff;
            color: #062b52;
            border: 1px solid #d5e0ec;
            min-height: 48px;
          }

          .refresh-button {
            background: #ffffff;
            color: #075a9f;
            border: 1px solid #cfdceb;
            padding: 12px 18px;
            min-height: 44px;
          }

          .address-textarea {
            min-height: 110px;
            padding: 12px 14px;
            resize: vertical;
            line-height: 1.45;
          }

          .items-section {
            margin-top: 8px;
          }

          .section-title {
            font-size: 20px;
            line-height: 1.2;
            font-weight: 900;
            margin-bottom: 12px;
            color: #062b52;
          }

          .items-table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #d8e3ef;
            border-radius: 18px;
            -webkit-overflow-scrolling: touch;
          }

          .items-table {
            width: 100%;
            min-width: 1080px;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 13px;
          }

          .items-table th {
            background: #f4f8fc;
            border-bottom: 1px solid #d8e3ef;
            color: #193a5b;
            text-align: left;
            padding: 12px;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
          }

          .items-table th:nth-child(1) {
            width: 52px;
          }

          .items-table th:nth-child(2) {
            width: 190px;
          }

          .items-table th:nth-child(3) {
            width: 380px;
          }

          .items-table th:nth-child(4) {
            width: 85px;
          }

          .items-table th:nth-child(5),
          .items-table th:nth-child(6) {
            width: 145px;
          }

          .items-table th:nth-child(7) {
            width: 160px;
          }

          .items-table th:nth-child(8) {
            width: 120px;
          }

          .items-table td {
            border-bottom: 1px solid #edf2f7;
            padding: 12px;
            vertical-align: top;
            color: #173b5f;
          }

          .td-no {
            font-weight: 900;
          }

          .product-select {
            height: 44px;
            padding: 0 12px;
          }

          .number-input,
          .price-input,
          .status-input {
            height: 42px;
            padding: 0 10px;
          }

          .total-cell {
            font-weight: 900;
            white-space: nowrap;
          }

          .rich-editor-box {
            border: 1px solid #cfdceb;
            border-radius: 14px;
            background: #ffffff;
            overflow: hidden;
          }

          .rich-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px;
            border-bottom: 1px solid #dbe5ef;
            background: #f7fbff;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .editor-button,
          .editor-text-button {
            border: 1px solid #cfdceb;
            background: #ffffff;
            color: #062b52;
            border-radius: 9px;
            min-width: 34px;
            height: 34px;
            padding: 0 10px;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            flex: 0 0 auto;
          }

          .editor-content-wrap {
            position: relative;
          }

          .editor-placeholder {
            position: absolute;
            top: 12px;
            left: 12px;
            right: 12px;
            color: #8a9bad;
            pointer-events: none;
            font-size: 13px;
            line-height: 1.45;
          }

          .rich-editor {
            min-height: 120px;
            padding: 12px;
            color: #062b52;
            outline: none;
            font-size: 14px;
            line-height: 1.5;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
          }

          .add-item-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 14px;
          }

          .add-item-button {
            background: #0a2f52;
            color: #ffffff;
            padding: 13px 24px;
            min-height: 46px;
          }

          .bottom-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(320px, 0.45fr);
            gap: 18px;
            margin-top: 24px;
            align-items: start;
          }

          .terms-textarea {
            min-height: 185px;
            padding: 14px;
            resize: vertical;
            line-height: 1.45;
          }

          .summary-box {
            border: 1px solid #d8e3ef;
            border-radius: 18px;
            padding: 18px;
            background: #fbfdff;
          }

          .summary-row,
          .grand-row {
            display: grid;
            grid-template-columns: 120px minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            margin-bottom: 14px;
            color: #344d68;
            font-size: 15px;
          }

          .summary-row b,
          .grand-row b {
            text-align: right;
            color: #062b52;
            font-weight: 900;
          }

          .summary-input {
            height: 42px;
            padding: 0 12px;
            text-align: right;
          }

          .summary-divider {
            height: 1px;
            background: #d8e3ef;
            margin: 16px 0;
          }

          .grand-row {
            color: #111827;
            font-size: 17px;
            font-weight: 900;
          }

          .in-words-label {
            color: #667890;
            font-size: 13px;
            margin-bottom: 8px;
          }

          .in-words-box {
            border: 1px solid #d8e3ef;
            border-radius: 12px;
            min-height: 42px;
            padding: 11px 12px;
            color: #062b52;
            font-size: 14px;
            line-height: 1.35;
            background: #ffffff;
          }

          .summary-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 18px;
          }

          .secondary-button {
            background: #ffffff;
            border: 1px solid #d8e3ef;
            color: #24364b;
            min-height: 44px;
            padding: 0 18px;
          }

          .print-button {
            background: #0a2f52;
            color: #ffffff;
            min-height: 44px;
            padding: 0 22px;
          }

          .list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 14px;
          }

          .list-header h2 {
            margin: 0;
            color: #062b52;
            font-size: 24px;
            line-height: 1.2;
          }

          .list-header p {
            margin: 6px 0 0;
            color: #58708b;
            font-size: 14px;
            line-height: 1.35;
          }

          .quotation-list-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #d8e3ef;
            border-radius: 16px;
            -webkit-overflow-scrolling: touch;
          }

          .quotation-table {
            width: 100%;
            min-width: 940px;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 13px;
          }

          .quotation-table th {
            background: #f4f8fc;
            border-bottom: 1px solid #d8e3ef;
            text-align: left;
            padding: 13px 14px;
            color: #193a5b;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.35px;
          }

          .quotation-table td {
            border-bottom: 1px solid #edf2f7;
            padding: 13px 14px;
            color: #173b5f;
            vertical-align: top;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .quotation-table tr:last-child td {
            border-bottom: 0;
          }

          .empty-cell {
            text-align: center;
            padding: 24px !important;
            color: #60758c !important;
            font-weight: 800;
          }

          .status-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #e8f8ef;
            color: #087a3d;
            padding: 6px 11px;
            font-size: 12px;
            font-weight: 900;
          }

          .list-actions {
            display: flex;
            gap: 8px;
          }

          .edit-button,
          .print-small-button {
            min-height: 36px;
            padding: 0 12px;
            font-size: 12px;
          }

          .edit-button {
            background: #0b78d0;
            color: #ffffff;
          }

          .print-small-button {
            background: #0a2f52;
            color: #ffffff;
          }

          .remove-button {
            background: #fff0f0;
            color: #b00020;
            border: 1px solid #ffcaca;
            min-height: 38px;
            padding: 0 12px;
          }

          @media (max-width: 1100px) {
            .form-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .field-full {
              grid-column: span 2;
            }

            .bottom-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 820px) {
            .quotation-page {
              overflow-x: hidden;
            }

            .top-header {
              flex-direction: column;
              gap: 10px;
              margin-bottom: 14px;
            }

            .header-logo {
              display: none;
            }

            .kicker {
              font-size: 12px;
              margin-bottom: 6px;
            }

            .page-title {
              font-size: 34px;
            }

            .page-subtitle {
              font-size: 15px;
              margin-top: 8px;
            }

            .content-card {
              border-radius: 18px;
              padding: 16px;
              margin-bottom: 16px;
            }

            .form-grid {
              grid-template-columns: 1fr;
              gap: 13px;
              margin-bottom: 18px;
            }

            .field-full {
              grid-column: span 1;
            }

            .field-label {
              font-size: 12px;
              gap: 7px;
            }

            .input {
              height: 48px;
              font-size: 15px;
            }

            .quote-input-row {
              grid-template-columns: minmax(0, 1fr) 72px;
              gap: 8px;
            }

            .address-textarea {
              min-height: 120px;
            }

            .section-title {
              font-size: 18px;
              margin-bottom: 10px;
            }

            .items-table-wrap,
            .quotation-list-wrap {
              border: 0;
              border-radius: 0;
              overflow: visible;
            }

            .items-table,
            .quotation-table {
              min-width: 0;
              width: 100%;
              display: block;
            }

            .items-table thead,
            .quotation-table thead {
              display: none;
            }

            .items-table tbody,
            .quotation-table tbody {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }

            .items-table tr,
            .quotation-table tr {
              display: block;
              width: 100%;
              border: 1px solid #d8e3ef;
              border-radius: 16px;
              background: #f8fbff;
              overflow: hidden;
              box-shadow: 0 8px 18px rgba(34, 79, 126, 0.05);
            }

            .items-table td,
            .quotation-table td {
              display: grid;
              grid-template-columns: 110px minmax(0, 1fr);
              gap: 10px;
              align-items: start;
              padding: 11px 12px;
              border-bottom: 1px solid #e4edf6;
              overflow: visible;
              text-overflow: unset;
              white-space: normal;
              word-break: break-word;
              line-height: 1.35;
            }

            .items-table td:last-child,
            .quotation-table td:last-child {
              border-bottom: 0;
            }

            .items-table td::before,
            .quotation-table td::before {
              content: attr(data-label);
              color: #5d7186;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .td-spec {
              display: block !important;
            }

            .td-spec::before {
              display: block;
              margin-bottom: 8px;
            }

            .rich-toolbar {
              flex-wrap: nowrap;
              overflow-x: auto;
            }

            .rich-editor {
              min-height: 150px;
              font-size: 14px;
            }

            .product-select,
            .number-input,
            .price-input,
            .status-input {
              height: 42px;
              font-size: 14px;
            }

            .add-item-wrap {
              justify-content: stretch;
            }

            .add-item-button {
              width: 100%;
            }

            .bottom-grid {
              grid-template-columns: 1fr;
              gap: 16px;
              margin-top: 18px;
            }

            .terms-textarea {
              min-height: 180px;
              font-size: 14px;
            }

            .summary-box {
              padding: 16px;
              border-radius: 16px;
            }

            .summary-row,
            .grand-row {
              grid-template-columns: 1fr;
              gap: 7px;
              margin-bottom: 14px;
            }

            .summary-row b,
            .grand-row b {
              text-align: left;
            }

            .summary-input {
              text-align: left;
            }

            .summary-actions {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
            }

            .secondary-button,
            .print-button {
              width: 100%;
              padding: 0 10px;
            }

            .list-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }

            .refresh-button {
              width: 100%;
            }

            .list-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              width: 100%;
              gap: 8px;
            }

            .edit-button,
            .print-small-button,
            .remove-button {
              width: 100%;
            }

            .empty-cell {
              display: block !important;
              text-align: center;
            }

            .empty-cell::before {
              display: none;
            }
          }

          @media (max-width: 430px) {
            .content-card {
              padding: 14px;
            }

            .page-title {
              font-size: 32px;
            }

            .items-table td,
            .quotation-table td {
              grid-template-columns: 96px minmax(0, 1fr);
              gap: 8px;
              padding: 10px;
            }

            .items-table td::before,
            .quotation-table td::before {
              font-size: 11px;
            }

            .quote-input-row {
              grid-template-columns: 1fr;
            }

            .load-button {
              width: 100%;
            }

            .summary-actions {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}