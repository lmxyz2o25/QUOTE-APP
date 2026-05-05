# Panduan Font Print Layout Proforma Invoice

File terkait:

D:\QUOTE-APP\apps\web\app\proforma-invoice\printlayout.tsx

---

## 1. `.pi-customer-block`

Untuk mengatur font data customer/pelanggan.

Contoh yang berubah:

Prismalink Internasional PT  
Bapak Asep Ruspeni  
Dipo Business Center, Rukan Blok B8  
Jl. Jenderal Gatot Subroto No.Kav 50-52  
Tanah Abang  
Kota Jakarta Pusat, 10260

CSS:

```css
.pi-customer-block {
  font-size: 10.6px;
  line-height: 1.22;
}

2. .pi-customer-invoice-meta

Untuk mengatur font Invoice No.# dan Date di bawah alamat customer.

Contoh yang berubah:

Invoice No.# : CBI-INV001-PI/V/2026
Date : 05-05-2026

CSS:

.pi-customer-invoice-meta {
  font-size: 10.6px;
  line-height: 1.18;
}
3. .pi-meta-block

Untuk mengatur font PO Number, Date, dan Status di kanan atas.

Contoh yang berubah:

PO Number# : PO-TEST-001
Date : 04-05-2026
Status : Payment waiting

CSS:

.pi-meta-block {
  font-size: 10.6px;
  line-height: 1.18;
  transform: translateX(50mm);
}

Keterangan tambahan:

transform: translateX(50mm);

Dipakai untuk menggeser posisi ke kanan/kiri.

Lebih kanan:

transform: translateX(55mm);

Lebih kiri:

transform: translateX(45mm);
4. .pi-item-table

Untuk mengatur font utama tabel item/product.

Contoh yang berubah:

NO. | DESCRIPTION | QTY | PRICE IDR | TOTAL IDR

CSS:

.pi-item-table {
  font-size: 10.2px;
  line-height: 1.16;
}

Bagian ini mempengaruhi:

nomor item
nama product
qty
price
total
5. .pi-item-table thead th

Untuk mengatur font judul kolom tabel.

Contoh yang berubah:

NO.
DESCRIPTION
QTY
PRICE IDR
TOTAL IDR

CSS:

.pi-item-table thead th {
  font-size: 10px;
}
6. .pi-product-detail

Untuk mengatur font detail spesifikasi product.

Contoh yang berubah:

Intel Xeon Silver 4514Y
Memory up to 1.5TB
2x 480GB SSD
PERC H755 Adapter
iDRAC9 Enterprise

CSS:

.pi-product-detail {
  font-size: 9.7px;
  line-height: 1.14;
}

Catatan penting:

Bagian ini paling banyak memakan ruang halaman. Jika font terlalu besar, layout bisa berubah menjadi 2 halaman.

Rekomendasi aman:

font-size: 9.5px sampai 10px;
line-height: 1.12 sampai 1.18;
7. .pi-bottom-main

Untuk mengatur font area bawah, yaitu payment dan summary.

CSS:

.pi-bottom-main {
  font-size: 10.8px;
  line-height: 1.32;
}

Bagian yang terpengaruh:

PAYMENT STATUS
PAYMENT TRANSFER TO
PAYMENT NOTE
SUBTOTAL
DISC
DP
TAX
GRAND TOTAL
In words

8. .pi-section-title

Untuk mengatur judul bagian bawah.

Contoh yang berubah:

PAYMENT STATUS :
PAYMENT TRANSFER TO :
PAYMENT NOTE :

CSS:

.pi-section-title {
  font-size: 11px;
}

Kalau ingin lebih tegas:

.pi-section-title {
  font-size: 11.5px;
  font-weight: 900;
}
9. .pi-summary-table

Untuk mengatur font summary angka kanan bawah.

Contoh yang berubah:

SUBTOTAL : 777.000.000,00
DISC : 0,00
DP : 388.500.000,00
TAX 0% : 0,00

CSS:

.pi-summary-table {
  font-size: 10.9px;
}
10. .pi-grand-label dan .pi-grand-value

Untuk mengatur GRAND TOTAL supaya lebih besar dan tegas.

Contoh yang berubah:

GRAND TOTAL : 388.500.000,00

CSS:

.pi-grand-label,
.pi-grand-value {
  font-size: 11.4px;
}

Jika ingin lebih besar:

.pi-grand-label,
.pi-grand-value {
  font-size: 12px;
}
11. .pi-inwords

Untuk mengatur font terbilang.

Contoh yang berubah:

In words:
Tiga Ratus Delapan Puluh Delapan Juta Lima Ratus Ribu Rupiah

CSS:

.pi-inwords {
  font-size: 10.8px;
}

Catatan:

Tidak apa-apa jika teks terbilang turun menjadi 2 baris.

12. .pi-approve-area

Untuk mengatur font area tanda tangan.

Contoh yang berubah:

Approve by:
Prismalink Internasional PT

Sign name:

Approve by:
PT. Cipta Bangun Infrastruktur

Aeky Hermanto

CSS:

.pi-approve-area {
  font-size: 10.8px;
}

Untuk menaikkan atau menurunkan area tanda tangan, ubah:

.pi-approve-area {
  margin-top: 8mm;
}

Lebih turun:

margin-top: 10mm;

Lebih naik:

margin-top: 6mm;
13. .pi-thankyou

Untuk mengatur tulisan:

THANK YOU FOR YOUR BUSINESS!

CSS:

.pi-thankyou {
  font-size: 11.4px;
}

Jika ingin lebih besar:

.pi-thankyou {
  font-size: 12px;
}
Rekomendasi Aman Membesarkan Font

Jika ingin membesarkan font, naikkan sedikit saja:

dari 10px menjadi 10.4px
dari 10.4px menjadi 10.8px
dari 9.7px menjadi 10px

Jangan langsung terlalu besar, karena layout bisa berubah menjadi 2 halaman.

Bagian yang paling mempengaruhi tinggi halaman:
.pi-product-detail.pi-item-table.pi-bottom-main

Cara Testing Setelah Ubah Font


Simpan file:


D:\QUOTE-APP\apps\web\app\proforma-invoice\printlayout.tsx


Buka browser.


Tekan:


Ctrl + F5


Buka:


http://localhost:3000/proforma-invoice


Klik Print Preview.


Cek apakah layout masih rapi dan tetap 1 halaman.


Setelah itu **Save** file tersebut.File script yang ini:```textdocs\create-proforma-font-guide.ps1
boleh dihapus saja, karena tidak perlu lagi.