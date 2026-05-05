cd D:\QUOTE-APP

$docsDir = "D:\QUOTE-APP\docs"
$filePath = "$docsDir\panduan-font-print-layout-proforma-invoice.md"

if (!(Test-Path $docsDir)) {
  New-Item -ItemType Directory -Path $docsDir | Out-Null
}

$content = @"
# Panduan Font Print Layout Proforma Invoice

File terkait:

D:\QUOTE-APP\apps\web\app\proforma-invoice\printlayout.tsx

## 1. .pi-customer-block

Untuk mengatur font data customer/pelanggan.

Contoh:
Prismalink Internasional PT
Bapak Asep Ruspeni
Dipo Business Center, Rukan Blok B8
Jl. Jenderal Gatot Subroto No.Kav 50-52
Tanah Abang
Kota Jakarta Pusat, 10260

CSS:
````css
.pi-customer-block {
  font-size: 10.6px;
  line-height: 1.22;
}