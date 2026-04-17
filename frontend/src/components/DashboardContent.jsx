import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Package, RotateCcw, Shield } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Card = ({ title, value, icon: Icon, trend, color }) => (
  <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ padding: 10, background: `${color}10`, color: color, borderRadius: 12 }}>
        <Icon size={24} />
      </div>
      {trend && (
        <span style={{ fontSize: 13, fontWeight: 700, color: trend > 0 ? '#10b981' : '#ef4444' }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{value}</div>
  </div>
);

export default function DashboardContent({ data }) {
  if (!data) return null;

  const { summary, trends, sku_analysis, channel_split, fraud_data, forecast } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 1. Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <Card title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="#4f46e5" trend={12.5} />
        <Card title="Total Orders" value={summary.totalOrders} icon={Users} color="#10b981" trend={8.2} />
        <Card title="Avg Order Value" value={`₹${summary.avgOrderValue.toFixed(2)}`} icon={Package} color="#8b5cf6" />
        <Card title="Return Rate" value={`${summary.returnRate.toFixed(1)}%`} icon={RotateCcw} color="#ef4444" trend={-2.4} />
      </div>

      {/* 2. Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Channel Split</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={channel_split} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {channel_split.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. SKU & Fraud Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Top SKUs by Revenue</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sku_analysis.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="sku" type="category" width={100} tick={{fontSize: 11, fontWeight: 600}} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Fraud Monitoring</h3>
            <Shield size={20} color="#ef4444" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Score</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#64748b' }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {fraud_data.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 8px', fontSize: 14, fontWeight: 600 }}>{f.customer_name}</td>
                    <td style={{ padding: '16px 8px', fontSize: 14 }}>{f.risk_score}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                        background: f.risk_level === 'CRITICAL' ? '#fef2f2' : f.risk_level === 'HIGH' ? '#fff7ed' : '#f0f9ff',
                        color: f.risk_level === 'CRITICAL' ? '#ef4444' : f.risk_level === 'HIGH' ? '#f59e0b' : '#0369a1'
                      }}>
                        {f.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Forecast Section (Bonus) */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', padding: 32, borderRadius: 24, color: '#fff' }}>
        <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>🔮 Predictive Revenue Forecast</h3>
        <p style={{ opacity: 0.8, marginBottom: 32, fontSize: 14 }}>Algorithmic projections based on current daily run-rate and historical velocity.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Next 7 Days</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>₹{forecast.next_7_days.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Next 30 Days</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>₹{forecast.next_30_days.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Next 90 Days</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>₹{forecast.next_90_days.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
