'use client';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import AppShell from '../components/AppShell';
import ProformaInvoicePrintLayout, {
  ProformaInvoiceItem,
  ProformaInvoicePrintData,
} from './printlayout';

type AnyRow = Record<string, any>;

type ProformaSourceRow = {
  quotationId: string;
  quotationNumber: string;
  quotationDate: string;
  customerId: string | null;
  companyName: string;
  attentionName: string;
  billingAddress: string;
  poId: string;
  poNumber: string;
  poDate: string;
  poStatus: string;
  items: ProformaInvoiceItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxValue: number;
  grandTotal: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_STATUS = 'Payment waiting';

function safeString(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizePlainText(value: unknown) {
  return safeString(value)
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatDateDisplay(value: unknown) {
  const raw = safeString(value);

  if (!raw) return '-';

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.slice(0, 10).split('-');
    return `${day}-${month}-${year}`;
  }

  return raw;
}

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function getRomanMonth(dateValue?: string) {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const raw = dateValue || todayInputDate();

  let monthIndex = new Date().getMonth();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    monthIndex = Number(raw.slice(5, 7)) - 1;
  }

  return roman[Math.max(0, Math.min(11, monthIndex))];
}

function getYear(dateValue?: string) {
  const raw = dateValue || todayInputDate();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 4);

  return String(new Date().getFullYear());
}

function getCompanyInitials(companyName: string) {
  const ignored = new Set(['PT', 'CV', 'TBK', 'THE', 'AND', '&']);

  const words = safeString(companyName)
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !ignored.has(word.toUpperCase()));

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return 'CU';
}

function generateInvoiceNo(companyName: string, sequence: number, dateValue?: string) {
  const seq = String(sequence || 1).padStart(3, '0');
  const customerInitial = getCompanyInitials(companyName);
  return `CBI-INV${seq}-${customerInitial}/${getRomanMonth(dateValue)}/${getYear(dateValue)}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatInputNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return String(Math.round(value));
}

const angka = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function terbilang(value: number): string {
  const number = Math.floor(Math.abs(value));

  if (number < 12) return angka[number];
  if (number < 20) return `${terbilang(number - 10)} Belas`;
  if (number < 100) {
    return `${terbilang(Math.floor(number / 10))} Puluh ${terbilang(number % 10)}`.trim();
  }
  if (number < 200) return `Seratus ${terbilang(number - 100)}`.trim();
  if (number < 1000) {
    return `${terbilang(Math.floor(number / 100))} Ratus ${terbilang(number % 100)}`.trim();
  }
  if (number < 2000) return `Seribu ${terbilang(number - 1000)}`.trim();
  if (number < 1000000) {
    return `${terbilang(Math.floor(number / 1000))} Ribu ${terbilang(number % 1000)}`.trim();
  }
  if (number < 1000000000) {
    return `${terbilang(Math.floor(number / 1000000))} Juta ${terbilang(number % 1000000)}`.trim();
  }
  if (number < 1000000000000) {
    return `${terbilang(Math.floor(number / 1000000000))} Miliar ${terbilang(number % 1000000000)}`.trim();
  }

  return `${terbilang(Math.floor(number / 1000000000000))} Triliun ${terbilang(
    number % 1000000000000,
  )}`.trim();
}

function rupiahWords(value: number) {
  const clean = terbilang(value).replace(/\s+/g, ' ').trim();
  return `${clean || 'Nol'} Rupiah`;
}

function getQuotationNumber(row: AnyRow) {
  return (
    safeString(row.quotation_number) ||
    safeString(row.quote_no) ||
    safeString(row.quotation_no) ||
    safeString(row.number) ||
    '-'
  );
}

function getQuotationDate(row: AnyRow) {
  return row.quote_date || row.quotation_date || row.date || row.created_at || '';
}

function getCompanyName(quotation: AnyRow, customer: AnyRow | null) {
  return (
    safeString(quotation.customer_name_snapshot) ||
    safeString(customer?.customer_legal_name) ||
    safeString(customer?.customer_name) ||
    safeString(quotation.customer_name) ||
    '-'
  );
}

function getAttentionName(quotation: AnyRow, customer: AnyRow | null) {
  return (
    safeString(quotation.attention_snapshot) ||
    safeString(quotation.attention) ||
    safeString(customer?.customer_name) ||
    safeString(customer?.pic_name) ||
    '-'
  );
}

function getBillingAddress(quotation: AnyRow, customer: AnyRow | null) {
  return normalizePlainText(
    quotation.billing_address_snapshot ||
      quotation.customer_address_snapshot ||
      quotation.billing_address ||
      customer?.billing_address ||
      '',
  );
}

function getProductName(item: AnyRow) {
  return (
    safeString(item.product_name_snapshot) ||
    safeString(item.product_name) ||
    safeString(item.title) ||
    safeString(item.name) ||
    '-'
  );
}

function getProductDescription(item: AnyRow) {
  return normalizePlainText(
    item.product_description_snapshot ||
      item.product_details ||
      item.description ||
      item.details ||
      '',
  );
}

function getItemQty(item: AnyRow) {
  const qty = Number(item.qty || item.quantity || 0);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function getItemPrice(item: AnyRow) {
  const price = Number(item.unit_price || item.price || item.default_price || 0);
  return Number.isFinite(price) ? price : 0;
}

function getItemTotal(item: AnyRow) {
  const existing = Number(item.line_total || item.total || 0);
  if (Number.isFinite(existing) && existing > 0) return existing;

  return getItemQty(item) * getItemPrice(item);
}

function sortItems(items: AnyRow[]) {
  return [...items].sort((a, b) => {
    const aLine = Number(a.line_no || a.item_no || 0);
    const bLine = Number(b.line_no || b.item_no || 0);
    return aLine - bLine;
  });
}

function buildPrintItems(items: AnyRow[]) {
  return sortItems(items).map((item, index) => {
    const qty = getItemQty(item);
    const price = getItemPrice(item);
    const total = getItemTotal(item);

    return {
      no: index + 1,
      productName: getProductName(item),
      description: getProductDescription(item),
      qty,
      price,
      total,
    };
  });
}

function getQuotationSubtotal(quotation: AnyRow, items: ProformaInvoiceItem[]) {
  const existing = Number(quotation.subtotal || 0);

  if (Number.isFinite(existing) && existing > 0) return existing;

  return items.reduce((sum, item) => sum + item.total, 0);
}

function getQuotationDiscount(quotation: AnyRow) {
  const value = Number(quotation.discount_value || quotation.discount || 0);
  return Number.isFinite(value) ? value : 0;
}

function getQuotationTaxPercent(quotation: AnyRow) {
  const value = Number(quotation.tax_percent || 0);
  return Number.isFinite(value) ? value : 0;
}

function getQuotationTaxValue(quotation: AnyRow, subtotalAfterDiscount: number, taxPercent: number) {
  const existing = Number(quotation.tax_value || 0);

  if (Number.isFinite(existing) && existing > 0) return existing;

  return (subtotalAfterDiscount * taxPercent) / 100;
}

function getQuotationGrandTotal(quotation: AnyRow, subtotal: number, discount: number, taxValue: number) {
  const existing = Number(quotation.grand_total || 0);

  if (Number.isFinite(existing) && existing > 0) return existing;

  return subtotal - discount + taxValue;
}

function isPoReady(po: AnyRow) {
  const status = safeString(po.status).toLowerCase();
  const poNumber = safeString(po.po_number);
  const storagePath = safeString(po.storage_path || po.file_path);

  return status === 'sudah ada' || Boolean(poNumber && storagePath);
}

export default function ProformaInvoicePage() {
  const [rows, setRows] = React.useState<ProformaSourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [invoiceNo, setInvoiceNo] = React.useState('');
  const [invoiceDate, setInvoiceDate] = React.useState(todayInputDate());
  const [status, setStatus] = React.useState(DEFAULT_STATUS);
  const [discount, setDiscount] = React.useState(0);
  const [dpValue, setDpValue] = React.useState(0);
  const [taxPercent, setTaxPercent] = React.useState(0);
  const [paymentNote, setPaymentNote] = React.useState('');
  const [printData, setPrintData] = React.useState<ProformaInvoicePrintData | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase ENV belum lengkap. Cek NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
      }

      const [quotationResult, itemResult, poResult, customerResult] = await Promise.all([
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        supabase.from('quotation_items').select('*'),
        supabase.from('customer_purchase_orders').select('*').order('updated_at', { ascending: false }),
        supabase.from('customers').select('*'),
      ]);

      if (quotationResult.error) throw quotationResult.error;
      if (itemResult.error) throw itemResult.error;
      if (poResult.error) throw poResult.error;
      if (customerResult.error) throw customerResult.error;

      const quotations = quotationResult.data || [];
      const quotationItems = itemResult.data || [];
      const purchaseOrders = (poResult.data || []).filter(isPoReady);
      const customers = customerResult.data || [];

      const customerById = new Map<string, AnyRow>();
      customers.forEach((customer) => {
        if (customer.id) customerById.set(safeString(customer.id), customer);
      });

      const itemsByQuotationId = new Map<string, AnyRow[]>();
      quotationItems.forEach((item) => {
        const quotationId = safeString(item.quotation_id);
        if (!quotationId) return;

        const current = itemsByQuotationId.get(quotationId) || [];
        current.push(item);
        itemsByQuotationId.set(quotationId, current);
      });

      const poByQuotationId = new Map<string, AnyRow>();
      purchaseOrders.forEach((po) => {
        const quotationId = safeString(po.quotation_id);
        if (!quotationId) return;

        if (!poByQuotationId.has(quotationId)) {
          poByQuotationId.set(quotationId, po);
        }
      });

      const mappedRows: ProformaSourceRow[] = quotations
        .filter((quotation) => poByQuotationId.has(safeString(quotation.id)))
        .map((quotation) => {
          const quotationId = safeString(quotation.id);
          const po = poByQuotationId.get(quotationId) as AnyRow;
          const customer = customerById.get(safeString(quotation.customer_id)) || null;
          const items = buildPrintItems(itemsByQuotationId.get(quotationId) || []);

          const subtotal = getQuotationSubtotal(quotation, items);
          const rowDiscount = getQuotationDiscount(quotation);
          const rowTaxPercent = getQuotationTaxPercent(quotation);
          const taxBase = subtotal - rowDiscount;
          const taxValue = getQuotationTaxValue(quotation, taxBase, rowTaxPercent);
          const grandTotal = getQuotationGrandTotal(quotation, subtotal, rowDiscount, taxValue);

          return {
            quotationId,
            quotationNumber: getQuotationNumber(quotation),
            quotationDate: formatDateDisplay(getQuotationDate(quotation)),
            customerId: safeString(quotation.customer_id) || null,
            companyName: getCompanyName(quotation, customer),
            attentionName: getAttentionName(quotation, customer),
            billingAddress: getBillingAddress(quotation, customer),
            poId: safeString(po.id),
            poNumber: safeString(po.po_number) || '-',
            poDate: formatDateDisplay(po.po_date || po.date || ''),
            poStatus: 'Sudah Ada',
            items,
            subtotal,
            discount: rowDiscount,
            taxPercent: rowTaxPercent,
            taxValue,
            grandTotal,
          };
        });

      setRows(mappedRows);

      if (mappedRows.length && !selectedId) {
        const first = mappedRows[0];
        setSelectedId(first.quotationId);
        setInvoiceNo(generateInvoiceNo(first.companyName, 1, invoiceDate));
        setDiscount(first.discount);
        setTaxPercent(first.taxPercent);
        setDpValue(0);
        setPaymentNote('');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Gagal mengambil data Proforma Invoice.');
    } finally {
      setLoading(false);
    }
  }, [invoiceDate, selectedId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((row) => {
      return [
        row.quotationNumber,
        row.companyName,
        row.attentionName,
        row.poNumber,
        row.items.map((item) => `${item.productName} ${item.description}`).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [rows, search]);

  const selectedRow = React.useMemo(() => {
    return rows.find((row) => row.quotationId === selectedId) || null;
  }, [rows, selectedId]);

  const summary = React.useMemo(() => {
    const subtotal = selectedRow?.subtotal || 0;
    const safeDiscount = Number.isFinite(discount) ? discount : 0;
    const safeDpValue = Number.isFinite(dpValue) ? dpValue : 0;
    const safeTaxPercent = Number.isFinite(taxPercent) ? taxPercent : 0;

    const taxBase = subtotal - safeDiscount;
    const taxValue = taxBase * (safeTaxPercent / 100);

    const fullPaymentTotal = subtotal - safeDiscount + taxValue;
    const paymentStatus = safeDpValue > 0 ? 'Down Payment' : 'Full Payment';

    const grandTotal = safeDpValue > 0 ? safeDpValue : fullPaymentTotal;

    return {
      subtotal,
      discount: safeDiscount,
      dpValue: safeDpValue,
      taxPercent: safeTaxPercent,
      taxValue,
      fullPaymentTotal,
      grandTotal,
      inWords: rupiahWords(grandTotal),
      paymentStatus,
    };
  }, [selectedRow, discount, dpValue, taxPercent]);

  const totalPoReady = rows.length;
  const selectedTotal = selectedRow ? summary.grandTotal : 0;

  function handleSelectRow(row: ProformaSourceRow, index: number) {
    setSelectedId(row.quotationId);
    setInvoiceNo(generateInvoiceNo(row.companyName, index + 1, invoiceDate));
    setDiscount(row.discount);
    setTaxPercent(row.taxPercent);
    setDpValue(0);
    setPaymentNote('');
    setStatus(DEFAULT_STATUS);
    setPrintData(null);
  }

  function buildPrintData(row: ProformaSourceRow): ProformaInvoicePrintData {
    return {
      invoiceNo: invoiceNo.trim() || generateInvoiceNo(row.companyName, 1, invoiceDate),
      invoiceDate: formatDateDisplay(invoiceDate),
      poNumber: row.poNumber,
      poDate: row.poDate,
      status,
      companyName: row.companyName,
      attentionName: row.attentionName,
      billingAddress: row.billingAddress,
      items: row.items,
      subtotal: summary.subtotal,
      discount: summary.discount,
      dpValue: summary.dpValue,
      taxPercent: summary.taxPercent,
      taxValue: summary.taxValue,
      grandTotal: summary.grandTotal,
      inWords: summary.inWords,
      paymentNote,
      paymentStatus: summary.paymentStatus,
      fullPaymentTotal: summary.fullPaymentTotal,
    };
  }

  function printInvoice() {
    setErrorMessage('');

    if (!selectedRow) {
      setErrorMessage('Pilih quotation yang PO Status-nya sudah ada terlebih dahulu.');
      return;
    }

    setPrintData(buildPrintData(selectedRow));

    setTimeout(() => {
      window.print();
    }, 150);
  }

  return (
    <AppShell>
      <main className="pi-page-ui">
        <style>{`
          .pi-page-ui {
            min-height: 100vh;
            background: #dfeaf5;
            color: #002b5b;
            padding: 24px 28px 40px;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            overflow-x: hidden;
          }

          .page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .breadcrumb {
            margin-bottom: 6px;
            color: #075da8;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 600;
          }

          .page-title {
            margin: 0;
            color: #003466;
            font-size: 42px;
            line-height: 1.05;
            font-weight: 500;
            letter-spacing: -0.035em;
          }

          .page-subtitle {
            margin: 10px 0 0;
            color: #496e93;
            font-size: 16px;
            line-height: 1.45;
            font-weight: 400;
          }

          .refresh-button {
            border: 1px solid #c9ddf1;
            background: #ffffff;
            color: #004b93;
            border-radius: 14px;
            padding: 13px 20px;
            min-width: 126px;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 18px rgba(0, 43, 91, 0.06);
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .summary-card,
          .content-card,
          .preview-box {
            background: #ffffff;
            border: 1px solid #d4e5f6;
            border-radius: 18px;
            box-shadow: 0 8px 20px rgba(0, 43, 91, 0.04);
          }

          .summary-card {
            padding: 18px 20px;
          }

          .summary-label {
            margin: 0 0 8px;
            color: #003466;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .summary-value {
            margin: 0;
            color: #003466;
            font-size: 30px;
            line-height: 1.05;
            font-weight: 700;
          }

          .summary-note {
            margin: 8px 0 0;
            color: #50769b;
            font-size: 13px;
            line-height: 1.4;
            font-weight: 400;
          }

          .content-card {
            padding: 18px 18px 20px;
            margin-bottom: 20px;
          }

          .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 14px;
          }

          .card-title {
            margin: 0;
            color: #003466;
            font-size: 28px;
            line-height: 1.15;
            font-weight: 600;
            letter-spacing: -0.025em;
          }

          .card-subtitle {
            margin: 4px 0 0;
            color: #496e93;
            font-size: 14px;
            line-height: 1.4;
            font-weight: 400;
          }

          .search-input,
          .form-input,
          .form-textarea {
            width: 100%;
            border: 1px solid #bad3eb;
            background: #ffffff;
            color: #002b5b;
            border-radius: 12px;
            padding: 11px 14px;
            font-size: 14px;
            line-height: 1.3;
            outline: none;
            box-sizing: border-box;
          }

          .search-input {
            max-width: 320px;
          }

          .form-textarea {
            min-height: 96px;
            resize: vertical;
          }

          .table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #d4e5f6;
            border-radius: 14px;
          }

          .pi-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 1080px;
            background: #ffffff;
          }

          .pi-table th {
            background: #eef6ff;
            color: #003466;
            font-size: 12px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 14px 12px;
            text-align: left;
            border-bottom: 1px solid #d4e5f6;
          }

          .pi-table td {
            color: #002b5b;
            font-size: 14px;
            line-height: 1.35;
            padding: 14px 12px;
            vertical-align: top;
            border-bottom: 1px solid #d4e5f6;
          }

          .pi-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .selected-row td {
            background: #f3f9ff;
          }

          .col-no {
            width: 60px;
            text-align: center !important;
          }

          .col-quote {
            width: 170px;
            font-weight: 700;
          }

          .col-date {
            width: 120px;
          }

          .col-customer {
            width: 220px;
          }

          .col-attention {
            width: 180px;
          }

          .col-po {
            width: 150px;
          }

          .col-total {
            width: 160px;
            font-weight: 700;
            text-align: right !important;
          }

          .col-action {
            width: 120px;
            text-align: center !important;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #8ee0a2;
            background: #eaffef;
            color: #0b8a2a;
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 12px;
            line-height: 1;
            font-weight: 700;
          }

          .action-button,
          .primary-button {
            border: 0;
            border-radius: 12px;
            color: #ffffff;
            cursor: pointer;
            font-weight: 800;
          }

          .action-button {
            background: #0b7bd3;
            padding: 9px 14px;
            font-size: 13px;
          }

          .primary-button {
            background: #082744;
            padding: 12px 18px;
            font-size: 14px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
          }

          .field label {
            display: block;
            margin-bottom: 6px;
            color: #003466;
            font-size: 12px;
            line-height: 1.25;
            font-weight: 800;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 14px;
          }

          .preview-box {
            padding: 16px;
            background: #f8fbff;
          }

          .preview-title {
            margin: 0 0 12px;
            color: #003466;
            font-size: 20px;
            line-height: 1.2;
            font-weight: 600;
          }

          .preview-line {
            margin: 0 0 8px;
            color: #003466;
            font-size: 14px;
            line-height: 1.45;
          }

          .money-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 12px;
            color: #003466;
            font-size: 14px;
            line-height: 1.35;
          }

          .money-row strong {
            white-space: nowrap;
          }

          .money-row.grand {
            padding-top: 10px;
            border-top: 1px solid #d4e5f6;
            font-size: 16px;
          }

          .empty-state {
            padding: 22px;
            text-align: center;
            color: #50769b;
            font-size: 14px;
          }

          .alert {
            margin-bottom: 16px;
            border: 1px solid #f3b5b5;
            background: #fff0f0;
            color: #c00000;
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 14px;
            font-weight: 700;
          }

          @media (max-width: 1180px) {
            .summary-grid,
            .form-grid,
            .detail-grid {
              grid-template-columns: 1fr;
            }

            .search-input {
              max-width: none;
            }
          }
        `}</style>

        <div className="page-header">
          <div>
            <div className="breadcrumb">SALES-APP / Transaction / Proforma Invoice</div>
            <h1 className="page-title">Proforma Invoice</h1>
            <p className="page-subtitle">
              Buat Proforma Invoice hanya dari quotation yang PO Status sudah ada.
            </p>
          </div>

          <button className="refresh-button" type="button" onClick={fetchData}>
            Refresh Data
          </button>
        </div>

        <section className="summary-grid">
          <div className="summary-card">
            <p className="summary-label">Quotation PO Ready</p>
            <p className="summary-value">{totalPoReady}</p>
            <p className="summary-note">Siap dibuat Proforma Invoice</p>
          </div>

          <div className="summary-card">
            <p className="summary-label">Selected Total</p>
            <p className="summary-value">{formatMoney(selectedTotal)}</p>
            <p className="summary-note">Grand total invoice aktif</p>
          </div>

          <div className="summary-card">
            <p className="summary-label">Status</p>
            <p className="summary-value" style={{ fontSize: 24 }}>
              {DEFAULT_STATUS}
            </p>
            <p className="summary-note">Default status Proforma Invoice</p>
          </div>
        </section>

        {errorMessage ? <div className="alert">{errorMessage}</div> : null}

        <section className="content-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Quotation List for Proforma Invoice</h2>
              <p className="card-subtitle">
                Hanya menampilkan data dari Customer PO dengan status Sudah Ada.
              </p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quotation / customer / PO..."
            />
          </div>

          <div className="table-wrap">
            <table className="pi-table">
              <thead>
                <tr>
                  <th className="col-no">No.</th>
                  <th className="col-quote">Quotation No</th>
                  <th className="col-date">Date</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-attention">Attention</th>
                  <th className="col-po">PO Number</th>
                  <th>PO Status</th>
                  <th className="col-total">Grand Total</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">Loading data Proforma Invoice...</div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        Belum ada quotation dengan PO Status Sudah Ada.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr
                      key={row.quotationId}
                      className={selectedId === row.quotationId ? 'selected-row' : ''}
                    >
                      <td className="col-no">{index + 1}</td>
                      <td className="col-quote">{row.quotationNumber}</td>
                      <td className="col-date">{row.quotationDate}</td>
                      <td className="col-customer">{row.companyName}</td>
                      <td className="col-attention">{row.attentionName}</td>
                      <td className="col-po">{row.poNumber}</td>
                      <td>
                        <span className="badge">Sudah Ada</span>
                      </td>
                      <td className="col-total">Rp {formatMoney(row.grandTotal)}</td>
                      <td className="col-action">
                        <button
                          className="action-button"
                          type="button"
                          onClick={() => handleSelectRow(row, index)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Create Proforma Invoice</h2>
              <p className="card-subtitle">
                Invoice number bisa otomatis dan tetap bisa diedit manual.
              </p>
            </div>

            <button className="primary-button" type="button" onClick={printInvoice}>
              Print Preview
            </button>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Invoice No.#</label>
              <input
                className="form-input"
                value={invoiceNo}
                onChange={(event) => setInvoiceNo(event.target.value)}
                placeholder="CBI-INV001-PI/V/2026"
              />
            </div>

            <div className="field">
              <label>Date</label>
              <input
                className="form-input"
                type="date"
                value={invoiceDate}
                onChange={(event) => {
                  const newDate = event.target.value;
                  setInvoiceDate(newDate);

                  if (selectedRow) {
                    const selectedIndex = Math.max(
                      0,
                      rows.findIndex((row) => row.quotationId === selectedRow.quotationId),
                    );
                    setInvoiceNo(generateInvoiceNo(selectedRow.companyName, selectedIndex + 1, newDate));
                  }
                }}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <input
                className="form-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                placeholder="Payment waiting"
              />
            </div>
          </div>

          <div className="detail-grid">
            <div className="preview-box">
              <h3 className="preview-title">Customer / PO Detail</h3>

              {selectedRow ? (
                <>
                  <p className="preview-line">
                    <strong>Company:</strong> {selectedRow.companyName}
                  </p>
                  <p className="preview-line">
                    <strong>Customer:</strong> {selectedRow.attentionName}
                  </p>
                  <p className="preview-line">
                    <strong>Address:</strong>
                    <br />
                    {selectedRow.billingAddress || '-'}
                  </p>
                  <p className="preview-line">
                    <strong>PO Number:</strong> {selectedRow.poNumber}
                  </p>
                  <p className="preview-line">
                    <strong>PO Date:</strong> {selectedRow.poDate}
                  </p>
                  <p className="preview-line">
                    <strong>Payment Status:</strong> {summary.paymentStatus}
                  </p>

                  <div className="field" style={{ marginTop: 16 }}>
                    <label>PAYMENT NOTE :</label>
                    <textarea
                      className="form-textarea"
                      value={paymentNote}
                      onChange={(event) => setPaymentNote(event.target.value)}
                      placeholder="Contoh: Down payment 70% setelah PO diterima."
                    />
                  </div>
                </>
              ) : (
                <p className="preview-line">Pilih quotation terlebih dahulu.</p>
              )}
            </div>

            <div className="preview-box">
              <h3 className="preview-title">Summary</h3>

              <div className="money-row">
                <span>Subtotal</span>
                <strong>Rp {formatMoney(summary.subtotal)}</strong>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Discount</label>
                <input
                  className="form-input"
                  type="number"
                  value={formatInputNumber(discount)}
                  onChange={(event) => setDiscount(Number(event.target.value || 0))}
                />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>DP</label>
                <input
                  className="form-input"
                  type="number"
                  value={formatInputNumber(dpValue)}
                  onChange={(event) => setDpValue(Number(event.target.value || 0))}
                  placeholder="0"
                />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Tax (%)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formatInputNumber(taxPercent)}
                  onChange={(event) => setTaxPercent(Number(event.target.value || 0))}
                />
              </div>

              <div className="money-row">
                <span>Tax Value</span>
                <strong>Rp {formatMoney(summary.taxValue)}</strong>
              </div>

              <div className="money-row">
                <span>DP</span>
                <strong>Rp {formatMoney(summary.dpValue)}</strong>
              </div>

              <div className="money-row">
                <span>Payment Status</span>
                <strong>{summary.paymentStatus}</strong>
              </div>

              <div className="money-row grand">
                <span>Grand Total</span>
                <strong>Rp {formatMoney(summary.grandTotal)}</strong>
              </div>

              <p className="preview-line">
                <strong>In words:</strong>
                <br />
                {summary.inWords}
              </p>
            </div>
          </div>
        </section>
      </main>

      <ProformaInvoicePrintLayout data={printData} />
    </AppShell>
  );
}