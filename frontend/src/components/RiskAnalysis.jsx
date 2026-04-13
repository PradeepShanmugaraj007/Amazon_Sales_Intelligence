import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import api from '../api';
import { 
  AlertTriangle, MapPin, Package, RotateCcw, User, Tag, 
  ChevronDown, ChevronUp, Shield, Calendar, TrendingUp, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const RISK_CONFIG = {
  CRITICAL: {
    bg: 'rgba(220, 38, 38, 0.04)',
    border: '#DC2626',
    text: '#DC2626',
    badge: '#DC2626',
  },
  HIGH: {
    bg: 'rgba(217, 119, 6, 0.04)',
    border: '#D97706',
    text: '#D97706',
    badge: '#D97706',
  },
  MEDIUM: {
    bg: 'rgba(59, 130, 246, 0.04)',
    border: '#3B82F6',
    text: '#3B82F6',
    badge: '#3B82F6',
  },
};

function RiskScoreBar({ score }) {
  const color = score >= 75 ? '#DC2626' : score >= 50 ? '#D97706' : '#3B82F6';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Risk Score</span>
        <span style={{ fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 4,
          transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  );
}

function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '12px 0' }}>No transaction records found.</div>;
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: 'var(--bg-primary)' }}>
            {['Date', 'Order ID', 'SKU', 'HSN/SAC', 'Qty', 'Amount (₹)'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'white' : 'var(--bg-primary)' }}>
              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t['Invoice Date']?.slice(0, 10) || '-'}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{t['Order Id'] || '-'}</td>
              <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--accent-secondary)' }}>{t['Sku'] || '-'}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t['Hsn/sac'] || '-'}</td>
              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{Math.abs(parseFloat(t['Quantity']) || 1)}</td>
              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--danger)' }}>₹{Math.abs(parseFloat(t['Invoice Amount']) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkuBreakdownTable({ skus }) {
  if (!skus || skus.length === 0) return null;
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: 'var(--bg-primary)' }}>
            {['SKU', 'HSN/SAC', 'Units Returned', 'Orders', 'Total Value (₹)'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skus.map((s, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'white' : 'var(--bg-primary)' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{s.Sku || '-'}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s['Hsn/sac'] || '-'}</td>
              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{s.quantity || Math.abs(parseFloat(s['Quantity']) || 1)}</td>
              <td style={{ padding: '8px 12px' }}>{s.count ?? '-'}</td>
              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--danger)' }}>₹{Math.abs(parseFloat(s.amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CriticalRiskCard({ item, rank }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('skus');
  const cfg = RISK_CONFIG[item.risk_label] || RISK_CONFIG['MEDIUM'];

  const rankColors = ['#DC2626', '#D97706', '#3B82F6', '#8B5CF6', '#059669'];
  const rankColor = rankColors[rank - 1] || '#64748B';

  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cfg.border}22` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>

          {/* Left: Rank + Identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Rank Badge */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: rankColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem' }}>#{rank}</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  background: cfg.badge, color: 'white',
                  padding: '2px 10px', borderRadius: 4,
                  fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em'
                }}>{item.risk_label} RISK</span>
                <User size={16} color="var(--text-secondary)" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.customer_id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <MapPin size={16} color="var(--danger)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                   {item.city}, {item.state}
                </span>
                <span style={{ background: '#fef2f2', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5', color: '#ef4444', fontWeight: 800, letterSpacing: '0.1em', marginLeft: 6 }}>
                   ZIP CODES: {item.postal_code || 'N/A'}
                </span>
                {item.gstin && item.gstin !== 'N/A' && (
                  <span style={{ marginLeft: 8, background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                    GSTIN: {item.gstin}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 4 }}>
                <Calendar size={12} />
                <span>First refund: {item.first_refund?.slice(0, 10)}</span>
                <span>→</span>
                <span>Last refund: {item.last_refund?.slice(0, 10)}</span>
              </div>
            </div>
          </div>

          {/* Right: Key Metrics */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.text }}>{item.refund_quantity}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Units</div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.text }}>{item.refund_count}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Orders</div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', minWidth: 100 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>₹{Number(item.total_refund_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Value</div>
            </div>
          </div>
        </div>

        <RiskScoreBar score={item.risk_score} />
      </div>

      {/* SKU Tags Row */}
      <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.5)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', borderBottom: `1px solid ${cfg.border}22` }}>
        <Tag size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: 4 }}>Refunded SKUs:</span>
        {(item.skus || []).map((sku, i) => (
          <span key={i} style={{
            background: 'white', color: 'var(--accent-secondary)',
            padding: '3px 10px', borderRadius: 4, fontSize: '0.75rem',
            border: '1px solid rgba(59,130,246,0.25)', fontWeight: 600
          }}>{sku}</span>
        ))}
        {(!item.skus || item.skus.length === 0) && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No SKU data</span>}
      </div>

      {/* Expandable Detail Section */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '10px 24px',
          background: 'rgba(255,255,255,0.6)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600
        }}
      >
        <span>{expanded ? 'Hide' : 'View'} Full Refund Details</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Tab toggles */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--border-color)', marginTop: 12 }}>
            {(['skus', 'transactions']).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? cfg.text : 'var(--text-secondary)',
                  borderBottom: `2px solid ${activeTab === tab ? cfg.text : 'transparent'}`,
                  marginBottom: -2,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'skus' ? '📦 SKU Breakdown' : '🧾 Transaction List'}
              </button>
            ))}
          </div>

          {activeTab === 'skus' && <SkuBreakdownTable skus={item.sku_breakdown} />}
          {activeTab === 'transactions' && <TransactionTable transactions={item.transactions} />}
        </div>
      )}
    </div>
  );
}

function FraudTrendChart({ data }) {
  const trendData = useMemo(() => {
    const dates = {};
    data.forEach(customer => {
      (customer.transactions || []).forEach(t => {
        const d = t['Invoice Date']?.slice(0, 7) || 'Unknown'; // Monthly grouping
        if (!dates[d]) dates[d] = { date: d, amount: 0, count: 0 };
        dates[d].amount += Math.abs(t['Invoice Amount'] || 0);
        dates[d].count += 1;
      });
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (trendData.length === 0) return null;

  return (
    <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <TrendingUp size={20} color="var(--danger)" />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Refund Value Trend</h3>
      </div>
      <div style={{ height: 260, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
            <Tooltip 
              contentStyle={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(v) => [`₹${v.toLocaleString()}`, 'Refund Value']}
            />
            <Area type="monotone" dataKey="amount" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#fraudGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HighQuantityRefunders({ data }) {
  const topRefunders = useMemo(() => {
    const records = [];
    data.forEach(c => {
      const hsnGroups = {};
      (c.sku_breakdown || []).forEach(s => {
        const hsn = s['Hsn/sac'] || 'Unclassified';
        if (!hsnGroups[hsn]) hsnGroups[hsn] = 0;
        hsnGroups[hsn] += (s.quantity || 1);
      });
      Object.entries(hsnGroups).forEach(([hsn, qty]) => {
        records.push({
          hsn,
          quantity: qty,
          city: c.city,
          state: c.state,
          postal_code: c.postal_code,
          customer_id: c.customer_id
        });
      });
    });
    return records.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [data]);

  return (
    <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Package size={20} color="var(--warning)" />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>High Quantity Refunders (By Tax Class)</h3>
      </div>
      <div style={{ height: 260, width: '100%', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>HSN/SAC</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Region & Pincode</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Units</th>
            </tr>
          </thead>
          <tbody>
            {topRefunders.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--accent-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {c.hsn}
                </td>
                <td style={{ padding: '12px 12px' }}>
                   <div style={{ fontWeight: 600 }}>{c.city}, {c.state}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 800, marginTop: 2 }}>ZIP: {c.postal_code || 'N/A'}</div>
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--danger)', fontSize: '1.2rem' }}>{c.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FraudAnalysis({ session_id }) {
  const { dataset } = useAppContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (session_id) {
          const params = new URLSearchParams();
          params.append('session_id', session_id);
          if (startDate) params.append('start_date', startDate);
          if (endDate) params.append('end_date', endDate);
          
          const res = await api.get(`/refunds/fraud?${params.toString()}`);
          if (Array.isArray(res)) {
            setData(res);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Failed to load fraud data", error);
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [session_id, startDate, endDate]);

  const totalRefundQty = data.reduce((s, d) => s + (d.refund_quantity || 0), 0);
  const totalRefundAmt = data.reduce((s, d) => s + (d.total_refund_amount || 0), 0);
  const totalOrders = data.reduce((s, d) => s + (d.refund_count || 0), 0);

  return (
    <div className="page-container">
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Shield size={22} color="var(--danger)" />
            <h1 className="page-title" style={{ margin: 0 }}>Fraud & Refund Risk Analysis</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Top 5 highest-risk customers ranked by refund quantity and frequency
          </p>
        </div>

        {/* Date Filters */}
        <div className="filters-bar glass" style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
          <input type="date" className="filter-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>to</span>
          <input type="date" className="filter-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      {!loading && data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Critical Customers Found', value: data.length, icon: <AlertTriangle size={18} color="var(--danger)" />, color: 'var(--danger)' },
            { label: 'Total Units Returned', value: totalRefundQty.toLocaleString(), icon: <Package size={18} color="var(--warning)" />, color: 'var(--warning)' },
            { label: 'Total Refund Value', value: `₹${totalRefundAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <RotateCcw size={18} color="var(--danger)" />, color: 'var(--danger)' },
            { label: 'Refund Transactions', value: totalOrders.toLocaleString(), icon: <User size={18} color="var(--accent-secondary)" />, color: 'var(--accent-secondary)' },
          ].map((m, i) => (
            <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'var(--bg-primary)', padding: 8, borderRadius: 8, flexShrink: 0 }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="glass" style={{ padding: '14px 20px', borderLeft: '4px solid var(--danger)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
          {dataset?.type === 'b2c'
            ? "B2C transactions are anonymous. Customers are identified by their shipping location (City + Postal Code). Risk score is calculated from return volume (60%) and return frequency (40%)."
            : "B2B buyers are identified by their registered business name. Risk score is calculated from return volume (60%) and return frequency (40%). Click any card to view their full refund ledger."}
        </p>
      </div>

      {/* Charts Section */}
      {!loading && data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <FraudTrendChart data={data} />
          <HighQuantityRefunders data={data} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loader-container"><div className="loader" /></div>
      ) : data.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Shield size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No refund activity detected</div>
          <div style={{ fontSize: '0.875rem' }}>No refund transactions found for the selected period.</div>
        </div>
      ) : (
        <div>
          {(() => {
            const worstOffender = data.reduce((max, obj) => obj.refund_quantity > max.refund_quantity ? obj : max, data[0]);
            const remaining = data.filter(d => d.customer_id !== worstOffender.customer_id);
            return (
              <>
                {/* 🚨 Worst Offender Priority Card */}
                <div style={{ marginBottom: 40, background: 'rgba(239, 68, 68, 0.02)', padding: '24px 24px', borderRadius: 16, border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 10 }}>
                    <AlertTriangle size={26} color="#ef4444" />
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      MAXIMUM QUANTITY REFUNDER DETECTED
                    </h2>
                  </div>
                  <CriticalRiskCard item={worstOffender} rank={1} />
                </div>
                
                {/* Normal Threat List */}
                {remaining.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>
                      <User size={20} color="var(--text-secondary)" />
                      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        General Threat List
                      </h2>
                    </div>
                    {remaining.map((item, idx) => (
                      <CriticalRiskCard key={item.customer_id} item={item} rank={idx + 2} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
