'use client';

import AppShell from '../components/AppShell';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

type TaxMode = 'include' | 'exclude';

type ProductRow = {
  id: string;
  product_name?: string | null;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  product_type?: string | null;
  serial_number?: string | null;
  product_details?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  tax_mode?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProductForm = {
  id?: string;
  brand: string;
  category: string;
  subcategory: string;
  product_type: string;
  title: string;
  serial_number: string;
  product_details: string;
  quantity: string;
  unit_price: string;
  tax_mode: TaxMode;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emptyForm: ProductForm = {
  brand: '',
  category: '',
  subcategory: '',
  product_type: '',
  title: '',
  serial_number: '',
  product_details: '',
  quantity: '1',
  unit_price: '0',
  tax_mode: 'exclude',
};

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function cleanPastedText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\f/g, '\n')
    .replace(/\t/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ ]{2,}/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function plainTextFromValue(value?: string | null) {
  if (!value) return '-';

  if (typeof window === 'undefined') {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '-';
  }

  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent?.replace(/\s+/g, ' ').trim() || '-';
}

export default function ProductsPage() {
  const detailsEditorRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadProducts() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setProducts([]);
    } else {
      setProducts((data || []) as ProductRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const brandOptions = useMemo(() => uniqueOptions(products.map((item) => item.brand)), [products]);
  const categoryOptions = useMemo(() => uniqueOptions(products.map((item) => item.category)), [products]);
  const subcategoryOptions = useMemo(() => uniqueOptions(products.map((item) => item.subcategory)), [products]);
  const typeOptions = useMemo(() => uniqueOptions(products.map((item) => item.product_type)), [products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((item) => {
      return [
        item.brand,
        item.category,
        item.subcategory,
        item.product_type,
        item.product_name,
        item.serial_number,
        plainTextFromValue(item.product_details),
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [products, search]);

  const totalProducts = products.length;
  const totalBrands = brandOptions.length;
  const totalCategories = categoryOptions.length;

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function focusDetailsEditor() {
    detailsEditorRef.current?.focus();
  }

  function getEditorPlainText() {
    if (!detailsEditorRef.current) return '';
    return detailsEditorRef.current.innerText || '';
  }

  function syncEditorToForm() {
    const text = getEditorPlainText();
    updateForm('product_details', text);
    return text;
  }

  function runDetailsCommand(command: string, value?: string) {
    focusDetailsEditor();
    document.execCommand(command, false, value);

    if (detailsEditorRef.current) {
      updateForm('product_details', detailsEditorRef.current.innerText || '');
      detailsEditorRef.current.focus();
    }
  }

  function setEditorText(text: string) {
    if (detailsEditorRef.current) {
      detailsEditorRef.current.innerText = text || '';
    }
  }

  function insertCleanTextToEditor(text: string) {
    const cleanText = cleanPastedText(text);
    if (!cleanText) return;

    focusDetailsEditor();

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      document.execCommand('insertText', false, cleanText);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(cleanText);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function handlePasteToEditor(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();

    const text = event.clipboardData.getData('text/plain');
    insertCleanTextToEditor(text);

    setTimeout(() => {
      syncEditorToForm();
    }, 0);
  }

  function editProduct(product: ProductRow) {
    const productDetails = product.product_details || '';

    setForm({
      id: product.id,
      brand: product.brand || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      product_type: product.product_type || '',
      title: product.product_name || '',
      serial_number: product.serial_number || '',
      product_details: productDetails,
      quantity: String(product.quantity ?? 1),
      unit_price: String(product.unit_price ?? 0),
      tax_mode: product.tax_mode === 'include' ? 'include' : 'exclude',
    });

    setTimeout(() => {
      setEditorText(productDetails);
      detailsEditorRef.current?.focus();
    }, 0);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage('');

    if (detailsEditorRef.current) {
      detailsEditorRef.current.innerText = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const productName = form.title.trim();
    const detailsValue = cleanPastedText(getEditorPlainText() || form.product_details || '');

    const payload = {
      product_name: productName,
      brand: form.brand.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim() || null,
      product_type: form.product_type.trim() || null,
      serial_number: form.serial_number.trim() || null,
      product_details: detailsValue || null,
      quantity: Number(form.quantity || 0),
      unit_price: Number(form.unit_price || 0),
      tax_mode: form.tax_mode,
      updated_at: new Date().toISOString(),
    };

    const result = form.id
      ? await supabase.from('products').update(payload).eq('id', form.id)
      : await supabase.from('products').insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(form.id ? 'Product berhasil di-update.' : 'Product berhasil disimpan.');
      resetForm();
      await loadProducts();
    }

    setSaving(false);
  }

  function formatCurrency(value?: number | null) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function renderProductDetailsPreview(productDetails?: string | null) {
    const text = plainTextFromValue(productDetails);
    return text.length > 95 ? `${text.slice(0, 95)}...` : text;
  }

  return (
    <AppShell activeMenu="Products">
      <main className="products-page">
        <section className="page-header">
          <div className="page-title-wrap">
            <div className="breadcrumb">SALES-APP / Master Data / Products</div>
            <h1>Products</h1>
            <p>Kelola brand, kategori, spesifikasi produk, quantity, harga, dan tax mode untuk kebutuhan quotation.</p>
          </div>

          <button type="button" onClick={loadProducts} className="secondary-button refresh-button">
            Refresh Data
          </button>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Products</div>
            <div className="summary-value">{totalProducts}</div>
            <div className="summary-hint">Data produk tersimpan</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Brands</div>
            <div className="summary-value">{totalBrands}</div>
            <div className="summary-hint">Brand aktif di database</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Categories</div>
            <div className="summary-value">{totalCategories}</div>
            <div className="summary-hint">Kategori produk tersedia</div>
          </div>
        </section>

        {message ? (
          <div className={message.toLowerCase().includes('berhasil') ? 'success-box' : 'error-box'}>{message}</div>
        ) : null}

        <section className="card">
          <div className="card-header">
            <div>
              <h2>{form.id ? 'Edit Product' : 'Add New Product'}</h2>
              <p>Gunakan form ini untuk menambahkan atau memperbarui master produk.</p>
            </div>

            <span className={form.id ? 'edit-mode-badge' : 'new-mode-badge'}>
              {form.id ? 'Editing Mode' : 'New Product'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <div className="grid-4">
              <label className="field-label">
                Brand
                <input
                  className="input"
                  list="brand-options"
                  value={form.brand}
                  onChange={(e) => updateForm('brand', e.target.value)}
                  placeholder="Contoh: Dell"
                  required
                />
                <datalist id="brand-options">
                  {brandOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <label className="field-label">
                Categories
                <input
                  className="input"
                  list="category-options"
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                  placeholder="Contoh: Server"
                  required
                />
                <datalist id="category-options">
                  {categoryOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <label className="field-label">
                Subcategories
                <input
                  className="input"
                  list="subcategory-options"
                  value={form.subcategory}
                  onChange={(e) => updateForm('subcategory', e.target.value)}
                  placeholder="Contoh: Rack Server"
                />
                <datalist id="subcategory-options">
                  {subcategoryOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <label className="field-label">
                Type
                <input
                  className="input"
                  list="type-options"
                  value={form.product_type}
                  onChange={(e) => updateForm('product_type', e.target.value)}
                  placeholder="Contoh: PowerEdge"
                />
                <datalist id="type-options">
                  {typeOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="grid-2">
              <label className="field-label">
                Title Products
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Contoh: Dell PowerEdge R450"
                  required
                />
              </label>

              <label className="field-label">
                Serial Number
                <input
                  className="input"
                  value={form.serial_number}
                  onChange={(e) => updateForm('serial_number', e.target.value)}
                  placeholder="Service tag / serial number"
                />
              </label>
            </div>

            <div className="grid-details">
              <div className="field-label">
                <span>Product Details</span>

                <div className="word-toolbar">
                  <select
                    className="font-select"
                    defaultValue="Arial"
                    onChange={(e) => runDetailsCommand('fontName', e.target.value)}
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
                    onChange={(e) => runDetailsCommand('fontSize', e.target.value)}
                  >
                    <option value="2">10</option>
                    <option value="3">12</option>
                    <option value="4">14</option>
                    <option value="5">18</option>
                    <option value="6">24</option>
                  </select>

                  <span className="toolbar-divider" />

                  <button type="button" title="Bold" className="toolbar-button" onClick={() => runDetailsCommand('bold')}>
                    B
                  </button>

                  <button type="button" title="Italic" className="toolbar-button" onClick={() => runDetailsCommand('italic')}>
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>

                  <button
                    type="button"
                    title="Underline"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('underline')}
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>

                  <button
                    type="button"
                    title="Strike"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('strikeThrough')}
                  >
                    <span style={{ textDecoration: 'line-through' }}>ab</span>
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Bullets"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('insertUnorderedList')}
                  >
                    •
                  </button>

                  <button
                    type="button"
                    title="Numbering"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('insertOrderedList')}
                  >
                    1.
                  </button>

                  <button type="button" title="Outdent" className="toolbar-button" onClick={() => runDetailsCommand('outdent')}>
                    ←
                  </button>

                  <button type="button" title="Indent" className="toolbar-button" onClick={() => runDetailsCommand('indent')}>
                    →
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Align Left"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('justifyLeft')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Center"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('justifyCenter')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Right"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('justifyRight')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Justify"
                    className="toolbar-button"
                    onClick={() => runDetailsCommand('justifyFull')}
                  >
                    ≣
                  </button>

                  <span className="toolbar-divider" />

                  <button
                    type="button"
                    title="Heading"
                    className="text-tool-button"
                    onClick={() => runDetailsCommand('formatBlock', 'h3')}
                  >
                    Heading
                  </button>

                  <button
                    type="button"
                    title="Paragraph"
                    className="text-tool-button"
                    onClick={() => runDetailsCommand('formatBlock', 'p')}
                  >
                    Paragraph
                  </button>

                  <button
                    type="button"
                    title="Clear Format"
                    className="text-tool-button"
                    onClick={() => runDetailsCommand('removeFormat')}
                  >
                    Clear
                  </button>
                </div>

                <div
                  ref={detailsEditorRef}
                  contentEditable
                  tabIndex={0}
                  role="textbox"
                  aria-label="Product details"
                  className="editor"
                  suppressContentEditableWarning
                  onMouseDown={(e) => {
                    e.currentTarget.focus();
                  }}
                  onClick={(e) => {
                    e.currentTarget.focus();
                  }}
                  onKeyUp={(e) => updateForm('product_details', e.currentTarget.innerText)}
                  onInput={(e) => updateForm('product_details', e.currentTarget.innerText)}
                  onBlur={(e) => updateForm('product_details', e.currentTarget.innerText)}
                  onPaste={handlePasteToEditor}
                />
              </div>

              <div className="price-panel">
                <div>
                  <h3>Price Information</h3>
                  <p>Isi quantity, unit price, dan pilihan pajak untuk dipakai sebagai default saat quotation.</p>
                </div>

                <label className="field-label">
                  Quantity
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => updateForm('quantity', e.target.value)}
                    placeholder="1"
                  />
                </label>

                <label className="field-label">
                  Unit Price
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.unit_price}
                    onChange={(e) => updateForm('unit_price', e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="field-label">
                  Tax
                  <select
                    className="input"
                    value={form.tax_mode}
                    onChange={(e) => updateForm('tax_mode', e.target.value as TaxMode)}
                  >
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update Product' : 'Save Product'}
              </button>

              {form.id ? (
                <button type="button" onClick={resetForm} className="secondary-button">
                  Cancel Edit
                </button>
              ) : (
                <button type="button" onClick={resetForm} className="secondary-button">
                  Clear Form
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card-header list-header">
            <div>
              <h2>List Products</h2>
              <p>Daftar produk yang tersimpan di database Supabase.</p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
            />
          </div>

          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Categories</th>
                  <th>Type</th>
                  <th>Title Products</th>
                  <th>Product Details</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="td-center" colSpan={9}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td className="td-center" colSpan={9}>
                      Belum ada data product.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td data-label="Brand">{product.brand || '-'}</td>
                      <td data-label="Categories">{product.category || '-'}</td>
                      <td data-label="Type">{product.product_type || product.subcategory || '-'}</td>
                      <td data-label="Title Products">
                        <div className="product-title-cell">{product.product_name || '-'}</div>
                        <div className="product-meta-cell">{product.serial_number || '-'}</div>
                      </td>
                      <td data-label="Product Details">{renderProductDetailsPreview(product.product_details)}</td>
                      <td data-label="Qty">{product.quantity ?? 0}</td>
                      <td data-label="Unit Price">{formatCurrency(product.unit_price)}</td>
                      <td data-label="Tax">
                        <span className={product.tax_mode === 'include' ? 'tax-include' : 'tax-exclude'}>
                          {product.tax_mode === 'include' ? 'Include' : 'Exclude'}
                        </span>
                      </td>
                      <td data-label="Action">
                        <button type="button" className="edit-button" onClick={() => editProduct(product)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <style jsx>{`
          .products-page {
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

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 20px;
          }

          .summary-card {
            background: #ffffff;
            border: 1px solid #d8e3ef;
            border-radius: 22px;
            padding: 22px;
            box-shadow: none;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .summary-label {
            font-size: 13px;
            font-weight: 800;
            color: #315d8a;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 8px;
          }

          .summary-value {
            font-size: 34px;
            line-height: 1;
            color: #062b52;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .summary-hint {
            color: #4f6f90;
            font-size: 14px;
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

          .product-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .grid-details {
            display: grid;
            grid-template-columns: minmax(0, 1.28fr) minmax(280px, 0.72fr);
            gap: 14px;
            align-items: start;
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
            width: 100%;
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
            min-height: 210px;
            border: 1px solid #cfdeeb;
            border-radius: 0 0 12px 12px;
            padding: 14px;
            font-size: 14px;
            font-weight: 400;
            outline: none;
            color: #0b315a;
            background: #ffffff;
            line-height: 1.55;
            box-sizing: border-box;
            cursor: text;
            user-select: text;
            white-space: pre-line;
            overflow-x: hidden;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .price-panel {
            display: flex;
            flex-direction: column;
            gap: 16px;
            border: 1px solid #cfdeeb;
            border-radius: 18px;
            background: #f6faff;
            padding: 18px;
            box-sizing: border-box;
          }

          .price-panel h3 {
            margin: 0;
            font-size: 21px;
            line-height: 1.15;
            color: #062b52;
            font-weight: 700;
          }

          .price-panel p {
            margin: 8px 0 0;
            color: #4f6f90;
            font-size: 15px;
            line-height: 1.45;
            font-weight: 400;
          }

          .actions {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
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

          .products-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 14px;
          }

          .products-table th {
            text-align: left;
            padding: 14px 16px;
            background: #f2f7fc;
            color: #173b5f;
            font-size: 12px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            border-bottom: 1px solid #e0e9f2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .products-table td {
            padding: 14px 16px;
            border-bottom: 1px solid #edf2f7;
            color: #173b5f;
            vertical-align: top;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .td-center {
            padding: 18px 16px;
            border-bottom: 1px solid #edf2f7;
            color: #173b5f;
            vertical-align: top;
            text-align: center;
          }

          .product-title-cell {
            color: #173b5f;
            font-size: 14px;
            font-weight: 700;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .product-meta-cell {
            margin-top: 4px;
            color: #60758c;
            font-size: 12px;
            font-weight: 400;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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

          .tax-include,
          .tax-exclude {
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 800;
            font-size: 12px;
            display: inline-flex;
          }

          .tax-include {
            background: #e8f8ef;
            color: #067a3c;
          }

          .tax-exclude {
            background: #f1f4f8;
            color: #73849a;
          }

          .new-mode-badge,
          .edit-mode-badge {
            padding: 9px 14px;
            border-radius: 999px;
            font-weight: 800;
            font-size: 13px;
            white-space: nowrap;
          }

          .new-mode-badge {
            background: #e8f8ef;
            color: #067a3c;
            border: 1px solid #bfe8cf;
          }

          .edit-mode-badge {
            background: #fff7e6;
            color: #946200;
            border: 1px solid #f4d492;
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

          @media (max-width: 1180px) {
            .grid-4 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .grid-details {
              grid-template-columns: 1fr;
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

            .refresh-button {
              width: 100%;
              height: 44px;
              padding: 0 14px;
            }

            .summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 14px;
            }

            .summary-card {
              border-radius: 16px;
              padding: 16px;
            }

            .summary-label {
              font-size: 11px;
              line-height: 1.25;
            }

            .summary-value {
              font-size: 28px;
            }

            .summary-hint {
              font-size: 12px;
            }

            .card {
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 14px;
            }

            .card-header,
            .list-header {
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

            .new-mode-badge,
            .edit-mode-badge {
              width: 100%;
              text-align: center;
            }

            .grid-4,
            .grid-2,
            .grid-details {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .input {
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
              min-height: 170px;
              font-size: 14px;
              line-height: 1.55;
            }

            .price-panel {
              padding: 16px;
              border-radius: 16px;
            }

            .price-panel h3 {
              font-size: 20px;
            }

            .price-panel p {
              font-size: 14px;
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

            .products-table {
              display: block;
              width: 100%;
              font-size: 13px;
            }

            .products-table thead {
              display: none;
            }

            .products-table tbody {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .products-table tr {
              display: block;
              border: 1px solid #d8e3ef;
              border-radius: 14px;
              background: #f8fbff;
              overflow: hidden;
              box-shadow: 0 8px 18px rgba(34, 79, 126, 0.05);
            }

            .products-table td {
              display: grid;
              grid-template-columns: 108px minmax(0, 1fr);
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

            .products-table td:last-child {
              border-bottom: 0;
            }

            .products-table td::before {
              content: attr(data-label);
              color: #5d7186;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .td-center {
              display: block !important;
              text-align: center;
              padding: 16px;
            }

            .td-center::before {
              display: none;
            }

            .product-title-cell,
            .product-meta-cell {
              white-space: normal;
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

            .summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .summary-card {
              padding: 14px;
            }

            .summary-label {
              font-size: 10px;
            }

            .summary-value {
              font-size: 27px;
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

            .products-table td {
              grid-template-columns: 96px minmax(0, 1fr);
              padding: 10px;
              gap: 8px;
            }

            .products-table td::before {
              font-size: 11px;
            }
          }

          @media (max-width: 380px) {
            .summary-grid {
              grid-template-columns: 1fr;
            }

            .products-table td {
              grid-template-columns: 1fr;
              gap: 5px;
            }

            .products-table td::before {
              display: block;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}