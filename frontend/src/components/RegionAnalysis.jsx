import React from "react";
import { MapPin } from "lucide-react";
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { SectionHeader } from "./UIComponents";
import { BRAND, fmt } from "../utils";

const RegionAnalysis = ({ stats, styles = {} }) => {
  if (!stats) return null;

  const chartData = (stats.stateList || []).slice(0, 15).map(s => ({
    name: s.state,
    value: s.orders,
    revenue: s.revenue
  }));

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
             <div style={{ display: 'inline-block', padding: '4px 12px', background: `${BRAND}15`, color: BRAND, borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 8, letterSpacing: 1 }}>FULL COVERAGE</div>
             <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Geographic Distribution</h3>
             <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>Orders by ship-to state across India</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: BRAND, fontWeight: 800 }}>
             <div style={{ width: 12, height: 12, background: BRAND, borderRadius: 2 }} /> Order Volume
          </div>
        </div>

        <div style={{ height: 500, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140} 
                style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v, name, props) => [v, 'Orders', `Revenue: ${fmt(props.payload.revenue)}`]}
              />
              <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} barSize={20}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND} fillOpacity={1 - (index * 0.04)} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-grid-2">
        <div style={styles.card}>
          <SectionHeader title="📊 State Revenue Matrix" sub="Numerical breakdown by region" />
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Revenue</th>
                  <th style={styles.th}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {(stats.stateList || []).map(s => (
                  <tr key={s.state}>
                    <td style={styles.td}><b>{s.state}</b></td>
                    <td style={styles.td}>{fmt(s.revenue)}</td>
                    <td style={styles.td}>{s.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass" style={{ background: 'white', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <div style={{ background: `${BRAND}10`, width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND, marginBottom: 20 }}>
              <MapPin size={24} />
           </div>
           <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Regional Intelligence</h3>
           <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              Your logistics engine is currently concentrated in <b>{stats.stateList?.[0]?.state}</b>. 
              {stats.stateList?.[1] ? ` Expanding secondary nodes in ${stats.stateList[1].state} could reduce transit times by up to 18%.` : ""}
           </p>
           <button style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 10, border: 'none', background: BRAND, color: 'white', fontWeight: 700 }}>View Logistics Map</button>
        </div>
      </div>
    </div>
  );
};

export default RegionAnalysis;
