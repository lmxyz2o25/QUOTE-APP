'use client';

import AppShell from '../components/AppShell';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, CSSProperties, FormEvent } from 'react';
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
      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>SALES-APP / Master Data / Products</div>
            <h1 style={styles.title}>Products</h1>
            <p style={styles.subtitle}>
              Kelola brand, kategori, spesifikasi produk, quantity, harga, dan tax mode untuk kebutuhan quotation.
            </p>
          </div>

          <button type="button" onClick={loadProducts} style={styles.secondaryButton}>
            Refresh Data
          </button>
        </section>

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Products</div>
            <div style={styles.summaryValue}>{totalProducts}</div>
            <div style={styles.summaryHint}>Data produk tersimpan</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Brands</div>
            <div style={styles.summaryValue}>{totalBrands}</div>
            <div style={styles.summaryHint}>Brand aktif di database</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Categories</div>
            <div style={styles.summaryValue}>{totalCategories}</div>
            <div style={styles.summaryHint}>Kategori produk tersedia</div>
          </div>
        </section>

        {message ? (
          <div style={message.toLowerCase().includes('berhasil') ? styles.successBox : styles.errorBox}>
            {message}
          </div>
        ) : null}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>{form.id ? 'Edit Product' : 'Add New Product'}</h2>
              <p style={styles.sectionText}>
                Gunakan form ini untuk menambahkan atau memperbarui master produk.
              </p>
            </div>

            <span style={form.id ? styles.editModeBadge : styles.newModeBadge}>
              {form.id ? 'Editing Mode' : 'New Product'}
            </span>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid4}>
              <label style={styles.label}>
                Brand
                <input
                  style={styles.input}
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

              <label style={styles.label}>
                Categories
                <input
                  style={styles.input}
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

              <label style={styles.label}>
                Subcategories
                <input
                  style={styles.input}
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

              <label style={styles.label}>
                Type
                <input
                  style={styles.input}
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

            <div style={styles.grid2}>
              <label style={styles.label}>
                Title Products
                <input
                  style={styles.input}
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Contoh: Dell PowerEdge R450"
                  required
                />
              </label>

              <label style={styles.label}>
                Serial Number
                <input
                  style={styles.input}
                  value={form.serial_number}
                  onChange={(e) => updateForm('serial_number', e.target.value)}
                  placeholder="Service tag / serial number"
                />
              </label>
            </div>

            <div style={styles.grid2AlignTop}>
              <div style={styles.label}>
                <span>Product Details</span>

                <div style={styles.wordToolbar}>
                  <select
                    style={styles.fontSelect}
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
                    style={styles.sizeSelect}
                    defaultValue="3"
                    onChange={(e) => runDetailsCommand('fontSize', e.target.value)}
                  >
                    <option value="2">10</option>
                    <option value="3">12</option>
                    <option value="4">14</option>
                    <option value="5">18</option>
                    <option value="6">24</option>
                  </select>

                  <span style={styles.toolbarDivider} />

                  <button type="button" title="Bold" style={styles.toolbarButton} onClick={() => runDetailsCommand('bold')}>
                    B
                  </button>

                  <button type="button" title="Italic" style={styles.toolbarButton} onClick={() => runDetailsCommand('italic')}>
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>

                  <button
                    type="button"
                    title="Underline"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('underline')}
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>

                  <button
                    type="button"
                    title="Strike"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('strikeThrough')}
                  >
                    <span style={{ textDecoration: 'line-through' }}>ab</span>
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Bullets"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('insertUnorderedList')}
                  >
                    •
                  </button>

                  <button
                    type="button"
                    title="Numbering"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('insertOrderedList')}
                  >
                    1.
                  </button>

                  <button type="button" title="Outdent" style={styles.toolbarButton} onClick={() => runDetailsCommand('outdent')}>
                    ←
                  </button>

                  <button type="button" title="Indent" style={styles.toolbarButton} onClick={() => runDetailsCommand('indent')}>
                    →
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Align Left"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('justifyLeft')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Center"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('justifyCenter')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Align Right"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('justifyRight')}
                  >
                    ≡
                  </button>

                  <button
                    type="button"
                    title="Justify"
                    style={styles.toolbarButton}
                    onClick={() => runDetailsCommand('justifyFull')}
                  >
                    ≣
                  </button>

                  <span style={styles.toolbarDivider} />

                  <button
                    type="button"
                    title="Heading"
                    style={styles.textToolButton}
                    onClick={() => runDetailsCommand('formatBlock', 'h3')}
                  >
                    Heading
                  </button>

                  <button
                    type="button"
                    title="Paragraph"
                    style={styles.textToolButton}
                    onClick={() => runDetailsCommand('formatBlock', 'p')}
                  >
                    Paragraph
                  </button>

                  <button
                    type="button"
                    title="Clear Format"
                    style={styles.textToolButton}
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
                  style={styles.editor}
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

              <div style={styles.pricePanel}>
                <div>
                  <h3 style={styles.pricePanelTitle}>Price Information</h3>
                  <p style={styles.pricePanelText}>
                    Isi quantity, unit price, dan pilihan pajak untuk dipakai sebagai default saat quotation.
                  </p>
                </div>

                <label style={styles.label}>
                  Quantity
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => updateForm('quantity', e.target.value)}
                    placeholder="1"
                  />
                </label>

                <label style={styles.label}>
                  Unit Price
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.unit_price}
                    onChange={(e) => updateForm('unit_price', e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label style={styles.label}>
                  Tax
                  <select
                    style={styles.input}
                    value={form.tax_mode}
                    onChange={(e) => updateForm('tax_mode', e.target.value as TaxMode)}
                  >
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </select>
                </label>
              </div>
            </div>

            <div style={styles.actions}>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update Product' : 'Save Product'}
              </button>

              {form.id ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Clear Form
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>List Products</h2>
              <p style={styles.sectionText}>Daftar produk yang tersimpan di database Supabase.</p>
            </div>

            <input
              style={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
            />
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Categories</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Title Products</th>
                  <th style={styles.th}>Product Details</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Unit Price</th>
                  <th style={styles.th}>Tax</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td style={styles.tdCenter} colSpan={9}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td style={styles.tdCenter} colSpan={9}>
                      Belum ada data product.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={styles.td}>{product.brand || '-'}</td>
                      <td style={styles.td}>{product.category || '-'}</td>
                      <td style={styles.td}>{product.product_type || product.subcategory || '-'}</td>
                      <td style={styles.td}>
                        <div style={styles.productTitleCell}>{product.product_name || '-'}</div>
                        <div style={styles.productMetaCell}>{product.serial_number || '-'}</div>
                      </td>
                      <td style={styles.td}>{renderProductDetailsPreview(product.product_details)}</td>
                      <td style={styles.td}>{product.quantity ?? 0}</td>
                      <td style={styles.td}>{formatCurrency(product.unit_price)}</td>
                      <td style={styles.td}>
                        <span style={product.tax_mode === 'include' ? styles.taxInclude : styles.taxExclude}>
                          {product.tax_mode === 'include' ? 'Include' : 'Exclude'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button type="button" style={styles.editButton} onClick={() => editProduct(product)}>
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    background: '#ffffff',
    border: '1px solid #d8e3ef',
    borderRadius: 22,
    padding: 22,
    boxShadow: 'none',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: '#315d8a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 34,
    lineHeight: 1,
    color: '#062b52',
    fontWeight: 700,
    marginBottom: 8,
  },
  summaryHint: {
    color: '#4f6f90',
    fontSize: 14,
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
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
  },
  grid2AlignTop: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.28fr) minmax(280px, 0.72fr)',
    gap: 14,
    alignItems: 'start',
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
    width: '100%',
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
    minHeight: 210,
    border: '1px solid #cfdeeb',
    borderRadius: '0 0 12px 12px',
    padding: 14,
    fontSize: 14,
    fontWeight: 400,
    outline: 'none',
    color: '#0b315a',
    background: '#ffffff',
    lineHeight: 1.55,
    boxSizing: 'border-box',
    cursor: 'text',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    whiteSpace: 'pre-line',
    overflowX: 'hidden',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
  },
  pricePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    border: '1px solid #cfdeeb',
    borderRadius: 18,
    background: '#f6faff',
    padding: 18,
    boxSizing: 'border-box',
  },
  pricePanelTitle: {
    margin: 0,
    fontSize: 21,
    lineHeight: 1.15,
    color: '#062b52',
    fontWeight: 700,
  },
  pricePanelText: {
    margin: '8px 0 0',
    color: '#4f6f90',
    fontSize: 15,
    lineHeight: 1.45,
    fontWeight: 400,
  },
  actions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #edf2f7',
    color: '#173b5f',
    verticalAlign: 'top',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdCenter: {
    padding: '18px 16px',
    borderBottom: '1px solid #edf2f7',
    color: '#173b5f',
    verticalAlign: 'top',
    textAlign: 'center',
  },
  productTitleCell: {
    color: '#173b5f',
    fontSize: 14,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productMetaCell: {
    marginTop: 4,
    color: '#60758c',
    fontSize: 12,
    fontWeight: 400,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  taxInclude: {
    background: '#e8f8ef',
    color: '#067a3c',
    padding: '6px 10px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    display: 'inline-flex',
  },
  taxExclude: {
    background: '#f1f4f8',
    color: '#73849a',
    padding: '6px 10px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    display: 'inline-flex',
  },
  newModeBadge: {
    background: '#e8f8ef',
    color: '#067a3c',
    padding: '9px 14px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
    border: '1px solid #bfe8cf',
  },
  editModeBadge: {
    background: '#fff7e6',
    color: '#946200',
    padding: '9px 14px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
    border: '1px solid #f4d492',
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