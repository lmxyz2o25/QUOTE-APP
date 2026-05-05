'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export type ProformaInvoiceItem = {
  no: number;
  productName: string;
  description: string;
  qty: number;
  price: number;
  total: number;
};

export type ProformaInvoicePrintData = {
  invoiceNo: string;
  invoiceDate: string;
  poNumber: string;
  poDate: string;
  status: string;
  companyName: string;
  attentionName: string;
  billingAddress: string;
  items: ProformaInvoiceItem[];
  subtotal: number;
  discount: number;
  dpValue: number;
  taxPercent: number;
  taxValue: number;
  grandTotal: number;
  inWords: string;
  paymentNote: string;
  paymentStatus: string;
  fullPaymentTotal?: number;
};

type Props = {
  data: ProformaInvoicePrintData | null;
};

function cleanText(value: unknown) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanHtml(value: unknown) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function safePrintTitle(invoiceNo: string) {
  const cleanInvoice = (invoiceNo || 'Proforma Invoice')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanInvoice || 'Proforma Invoice';
}

export default function ProformaInvoicePrintLayout({ data }: Props) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!data?.invoiceNo) return;

    document.title = safePrintTitle(data.invoiceNo);
  }, [data?.invoiceNo]);

  if (!data) return null;

  const items = data.items || [];

  const computedSubtotal =
    data.subtotal && data.subtotal > 0
      ? data.subtotal
      : items.reduce((acc, item) => acc + Number(item.qty || 0) * Number(item.price || 0), 0);

  const computedDiscount = Number(data.discount || 0);
  const computedDpValue = Number(data.dpValue || 0);
  const computedTaxPercent = Number(data.taxPercent || 0);

  const computedTaxValue =
    typeof data.taxValue === 'number'
      ? data.taxValue
      : (computedSubtotal - computedDiscount) * (computedTaxPercent / 100);

  const computedFullPaymentTotal =
    typeof data.fullPaymentTotal === 'number'
      ? data.fullPaymentTotal
      : computedSubtotal - computedDiscount + computedTaxValue;

  const computedGrandTotal =
    computedDpValue > 0
      ? computedDpValue
      : data.grandTotal && data.grandTotal > 0
        ? data.grandTotal
        : computedFullPaymentTotal;

  const paymentStatus = computedDpValue > 0 ? 'Down Payment' : data.paymentStatus || 'Full Payment';

  const content = (
    <section className="pi-print-root">
      <style>{`
        @media screen {
          .pi-print-root {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 8mm 12mm 8mm;
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

          body > :not(.pi-print-root) {
            display: none !important;
          }

          .pi-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            box-sizing: border-box !important;
          }

          .pi-print-root,
          .pi-print-root * {
            line-height: 1.25;
          }

          .pi-print-root,
          .pi-print-root * {
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          img {
            max-width: 100% !important;
          }

          .pi-print-shell {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .pi-print-shell > thead {
            display: table-header-group;
          }

          .pi-print-shell > tbody {
            display: table-row-group;
          }

          .pi-print-shell > thead > tr > th,
          .pi-print-shell > tbody > tr > td {
            padding: 0;
            border: 0;
            vertical-align: top;
          }

          .pi-repeat-header {
            width: 100%;
            height: 30mm;
            box-sizing: border-box;
            padding: 0mm 1mm 5mm 1mm;
            background: #ffffff;
          }

          .pi-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
            width: 100%;
          }

          .pi-header-left {
            width: 70mm;
            flex: 0 0 70mm;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .pi-logo {
            width: 68mm;
            height: 14mm;
            display: block;
            object-fit: contain;
            object-position: left top;
            margin-top: 0mm;
          }

          .pi-address-image {
            width: 60mm;
            height: 10mm;
            display: block;
            object-fit: contain;
            object-position: left top;
            margin-top: 0.6mm;
            margin-left: 1mm;
          }

          .pi-header-right {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            justify-content: flex-end;
          }

          .pi-title-image {
            width: 56mm;
            height: 17mm;
            display: block;
            object-fit: contain;
            object-position: right top;
            margin-top: 0mm;
          }

          .pi-content {
            width: 100%;
            box-sizing: border-box;
            padding-top: 2mm;
            padding-left: 1mm;
            padding-right: 1mm;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .pi-top-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
            margin-top: 1.5mm;
            margin-bottom: 1.6mm;
          }

          .pi-customer-block {
            flex: 1 1 53%;
            min-width: 0;
            font-size: 10.6px;
            line-height: 1.25;
          }

          .pi-company-name {
            font-weight: 700;
            margin-bottom: 0.55mm;
          }

          .pi-attention-name {
            font-weight: 700;
            margin-bottom: 0.65mm;
          }

          .pi-address-text {
            white-space: pre-line;
          }

          .pi-customer-invoice-meta {
            width: 72mm;
            margin-top: 1.8mm;
            font-size: 10.4px;
            line-height: 1.25;
          }

          .pi-customer-invoice-table {
            width: 100%;
            border-collapse: collapse;
          }

          .pi-customer-invoice-table td {
            padding: 0.1mm 0;
            vertical-align: top;
          }

          .pi-customer-invoice-label {
            width: 21mm;
            font-weight: 700;
            white-space: nowrap;
          }

          .pi-customer-invoice-sep {
            width: 3mm;
            text-align: center;
          }

          .pi-customer-invoice-value {
            font-weight: 700;
            white-space: nowrap;
          }

          .pi-meta-block {
            flex: 0 0 43%;
            min-width: 0;
            font-size: 10.4px;
            line-height: 1.25;
            transform: none;
            display: flex;
            justify-content: flex-end;
          }

          .pi-meta-table {
            width: 100%;
            border-collapse: collapse;
            width: auto;
          }

          .pi-meta-table td {
            padding: 0.1mm 0;
            vertical-align: top;
          }

          .pi-meta-label {
            width: 24mm;
            font-weight: 700;
            white-space: nowrap;
          }

          .pi-meta-sep {
            width: 3mm;
            text-align: center;
          }

          .pi-item-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.3px;
            line-height: 1.22;
          }

          .pi-item-table thead {
            display: table-header-group;
          }

          .pi-item-table thead th {
            text-align: left;
            font-weight: 700;
            font-size: 9.8px;
            padding: 1.05mm 0;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
          }

          .pi-item-table th.no {
            width: 8mm;
          }

          .pi-item-table th.desc {
            width: auto;
          }

          .pi-item-table th.qty {
            width: 14mm;
            text-align: right;
          }

          .pi-item-table th.price {
            width: 28mm;
            text-align: right;
          }

          .pi-item-table th.total {
            width: 30mm;
            text-align: right;
          }

          .pi-item-table td {
            vertical-align: top;
            padding: 0.5mm 0;
          }

          .pi-item-table td.no {
            padding-right: 2mm;
          }

          .pi-item-table td.desc {
            padding-right: 3mm;
          }

          .pi-num {
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            white-space: nowrap;
          }

          .pi-num > span {
            display: block;
            width: 100%;
            text-align: right;
          }

          .pi-row-main {
            page-break-inside: auto;
            break-inside: auto;
          }

          .pi-detail-row td {
            padding-top: 0;
            padding-bottom: 0.32mm;
          }

          .pi-detail-wrap {
            padding-left: 10mm;
            padding-right: 69mm;
          }

          .pi-product-name {
            font-weight: 700;
            margin-bottom: 0.28mm;
            font-size: 10.3px;
            line-height: 1.22;
          }

          .pi-product-detail {
            font-size: 9.6px;
            line-height: 1.22;
            white-space: pre-line;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .pi-product-detail div,
          .pi-product-detail p {
            margin: 0;
          }

          .pi-product-detail br {
            line-height: 1.22;
          }

          .pi-product-detail ul {
            list-style: disc;
            padding-left: 3.5mm;
            margin: 0.25mm 0;
          }

          .pi-product-detail ol {
            list-style: decimal;
            padding-left: 3.5mm;
            margin: 0.25mm 0;
          }

          .pi-product-detail li {
            margin: 0.08mm 0;
          }

          .pi-bottom-block {
            margin-top: 6mm;
            page-break-inside: auto;
            break-inside: auto;
          }

          .pi-bottom-main {
            display: grid;
            grid-template-columns: 1.08fr 0.92fr;
            gap: 12mm;
            align-items: start;
            font-size: 10.5px;
            line-height: 1.28;
          }

          .pi-payment-area {
            min-width: 0;
          }

          .pi-summary-area {
            min-width: 0;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
          }

          .pi-section-title {
            font-size: 10.9px;
            line-height: 1.2;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 0.55mm;
          }

          .pi-payment-status-value {
            padding-left: 7mm;
            margin-bottom: 2.6mm;
            font-size: 10.5px;
            line-height: 1.28;
          }

          .pi-bank-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 0.4mm;
            font-size: 10.5px;
            line-height: 1.28;
          }

          .pi-bank-table td {
            padding: 0.12mm 0;
            vertical-align: top;
          }

          .pi-bank-label {
            width: 28mm;
            font-weight: 700;
            padding-left: 7mm !important;
            white-space: nowrap;
          }

          .pi-bank-sep {
            width: 3mm;
            text-align: center;
          }

          .pi-payment-note {
            margin-top: 2.1mm;
          }

          .pi-payment-note-text {
            padding-left: 7mm;
            margin-top: 0.7mm;
            white-space: pre-line;
            word-break: normal;
            overflow-wrap: break-word;
            font-size: 10.4px;
            line-height: 1.28;
          }

          .pi-summary-table {
            width: 68mm;
            margin-left: auto;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.6px;
            line-height: 1.28;
          }

          .pi-summary-table td {
            padding: 0.22mm 0;
            vertical-align: top;
          }

          .pi-summary-label {
            width: 26mm;
            font-weight: 800;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .pi-summary-sep {
            width: 3mm;
            text-align: center;
          }

          .pi-summary-value {
            width: 39mm;
            text-align: right;
            font-weight: 700;
            white-space: nowrap;
          }

          .pi-summary-gap td {
            padding-top: 2.2mm;
          }

          .pi-grand-label,
          .pi-grand-value {
            font-weight: 900 !important;
            font-size: 11.4px;
          }

          .pi-inwords {
            width: 68mm;
            margin-left: auto;
            margin-top: 2.8mm;
            font-size: 10.5px;
            line-height: 1.28;
          }

          .pi-inwords-label {
            margin-bottom: 0.6mm;
          }

          .pi-inwords-value {
            font-weight: 800;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: break-word;
          }

          .pi-approve-area {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12mm;
            margin-top: 5.2mm;
            font-size: 10.5px;
            line-height: 1.28;
            align-items: end;
          }

          .pi-approve-box {
            min-width: 0;
          }

          .pi-approve-title {
            margin-bottom: 0.6mm;
          }

          .pi-approve-company {
            margin-bottom: 9mm;
          }

          .pi-approve-name {
            margin-bottom: 0.9mm;
          }

          .pi-sign-label {
            margin-bottom: 2.2mm;
          }

          .pi-sign-line {
            width: 47mm;
            border-top: 1px solid #000000;
          }

          .pi-thankyou {
            align-self: end;
            text-align: center;
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            text-transform: uppercase;
            padding-bottom: 1.4mm;
          }
        }
      `}</style>

      <table className="pi-print-shell">
        <thead>
          <tr>
            <th>
              <div className="pi-repeat-header">
                <div className="pi-header-row">
                  <div className="pi-header-left">
                    <img src="/images/Logo-CBI.png" alt="Logo CBI" className="pi-logo" />

                    <img
                      src="/images/address-cbi-pi.png"
                      alt="Address CBI"
                      className="pi-address-image"
                    />
                  </div>

                  <div className="pi-header-right">
                    <img
                      src="/images/proforma_invoice.png"
                      alt="Proforma Invoice"
                      className="pi-title-image"
                    />
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <div className="pi-content">
                <div className="pi-top-info">
                  <div className="pi-customer-block">
                    <div className="pi-company-name">{data.companyName}</div>
                    <div className="pi-attention-name">{data.attentionName}</div>
                    <div className="pi-address-text">{cleanText(data.billingAddress)}</div>

                    <div className="pi-customer-invoice-meta">
                      <table className="pi-customer-invoice-table">
                        <tbody>
                          <tr>
                            <td className="pi-customer-invoice-label">Invoice No.#</td>
                            <td className="pi-customer-invoice-sep">:</td>
                            <td className="pi-customer-invoice-value">{data.invoiceNo}</td>
                          </tr>

                          <tr>
                            <td className="pi-customer-invoice-label">Date</td>
                            <td className="pi-customer-invoice-sep">:</td>
                            <td className="pi-customer-invoice-value">{data.invoiceDate}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pi-meta-block">
                    <table className="pi-meta-table">
                      <tbody>
                        <tr>
                          <td className="pi-meta-label">PO Number#</td>
                          <td className="pi-meta-sep">:</td>
                          <td>{data.poNumber}</td>
                        </tr>

                        <tr>
                          <td className="pi-meta-label">Date</td>
                          <td className="pi-meta-sep">:</td>
                          <td>{data.poDate}</td>
                        </tr>

                        <tr>
                          <td className="pi-meta-label">Status</td>
                          <td className="pi-meta-sep">:</td>
                          <td>{data.status}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <table className="pi-item-table">
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
                    {items.map((item, index) => {
                      const total = Number(
                        item.total || Number(item.qty || 0) * Number(item.price || 0),
                      );

                      return (
                        <React.Fragment key={`pi-item-${index}-${item.productName}`}>
                          <tr className="pi-row-main">
                            <td className="no">{index + 1}</td>

                            <td className="desc">
                              <div className="pi-product-name">{cleanText(item.productName)}</div>
                            </td>

                            <td className="pi-num">
                              <span>{item.qty}</span>
                            </td>

                            <td className="pi-num">
                              <span>{formatMoney(Number(item.price || 0))}</span>
                            </td>

                            <td className="pi-num">
                              <span>{formatMoney(total)}</span>
                            </td>
                          </tr>

                          {item.description ? (
                            <tr className="pi-detail-row">
                              <td colSpan={5}>
                                <div className="pi-detail-wrap">
                                  <div
                                    className="pi-product-detail"
                                    dangerouslySetInnerHTML={{
                                      __html: cleanHtml(item.description).replace(/\n/g, '<br />'),
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                <div className="pi-bottom-block">
                  <div className="pi-bottom-main">
                    <div className="pi-payment-area">
                      <div className="pi-section-title">PAYMENT STATUS :</div>
                      <div className="pi-payment-status-value">{paymentStatus}</div>

                      <div className="pi-section-title">PAYMENT TRANSFER TO :</div>

                      <table className="pi-bank-table">
                        <tbody>
                          <tr>
                            <td className="pi-bank-label">Account Name</td>
                            <td className="pi-bank-sep">:</td>
                            <td>Aeky Siswo Budi Hermanto</td>
                          </tr>

                          <tr>
                            <td className="pi-bank-label">Bank</td>
                            <td className="pi-bank-sep">:</td>
                            <td>BCA</td>
                          </tr>

                          <tr>
                            <td className="pi-bank-label">Account Number</td>
                            <td className="pi-bank-sep">:</td>
                            <td>194.011.311</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="pi-payment-note">
                        <div className="pi-section-title">PAYMENT NOTE :</div>
                        <div className="pi-payment-note-text">
                          {cleanText(data.paymentNote) || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="pi-summary-area">
                      <table className="pi-summary-table">
                        <tbody>
                          <tr>
                            <td className="pi-summary-label">SUBTOTAL</td>
                            <td className="pi-summary-sep">:</td>
                            <td className="pi-summary-value">{formatMoney(computedSubtotal)}</td>
                          </tr>

                          <tr>
                            <td className="pi-summary-label">DISC</td>
                            <td className="pi-summary-sep">:</td>
                            <td className="pi-summary-value">{formatMoney(computedDiscount)}</td>
                          </tr>

                          <tr>
                            <td className="pi-summary-label">DP</td>
                            <td className="pi-summary-sep">:</td>
                            <td className="pi-summary-value">{formatMoney(computedDpValue)}</td>
                          </tr>

                          <tr>
                            <td className="pi-summary-label">TAX {computedTaxPercent}%</td>
                            <td className="pi-summary-sep">:</td>
                            <td className="pi-summary-value">{formatMoney(computedTaxValue)}</td>
                          </tr>

                          <tr className="pi-summary-gap">
                            <td className="pi-summary-label pi-grand-label">GRAND TOTAL</td>
                            <td className="pi-summary-sep">:</td>
                            <td className="pi-summary-value pi-grand-value">
                              {formatMoney(computedGrandTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="pi-inwords">
                        <div className="pi-inwords-label">In words:</div>
                        <div className="pi-inwords-value">{data.inWords}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pi-approve-area">
                    <div className="pi-approve-box">
                      <div className="pi-approve-title">Approve by:</div>
                      <div className="pi-approve-company">{data.companyName}</div>

                      <div className="pi-sign-label">Sign name:</div>
                      <div className="pi-sign-line" />
                    </div>

                    <div className="pi-approve-box">
                      <div className="pi-approve-title">Approve by:</div>
                      <div className="pi-approve-company">PT. Cipta Bangun Infrastruktur</div>

                      <div className="pi-approve-name">Aeky Hermanto</div>
                      <div className="pi-sign-line" />
                    </div>

                    <div className="pi-thankyou">THANK YOU FOR YOUR BUSINESS!</div>
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