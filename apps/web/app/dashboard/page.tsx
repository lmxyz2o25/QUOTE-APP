'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppShell from '../components/AppShell';

type QuotationRow = {
  id: string;
  status?: string | null;
  quote_date?: string | null;
  created_at?: string | null;
  customer_name_snapshot?: string | null;
};

type DashboardMetrics = {
  totalCustomers: number;
  totalQuotations: number;
  quotationsThisMonth: number;
  totalCustomerPO: number;
  totalProformaInvoices: number;
  quoteStatusCounts: { label: string; value: number; color: string }[];
  monthlyQuoteSeries: { label: string; value: number }[];
  topCustomers: { name: string; value: number }[];
  recentQuotations: { customer: string; date: string; status: string }[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emptyMetrics: DashboardMetrics = {
  totalCustomers: 0,
  totalQuotations: 0,
  quotationsThisMonth: 0,
  totalCustomerPO: 0,
  totalProformaInvoices: 0,
  quoteStatusCounts: [
    { label: 'Approved', value: 0, color: '#18b368' },
    { label: 'Pending', value: 0, color: '#3277f6' },
    { label: 'Rejected', value: 0, color: '#ff4d4f' },
  ],
  monthlyQuoteSeries: [],
  topCustomers: [],
  recentQuotations: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

function normalizeStatusGroup(status?: string | null) {
  const value = String(status || '').trim().toLowerCase();

  if (
    value.includes('approve') ||
    value.includes('approved') ||
    value.includes('accept') ||
    value.includes('completed') ||
    value.includes('success') ||
    value.includes('paid') ||
    value.includes('issued') ||
    value.includes('sent') ||
    value.includes('simpan')
  ) {
    return 'Approved';
  }

  if (value.includes('reject') || value.includes('rejected') || value.includes('cancel')) {
    return 'Rejected';
  }

  return 'Pending';
}

function formatShortDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function buildMonthSeries(rows: QuotationRow[]) {
  const now = new Date();
  const result: { label: string; value: number; month: number; year: number }[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    result.push({
      label: date.toLocaleString('en-US', { month: 'short' }),
      value: 0,
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }

  rows.forEach((row) => {
    const source = row.quote_date || row.created_at;
    if (!source) return;

    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return;

    const target = result.find(
      (item) => item.month === date.getMonth() && item.year === date.getFullYear(),
    );

    if (target) {
      target.value += 1;
    }
  });

  return result.map(({ label, value }) => ({ label, value }));
}

function buildLinePath(values: number[]) {
  const width = 620;
  const height = 170;
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0];
  const maxValue = Math.max(...safeValues, 1);
  const stepX = safeValues.length > 1 ? width / (safeValues.length - 1) : width;

  const points = safeValues.map((value, index) => {
    const x = index * stepX;
    const y = height - (value / maxValue) * (height - 18) - 10;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return { linePath, areaPath, points, safeValues };
}

function statusTone(status: string) {
  const grouped = normalizeStatusGroup(status);

  if (grouped === 'Approved') {
    return { color: '#0f9f62', background: 'rgba(15, 159, 98, 0.12)' };
  }

  if (grouped === 'Rejected') {
    return { color: '#e5484d', background: 'rgba(229, 72, 77, 0.12)' };
  }

  return { color: '#2b6ef3', background: 'rgba(43, 110, 243, 0.12)' };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');

  async function fetchDashboard() {
    setLoading(true);
    setInfoMessage('');

    if (!supabaseUrl || !supabaseAnonKey) {
      setInfoMessage('Env Supabase belum lengkap.');
      setLoading(false);
      return;
    }

    async function safeCount(tableName: string) {
      const result = await supabase.from(tableName).select('id', {
        count: 'exact',
        head: true,
      });

      if (result.error) {
        return 0;
      }

      return result.count || 0;
    }

    const [
      totalCustomers,
      totalQuotations,
      totalCustomerPO,
      totalProformaInvoices,
      quotationsRowsResult,
    ] = await Promise.all([
      safeCount('customers'),
      safeCount('quotations'),
      safeCount('customer_purchase_orders'),
      safeCount('proforma_invoices'),
      supabase
        .from('quotations')
        .select('id, status, quote_date, created_at, customer_name_snapshot')
        .order('created_at', { ascending: false })
        .limit(300),
    ]);

    const quotationsRows = quotationsRowsResult.error
      ? []
      : ((quotationsRowsResult.data || []) as QuotationRow[]);

    if (quotationsRowsResult.error) {
      setInfoMessage(quotationsRowsResult.error.message);
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const quotationsThisMonth = quotationsRows.filter((row) => {
      const source = row.quote_date || row.created_at;
      if (!source) return false;

      const date = new Date(source);
      if (Number.isNaN(date.getTime())) return false;

      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const groupedStatus = quotationsRows.reduce<Record<string, number>>(
      (acc, row) => {
        const group = normalizeStatusGroup(row.status);
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      },
      {
        Approved: 0,
        Pending: 0,
        Rejected: 0,
      },
    );

    const quoteStatusCounts = [
      { label: 'Approved', value: groupedStatus.Approved || 0, color: '#18b368' },
      { label: 'Pending', value: groupedStatus.Pending || 0, color: '#3277f6' },
      { label: 'Rejected', value: groupedStatus.Rejected || 0, color: '#ff4d4f' },
    ];

    const topCustomersMap = quotationsRows.reduce<Record<string, number>>((acc, row) => {
      const name = row.customer_name_snapshot?.trim() || 'Unknown Customer';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const topCustomers = Object.entries(topCustomersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const recentQuotations = quotationsRows.slice(0, 5).map((row) => ({
      customer: row.customer_name_snapshot?.trim() || 'Unknown Customer',
      date: formatShortDate(row.quote_date || row.created_at),
      status: normalizeStatusGroup(row.status),
    }));

    setMetrics({
      totalCustomers,
      totalQuotations,
      quotationsThisMonth,
      totalCustomerPO,
      totalProformaInvoices,
      quoteStatusCounts,
      monthlyQuoteSeries: buildMonthSeries(quotationsRows),
      topCustomers,
      recentQuotations,
    });

    setLoading(false);
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const donutTotal = metrics.quoteStatusCounts.reduce((sum, item) => sum + item.value, 0);

  const donutBackground = useMemo(() => {
    const total = Math.max(donutTotal, 1);

    const approved = (metrics.quoteStatusCounts[0]?.value || 0) / total;
    const pending = (metrics.quoteStatusCounts[1]?.value || 0) / total;
    const rejected = (metrics.quoteStatusCounts[2]?.value || 0) / total;

    const a1 = approved * 100;
    const a2 = (approved + pending) * 100;
    const a3 = (approved + pending + rejected) * 100;

    return `conic-gradient(
      #18b368 0% ${a1}%,
      #3277f6 ${a1}% ${a2}%,
      #ff4d4f ${a2}% ${a3}%,
      #e7edf5 ${a3}% 100%
    )`;
  }, [donutTotal, metrics.quoteStatusCounts]);

  const chartValues = metrics.monthlyQuoteSeries.map((item) => item.value);
  const { linePath, areaPath, points, safeValues } = buildLinePath(chartValues);

  const chartPeakIndex = safeValues.reduce((bestIndex, currentValue, index, array) => {
    return currentValue > (array[bestIndex] || 0) ? index : bestIndex;
  }, 0);

  const peakPoint = points[chartPeakIndex];
  const peakLabel = metrics.monthlyQuoteSeries[chartPeakIndex]?.label || '';
  const peakValue = safeValues[chartPeakIndex] || 0;

  const maxTopCustomerValue = Math.max(...metrics.topCustomers.map((item) => item.value), 1);

  return (
    <AppShell activeMenu="Dashboard">
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="page-kicker">SALES-APP / Dashboard</div>
            <h1>Dashboard</h1>
            <p>Ringkasan data quotation, customer, PO, dan proforma invoice.</p>
          </div>

          <div className="top-actions">
            <button type="button" className="top-select">
              This Week <span>⌄</span>
            </button>
            <button type="button" className="top-select">
              IDR / USD <span>⌄</span>
            </button>
          </div>
        </header>

        {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Quotations This Month</span>
            <strong>{loading ? '...' : formatNumber(metrics.quotationsThisMonth)}</strong>
            <small>Data real dari tabel quotations</small>
          </div>

          <div className="stat-card">
            <span>Total Customers</span>
            <strong>{loading ? '...' : formatNumber(metrics.totalCustomers)}</strong>
            <small>Data real dari tabel customers</small>
          </div>

          <div className="stat-card">
            <span>Total Customer PO</span>
            <strong>{loading ? '...' : formatNumber(metrics.totalCustomerPO)}</strong>
            <small>Data real dari tabel customer_purchase_orders</small>
          </div>

          <div className="stat-card">
            <span>Total Proforma Invoice</span>
            <strong>{loading ? '...' : formatNumber(metrics.totalProformaInvoices)}</strong>
            <small>Data real dari tabel proforma_invoices</small>
          </div>
        </section>

        <section className="content-grid-top">
          <div className="panel line-panel">
            <div className="panel-header">
              <div>
                <h2>Quotations Overview</h2>
                <div className="panel-big-number">
                  {loading ? '...' : formatNumber(metrics.totalQuotations)}
                  <span>Total quotations</span>
                </div>
              </div>

              <button type="button" className="mini-button">
                Last 6 Months ⌄
              </button>
            </div>

            <div className="line-chart-wrapper">
              <div className="chart-axis-left">
                {Array.from({ length: 5 }).map((_, index) => {
                  const max = Math.max(...safeValues, 1);
                  const value = Math.round(((4 - index) / 4) * max);

                  return <span key={`axis-${index}`}>{formatNumber(value)}</span>;
                })}
              </div>

              <svg className="line-chart" viewBox="0 0 620 170" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2f77f5" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2f77f5" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#lineArea)" />
                <path d={linePath} fill="none" stroke="#2f77f5" strokeWidth="3" strokeLinecap="round" />

                {points.map((point, index) => (
                  <circle key={`point-${index}`} cx={point.x} cy={point.y} r="4" fill="#2f77f5" />
                ))}

                {peakPoint ? (
                  <>
                    <line
                      x1={peakPoint.x}
                      y1={peakPoint.y}
                      x2={peakPoint.x}
                      y2="170"
                      stroke="#8cb8ff"
                      strokeWidth="2"
                      strokeDasharray="4 5"
                    />
                    <foreignObject
                      x={Math.max(peakPoint.x - 36, 0)}
                      y={Math.max(peakPoint.y - 72, 0)}
                      width="86"
                      height="62"
                    >
                      <div className="tooltip-card">
                        <span>{peakLabel}</span>
                        <strong>{formatNumber(peakValue)}</strong>
                      </div>
                    </foreignObject>
                  </>
                ) : null}
              </svg>

              <div className="chart-months">
                {metrics.monthlyQuoteSeries.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel status-panel">
            <div className="panel-header">
              <h2>Quote Status by Time</h2>

              <button type="button" className="mini-button">
                This Week ⌄
              </button>
            </div>

            <div className="donut-wrap">
              <div className="donut" style={{ background: donutBackground }}>
                <div className="donut-inner">
                  <span>Total</span>
                  <strong>{formatNumber(donutTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="status-list">
              {metrics.quoteStatusCounts.map((item) => (
                <div key={item.label} className="status-row">
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-grid-bottom">
          <div className="panel top-customers-panel">
            <div className="panel-header">
              <h2>Top Customers by Quotations</h2>

              <button type="button" className="mini-button">
                Real Data ⌄
              </button>
            </div>

            <div className="bar-list">
              {metrics.topCustomers.length === 0 ? (
                <div className="empty-bar-row">
                  <span>Belum ada data</span>
                  <div />
                  <strong>0</strong>
                </div>
              ) : (
                metrics.topCustomers.map((item) => (
                  <div key={item.name} className="bar-row">
                    <span>{item.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max((item.value / maxTopCustomerValue) * 100, 8)}%`,
                        }}
                      />
                    </div>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel recent-panel">
            <h2>Recent Quotations</h2>

            <table className="recent-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {metrics.recentQuotations.length === 0 ? (
                  <tr>
                    <td data-label="Customer">Belum ada data</td>
                    <td data-label="Date">-</td>
                    <td data-label="Status">
                      <span className="status-pill pending">Pending</span>
                    </td>
                  </tr>
                ) : (
                  metrics.recentQuotations.map((item, index) => {
                    const tone = statusTone(item.status);

                    return (
                      <tr key={`${item.customer}-${index}`}>
                        <td data-label="Customer">{item.customer}</td>
                        <td data-label="Date">{item.date}</td>
                        <td data-label="Status">
                          <span
                            className="status-pill"
                            style={{
                              color: tone.color,
                              background: tone.background,
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <style jsx>{`
          .dashboard-page {
            width: 100%;
            max-width: 100%;
            min-height: 100%;
            overflow-x: hidden;
            color: #071f3d;
            font-family: Arial, sans-serif;
            font-weight: 400;
          }

          .dashboard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
            background: #dfe8f2;
          }

          .dashboard-title-wrap {
            min-width: 0;
          }

          .page-kicker {
            color: #3b73a8;
            font-size: 12px;
            font-weight: 400;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            background: #dfe8f2;
          }

          .dashboard-header h1 {
            margin: 0;
            font-size: 36px;
            line-height: 1.1;
            font-weight: 400;
            color: #062b52;
            background: #dfe8f2;
            font-family: Arial, sans-serif;
          }

          .dashboard-header p {
            margin: 8px 0 0;
            color: #5d7590;
            font-size: 15px;
            font-weight: 400;
            background: #dfe8f2;
            font-family: Arial, sans-serif;
          }

          .top-actions {
            display: flex;
            gap: 10px;
            flex-shrink: 0;
          }

          .top-select,
          .mini-button {
            height: 40px;
            border: 1px solid #cbd8e6;
            border-radius: 12px;
            background: #ffffff;
            color: #071f3d;
            font-size: 13px;
            font-weight: 700;
            padding: 0 14px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            white-space: nowrap;
          }

          .info-banner {
            margin-bottom: 14px;
            border: 1px solid #c7d7ea;
            background: #f8fbff;
            color: #315679;
            border-radius: 12px;
            padding: 12px 14px;
            font-weight: 600;
            font-family: Arial, sans-serif;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 14px;
            max-width: 100%;
            overflow: hidden;
          }

          .stat-card,
          .panel {
            background: #ffffff;
            border: 1px solid #cbd8e6;
            border-radius: 14px;
            box-shadow: 0 10px 24px rgba(34, 79, 126, 0.05);
            max-width: 100%;
            min-width: 0;
            font-family: Arial, sans-serif;
          }

          .stat-card {
            min-height: 112px;
            padding: 20px;
          }

          .stat-card span {
            display: block;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .stat-card strong {
            display: block;
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 8px;
          }

          .stat-card small {
            color: #5d7186;
            font-size: 13px;
            font-weight: 400;
          }

          .content-grid-top {
            display: grid;
            grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
            gap: 14px;
            margin-bottom: 14px;
            max-width: 100%;
            overflow: hidden;
          }

          .content-grid-bottom {
            display: grid;
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
            gap: 14px;
            max-width: 100%;
            overflow: hidden;
          }

          .panel {
            padding: 18px;
            min-width: 0;
          }

          .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 10px;
          }

          .panel h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #071f3d;
            font-family: Arial, sans-serif;
          }

          .panel-big-number {
            margin-top: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 22px;
            font-weight: 900;
          }

          .panel-big-number span {
            font-size: 13px;
            font-weight: 500;
            color: #526a83;
          }

          .line-chart-wrapper {
            position: relative;
            height: 250px;
            padding: 8px 0 0 38px;
            overflow: hidden;
          }

          .chart-axis-left {
            position: absolute;
            left: 0;
            top: 12px;
            height: 170px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #667c94;
            font-size: 12px;
            font-family: Arial, sans-serif;
          }

          .line-chart {
            width: 100%;
            max-width: 100%;
            height: 180px;
            border-bottom: 1px solid #d8e4ef;
            background:
              linear-gradient(#dfe8f2 1px, transparent 1px) 0 0 / 100% 42px;
          }

          .tooltip-card {
            width: 78px;
            height: 56px;
            padding: 8px;
            border: 1px solid #cbd8e6;
            border-radius: 10px;
            background: #ffffff;
            box-shadow: 0 8px 18px rgba(34, 79, 126, 0.12);
            font-family: Arial, sans-serif;
          }

          .tooltip-card span {
            display: block;
            font-size: 12px;
            color: #5d7186;
          }

          .tooltip-card strong {
            display: block;
            margin-top: 5px;
            font-size: 14px;
            color: #071f3d;
          }

          .chart-months {
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            color: #667c94;
            font-size: 12px;
            font-family: Arial, sans-serif;
          }

          .status-panel {
            min-height: 292px;
          }

          .donut-wrap {
            display: flex;
            justify-content: center;
            padding: 8px 0 8px;
          }

          .donut {
            width: 148px;
            height: 148px;
            border-radius: 999px;
            display: grid;
            place-items: center;
          }

          .donut-inner {
            width: 92px;
            height: 92px;
            border-radius: 999px;
            background: #ffffff;
            display: grid;
            place-items: center;
            box-shadow: inset 0 0 0 1px #e1e8f1;
          }

          .donut-inner span {
            color: #6e7f91;
            font-size: 13px;
            margin-bottom: -18px;
          }

          .donut-inner strong {
            font-size: 24px;
            font-weight: 900;
          }

          .status-list {
            border-top: 1px solid #d8e4ef;
            padding-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-family: Arial, sans-serif;
          }

          .status-row span {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #223b55;
          }

          .status-row i {
            width: 10px;
            height: 10px;
            border-radius: 999px;
          }

          .status-row strong {
            font-weight: 800;
          }

          .top-customers-panel,
          .recent-panel {
            min-height: 230px;
          }

          .bar-list {
            margin-top: 28px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .bar-row,
          .empty-bar-row {
            display: grid;
            grid-template-columns: 150px minmax(0, 1fr) 48px;
            align-items: center;
            gap: 14px;
            font-size: 13px;
            font-family: Arial, sans-serif;
          }

          .bar-track,
          .empty-bar-row div {
            height: 20px;
            background: #edf2f7;
            border-radius: 999px;
            overflow: hidden;
          }

          .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #2f77f5, #2366dd);
          }

          .bar-row strong,
          .empty-bar-row strong {
            text-align: right;
          }

          .recent-table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
            table-layout: fixed;
            font-family: Arial, sans-serif;
          }

          .recent-table th {
            text-align: left;
            background: #f2f6fb;
            color: #526a83;
            padding: 13px;
            font-weight: 700;
          }

          .recent-table td {
            padding: 13px;
            border-top: 1px solid #edf2f7;
            color: #223b55;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .status-pill {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 12px;
            font-weight: 700;
            font-family: Arial, sans-serif;
          }

          .status-pill.pending {
            color: #2b6ef3;
            background: rgba(43, 110, 243, 0.12);
          }

          @media (max-width: 1200px) {
            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .content-grid-top,
            .content-grid-bottom {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 820px) {
            .dashboard-page {
              padding-bottom: 24px;
            }

            .dashboard-header {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
              margin-bottom: 14px;
            }

            .page-kicker {
              font-size: 12px;
              margin-bottom: 6px;
            }

            .dashboard-header h1 {
              font-size: 34px;
            }

            .dashboard-header p {
              max-width: 100%;
              font-size: 15px;
              line-height: 1.28;
            }

            .top-actions {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }

            .top-select,
            .mini-button {
              width: 100%;
              height: 42px;
              padding: 0 12px;
              font-size: 13px;
              border-radius: 13px;
            }

            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 12px;
            }

            .stat-card {
              min-height: 152px;
              padding: 18px;
            }

            .stat-card span {
              font-size: 14px;
              line-height: 1.18;
              margin-bottom: 12px;
            }

            .stat-card strong {
              font-size: 28px;
              margin-bottom: 12px;
            }

            .stat-card small {
              display: block;
              font-size: 13px;
              line-height: 1.35;
            }

            .content-grid-top,
            .content-grid-bottom {
              grid-template-columns: 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }

            .panel {
              padding: 16px;
              border-radius: 14px;
            }

            .panel-header {
              align-items: flex-start;
              gap: 10px;
            }

            .panel h2 {
              font-size: 17px;
              line-height: 1.2;
            }

            .panel-big-number {
              font-size: 24px;
              margin-top: 10px;
            }

            .line-chart-wrapper {
              height: 232px;
              padding-left: 30px;
              padding-top: 4px;
            }

            .chart-axis-left {
              height: 154px;
              top: 10px;
              font-size: 11px;
            }

            .line-chart {
              height: 162px;
              background:
                linear-gradient(#dfe8f2 1px, transparent 1px) 0 0 / 100% 38px;
            }

            .chart-months {
              font-size: 11px;
              padding-top: 8px;
            }

            .tooltip-card {
              display: none;
            }

            .donut {
              width: 132px;
              height: 132px;
            }

            .donut-inner {
              width: 82px;
              height: 82px;
            }

            .donut-inner strong {
              font-size: 22px;
            }

            .bar-list {
              margin-top: 18px;
              gap: 14px;
            }

            .bar-row,
            .empty-bar-row {
              grid-template-columns: 96px minmax(0, 1fr) 34px;
              gap: 10px;
              font-size: 12px;
            }

            .bar-row span,
            .empty-bar-row span {
              line-height: 1.15;
              word-break: break-word;
            }

            .bar-track,
            .empty-bar-row div {
              height: 18px;
            }

            .recent-table {
              display: block;
              margin-top: 14px;
              font-size: 13px;
            }

            .recent-table thead {
              display: none;
            }

            .recent-table tbody {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .recent-table tr {
              display: block;
              border: 1px solid #d8e4ef;
              border-radius: 12px;
              background: #f8fbff;
              padding: 10px;
            }

            .recent-table td {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              border-top: 0;
              padding: 7px 4px;
              white-space: normal;
              overflow: visible;
              text-overflow: unset;
              line-height: 1.25;
            }

            .recent-table td::before {
              content: attr(data-label);
              flex-shrink: 0;
              color: #5d7186;
              font-size: 12px;
              font-weight: 700;
            }

            .status-pill {
              padding: 6px 10px;
              font-size: 12px;
            }
          }

          @media (max-width: 520px) {
            .dashboard-header h1 {
              font-size: 32px;
            }

            .dashboard-header p {
              font-size: 15px;
            }

            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }

            .stat-card {
              min-height: 148px;
              padding: 16px 14px;
            }

            .stat-card span {
              font-size: 13px;
            }

            .stat-card strong {
              font-size: 27px;
            }

            .stat-card small {
              font-size: 12px;
            }

            .panel {
              padding: 14px;
            }

            .panel-header {
              flex-direction: column;
            }

            .panel-header .mini-button {
              max-width: 180px;
            }

            .line-chart-wrapper {
              height: 218px;
              padding-left: 28px;
            }

            .line-chart {
              height: 154px;
            }

            .chart-months {
              font-size: 10.5px;
            }

            .status-row {
              font-size: 13px;
            }

            .bar-row,
            .empty-bar-row {
              grid-template-columns: 92px minmax(0, 1fr) 28px;
              gap: 8px;
              font-size: 12px;
            }
          }

          @media (max-width: 380px) {
            .top-actions {
              grid-template-columns: 1fr;
            }

            .stats-grid {
              grid-template-columns: 1fr;
            }

            .stat-card {
              min-height: 120px;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}