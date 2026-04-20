import React from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

const BRAND = "#2563eb";

export const KpiCard = ({ label, value, color = BRAND, icon, trend, sub }) => {
  const isPositive = trend > 0;
  return (
    <div className="glass" style={{
      padding: '24px', borderRadius: '20px', background: 'white',
      border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '10px', background: `${color}10`, borderRadius: '12px', color: color, fontSize: '20px' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: '100px',
            background: isPositive ? '#f0fdf4' : '#fef2f2', color: isPositive ? '#16a34a' : '#dc2626',
            fontSize: '11px', fontWeight: 800
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
};

export const SectionHeader = ({ title, sub, icon, badge }) => (
  <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{title}</h2>
        {badge && (
          <div style={{ padding: '2px 8px', borderRadius: '6px', background: `${BRAND}10`, color: BRAND, fontSize: '10px', fontWeight: 800 }}>
            {badge}
          </div>
        )}
      </div>
      {sub && <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{sub}</p>}
    </div>
  </div>
);

export const Badge = ({ label, color = BRAND, variant = 'subtle' }) => {
  const styles = {
    subtle: { background: `${color}15`, color: color, border: `1px solid ${color}20` },
    solid: { background: color, color: 'white', border: 'none' },
    outline: { background: 'transparent', color: color, border: `1.5px solid ${color}` }
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em',
      ...styles[variant]
    }}>
      {label}
    </span>
  );
};

export const InsightCard = ({ title, body, icon = "💡", color = BRAND }) => (
  <div className="glass" style={{
    padding: '20px', borderRadius: '16px', background: 'white',
    border: `1px solid #e2e8f0`, borderLeft: `4px solid ${color}`,
    display: 'flex', gap: 16, alignItems: 'flex-start'
  }}>
    <div style={{ fontSize: '24px' }}>{icon}</div>
    <div>
      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{body}</p>
    </div>
  </div>
);
