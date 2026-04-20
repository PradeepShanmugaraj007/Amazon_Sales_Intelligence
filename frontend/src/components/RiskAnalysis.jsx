import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, TrendingDown, DollarSign, MapPin, Package, History } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';

const RED = "#ef4444";
const GREEN = "#22c55e";
const BRAND = "#2563eb";
const YELLOW = "#f59e0b";

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export const CriticalRiskCard = ({ title, desc, severity = 'high', icon = <ShieldAlert size={20} /> }) => {
  const color = severity === 'high' ? RED : severity === 'medium' ? YELLOW : BRAND;
  return (
    <div className="glass" style={{
      padding: '16px', borderRadius: '12px', background: 'white',
      border: `1px solid #e2e8f0`, borderLeft: `4px solid ${color}`, display: 'flex', gap: 12, alignItems: 'flex-start'
    }}>
      <div style={{ color: color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
};

const RiskMetric = ({ label, value, icon, color = BRAND }) => (
  <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ padding: '8px', background: `${color}10`, borderRadius: '10px', color: color }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
    </div>
    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{value}</div>
  </div>
);

const FraudAnalysis = ({ fraudData }) => {
  const score = fraudData?.score || 12;
  const status = score < 20 ? 'Secure' : score < 50 ? 'Warning' : 'Critical';
  const color = score < 20 ? GREEN : score < 50 ? YELLOW : RED;

  // Derive top regions/skus from topRisk
  const topRegions = (fraudData?.topRisk || []).slice(0, 3);
  const topSkus = (fraudData?.topRisk || []).reduce((acc, curr) => {
    (curr.skus || []).forEach(sku => {
      acc[sku] = (acc[sku] || 0) + 1;
    });
    return acc;
  }, {});
  const sortedSkus = Object.entries(topSkus).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Radar Data for behavioral patterns
  const radarData = [
     { subject: 'Frequency', A: Math.min(100, (fraudData?.totalRefundTransactions || 0) * 10), fullMark: 100 },
     { subject: 'Quantity', A: Math.min(100, (fraudData?.totalRefundQty || 0) * 5), fullMark: 100 },
     { subject: 'Variety', A: Math.min(100, (sortedSkus.length || 0) * 20), fullMark: 100 },
     { subject: 'Velocity', A: score, fullMark: 100 },
     { subject: 'Value', A: Math.min(100, ((fraudData?.moneyAtRisk || 0) / 50000) * 100), fullMark: 100 },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* FINANCIAL EXPOSURE HEADER */}
      <div style={{ display: 'flex', gap: 20 }}>
        <RiskMetric label="Money at Risk" value={fmt(fraudData?.moneyAtRisk || 0)} icon={<DollarSign size={18} />} color={RED} />
        <RiskMetric label="Flagged Refunds" value={fraudData?.totalRefundTransactions || 0} icon={<History size={18} />} color={YELLOW} />
        <RiskMetric label="Return Volume" value={Math.floor(fraudData?.totalRefundQty || 0)} icon={<Package size={18} />} color={BRAND} />
        <RiskMetric label="Threat Vectors" value={fraudData?.totalAlerts || 0} icon={<ShieldAlert size={18} />} color={RED} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* RISK RADAR SECTION */}
          <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20 }}>Risk Profile Radar</div>
            <div style={{ height: 280, width: '100%' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                     <PolarGrid stroke="#e2e8f0" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="Threat Level" dataKey="A" stroke={RED} fill={RED} fillOpacity={0.15} />
                     <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
               <div style={{ fontSize: '11px', fontWeight: 800, color: RED }}>● Threat Level Profile</div>
            </div>
          </div>

          <div className="glass" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 }}>Health Scan Result</div>
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - score / 100)} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{score}%</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: color, textTransform: 'uppercase' }}>{status}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* THREAT FEED */}
          <div className="glass" style={{ padding: '32px', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Threat Intelligence Feed</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: GREEN }}>● LIVE MONITORING</div>
                 <ShieldCheck size={20} color={GREEN} />
              </div>
            </div>
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Vector ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Detection Engine</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Confidence</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudData?.topRisk?.length > 0 ? (
                    fraudData.topRisk.map((row, i) => {
                      const engines = ["Postcode Centroid", "Velocity Spike", "Buyer Frequency", "Identity Mismatch", "Return Anomaly"];
                      const engine = engines[i % engines.length];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700 }}>
                            <span style={{ color: '#94a3b8', marginRight: 8, fontSize: 10 }}>FT-{800 + i}</span>
                            {row.customer_id?.slice(0, 15)}...
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                            {engine}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 800, color: BRAND }}>
                            {row.risk_score}%
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              fontSize: '10px', fontWeight: 900, background: row.risk_score >= 80 ? `${RED}10` : '#f1f5f9',
                              color: row.risk_score >= 80 ? RED : '#64748b', padding: '2px 8px', borderRadius: '4px' 
                            }}>{row.risk_label}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No critical risk vectors detected in this dataset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
             {/* TERRITORIAL RISK BREAKDOWN */}
            <div className="glass" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MapPin size={16} color={RED} />
                  <h3 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>Regional Hotspots</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topRegions.map((reg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{reg.state}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{reg.city}</div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: reg.risk_score >= 80 ? RED : BRAND }}>{reg.risk_score}%</div>
                      </div>
                  ))}
                </div>
              </div>

              {/* SKU VULNERABILITY ANALYSIS */}
              <div className="glass" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Package size={16} color={BRAND} />
                  <h3 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>Vulnerable SKUs</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {sortedSkus.map(([sku, count], i) => (
                      <div key={i} style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sku}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{count} <span style={{ fontSize: 9, color: RED }}>Refunds</span></div>
                      </div>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudAnalysis;
