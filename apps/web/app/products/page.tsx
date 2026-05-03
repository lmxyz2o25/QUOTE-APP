'use client';

import AppShell from '../components/AppShell';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';

type TaxMode = 'include' | 'exclude';

type ProductRow = {
  id: string;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  product_type?: string | null;
  title?: string | null;
  serial_number?: string | null;
  product_details?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  tax_mode?: string | null;
  created_at?: string | null;
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

export default function ProductsPage() {
  const editorRef = useRef<HTMLDivElement | null>(null);

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
      return [item.brand, item.category, item.subcategory, item.product_type, item.title, item.serial_number]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [products, search]);

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function runEditorCommand(command: string, value?: string) {
    document.execCommand(command, false, value);

    if (editorRef.current) {
      updateForm('product_details', editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  }

  function editProduct(product: ProductRow) {
    const productDetails = product.product_details || '';

    setForm({
      id: product.id,
      brand: product.brand || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      product_type: product.product_type || '',
      title: product.title || '',
      serial_number: product.serial_number || '',
      product_details: productDetails,
      quantity: String(product.quantity ?? 1),
      unit_price: String(product.unit_price ?? 0),
      tax_mode: (product.tax_mode as TaxMode) || 'exclude',
    });

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = productDetails;
      }
    }, 0);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage('');

    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const details = editorRef.current?.innerHTML || form.product_details || '';

    const payload = {
      brand: form.brand.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim() || null,
      product_type: form.product_type.trim() || null,
      title: form.title.trim(),
      serial_number: form.serial_number.trim() || null,
      product_details: details,
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

  return (
    <AppShell activeMenu="Products">
      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>SALES-APP / Products</div>
            <h1 style={styles.title}>Products</h1>
            <p style={styles.subtitle}>Kelola data produk untuk quotation dan sales order.</p>
          </div>

          <button type="button" onClick={loadProducts} style={styles.refreshButton}>
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
              <h2 style={styles.sectionTitle}>Products</h2>
              <p style={styles.sectionText}>
                Lengkapi brand, kategori, spesifikasi, quantity, harga, dan tax mode.
              </p>
            </div>
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
                  placeholder="Pilih atau ketik brand baru"
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
                  placeholder="Pilih atau ketik category baru"
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
                  placeholder="Pilih atau ketik subcategory baru"
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
                  placeholder="Pilih atau ketik type baru"
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
                  placeholder="Dell PowerEdge R450"
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

            <div style={styles.detailsAndControlsGrid}>
              <label style={styles.label}>
                Product Details

                <div style={styles.editorBox}>
                  <div style={styles.toolbar}>
                    <select
                      style={styles.toolbarSelect}
                      onChange={(e) => runEditorCommand('fontName', e.target.value)}
                      defaultValue="Arial"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Verdana">Verdana</option>
                    </select>

                    <select
                      style={styles.toolbarSize}
                      onChange={(e) => runEditorCommand('fontSize', e.target.value)}
                      defaultValue="3"
                    >
                      <option value="2">10</option>
                      <option value="3">12</option>
                      <option value="4">14</option>
                      <option value="5">18</option>
                    </select>

                    <span style={styles.toolbarDivider} />

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('bold')}>
                      <b>B</b>
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('italic')}>
                      <i>I</i>
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('underline')}>
                      <u>U</u>
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('strikeThrough')}>
                      <span style={{ textDecoration: 'line-through' }}>ab</span>
                    </button>

                    <span style={styles.toolbarDivider} />

                    <button
                      type="button"
                      style={styles.iconButton}
                      onClick={() => runEditorCommand('insertUnorderedList')}
                    >
                      •
                    </button>

                    <button
                      type="button"
                      style={styles.iconButton}
                      onClick={() => runEditorCommand('insertOrderedList')}
                    >
                      1.
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('outdent')}>
                      ←
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('indent')}>
                      →
                    </button>

                    <span style={styles.toolbarDivider} />

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('justifyLeft')}>
                      ≡
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('justifyCenter')}>
                      ≡
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('justifyRight')}>
                      ≡
                    </button>

                    <button type="button" style={styles.iconButton} onClick={() => runEditorCommand('justifyFull')}>
                      ≣
                    </button>

                    <span style={styles.toolbarDivider} />

                    <button
                      type="button"
                      style={styles.textToolButton}
                      onClick={() => runEditorCommand('formatBlock', 'h3')}
                    >
                      Heading
                    </button>

                    <button
                      type="button"
                      style={styles.textToolButton}
                      onClick={() => runEditorCommand('formatBlock', 'p')}
                    >
                      Paragraph
                    </button>

                    <button type="button" style={styles.textToolButton} onClick={() => runEditorCommand('removeFormat')}>
                      Clear
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    style={styles.editor}
                    suppressContentEditableWarning
                    onInput={(e) => updateForm('product_details', e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: form.product_details }}
                  />
                </div>
              </label>

              <div style={styles.rightControlsGrid}>
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
                <button type="button" onClick={resetForm} style={styles.cancelButton}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>List Products</h2>
              <p style={styles.sectionText}>Daftar produk yang tersimpan di database.</p>
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
                  <th style={styles.th}>Title Products</th>
                  <th style={styles.th}>Unit Price</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      Belum ada data product.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={styles.td}>{product.brand || '-'}</td>
                      <td style={styles.td}>{product.category || '-'}</td>
                      <td style={styles.td}>{product.title || '-'}</td>
                      <td style={styles.td}>{formatCurrency(product.unit_price)}</td>
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
    width: '100%',
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
    alignItems: 'flex-start',
    marginBottom: 20,
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
  refreshButton: {
    border: '1px solid #cbdceb',
    background: '#ffffff',
    color: '#075a9f',
    borderRadius: 14,
    padding: '14px 22px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(8, 43, 82, 0.04)',
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
    marginBottom: 22,
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 20,
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
    gap: 18,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 18,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 18,
  },
  detailsAndControlsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 18,
    alignItems: 'start',
  },
  rightControlsGrid: {
    display: 'grid',
    gridTemplateColumns: '110px minmax(0, 1fr) 140px',
    gap: 18,
    alignItems: 'start',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 15,
    fontWeight: 700,
    color: '#062b52',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 13,
    border: '1px solid #c8dceb',
    padding: '0 16px',
    fontSize: 16,
    fontWeight: 400,
    outline: 'none',
    color: '#082b52',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  editorBox: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    padding: '10px 12px',
    border: '1px solid #c8dceb',
    borderBottom: 0,
    borderRadius: '14px 14px 0 0',
    background: '#f7fbff',
    boxSizing: 'border-box',
  },
  toolbarSelect: {
    height: 40,
    minWidth: 120,
    borderRadius: 9,
    border: '1px solid #c5d8e8',
    background: '#ffffff',
    color: '#082b52',
    fontSize: 15,
    fontWeight: 400,
    padding: '0 12px',
    outline: 'none',
  },
  toolbarSize: {
    height: 40,
    minWidth: 70,
    borderRadius: 9,
    border: '1px solid #c5d8e8',
    background: '#ffffff',
    color: '#082b52',
    fontSize: 15,
    fontWeight: 400,
    padding: '0 10px',
    outline: 'none',
  },
  toolbarDivider: {
    width: 1,
    height: 36,
    background: '#cbdceb',
    margin: '0 4px',
  },
  iconButton: {
    minWidth: 34,
    height: 36,
    border: 0,
    background: 'transparent',
    color: '#082b52',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 400,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  textToolButton: {
    height: 38,
    border: '1px solid #cbdceb',
    background: '#ffffff',
    color: '#082b52',
    borderRadius: 9,
    padding: '0 12px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  editor: {
    width: '100%',
    minHeight: 118,
    border: '1px solid #c8dceb',
    borderRadius: '0 0 14px 14px',
    padding: 16,
    fontSize: 16,
    fontWeight: 400,
    outline: 'none',
    color: '#082b52',
    background: '#ffffff',
    lineHeight: 1.65,
    boxSizing: 'border-box',
    overflowX: 'hidden',
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
    borderRadius: 13,
    padding: '14px 22px',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    minWidth: 150,
  },
  cancelButton: {
    border: '1px solid #cbdceb',
    background: '#ffffff',
    color: '#075a9f',
    borderRadius: 13,
    padding: '13px 18px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  search: {
    width: 320,
    height: 48,
    borderRadius: 13,
    border: '1px solid #c8dceb',
    padding: '0 16px',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: 15,
    color: '#082b52',
    background: '#ffffff',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'hidden',
    border: '1px solid #d8e3ef',
    borderRadius: 15,
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontSize: 15,
  },
  th: {
    textAlign: 'left',
    padding: '15px 16px',
    background: '#f0f6fb',
    color: '#082b52',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    borderBottom: '1px solid #d8e3ef',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '15px 16px',
    borderBottom: '1px solid #edf2f7',
    color: '#082b52',
    verticalAlign: 'middle',
    fontSize: 15,
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
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
  successBox: {
    background: '#e9f9ef',
    border: '1px solid #bdebcf',
    color: '#08753b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    fontWeight: 700,
  },
  errorBox: {
    background: '#fff0f0',
    border: '1px solid #ffc8c8',
    color: '#b00020',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    fontWeight: 700,
  },
};