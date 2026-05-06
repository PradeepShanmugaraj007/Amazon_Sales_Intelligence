import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { LogOut, ShoppingCart, TrendingUp, Users, Activity, Filter, Package } from 'lucide-react';
import { processData, fmt, BRAND, GREEN, RED, PURPLE } from "../utils";

const ShopifyDashboard = ({ rawData, filename, onReset }) => {
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || "overview");
  const SHOPIFY_GREEN = "#059669";
  const SHOPIFY_DARK = "#064e3b";

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

  const d2cStats = useMemo(() => {
    let revenue = 0;
    let orders = 0;
    let cartAbandonmentBase = 0;
    const ltvMap = {};

    rawData.forEach(r => {
      const amt = r["Invoice Amount"] || 0;
      if (amt > 0) {
        revenue += amt;
        orders += 1;
        
        // Simulating customer LTV based on regions/IDs if names are absent
        const custName = r["Buyer Name"] || r["Ship To State"] || "Guest User";
        if(!ltvMap[custName]) ltvMap[custName] = { name: custName, value: 0, orders: 0 };
        ltvMap[custName].value += amt;
        ltvMap[custName].orders += 1;
      } else {
        cartAbandonmentBase++;
      }
    });

    const ltvList = Object.values(ltvMap).sort((a,b) => b.value - a.value).slice(0, 5);

    // Simulate D2C Funnel
    const funnelData = [
      { step: "Store Sessions", count: orders * 4.5 },
      { step: "Added to Cart", count: orders * 1.8 },
      { step: "Reached Checkout", count: orders * 1.2 },
      { step: "Purchased", count: orders }
    ];

    return { revenue, orders, ltvList, funnelData, abandonment: cartAbandonmentBase };
  }, [rawData]);

  const baseStats = useMemo(() => processData(rawData), [rawData]);
  const chartData = (baseStats.weeklySales || []).map(w => ({ ...w, name: w.week }));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", minHeight: "100vh", display: "flex" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 280, background: SHOPIFY_DARK, color: "#fff", display: "flex", flexDirection: "column", padding: 24, position: "fixed", height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ background: SHOPIFY_GREEN, padding: 8, borderRadius: 12 }}><ShoppingCart size={24} color="#fff" /></div>
          <div><div style={{ fontSize: 18, fontWeight: 900 }}>ShopifyFlow</div><div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1 }}>D2C ANALYTICS ENGINE</div></div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "overview", label: "D2C Overview", icon: <Activity size={18} /> },
            { id: "funnel", label: "Checkout Funnel", icon: <Filter size={18} /> },
            { id: "ltv", label: "Customer LTV", icon: <Users size={18} /> },
          ].map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: activeTab === t.id ? SHOPIFY_GREEN : "transparent", color: activeTab === t.id ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}><LogOut size={16} /> Secure Exit</button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 280, padding: "32px 40px", minWidth: 0 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: SHOPIFY_DARK }}>
            {activeTab === "overview" && "Direct-to-Consumer Analytics"}
            {activeTab === "funnel" && "Checkout Funnel Optimization"}
            {activeTab === "ltv" && "Customer Lifetime Value Cohorts"}
          </h1>
          <div style={{ fontSize: 13, color: "#059669", marginTop: 4, fontWeight: 600 }}>Source: {filename} • Shopify API Layer</div>
        </div>

        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
               <div style={{ background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #d1fae5" }}>
                 <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>Gross Sales Volume</div>
                 <div style={{ fontSize: 32, fontWeight: 900, color: SHOPIFY_DARK, marginTop: 8 }}>{fmt(d2cStats.revenue)}</div>
               </div>
               <div style={{ background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #d1fae5" }}>
                 <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>Fulfilled Orders</div>
                 <div style={{ fontSize: 32, fontWeight: 900, color: SHOPIFY_DARK, marginTop: 8 }}>{d2cStats.orders.toLocaleString()}</div>
               </div>
               <div style={{ background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #d1fae5" }}>
                 <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>Average Cart Value</div>
                 <div style={{ fontSize: 32, fontWeight: 900, color: SHOPIFY_DARK, marginTop: 8 }}>{fmt(d2cStats.revenue / Math.max(1, d2cStats.orders))}</div>
               </div>
            </div>

            <div style={{ background: "#fff", padding: 28, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #d1fae5" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: SHOPIFY_DARK, margin: "0 0 20px" }}>Storefront Sales Velocity</h2>
              <ResponsiveContainer width="100%" height={280}>
                 <AreaChart data={chartData}>
                   <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={SHOPIFY_GREEN} stopOpacity={0.2}/><stop offset="95%" stopColor={SHOPIFY_GREEN} stopOpacity={0}/></linearGradient></defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                   <XAxis dataKey="name" tick={{fontSize: 11}} stroke="#9ca3af" />
                   <YAxis tick={{fontSize: 11}} stroke="#9ca3af" tickFormatter={v => fmt(v)} />
                   <Tooltip cursor={{ fill: '#f0fdf4' }} />
                   <Area type="monotone" dataKey="revenue" stroke={SHOPIFY_GREEN} strokeWidth={4} fill="url(#gr)" />
                 </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "funnel" && (
          <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #d1fae5" }}>
             <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 8px", color: SHOPIFY_DARK }}>Conversion Funnel Analytics (Simulated)</h2>
             <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>Tracking user behavior from first session to final checkout fulfillment.</p>
             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={d2cStats.funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ecfdf5" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="step" type="category" tick={{fontSize: 13, fontWeight: 600, fill: SHOPIFY_DARK}} width={140} />
                 <Tooltip />
                 <Bar dataKey="count" fill={SHOPIFY_GREEN} radius={[0, 8, 8, 0]} barSize={40}>
                   {d2cStats.funnelData.map((e, index) => <Cell key={index} fill={[`#064e3b`, `#059669`, `#10b981`, `#34d399`][index]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        )}

        {activeTab === "ltv" && (
           <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #d1fae5" }}>
             <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 24px", color: SHOPIFY_DARK }}>Top Customer Lifetime Value (LTV)</h2>
             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               {d2cStats.ltvList.map((c, i) => (
                 <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, border: "1px solid #ecfdf5", borderRadius: 12, background: "#fafafa" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                     <div style={{ width: 40, height: 40, borderRadius: 20, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: SHOPIFY_GREEN }}>#{i + 1}</div>
                     <div>
                       <div style={{ fontWeight: 800, color: SHOPIFY_DARK }}>{c.name}</div>
                       <div style={{ fontSize: 13, color: "#6b7280" }}>{c.orders} total orders</div>
                     </div>
                   </div>
                   <div style={{ fontSize: 18, fontWeight: 900, color: SHOPIFY_GREEN }}>{fmt(c.value)} LTV</div>
                 </div>
               ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default ShopifyDashboard;
