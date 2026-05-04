// src/app/quotations/printlayout.tsx
'use client';

import React from 'react';

type QuoteItem = {
  id: string;
  productId?: string;
  description: string;
  qty: number;
  price: number;
  status: string;
};

type PrintLayoutProps = {
  quoteNo: string;
  quoteDate: string;
  customerName: string;
  attention: string;
  address: string;
  priority: string;
  terms: string;
  logoSrc: string;
  addressImageSrc: string;

  items: QuoteItem[];

  subtotal: number;
  discountValue: number;
  taxPercent: number;
  taxValue: number;
  grandTotal: number;
  inWords: string;

  formatCurrency: (value: number) => string;
  getProductName: (item: QuoteItem) => string;
  getDetailSpec: (item: QuoteItem) => string;
};

function normalizeAssetPath(src: string) {
  if (!src) return '';
  if (src.startsWith('/images/')) return src;
  if (src.startsWith('/')) return `/images${src}`;
  return `/images/${src}`;
}

function cleanHtml(value: string) {
  return (value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
}

function safePrintTitle(quoteNo: string) {
  const cleanQuote = (quoteNo || 'Quotation')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanQuote || 'Quotation';
}

export default function PrintLayout(props: PrintLayoutProps) {
  const {
    quoteNo,
    quoteDate,
    customerName,
    attention,
    address,
    priority,
    terms,
    logoSrc,
    addressImageSrc,
    items,
    subtotal,
    discountValue,
    taxPercent,
    taxValue,
    grandTotal,
    inWords,
    formatCurrency,
    getProductName,
    getDetailSpec,
  } = props;

  const safeLogoSrc = normalizeAssetPath(logoSrc || '/images/Logo-CBI.png');
  const safeAddressImageSrc = normalizeAssetPath(addressImageSrc || '/images/address-cbi.png');
  const quotationHeaderSrc = '/images/quotation.png';

  const isBefore = (item: QuoteItem) => {
    return (item.description || '').toUpperCase().includes('BEFORE');
  };

  const isRevisi = (item: QuoteItem) => {
    return (item.description || '').toUpperCase().includes('REVISI');
  };

  const validItems = items.filter((item) => !isBefore(item));

  const computedSubtotal =
    subtotal && subtotal > 0
      ? subtotal
      : validItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  const computedTaxValue =
    typeof taxValue === 'number'
      ? taxValue
      : (computedSubtotal - discountValue) * (taxPercent / 100);

  const computedGrandTotal =
    grandTotal && grandTotal > 0
      ? grandTotal
      : computedSubtotal - discountValue + computedTaxValue;

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = safePrintTitle(quoteNo);
  }, [quoteNo]);

  return (
    <section className="quotation-print-root">
      <style>{`
        @media screen {
          .quotation-print-root {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .quotation-print-root,
          .quotation-print-root * {
            visibility: visible !important;
          }

          .quotation-print-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            box-sizing: border-box !important;
          }

          .ps-print-shell {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .ps-print-shell > thead {
            display: table-header-group;
          }

          .ps-print-shell > tbody {
            display: table-row-group;
          }

          .ps-print-shell > thead > tr > th,
          .ps-print-shell > tbody > tr > td {
            padding: 0;
            border: 0;
            vertical-align: top;
          }

          .ps-repeat-header {
            width: 100%;
            height: 38mm;
            box-sizing: border-box;
            padding: 0 1mm 4mm 1mm;
            background: #ffffff;
          }

          .ps-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
            width: 100%;
          }

          .ps-header-left {
            flex: 1 1 auto;
            min-width: 0;
          }

          .ps-quotation-title {
            width: auto;
            height: 9mm;
            display: block;
            object-fit: contain;
            object-position: left top;
            margin-top: 2mm;
          }

          .ps-header-right {
            width: 72mm;
            flex: 0 0 72mm;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            overflow: visible;
          }

          .ps-logo {
            width: 72mm;
            height: 24mm;
            display: block;
            object-fit: contain;
            object-position: right center;
            margin-top: -4mm;
            padding-bottom: 1mm;
            box-sizing: border-box;
          }

          .ps-address-image {
            width: 72mm;
            height: 15mm;
            display: block;
            object-fit: contain;
            object-position: right top;
            margin-top: -4.5mm;
          }

          .ps-content {
            width: 100%;
            box-sizing: border-box;
            padding-left: 1mm;
            padding-right: 1mm;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .ps-meta {
            margin-bottom: 4mm;
            font-size: 10.5px;
            line-height: 1.25;
          }

          .ps-meta strong,
          .ps-priority,
          .ps-customer-name,
          .ps-prod,
          .ps-thanks,
          .ps-sign-company,
          .ps-sign-name {
            font-weight: 700;
          }

          .ps-customer {
            font-size: 10.5px;
            line-height: 1.28;
            margin-bottom: 3mm;
          }

          .ps-priority {
            margin-bottom: 2mm;
          }

          .ps-address-text {
            white-space: pre-line;
          }

          .ps-intro {
            margin-top: 2.8mm;
            margin-bottom: 3mm;
            font-size: 10.5px;
            line-height: 1.28;
          }

          .ps-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.2px;
            line-height: 1.23;
          }

          .ps-table thead {
            display: table-header-group;
          }

          .ps-table thead th {
            text-align: left;
            font-weight: 700;
            font-size: 10px;
            padding: 1.2mm 0;
            border-bottom: 1px solid #000000;
          }

          .ps-table th.no {
            width: 8mm;
          }

          .ps-table th.desc {
            width: auto;
          }

          .ps-table th.qty {
            width: 15mm;
            text-align: right;
          }

          .ps-table th.price {
            width: 29mm;
            text-align: right;
          }

          .ps-table th.total {
            width: 31mm;
            text-align: right;
          }

          .ps-table td {
            vertical-align: top;
            padding: 0.8mm 0;
          }

          .ps-table td.no {
            padding-right: 2mm;
          }

          .ps-table td.desc {
            padding-right: 3mm;
          }

          .ps-num {
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            white-space: nowrap;
          }

          .ps-num > span {
            display: block;
            width: 100%;
            text-align: right;
          }

          .ps-row-main {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .ps-detail-row td {
            padding-top: 0.2mm;
            padding-bottom: 0.6mm;
          }

          .ps-detail-wrap {
            padding-left: 10mm;
            padding-right: 70mm;
          }

          .ps-spec {
            margin-top: 0.3mm;
            font-size: 10px;
            line-height: 1.22;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .ps-spec-content {
            margin-top: 0.4mm;
            white-space: pre-line;
          }

          .ps-spec-content div,
          .ps-spec-content p {
            margin: 0;
          }

          .ps-spec-content br {
            line-height: 1.2;
          }

          .ps-spec-content ul {
            list-style: disc;
            padding-left: 4mm;
            margin: 0.8mm 0;
          }

          .ps-spec-content ol {
            list-style: decimal;
            padding-left: 4mm;
            margin: 0.8mm 0;
          }

          .ps-spec-content li {
            margin: 0.25mm 0;
          }

          .ps-status {
            margin-top: 0.8mm;
            font-size: 10px;
            line-height: 1.2;
            color: #000000;
          }

          .ps-strike {
            position: relative;
            display: inline-block;
          }

          .ps-strike::after {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            width: 100%;
            height: 1px;
            background: #000000;
            transform: rotate(-12deg);
          }

          .ps-revisi {
            font-weight: 700;
            background: #fff3cd;
            padding: 1px 2px;
          }

          .ps-bottom-block {
            margin-top: 18mm;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .ps-bottom {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10mm;
            font-size: 10.3px;
            line-height: 1.32;
          }

          .ps-terms {
            flex: 1 1 58%;
            min-width: 0;
          }

          .ps-summary {
            flex: 0 0 36%;
            min-width: 0;
            font-size: 10.3px;
            line-height: 1.32;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
          }

          .ps-terms-title {
            font-weight: 700;
            margin-bottom: 1.2mm;
          }

          .ps-terms-text {
            white-space: pre-line;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .ps-summary-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
            margin-top: 1.3mm;
          }

          .ps-summary-row span:first-child {
            flex: 1;
            text-align: left;
            font-weight: 700;
          }

          .ps-summary-row span:last-child {
            min-width: 35mm;
            text-align: right;
            font-weight: 700;
          }

          .ps-grand {
            margin-top: 3mm;
          }

          .ps-grand span:first-child,
          .ps-grand span:last-child {
            font-weight: 800;
            font-size: 10.6px;
          }

          .ps-inwords {
            margin-top: 2.5mm;
            text-align: left;
          }

          .ps-inwords-label {
            margin-bottom: 0.7mm;
            font-weight: 700;
          }

          .ps-inwords-value {
            font-weight: 700;
          }

          .ps-thanks {
            margin-top: 4mm;
            font-size: 10.6px;
            font-weight: 700;
          }

          .ps-sign {
            margin-top: 2.5mm;
            font-size: 10.3px;
            line-height: 1.45;
          }

          .ps-sign-name {
            margin-top: 6mm;
            font-weight: 700;
          }
        }
      `}</style>

      <table className="ps-print-shell">
        <thead>
          <tr>
            <th>
              <div className="ps-repeat-header">
                <div className="ps-header-row">
                  <div className="ps-header-left">
                    <img
                      src={quotationHeaderSrc}
                      alt="QUOTATION"
                      className="ps-quotation-title"
                    />
                  </div>

                  <div className="ps-header-right">
                    <img src={safeLogoSrc} alt="Logo Company" className="ps-logo" />
                    <img src={safeAddressImageSrc} alt="Address" className="ps-address-image" />
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <div className="ps-content">
                <div className="ps-meta">
                  <div>
                    <strong>QUOTE NO.#:</strong> {quoteNo}
                  </div>
                  <div>
                    <strong>DATE:</strong> {quoteDate}
                  </div>
                </div>

                <div className="ps-customer">
                  <div className="ps-priority">{priority}</div>
                  <div>Dear,</div>
                  <div className="ps-customer-name">{attention}</div>
                  <div>{customerName}</div>
                  <div className="ps-address-text">{address}</div>
                </div>

                <div className="ps-intro">
                  Thank you for giving us the opportunity to participate in the procurement...
                </div>

                <table className="ps-table">
                  <thead>
                    <tr>
                      <th className="no">NO.</th>
                      <th className="desc">DESCRIPTION</th>
                      <th className="qty">QTY</th>
                      <th className="price">PRICE IDR</th>
                      <th className="total">TOTAL IDR</th>
                    </tr>
                  </thead>

                  <tbody>
                    {validItems.map((item, idx) => {
                      const productName = getProductName(item);
                      const detailSpec = cleanHtml(getDetailSpec(item));
                      const total = item.qty * item.price;
                      const before = isBefore(item);
                      const revisi = isRevisi(item);

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="ps-row-main">
                            <td className="no">{idx + 1}</td>

                            <td className="desc">
                              {productName ? (
                                <div className={revisi ? 'ps-prod ps-revisi' : 'ps-prod'}>
                                  {productName}
                                </div>
                              ) : null}
                            </td>

                            <td className="ps-num">
                              <span>{item.qty}</span>
                            </td>

                            <td className="ps-num">
                              <span className={before ? 'ps-strike' : ''}>
                                {formatCurrency(item.price)}
                              </span>
                            </td>

                            <td className="ps-num">
                              <span className={before ? 'ps-strike' : ''}>
                                {formatCurrency(total)}
                              </span>
                            </td>
                          </tr>

                          {(detailSpec || item.status) && (
                            <tr className="ps-detail-row">
                              <td colSpan={5}>
                                <div className="ps-detail-wrap">
                                  {detailSpec ? (
                                    <div className="ps-spec">
                                      <div
                                        className="ps-spec-content"
                                        dangerouslySetInnerHTML={{
                                          __html: detailSpec,
                                        }}
                                      />
                                    </div>
                                  ) : null}

                                  {item.status ? (
                                    <div className="ps-status">{item.status}</div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                <div className="ps-bottom-block">
                  <div className="ps-bottom">
                    <div className="ps-terms">
                      <div className="ps-terms-title">TERMS AND CONDITIONS</div>
                      <div className="ps-terms-text">{terms}</div>
                    </div>

                    <div className="ps-summary">
                      <div className="ps-summary-row">
                        <span>SUBTOTAL :</span>
                        <span>{formatCurrency(computedSubtotal)}</span>
                      </div>

                      <div className="ps-summary-row">
                        <span>DISC :</span>
                        <span>{formatCurrency(discountValue)}</span>
                      </div>

                      <div className="ps-summary-row">
                        <span>TAX {taxPercent}% :</span>
                        <span>{formatCurrency(computedTaxValue)}</span>
                      </div>

                      <div className="ps-summary-row ps-grand">
                        <span>GRAND TOTAL :</span>
                        <span>{formatCurrency(computedGrandTotal)}</span>
                      </div>

                      <div className="ps-inwords">
                        <div className="ps-inwords-label">In words:</div>
                        <div className="ps-inwords-value">{inWords}</div>
                      </div>
                    </div>
                  </div>

                  <div className="ps-thanks">THANK YOU FOR YOUR BUSINESS!</div>

                  <div className="ps-sign">
                    <div>Best Regards,</div>
                    <div className="ps-sign-company">PT. Cipta Bangun Infrastruktur</div>
                    <div className="ps-sign-name">Aeky Hermanto</div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}