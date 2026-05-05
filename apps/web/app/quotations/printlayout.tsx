'use client';

import React from 'react';
import { createPortal } from 'react-dom';

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
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .trim();
}

function cleanText(value: unknown) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safePrintTitle(quoteNo: string) {
  const cleanQuote = (quoteNo || 'Quotation')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanQuote || 'Quotation';
}

function splitHtmlFromKeyword(html: string, keyword: string) {
  const source = html || '';
  const index = source.toLowerCase().indexOf(keyword.toLowerCase());

  if (index < 0) {
    return {
      beforeHtml: source,
      afterHtml: '',
    };
  }

  return {
    beforeHtml: source.slice(0, index).trim(),
    afterHtml: source.slice(index).trim(),
  };
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
      : validItems.reduce((acc, item) => acc + Number(item.qty || 0) * Number(item.price || 0), 0);

  const computedTaxValue =
    typeof taxValue === 'number'
      ? taxValue
      : (computedSubtotal - Number(discountValue || 0)) * (Number(taxPercent || 0) / 100);

  const computedGrandTotal =
    grandTotal && grandTotal > 0
      ? grandTotal
      : computedSubtotal - Number(discountValue || 0) + computedTaxValue;

  const preparedItems = validItems.map((item) => {
    return {
      item,
      detailSpec: cleanHtml(getDetailSpec(item)),
    };
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = safePrintTitle(quoteNo);
  }, [quoteNo]);

  const renderHeader = () => {
    return (
      <div className="ps-repeat-header">
        <div className="ps-header-row">
          <div className="ps-header-left">
            <img src={quotationHeaderSrc} alt="QUOTATION" className="ps-quotation-title" />
          </div>

          <div className="ps-header-right">
            <img src={safeLogoSrc} alt="Logo Company" className="ps-logo" />
            <img src={safeAddressImageSrc} alt="Address" className="ps-address-image" />
          </div>
        </div>
      </div>
    );
  };

  const content = (
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
            width: auto !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > :not(.quotation-print-root) {
            display: none !important;
          }

          .quotation-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            box-sizing: border-box !important;
          }

          .quotation-print-root,
          .quotation-print-root * {
            line-height: 1.25;
          }

          .ps-force-page-break {
            display: block !important;
            height: 1px !important;
            line-height: 0 !important;
            overflow: hidden !important;
            page-break-before: always !important;
            break-before: page !important;
          }

          .ps-force-page-break {
            display: none !important;
          }

          .ps-repeat-header {
            width: 100%;
            height: 34mm;
            box-sizing: border-box;
            padding: 0 1mm 3mm 1mm;
            background: #ffffff;
            overflow: visible;
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

          .ps-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 7mm;
            width: 100%;
          }

          .ps-header-left {
            flex: 1 1 auto;
            min-width: 0;
          }

          .ps-quotation-title {
            width: auto;
            height: 8.5mm;
            display: block;
            object-fit: contain;
            object-position: left top;
            margin-top: 1mm;
          }

          .ps-header-center {
            flex: 0 0 45mm;
            text-align: center;
            font-size: 9.6px;
            line-height: 1.15;
            font-weight: 700;
            padding-top: 1mm;
            white-space: nowrap;
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
            width: 70mm;
            height: 21mm;
            display: block;
            object-fit: contain;
            object-position: right center;
            margin-top: -3mm;
            padding-bottom: 1mm;
            box-sizing: border-box;
          }

          .ps-address-image {
            width: 67mm;
            height: 12mm;
            display: block;
            object-fit: contain;
            object-position: right top;
            margin-top: -4.2mm;
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
            margin-bottom: 3mm;
            font-size: 10.3px;
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
            font-size: 10.3px;
            line-height: 1.25;
            margin-bottom: 2.4mm;
          }

          .ps-priority {
            margin-bottom: 1.5mm;
          }

          .ps-address-text {
            white-space: pre-line;
          }

          .ps-intro {
            margin-top: 2.2mm;
            margin-bottom: 2.4mm;
            font-size: 10.1px;
            line-height: 1.25;
          }

          .ps-table,
          .ps-continuation-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.1px;
            line-height: 1.22;
          }

          .ps-table th,
          .ps-table td,
          .ps-continuation-table th,
          .ps-continuation-table td {
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          .ps-header-row,
          .ps-content,
          .ps-detail-wrap,
          .ps-continuation-detail,
          .ps-spec,
          .ps-spec-content,
          .ps-spec-content *,
          .ps-terms-text,
          .ps-inwords-value {
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          img {
            max-width: 100% !important;
          }

          .ps-item-group {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          .ps-table thead th,
          .ps-continuation-table thead th {
            text-align: left;
            font-weight: 700;
            font-size: 9.6px;
            padding: 1.05mm 0;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
          }

          .ps-table th.no,
          .ps-continuation-table th.no {
            width: 8mm;
          }

          .ps-table th.desc,
          .ps-continuation-table th.desc {
            width: auto;
          }

          .ps-table th.qty,
          .ps-continuation-table th.qty {
            width: 15mm;
            text-align: right;
          }

          .ps-table th.price,
          .ps-continuation-table th.price {
            width: 29mm;
            text-align: right;
          }

          .ps-table th.total,
          .ps-continuation-table th.total {
            width: 31mm;
            text-align: right;
          }

          .ps-table td,
          .ps-continuation-table td {
            vertical-align: top;
            padding: 0.55mm 0;
          }

          .ps-table td.no,
          .ps-continuation-table td.no {
            padding-right: 2mm;
          }

          .ps-table td.desc,
          .ps-continuation-table td.desc {
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
            page-break-inside: auto;
            break-inside: auto;
          }

          .ps-detail-row td {
            padding-top: 0.1mm;
            padding-bottom: 0.4mm;
          }

          .ps-detail-row {
            page-break-inside: auto;
            break-inside: auto;
          }

          .ps-detail-wrap {
            padding-left: 10mm;
            padding-right: 70mm;
          }

          .ps-continuation-detail {
            padding-left: 10mm;
            padding-right: 70mm;
          }

          .ps-spec {
            margin-top: 0.2mm;
            font-size: 9.4px;
            line-height: 1.22;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .ps-spec-content {
            margin-top: 0.3mm;
            white-space: pre-line;
          }

          .ps-spec-content div,
          .ps-spec-content p {
            margin: 0;
          }

          .ps-spec-content br {
            line-height: 1.22;
          }

          .ps-spec-content ul {
            list-style: disc;
            padding-left: 4mm;
            margin: 0.5mm 0;
          }

          .ps-spec-content ol {
            list-style: decimal;
            padding-left: 4mm;
            margin: 0.5mm 0;
          }

          .ps-spec-content li {
            margin: 0.12mm 0;
          }

          .ps-status {
            margin-top: 0.5mm;
            font-size: 9.4px;
            line-height: 1.22;
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
            margin-top: 7mm;
            page-break-inside: auto;
            break-inside: auto;
          }

          .ps-bottom {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10mm;
            font-size: 10.3px;
            line-height: 1.28;
          }

          .ps-terms {
            flex: 1 1 58%;
            min-width: 0;
          }

          .ps-summary {
            flex: 0 0 36%;
            min-width: 0;
            font-size: 10.3px;
            line-height: 1.28;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
          }

          .ps-terms-title {
            font-weight: 700;
            margin-bottom: 1mm;
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
            gap: 6mm;
            margin-top: 1mm;
          }

          .ps-summary-row span:first-child {
            flex: 1;
            text-align: left;
            font-weight: 700;
          }

          .ps-summary-row span:last-child {
            min-width: 34mm;
            text-align: right;
            font-weight: 700;
          }

          .ps-grand {
            margin-top: 2.4mm;
          }

          .ps-grand span:first-child,
          .ps-grand span:last-child {
            font-weight: 800;
            font-size: 10.8px;
          }

          .ps-inwords {
            margin-top: 2.2mm;
            text-align: left;
          }

          .ps-inwords-label {
            margin-bottom: 0.6mm;
            font-weight: 700;
          }

          .ps-inwords-value {
            font-weight: 700;
          }

          .ps-thanks {
            margin-top: 4mm;
            font-size: 10.8px;
            font-weight: 700;
          }

          .ps-sign {
            margin-top: 2.5mm;
            font-size: 10.3px;
            line-height: 1.35;
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
            <th>{renderHeader()}</th>
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
            <div className="ps-priority">{priority || 'CUSTOMER PRIORITY'}</div>
            <div>Dear,</div>
            <div className="ps-customer-name">{attention}</div>
            <div>{customerName}</div>
            <div className="ps-address-text">{cleanText(address)}</div>
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

            {preparedItems.map((prepared, idx) => {
              const item = prepared.item;
              const productName = getProductName(item);
              const detailSpec = prepared.detailSpec;
              const total = Number(item.qty || 0) * Number(item.price || 0);
              const before = isBefore(item);
              const revisi = isRevisi(item);
              const showStatusHere = item.status;

              return (
                <tbody key={item.id} className="ps-item-group">
                  <tr className="ps-row-main">
                    <td className="no">{idx + 1}</td>

                    <td className="desc">
                      {productName ? (
                        <div className={revisi ? 'ps-prod ps-revisi' : 'ps-prod'}>{productName}</div>
                      ) : null}
                    </td>

                    <td className="ps-num">
                      <span>{item.qty}</span>
                    </td>

                    <td className="ps-num">
                      <span className={before ? 'ps-strike' : ''}>
                        {formatCurrency(Number(item.price || 0))}
                      </span>
                    </td>

                    <td className="ps-num">
                      <span className={before ? 'ps-strike' : ''}>{formatCurrency(total)}</span>
                    </td>
                  </tr>

                  {(detailSpec || showStatusHere) && (
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

                          {showStatusHere ? <div className="ps-status">{item.status}</div> : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>

          <div className="ps-bottom-block">
            <div className="ps-bottom">
              <div className="ps-terms">
                <div className="ps-terms-title">TERMS AND CONDITIONS</div>
                <div className="ps-terms-text">{cleanText(terms)}</div>
              </div>

              <div className="ps-summary">
                <div className="ps-summary-row">
                  <span>SUBTOTAL :</span>
                  <span>{formatCurrency(computedSubtotal)}</span>
                </div>

                <div className="ps-summary-row">
                  <span>DISC :</span>
                  <span>{formatCurrency(Number(discountValue || 0))}</span>
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

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}