import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LogOut, Database, Truck, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { processData, fmt } from "../utils";

const ERPDashboard = ({ rawData, filename, onReset }) => {
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || "overview");
  const ERP_SLATE = "#1e293b";
  const ERP_BLUE = "#3b82f6";
  const ERP_WARNING = "#f59e0b";

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTab(hash || "overview");
    };
    window.addEventListener('hashchange', handlePopState);
    return () => window.removeEventListener('hashchange', handlePopState);
  }, []);
  
  const handleTabChange = (tabId) => {
    window.location.hash = tabId;
    setActiveTab(tabId);
  };

  const erpStats = useMemo(() => {
    let macroVolume = 0;
    let b2bOrders = 0;
    let defectSum = 0;
    const vendorMap = {};

    rawData.forEach(r => {
      const qty = r["Quantity"] || 0;
      const amt = r["Invoice Amount"] || 0;
      
      const vendorName = r["Buyer Name"] || r["Gstin"] || r["Sku"] || "Unknown Supplier";
      if (!vendorMap[vendorName]) vendorMap[vendorName] = { name: vendorName, defects: 0, fulfilled: 0 };

      if (qty >= 0 || amt > 0) {
        macroVolume += qty;
        b2bOrders += 1;
        vendorMap[vendorName].fulfilled += qty;
      } else {
        defectSum += Math.abs(qty);
        vendorMap[vendorName].defects += Math.abs(qty);
      }
    });

    const vendorLogistics = Object.values(vendorMap)
      .map(v => ({ ...v, defectRate: v.fulfilled > 0 ? (v.defects / v.fulfilled * 100) : 0 }))
      .sort((a,b) => b.fulfilled - a.fulfilled)
      .slice(0, 5);

    const freightMap = {};
    rawData.forEach(r => {
      const state = r["Ship To State"] || r["Region"] || "Unknown Node";
      const qty = Math.max(0, r["Quantity"] || 1);
      if (!freightMap[state]) freightMap[state] = { name: state, volume: 0, cost: 0, routes: 0 };
      freightMap[state].volume += qty;
      freightMap[state].cost += qty * 14.50; 
      freightMap[state].routes += 1;
    });
    const freightRegions = Object.values(freightMap).sort((a,b) => b.volume - a.volume).slice(0, 6);

    return { macroVolume, b2bOrders, defectSum, vendorLogistics, freightRegions };
  }, [rawData]);

  return (
    <div style={{ fontFamily: "monospace", background: "#0f172a", minHeight: "100vh", display: "flex", color: "#e2e8f0" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 280, background: "#020617", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: 24, position: "fixed", height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ background: "rgba(59, 130, 246, 0.2)", padding: 8, borderRadius: 8, border: "1px solid #3b82f6" }}><Database size={24} color={ERP_BLUE} /></div>
          <div><div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", fontFamily: "sans-serif" }}>NEXUS ERP</div><div style={{ fontSize: 10, color: ERP_BLUE, letterSpacing: 2 }}>SUPPLY CHAIN ROOT</div></div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "overview", label: "Macro Logistics Overview", icon: <Package size={18} /> },
            { id: "vendors", label: "Supplier Compliance", icon: <ShieldCheck size={18} /> },
            { id: "freight", label: "Freight & Shipping", icon: <Truck size={18} /> },
          ].map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 8, border: activeTab === t.id ? `1px solid ${ERP_BLUE}` : "1px solid transparent", background: activeTab === t.id ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === t.id ? ERP_BLUE : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "monospace" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", border: "1px solid #334155", background: "transparent", color: "#94a3b8", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}><LogOut size={16} /> Disconnect Node</button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 280, padding: "40px", minWidth: 0 }}>
        <div style={{ marginBottom: 32, borderBottom: "1px solid #1e293b", paddingBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f8fafc", fontFamily: "sans-serif", textTransform: "uppercase" }}>
            {activeTab === "overview" && "Macro Logistics & Volume Metric"}
            {activeTab === "vendors" && "Supplier Quality & Compliance Index"}
            {activeTab === "freight" && "Freight Routing Dynamics"}
          </h1>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>{filename} // SYSTEM: Custom ERP Parsing // STATUS: ONLINE</div>
        </div>

        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
               <div style={{ background: ERP_SLATE, padding: 24, borderRadius: 8, borderLeft: `4px solid ${ERP_BLUE}` }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: 1 }}>TOT_BULK_VOLUME</div>
                 <div style={{ fontSize: 36, fontWeight: 900, color: "#f8fafc", marginTop: 8 }}>{erpStats.macroVolume.toLocaleString()}<span style={{fontSize: 14, color: "#64748b", marginLeft: 8}}>UNITS</span></div>
               </div>
               <div style={{ background: ERP_SLATE, padding: 24, borderRadius: 8, borderLeft: `4px solid #10b981` }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: 1 }}>B2B_PURCHASE_ORDERS</div>
                 <div style={{ fontSize: 36, fontWeight: 900, color: "#f8fafc", marginTop: 8 }}>{erpStats.b2bOrders.toLocaleString()}<span style={{fontSize: 14, color: "#64748b", marginLeft: 8}}>PO</span></div>
               </div>
               <div style={{ background: ERP_SLATE, padding: 24, borderRadius: 8, borderLeft: `4px solid ${ERP_WARNING}` }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: 1 }}>SUPPLY_DEFECTS</div>
                 <div style={{ fontSize: 36, fontWeight: 900, color: "#f8fafc", marginTop: 8 }}>{erpStats.defectSum.toLocaleString()}<span style={{fontSize: 14, color: "#64748b", marginLeft: 8}}>UNITS</span></div>
               </div>
            </div>

            <div style={{ background: ERP_SLATE, padding: 28, borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <AlertCircle size={20} color={ERP_WARNING} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: 1 }}>SUPPLY CHAIN BOTTLENECKS (SIMULATED)</h2>
              </div>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155", color: "#64748b", fontSize: 11 }}>
                    <th style={{ padding: 12 }}>SUPPLIER / SKU NODE</th>
                    <th style={{ padding: 12 }}>COMPLETED RECEIPTS</th>
                    <th style={{ padding: 12 }}>DEFECT / REJECT COUNT</th>
                    <th style={{ padding: 12 }}>COMPLIANCE SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {erpStats.vendorLogistics.map((v, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: 16, fontWeight: 700, color: "#93c5fd" }}>{v.name}</td>
                      <td style={{ padding: 16, color: "#10b981" }}>+{v.fulfilled.toLocaleString()}</td>
                      <td style={{ padding: 16, color: ERP_WARNING }}>{v.defects.toLocaleString()}</td>
                      <td style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 100, height: 6, background: "#0f172a", borderRadius: 3 }}>
                            <div style={{ height: "100%", background: v.defectRate > 5 ? ERP_WARNING : "#10b981", width: `${Math.max(0, 100 - v.defectRate)}%`, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: v.defectRate > 5 ? ERP_WARNING : "#10b981" }}>{(100 - v.defectRate).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "vendors" && (
           <div style={{ background: ERP_SLATE, padding: 32, borderRadius: 8 }}>
             <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", margin: "0 0 24px", textTransform: "uppercase" }}>Vendor Volume Distribution</h2>
             <ResponsiveContainer width="100%" height={360}>
               <BarChart data={erpStats.vendorLogistics} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                 <XAxis type="number" tick={{fill: "#64748b"}} stroke="#334155" />
                 <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: "#94a3b8", fontWeight: 700}} width={120} stroke="#334155" />
                 <Tooltip contentStyle={{background: "#020617", border: "1px solid #334155", color: "#f8fafc"}} />
                 <Bar dataKey="fulfilled" fill={ERP_BLUE} radius={[0, 4, 4, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        )}

        {activeTab === "freight" && (
           <div style={{ background: ERP_SLATE, padding: 32, borderRadius: 8 }}>
             <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
               <Truck size={20} color={ERP_BLUE} />
               <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", margin: 0, textTransform: "uppercase" }}>Freight Liability & Node Routes (Simulated LTL)</h2>
             </div>
             
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
               {erpStats.freightRegions.map((f, i) => (
                 <div key={i} style={{ border: "1px solid #334155", padding: 20, borderRadius: 8, background: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div>
                     <div style={{ color: "#3b82f6", fontWeight: 900, fontSize: 16 }}>{f.name.toUpperCase()}</div>
                     <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{f.routes.toLocaleString()} ACTIVE ROUTES</div>
                   </div>
                   <div style={{ textAlign: "right" }}>
                     <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 20 }}>{fmt(f.cost)}</div>
                     <div style={{ color: "#10b981", fontSize: 11, marginTop: 4 }}>{f.volume.toLocaleString()} UNITS MOVED</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default ERPDashboard;
