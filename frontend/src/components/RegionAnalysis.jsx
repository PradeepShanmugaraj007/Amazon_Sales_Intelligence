import React, { useState } from "react";
import { MapPin, Activity } from "lucide-react";
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { SectionHeader } from "./UIComponents";
import { BRAND, fmt } from "../utils";

const STATE_COORDS = {
  "jammu & kashmir": { x: 30, y: 95 },
  "himachal pradesh": { x: 35, y: 85 },
  "punjab": { x: 25, y: 80 },
  "chandigarh": { x: 28, y: 82 },
  "uttarakhand": { x: 42, y: 80 },
  "haryana": { x: 28, y: 75 },
  "delhi": { x: 32, y: 73 },
  "rajasthan": { x: 15, y: 65 },
  "uttar pradesh": { x: 45, y: 65 },
  "bihar": { x: 65, y: 60 },
  "sikkim": { x: 75, y: 65 },
  "assam": { x: 88, y: 60 },
  "meghalaya": { x: 85, y: 55 },
  "arunachal pradesh": { x: 95, y: 70 },
  "nagaland": { x: 95, y: 58 },
  "manipur": { x: 95, y: 50 },
  "mizoram": { x: 90, y: 45 },
  "tripura": { x: 85, y: 48 },
  "west bengal": { x: 75, y: 45 },
  "jharkhand": { x: 60, y: 50 },
  "odisha": { x: 60, y: 35 },
  "chhattisgarh": { x: 50, y: 45 },
  "madhya pradesh": { x: 35, y: 50 },
  "gujarat": { x: 5, y: 50 },
  "maharashtra": { x: 20, y: 35 },
  "goa": { x: 15, y: 22 },
  "karnataka": { x: 25, y: 15 },
  "telangana": { x: 40, y: 28 },
  "andhra pradesh": { x: 45, y: 15 },
  "kerala": { x: 25, y: 0 },
  "tamil nadu": { x: 35, y: 5 },
  "puducherry": { x: 40, y: 8 }
};

const RegionAnalysis = ({ stats, styles = {} }) => {
  const [showMap, setShowMap] = useState(false);
  if (!stats) return null;

  const chartData = (stats.stateList || []).slice(0, 15).map(s => ({
    name: s.state,
    value: s.orders,
    revenue: s.revenue
  }));

  const scatterData = (stats.stateList || []).map(s => {
    const coords = STATE_COORDS[s.state.toLowerCase()] || { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
    return {
      name: s.state,
      x: coords.x,
      y: coords.y,
      orders: s.orders,
      revenue: s.revenue
    };
  });
  
  const maxRev = Math.max(...scatterData.map(d => d.revenue), 1);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
             <div style={{ display: 'inline-block', padding: '4px 12px', background: `${BRAND}15`, color: BRAND, borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 8, letterSpacing: 1 }}>FULL COVERAGE</div>
             <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{showMap ? "Logistics Node Network" : "Geographic Distribution"}</h3>
             <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
               {showMap ? "Live visualization of regional distribution hubs across India" : "Orders by ship-to state across India"}
             </p>
          </div>
          {!showMap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: BRAND, fontWeight: 800 }}>
               <div style={{ width: 12, height: 12, background: BRAND, borderRadius: 2 }} /> Order Volume
            </div>
          )}
        </div>

        <div style={{ height: 500, width: '100%' }}>
          {showMap ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg, #020617, #0f172a)', borderRadius: 24, overflow: 'hidden', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
               {/* Abstract Grid Overlay */}
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
               <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 12 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}/> Standard</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/> High Traffic</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }}/> Critical Node</div>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 60, right: 60, bottom: 60, left: 60 }}>
                   <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                   <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                   <ZAxis type="number" dataKey="orders" range={[200, 4000]} />
                   <Tooltip 
                     cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                     content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         const data = payload[0].payload;
                         return (
                           <div style={{ background: 'rgba(15,23,42,0.85)', padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                             <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 12 }}>{data.name}</div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 8 }}>
                               <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Volume</span>
                               <span style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{data.orders} units</span>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                               <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Revenue</span>
                               <span style={{ fontSize: 14, color: '#4ade80', fontWeight: 800 }}>{fmt(data.revenue)}</span>
                             </div>
                           </div>
                         );
                       }
                       return null;
                     }}
                   />
                   <Scatter data={scatterData}>
                     {scatterData.map((entry, index) => {
                        const ratio = entry.revenue / maxRev;
                        const color = ratio > 0.6 ? '#f43f5e' : ratio > 0.2 ? '#f59e0b' : '#3b82f6';
                        return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />;
                     })}
                   </Scatter>
                 </ScatterChart>
               </ResponsiveContainer>
            </div>
          ) : (
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
          )}
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
              <Activity size={24} />
           </div>
           <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Regional Intelligence</h3>
           <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              Your logistics engine is currently concentrated in <b>{stats.stateList?.[0]?.state}</b>. 
              {stats.stateList?.[1] ? ` Expanding secondary nodes in ${stats.stateList[1].state} could reduce transit times by up to 18%.` : ""}
           </p>
           <button 
             onClick={() => setShowMap(!showMap)} 
             style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 10, border: 'none', background: showMap ? '#0f172a' : BRAND, color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}>
             {showMap ? "Return to Regional Chart" : "View Logistics Map"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default RegionAnalysis;
