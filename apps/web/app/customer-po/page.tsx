'use client';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import AppShell from '../components/AppShell';

type AnyRow = Record<string, any>;

type CustomerPoRow = {
  id: string;
  quotationNumber: string;
  quoteDate: string;
  customerId: string | null;
  customerName: string;
  attention: string;
  descriptionItem: string;
  qty: number;
  poStatus: 'Belum Ada' | 'Sudah Ada';
  poNumber: string;
  poDate: string;
  poId: string | null;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = 'customer-purchase-orders';

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];

function safeString(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeText(value: unknown) {
  return safeString(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
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

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return '-';

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
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

function getCustomerName(row: AnyRow) {
  return (
    safeString(row.customer_name_snapshot) ||
    safeString(row.customer_name) ||
    safeString(row.customer_legal_name) ||
    safeString(row.customer) ||
    '-'
  );
}

function getAttention(row: AnyRow) {
  return (
    safeString(row.attention_snapshot) ||
    safeString(row.attention) ||
    safeString(row.pic_name) ||
    safeString(row.contact_person) ||
    '-'
  );
}

function getProductName(item: AnyRow) {
  return (
    safeString(item.product_name_snapshot) ||
    safeString(item.product_name) ||
    safeString(item.title) ||
    safeString(item.name) ||
    ''
  );
}

function getProductDescription(item: AnyRow) {
  return (
    safeString(item.product_description_snapshot) ||
    safeString(item.description) ||
    safeString(item.product_details) ||
    ''
  );
}

function getItemDescription(items: AnyRow[]) {
  if (!items.length) return '-';

  const sortedItems = [...items].sort((a, b) => {
    const aLine = Number(a.line_no || a.item_no || 0);
    const bLine = Number(b.line_no || b.item_no || 0);
    return aLine - bLine;
  });

  const descriptions = sortedItems
    .map((item) => {
      const productName = normalizeText(getProductName(item));
      const productDesc = normalizeText(getProductDescription(item));

      if (productName && productDesc) return `${productName} - ${productDesc}`;
      return productName || productDesc;
    })
    .filter(Boolean);

  return descriptions.length ? descriptions.join(', ') : '-';
}

function getQty(items: AnyRow[]) {
  if (!items.length) return 0;

  return items.reduce((total, item) => {
    const qty = Number(item.qty || item.quantity || 0);
    return total + (Number.isFinite(qty) ? qty : 0);
  }, 0);
}

function getLatestPoByQuotation(customerPOs: AnyRow[]) {
  const map = new Map<string, AnyRow>();

  customerPOs.forEach((po) => {
    const quotationId = safeString(po.quotation_id);
    if (!quotationId) return;

    if (!map.has(quotationId)) {
      map.set(quotationId, po);
    }
  });

  return map;
}

function getPoStatus(po: AnyRow | null): 'Belum Ada' | 'Sudah Ada' {
  if (!po) return 'Belum Ada';

  const poNumber = safeString(po.po_number);
  const storagePath = safeString(po.storage_path || po.file_path || po.po_file_path);

  if (poNumber || storagePath) return 'Sudah Ada';
  return 'Belum Ada';
}

function getPoNumber(po: AnyRow | null) {
  if (!po) return '-';
  return safeString(po.po_number) || '-';
}

function getPoDate(po: AnyRow | null) {
  if (!po) return '';
  return safeString(po.po_date || po.date || '');
}

function getPoFileName(po: AnyRow | null) {
  if (!po) return '';
  return safeString(po.file_name || po.filename || po.original_file_name);
}

function getPoStoragePath(po: AnyRow | null) {
  if (!po) return '';
  return safeString(po.storage_path || po.file_path || po.po_file_path);
}

function getPoMimeType(po: AnyRow | null) {
  if (!po) return '';
  return safeString(po.mime_type || po.file_type);
}

function getPoFileSize(po: AnyRow | null) {
  if (!po) return 0;
  return Number(po.file_size || po.size || 0);
}

function getFileExtension(fileName: string) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function CustomerPoPage() {
  const [rows, setRows] = React.useState<CustomerPoRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const [activeQuotationId, setActiveQuotationId] = React.useState<string | null>(null);
  const [poNumber, setPoNumber] = React.useState('');
  const [poDate, setPoDate] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase ENV belum lengkap. Cek NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      const [quotationResult, itemResult, poResult] = await Promise.all([
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        supabase.from('quotation_items').select('*'),
        supabase.from('customer_purchase_orders').select('*').order('updated_at', { ascending: false }),
      ]);

      if (quotationResult.error) throw quotationResult.error;
      if (itemResult.error) throw itemResult.error;
      if (poResult.error) throw poResult.error;

      const quotations = quotationResult.data || [];
      const quotationItems = itemResult.data || [];
      const customerPOs = poResult.data || [];

      const itemsByQuotationId = new Map<string, AnyRow[]>();

      quotationItems.forEach((item) => {
        const quotationId = safeString(item.quotation_id);
        if (!quotationId) return;

        const currentItems = itemsByQuotationId.get(quotationId) || [];
        currentItems.push(item);
        itemsByQuotationId.set(quotationId, currentItems);
      });

      const poByQuotationId = getLatestPoByQuotation(customerPOs);

      const mappedRows: CustomerPoRow[] = quotations.map((quotation) => {
        const quotationId = safeString(quotation.id);
        const items = itemsByQuotationId.get(quotationId) || [];
        const po = poByQuotationId.get(quotationId) || null;

        return {
          id: quotationId,
          quotationNumber: getQuotationNumber(quotation),
          quoteDate: formatDateDisplay(getQuotationDate(quotation)),
          customerId: safeString(quotation.customer_id) || null,
          customerName: getCustomerName(quotation),
          attention: getAttention(quotation),
          descriptionItem: getItemDescription(items),
          qty: getQty(items),
          poStatus: getPoStatus(po),
          poNumber: getPoNumber(po),
          poDate: getPoDate(po),
          poId: po ? safeString(po.id) : null,
          fileName: getPoFileName(po),
          storagePath: getPoStoragePath(po),
          mimeType: getPoMimeType(po),
          fileSize: getPoFileSize(po),
        };
      });

      setRows(mappedRows);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Gagal mengambil data Customer PO.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((row) => {
      const source = [
        row.quotationNumber,
        row.quoteDate,
        row.customerName,
        row.attention,
        row.descriptionItem,
        row.poStatus,
        row.poNumber,
        row.fileName,
      ]
        .join(' ')
        .toLowerCase();

      return source.includes(keyword);
    });
  }, [rows, search]);

  const totalQuotation = rows.length;
  const totalWithPO = rows.filter((row) => row.poStatus === 'Sudah Ada').length;
  const totalWithoutPO = rows.filter((row) => row.poStatus === 'Belum Ada').length;

  function openPoForm(row: CustomerPoRow) {
    setErrorMessage('');
    setSuccessMessage('');

    if (activeQuotationId === row.id) {
      setActiveQuotationId(null);
      return;
    }

    setActiveQuotationId(row.id);
    setPoNumber(row.poNumber !== '-' ? row.poNumber : '');
    setPoDate(row.poDate || todayInputDate());
    setSelectedFile(null);

    setTimeout(() => {
      const formElement = document.getElementById(`po-form-${row.id}`);
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(null);
    setErrorMessage('');

    if (!file) return;

    const extension = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setErrorMessage('Format file tidak didukung. Gunakan PDF, JPG, PNG, DOC, DOCX, XLS, atau XLSX.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  async function openFile(storagePath: string) {
    setErrorMessage('');

    if (!storagePath) {
      setErrorMessage('File PO belum tersedia.');
      return;
    }

    const signedResult = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, 60 * 10);

    if (signedResult.data?.signedUrl) {
      window.open(signedResult.data.signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setErrorMessage('Gagal membuka file PO.');
  }

  async function findExistingPo(quotationId: string) {
    const existingResult = await supabase
      .from('customer_purchase_orders')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existingResult.error) throw existingResult.error;

    const existingRows = existingResult.data || [];
    return existingRows.length ? existingRows[0] : null;
  }

  async function uploadPoFile(row: CustomerPoRow, file: File) {
    const extension = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error('Format file tidak didukung. Gunakan PDF, JPG, PNG, DOC, DOCX, XLS, atau XLSX.');
    }

    const safeFileName = sanitizeFileName(file.name);
    const storagePath = `${row.id}/${Date.now()}-${safeFileName}`;

    const uploadResult = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

    if (uploadResult.error) throw uploadResult.error;

    return {
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || '',
      file_size: file.size,
    };
  }

  async function deleteOldPoFile(storagePath: string) {
    if (!storagePath) return;

    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    } catch (error) {
      console.warn('File lama tidak berhasil dihapus dari Storage, tetapi data PO sudah berhasil diupdate.', error);
    }
  }

  async function savePO(row: CustomerPoRow) {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const cleanPoNumber = poNumber.trim();

      if (!cleanPoNumber) {
        throw new Error('PO Number wajib diisi.');
      }

      const existingPo = await findExistingPo(row.id);
      const existingPoId = safeString(existingPo?.id || row.poId);
      const oldStoragePath = safeString(existingPo?.storage_path || row.storagePath);

      if (!existingPoId && !selectedFile) {
        throw new Error('File PO wajib dipilih untuk Insert PO baru.');
      }

      const userResult = await supabase.auth.getUser();
      const authUserId = userResult.data.user?.id || null;

      let uploadedFileData: AnyRow = {};

      if (selectedFile) {
        uploadedFileData = await uploadPoFile(row, selectedFile);
      }

      const payload: AnyRow = {
        quotation_id: row.id,
        customer_id: row.customerId,
        po_number: cleanPoNumber,
        po_date: poDate || todayInputDate(),
        status: 'Sudah Ada',
        uploaded_by: authUserId,
        updated_at: new Date().toISOString(),
        ...uploadedFileData,
      };

      if (existingPoId) {
        const updateResult = await supabase.from('customer_purchase_orders').update(payload).eq('id', existingPoId);

        if (updateResult.error) throw updateResult.error;

        if (selectedFile && oldStoragePath && oldStoragePath !== uploadedFileData.storage_path) {
          await deleteOldPoFile(oldStoragePath);
        }

        setSuccessMessage(`PO berhasil diupdate untuk ${row.quotationNumber}.`);
      } else {
        const insertResult = await supabase.from('customer_purchase_orders').insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (insertResult.error) throw insertResult.error;

        setSuccessMessage(`PO berhasil disimpan untuk ${row.quotationNumber}.`);
      }

      setActiveQuotationId(null);
      setPoNumber('');
      setPoDate('');
      setSelectedFile(null);

      await fetchData();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Gagal menyimpan Customer PO.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell activeMenu="Customer PO">
      <main className="customer-po-page">
        <style>{`
          .customer-po-page {
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
            letter-spacing: 0;
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
            max-width: 720px;
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

          .refresh-button:hover {
            background: #f6fbff;
          }

          .refresh-button:disabled {
            cursor: not-allowed;
            opacity: 0.65;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .summary-card {
            background: #ffffff;
            border: 1px solid #d4e4f5;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 24px rgba(0, 43, 91, 0.05);
          }

          .summary-label {
            margin-bottom: 8px;
            color: #315d8a;
            font-size: 12px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .summary-value {
            color: #00386e;
            font-size: 30px;
            line-height: 1;
            font-weight: 900;
          }

          .summary-note {
            margin-top: 8px;
            color: #557396;
            font-size: 13px;
            line-height: 1.35;
            font-weight: 400;
          }

          .alert {
            border-radius: 12px;
            padding: 12px 14px;
            margin-bottom: 16px;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.35;
          }

          .alert-error {
            border: 1px solid #ffb8b8;
            background: #fff0f0;
            color: #b00020;
          }

          .alert-success {
            border: 1px solid #a9e8c0;
            background: #effff4;
            color: #087a2f;
          }

          .content-card {
            background: #ffffff;
            border: 1px solid #d4e4f5;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 10px 24px rgba(0, 43, 91, 0.05);
          }

          .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
          }

          .card-title {
            margin: 0;
            color: #002b5b;
            font-size: 26px;
            line-height: 1.15;
            font-weight: 900;
            letter-spacing: -0.02em;
          }

          .card-subtitle {
            margin: 6px 0 0;
            color: #496e93;
            font-size: 14px;
            line-height: 1.4;
            font-weight: 400;
          }

          .search-input {
            width: min(310px, 100%);
            border: 1px solid #c8dced;
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 14px;
            font-weight: 400;
            outline: none;
            color: #002b5b;
            background: #ffffff;
          }

          .search-input:focus {
            border-color: #0b77d8;
            box-shadow: 0 0 0 3px rgba(11, 119, 216, 0.12);
          }

          .table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #d8e6f3;
            border-radius: 14px;
            background: #ffffff;
            -webkit-overflow-scrolling: touch;
          }

          .po-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            background: #ffffff;
          }

          .po-table th {
            background: #f0f6fc;
            color: #002b5b;
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 9px;
            border-bottom: 1px solid #d8e6f3;
            white-space: nowrap;
          }

          .po-table td {
            color: #002b5b;
            font-size: 13px;
            line-height: 1.35;
            font-weight: 400;
            vertical-align: top;
            padding: 12px 9px;
            border-bottom: 1px solid #e8f0f8;
            word-break: break-word;
          }

          .po-table tr:last-child td {
            border-bottom: none;
          }

          .col-no {
            width: 4%;
            text-align: center;
          }

          .col-quote {
            width: 13%;
          }

          .col-date {
            width: 8%;
          }

          .col-customer {
            width: 14%;
          }

          .col-attention {
            width: 12%;
          }

          .col-desc {
            width: 20%;
          }

          .col-qty {
            width: 5%;
            text-align: center;
          }

          .col-status {
            width: 9%;
            text-align: center;
          }

          .col-po {
            width: 9%;
          }

          .col-file {
            width: 10%;
          }

          .col-action {
            width: 8%;
            text-align: center;
          }

          .quotation-number {
            font-weight: 900;
            color: #002b5b;
          }

          .description-text {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            line-height: 1;
            font-weight: 900;
            white-space: nowrap;
          }

          .badge-ready {
            background: #e9fff1;
            border: 1px solid #b9eac8;
            color: #087a2f;
          }

          .badge-empty {
            background: #fff5e6;
            border: 1px solid #ffd59a;
            color: #a45d00;
          }

          .action-button {
            border: 0;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13px;
            line-height: 1;
            font-weight: 900;
            cursor: pointer;
            color: #ffffff;
            background: #0b77d8;
            white-space: nowrap;
          }

          .action-button:hover {
            background: #075fae;
          }

          .file-link-button {
            border: 0;
            padding: 0;
            background: transparent;
            color: #0b67bd;
            cursor: pointer;
            font-size: 13px;
            font-weight: 800;
            text-align: left;
            text-decoration: underline;
          }

          .file-note {
            margin-top: 4px;
            color: #557396;
            font-size: 12px;
            line-height: 1.3;
            font-weight: 400;
          }

          .po-form-row td {
            background: #f8fbff;
            padding: 0;
          }

          .po-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1.4fr auto;
            gap: 14px;
            align-items: end;
            padding: 18px;
            border-top: 1px solid #d8e6f3;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .field label {
            color: #002b5b;
            font-size: 12px;
            font-weight: 900;
          }

          .field input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #c8dced;
            border-radius: 11px;
            padding: 11px 12px;
            font-size: 14px;
            font-weight: 400;
            outline: none;
            background: #ffffff;
            color: #002b5b;
          }

          .field input:focus {
            border-color: #0b77d8;
            box-shadow: 0 0 0 3px rgba(11, 119, 216, 0.12);
          }

          .form-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: flex-end;
          }

          .save-button {
            border: 0;
            border-radius: 11px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            color: #ffffff;
            background: #087a2f;
            white-space: nowrap;
          }

          .save-button:disabled {
            cursor: not-allowed;
            opacity: 0.65;
          }

          .cancel-button {
            border: 1px solid #c8dced;
            border-radius: 11px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            color: #0b5cab;
            background: #ffffff;
            white-space: nowrap;
          }

          .empty-state {
            padding: 30px 12px;
            text-align: center;
            color: #557396;
            font-weight: 700;
            font-size: 14px;
          }

          @media (max-width: 1300px) {
            .po-table {
              min-width: 1180px;
            }
          }

          @media (max-width: 1200px) {
            .summary-grid {
              grid-template-columns: 1fr;
            }

            .po-form {
              grid-template-columns: 1fr;
            }

            .form-actions {
              justify-content: flex-start;
            }
          }

          @media (max-width: 820px) {
            .customer-po-page {
              padding: 16px 14px 28px;
              overflow-x: hidden;
            }

            .page-header {
              flex-direction: column;
              gap: 12px;
              margin-bottom: 16px;
            }

            .breadcrumb {
              font-size: 12px;
              line-height: 1.25;
            }

            .page-title {
              font-size: 36px;
              letter-spacing: -0.025em;
            }

            .page-subtitle {
              font-size: 15px;
              line-height: 1.35;
              margin-top: 8px;
            }

            .refresh-button {
              width: 100%;
              min-height: 48px;
              border-radius: 14px;
            }

            .summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 16px;
            }

            .summary-card {
              padding: 16px;
              border-radius: 16px;
            }

            .summary-label {
              font-size: 11px;
              line-height: 1.25;
            }

            .summary-value {
              font-size: 28px;
            }

            .summary-note {
              font-size: 12px;
            }

            .summary-card:nth-child(3) {
              grid-column: span 2;
            }

            .content-card {
              padding: 16px;
              border-radius: 18px;
            }

            .card-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }

            .card-title {
              font-size: 24px;
              line-height: 1.15;
            }

            .card-subtitle {
              font-size: 13px;
              line-height: 1.35;
            }

            .search-input {
              width: 100%;
              min-height: 48px;
              font-size: 15px;
            }

            .table-wrap {
              border: 0;
              border-radius: 0;
              overflow: visible;
              background: transparent;
            }

            .po-table {
              display: block;
              min-width: 0;
              width: 100%;
              background: transparent;
            }

            .po-table thead {
              display: none;
            }

            .po-table tbody {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }

            .po-table tr {
              display: block;
              width: 100%;
              border: 1px solid #d4e4f5;
              border-radius: 18px;
              background: #f8fbff;
              overflow: hidden;
              box-shadow: 0 8px 18px rgba(0, 43, 91, 0.05);
            }

            .po-table td {
              display: grid;
              grid-template-columns: 112px minmax(0, 1fr);
              gap: 10px;
              align-items: start;
              width: 100%;
              box-sizing: border-box;
              padding: 12px 12px;
              border-bottom: 1px solid #e3edf7;
              font-size: 14px;
              line-height: 1.35;
              word-break: break-word;
            }

            .po-table td::before {
              content: attr(data-label);
              color: #5b7189;
              font-size: 11px;
              line-height: 1.25;
              font-weight: 900;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            .po-table td:last-child {
              border-bottom: 0;
            }

            .col-no,
            .col-qty,
            .col-status,
            .col-action {
              text-align: left;
            }

            .quotation-number {
              font-size: 14px;
              line-height: 1.35;
            }

            .description-text {
              display: block;
              -webkit-line-clamp: unset;
              max-height: 92px;
              overflow: auto;
              padding-right: 4px;
              line-height: 1.4;
            }

            .badge {
              width: fit-content;
              min-width: 88px;
              min-height: 28px;
            }

            .file-link-button {
              font-size: 14px;
            }

            .file-note {
              font-size: 12px;
            }

            .action-button {
              width: 100%;
              min-height: 44px;
              font-size: 14px;
              border-radius: 12px;
            }

            .po-form-row {
              margin-top: -8px;
              border-color: #bcd6ef !important;
              background: #eef6ff !important;
            }

            .po-form-row td {
              display: block;
              padding: 0;
              border-bottom: 0;
            }

            .po-form-row td::before {
              display: none;
            }

            .po-form {
              display: grid;
              grid-template-columns: 1fr;
              gap: 14px;
              padding: 16px;
              border-top: 0;
              background: #eef6ff;
            }

            .field label {
              font-size: 12px;
            }

            .field input {
              min-height: 48px;
              font-size: 15px;
              border-radius: 13px;
            }

            .form-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              width: 100%;
            }

            .save-button,
            .cancel-button {
              width: 100%;
              min-height: 46px;
              padding: 12px;
              border-radius: 13px;
            }

            .empty-state {
              padding: 22px 14px;
            }

            .po-table tr:has(.empty-state) {
              display: block;
              background: #ffffff;
            }

            .po-table tr:has(.empty-state) td {
              display: block;
              border-bottom: 0;
            }

            .po-table tr:has(.empty-state) td::before {
              display: none;
            }
          }

          @media (max-width: 430px) {
            .customer-po-page {
              padding: 14px 12px 26px;
            }

            .page-title {
              font-size: 34px;
            }

            .summary-grid {
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .summary-card {
              padding: 14px;
            }

            .summary-value {
              font-size: 26px;
            }

            .content-card {
              padding: 14px;
            }

            .po-table td {
              grid-template-columns: 98px minmax(0, 1fr);
              gap: 8px;
              padding: 11px 10px;
              font-size: 13.5px;
            }

            .po-table td::before {
              font-size: 10.5px;
            }

            .form-actions {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="page-header">
          <div>
            <div className="breadcrumb">SALES-APP / Transaction / Customer PO</div>
            <h1 className="page-title">Customer PO</h1>
            <p className="page-subtitle">
              Kelola official Purchase Order dari customer berdasarkan quotation yang sudah dibuat.
            </p>
          </div>

          <button className="refresh-button" type="button" onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Quotations</div>
            <div className="summary-value">{totalQuotation}</div>
            <div className="summary-note">Quotation tersedia</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">PO Sudah Ada</div>
            <div className="summary-value">{totalWithPO}</div>
            <div className="summary-note">PO sudah diupload</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">PO Belum Ada</div>
            <div className="summary-value">{totalWithoutPO}</div>
            <div className="summary-note">Menunggu PO customer</div>
          </div>
        </section>

        {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}
        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

        <section className="content-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Quotation List for Customer PO</h2>
              <p className="card-subtitle">
                Data diambil dari Quotation List. Klik Insert PO untuk memasukkan nomor PO dan upload file resmi customer.
              </p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quotation / customer..."
            />
          </div>

          <div className="table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th className="col-no">No.</th>
                  <th className="col-quote">Quotation No</th>
                  <th className="col-date">Date</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-attention">Attention</th>
                  <th className="col-desc">Description Item</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-status">PO Status</th>
                  <th className="col-po">PO Number</th>
                  <th className="col-file">File PO</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">Loading data Customer PO...</div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">Belum ada data quotation untuk Customer PO.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <React.Fragment key={row.id}>
                      <tr>
                        <td className="col-no" data-label="No.">
                          {index + 1}
                        </td>

                        <td className="col-quote" data-label="Quotation No">
                          <span className="quotation-number">{row.quotationNumber}</span>
                        </td>

                        <td className="col-date" data-label="Date">
                          {row.quoteDate}
                        </td>

                        <td className="col-customer" data-label="Customer">
                          {row.customerName}
                        </td>

                        <td className="col-attention" data-label="Attention">
                          {row.attention}
                        </td>

                        <td className="col-desc" data-label="Description Item">
                          <div className="description-text">{row.descriptionItem}</div>
                        </td>

                        <td className="col-qty" data-label="Qty">
                          {row.qty || '-'}
                        </td>

                        <td className="col-status" data-label="PO Status">
                          <span className={row.poStatus === 'Sudah Ada' ? 'badge badge-ready' : 'badge badge-empty'}>
                            {row.poStatus}
                          </span>
                        </td>

                        <td className="col-po" data-label="PO Number">
                          {row.poNumber}
                        </td>

                        <td className="col-file" data-label="File PO">
                          {row.storagePath ? (
                            <div>
                              <button type="button" className="file-link-button" onClick={() => openFile(row.storagePath)}>
                                Lihat File PO
                              </button>

                              <div className="file-note">
                                {row.fileName || 'File PO'} · {formatFileSize(row.fileSize)}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="col-action" data-label="Action">
                          <button className="action-button" type="button" onClick={() => openPoForm(row)}>
                            {row.poStatus === 'Sudah Ada' ? 'Update PO' : 'Insert PO'}
                          </button>
                        </td>
                      </tr>

                      {activeQuotationId === row.id ? (
                        <tr className="po-form-row" id={`po-form-${row.id}`}>
                          <td colSpan={11}>
                            <div className="po-form">
                              <div className="field">
                                <label>PO Number</label>
                                <input
                                  value={poNumber}
                                  onChange={(event) => setPoNumber(event.target.value)}
                                  placeholder="Contoh: PO-PRISMA-001"
                                />
                              </div>

                              <div className="field">
                                <label>PO Date</label>
                                <input type="date" value={poDate} onChange={(event) => setPoDate(event.target.value)} />
                              </div>

                              <div className="field">
                                <label>{row.poStatus === 'Sudah Ada' ? 'Upload File PO Baru' : 'Upload File PO'}</label>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                  onChange={handleFileChange}
                                />
                              </div>

                              <div className="form-actions">
                                <button className="save-button" type="button" onClick={() => savePO(row)} disabled={saving}>
                                  {saving ? 'Saving...' : row.poStatus === 'Sudah Ada' ? 'Update PO' : 'Save PO'}
                                </button>

                                <button
                                  className="cancel-button"
                                  type="button"
                                  onClick={() => {
                                    setActiveQuotationId(null);
                                    setPoNumber('');
                                    setPoDate('');
                                    setSelectedFile(null);
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}