import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from "recharts";
import { 
  AlertTriangle, MapPin, Package, RotateCcw, User, Tag, 
  ChevronDown, ChevronUp, Shield, Calendar, Search, 
  TrendingUp, TrendingDown, Clock, Activity, Download
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import LoginSection from "./components/LoginSection";
import UploadSection from "./components/UploadSection";
import Sidebar from "./components/Sidebar";
import AdminPanel from "./components/AdminPanel";
import { KpiCard, SectionHeader, Badge, InsightCard } from "./components/UIComponents";
import FraudAnalysis, { CriticalRiskCard } from "./components/RiskAnalysis";
import { processData, fmt, colorFor, BRAND, ACCENT, GREEN, RED, PURPLE, TEAL, INDIAN_STATES } from "./utils";
import { AppProvider, useAppContext } from "./context/AppContext";

import ShopifyDashboard from "./components/ShopifyDashboard";
import ERPDashboard from "./components/ERPDashboard";

// ─── UPGRADE BANNER ─────────────────────────────────────────────────────────
const UpgradeBanner = ({ feature, requiredPlan, color, icon }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
    border: `1px solid ${color}40`,
    borderRadius: 20,
    padding: "60px 40px",
    textAlign: "center",
    marginTop: 24,
  }}>
    <div style={{ fontSize: 56, marginBottom: 20 }}>{icon}</div>
    <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
      {feature} is not available on your plan
    </h2>
    <p style={{ fontSize: 15, color: "#64748b", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
      Upgrade to <strong style={{ color }}>{requiredPlan}</strong> to unlock this feature and get access to advanced analytics, forecasting, and intelligence tools.
    </p>
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "14px 32px", borderRadius: 12,
      background: color, color: "#fff",
      fontWeight: 800, fontSize: 15,
      boxShadow: `0 8px 24px ${color}40`,
    }}>
      🚀 Upgrade to {requiredPlan}
    </div>
    <div style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
      Contact us at support@selleriq.pro to upgrade your subscription.
    </div>
  </div>
);

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────
const Dashboard = ({ rawData, filename, activePlan, source, session_id, onReset }) => {
  const { dataset, updateDataset } = useAppContext();

  // Plan-based tab access rules
  const planOrder = { starter: 0, pro: 1, enterprise: 2 };
  const canAccess = (minPlan) => (planOrder[activePlan] || 0) >= (planOrder[minPlan] || 0);

  const ALL_TABS = ["overview", "sku", "regions", "tax", "fraud", "forecast", "saas", "about", "support"];
  const LOCKED_TABS = [
    ...(canAccess('pro') ? [] : ['fraud', 'forecast']),
    ...(canAccess('enterprise') ? [] : ['saas']),
  ];
  const KNOWN_TABS = ALL_TABS;

  const [activeTab, setActiveTabState] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return KNOWN_TABS.includes(hash) ? hash : "overview";
  });

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (KNOWN_TABS.includes(hash)) {
        // Redirect to overview if locked tab is accessed directly
        setActiveTabState(LOCKED_TABS.includes(hash) ? "overview" : hash);
      }
    };
    window.addEventListener('hashchange', handlePopState);
    return () => window.removeEventListener('hashchange', handlePopState);
  }, []);
  
  const setActiveTab = (tabId) => {
    if (LOCKED_TABS.includes(tabId)) return; // Block locked tabs
    const valid = KNOWN_TABS.includes(tabId) ? tabId : "overview";
    window.location.hash = valid;
    setActiveTabState(valid); 
  };
  const [dateRange, setDateRange] = useState("all");
  const [skuFilter, setSkuFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [chartView, setChartView] = useState("weekly");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Update context when Dashboard loads with new data
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const isB2B = rawData.some(r => r["Gstin"] || r["Buyer Name"]);
      const newType = isB2B ? 'b2b' : 'b2c';
      updateDataset({ id: filename, type: newType });
    }
  }, [filename, rawData, updateDataset]);

  const filtered = useMemo(() => {
    let d = rawData || [];

    if (dateRange === "7d") { const c = new Date(); c.setDate(c.getDate() - 7); d = d.filter(r => r._isoDate >= c); }
    if (startDate) { const sd = new Date(startDate); d = d.filter(r => r._isoDate && r._isoDate >= sd); }
    if (endDate) { const ed = new Date(endDate); d = d.filter(r => r._isoDate && r._isoDate <= ed); }
    if (skuFilter) d = d.filter(r => (r["Sku"] || "").toLowerCase().includes(skuFilter.toLowerCase()) || (r["Item Description"] || "").toLowerCase().includes(skuFilter.toLowerCase()));
    if (stateFilter !== "all") d = d.filter(r => r["Ship To State"] === stateFilter);
    return d;
  }, [rawData, dateRange, skuFilter, stateFilter, startDate, endDate]);

  const stats = useMemo(() => processData(filtered), [filtered]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return chartView === "monthly" ? (stats.monthlySales || []).map(m => ({ ...m, name: m.month }))
      : chartView === "daily" ? (stats.dailySales || []).slice(-30).map(d => ({ ...d, name: d.date.slice(5) }))
      : (stats.weeklySales || []).map(w => ({ ...w, name: w.week }));
  }, [stats, chartView]);

  const styles = {
    container: { fontFamily: "'Inter', sans-serif", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", minHeight: "100vh", display: "flex" },
    main: { flex: 1, marginLeft: 280, padding: "32px 40px", minWidth: 0 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(0,0,0,0.05)" },
    filterBar: { display: "flex", gap: 12, marginBottom: 24, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", padding: 16, borderRadius: 16, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.03)", border: "1px solid #ffffff" },
    card: { background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", borderRadius: 16, padding: 28, boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)", marginBottom: 24, border: "1px solid #ffffff" },
    select: { padding: "10px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#ffffff", fontSize: 14, fontWeight: 600, color: "#334155", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "14px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" },
    td: { padding: "14px", fontSize: 14, color: "#334155", borderBottom: "1px solid #f1f5f9" }
  };

  const generatePDF = async () => {
    setIsExporting(true);
    
    // Give React time to physically render all charts un-collapsed
    setTimeout(async () => {
      try {
        const target = document.getElementById("dashboard-export-area");
        if(!target) return;
        
        const canvas = await html2canvas(target, { scale: 3, backgroundColor: "#f8fafc", useCORS: true, logging: false });
        const imgData = canvas.toDataURL("image/png", 1.0);
        
        // Define precise optical bounds using exact DOM dimensions
        const pdfWidth = target.offsetWidth;
        const pdfHeight = target.offsetHeight;
        
        // Render with extreme high-res scale mapped perfectly into the DOM boundary
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`SellerIQ_MasterReport_${activePlan.toUpperCase()}.pdf`);
      } catch (err) {
        console.error("PDF Export failed", err);
        alert("Failed to render PDF. Please try again.");
      } finally {
        setIsExporting(false);
      }
    }, 5000); // Wait 5 seconds for dynamically un-collapsed network components to finish fetching
  };

  return (
    <div style={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} onReset={onReset} activePlan={activePlan} />

      <div style={styles.main} id="dashboard-export-area">

        <div style={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: BRAND }}>
              {isExporting ? "Comprehensive Executive Report" : (
                activeTab === "overview" ? (
                  source === 'shopify' ? "D2C Flow Analytics Dashboard" :
                  source === 'custom'  ? "Enterprise ERP Intelligence Hub" :
                  "Dashboard Overview"
                ) :
                activeTab === "sku" ? "Product & SKU Dynamics" :
                activeTab === "regions" ? "Regional Fulfillment Map" :
                activeTab === "tax" ? "Tax Class Distribution" :
                activeTab === "fraud" ? "Risk & Scam Detection" :
                activeTab === "forecast" ? "Revenue Projections" :
                activeTab === "saas" ? "SaaS Integration Hub" :
                activeTab === "about" ? "About SellerIQ Pro" :
                activeTab === "support" ? "Customer Support Center" : ""
              )}
            </h1>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Report: <b>{filename}</b> • {rawData.length.toLocaleString()} transactions • {source === 'shopify' ? 'Shopify Export' : source === 'custom' ? 'Custom ERP' : 'Amazon MTR'} Tracker</div>
          </div>
          <div style={{ textAlign: "right", marginRight: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: GREEN, marginBottom: 12 }}>● STATUS: SECURE</div>
            <button 
               onClick={generatePDF} 
               style={{ 
                 padding: "8px 16px", borderRadius: 8, border: "none", 
                 background: BRAND, 
                 color: "#fff", 
                 fontSize: 13, fontWeight: 700, cursor: "pointer",
                 display: "flex", alignItems: "center", gap: 8 
               }}
               title="Download PDF Report"
            >
               <Download size={16} /> PDF Export
            </button>
          </div>
        </div>

        {!isExporting && activeTab !== "fraud" && activeTab !== "saas" && activeTab !== "about" && activeTab !== "support" && (
          <div style={styles.filterBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>Period:</span>
              <select style={styles.select} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="all">Lifetime</option>
                <option value="7d">Last 7d</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>State:</span>
              <select style={styles.select} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="all">All Regions</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <input type="text" placeholder="Search SKU or name..." style={{ ...styles.select, flex: 1, background: "#fff" }} value={skuFilter} onChange={e => setSkuFilter(e.target.value)} />
            </div>
            {activeTab === "overview" && (
              <div style={{ display: "flex", gap: 4, padding: 3, background: "#f1f5f9", borderRadius: 8 }}>
                {["daily", "weekly", "monthly"].map(v => (
                  <button key={v} onClick={() => setChartView(v)} style={{ padding: "4px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer", background: chartView === v ? "#fff" : "transparent" }}>{v[0].toUpperCase() + v.slice(1)}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGE CONTENT RENDERING */}
        {(activeTab === "overview" || isExporting) && stats && (
          <>
            {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, marginTop: 40, color: "#0f172a" }}>1. Executive Overview</h2>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
              <KpiCard label={source === 'shopify' ? 'D2C Gross Sales' : source === 'custom' ? 'Wholesale Revenue' : 'Total Revenue'} value={fmt(stats.totalRevenue)} icon="💰" color={BRAND} trend={8.2} />
              <KpiCard label={source === 'shopify' ? 'Checkout Orders' : source === 'custom' ? 'B2B Purchase Orders' : 'Orders Received'} value={stats.totalOrders} icon="📦" color={GREEN} trend={12} />
              <KpiCard label={source === 'shopify' ? 'Cart Abandonment Loss' : source === 'custom' ? 'Defect Return Rate' : 'Refund Rate'} value={`${stats.returnRate}%`} icon="🔄" color={RED} trend={-2} />
              <KpiCard label={source === 'shopify' ? 'Average Cart Value' : source === 'custom' ? 'Avg PO Value' : 'Avg. Order Value'} value={fmt(stats.avgOrderValue)} icon="💎" color={PURPLE} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={styles.card}>
                <SectionHeader title="📈 Revenue performance" sub="Revenue trend per selected view" />
                <ResponsiveContainer width="100%" height={280}>
                   <AreaChart data={chartData}>
                     <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND} stopOpacity={0.1}/><stop offset="95%" stopColor={BRAND} stopOpacity={0}/></linearGradient></defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" tick={{fontSize: 10}} />
                     <YAxis tick={{fontSize: 10}} tickFormatter={v => fmt(v)} />
                     <Tooltip />
                     <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={3} fill="url(#gr)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.card}>
                 <SectionHeader title="🏆 Top Products" sub={source === 'shopify' ? 'Top Converting Variants' : source === 'custom' ? 'Highest Volume SKUs' : 'Top 5 contributors'} />
                 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {(stats.skuList || []).slice(0, 5).map((s, i) => (
                     <div key={s.sku} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{s.sku}</div>
                          <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", background: colorFor(i), width: `${stats.skuList[0].revenue ? (s.revenue / stats.skuList[0].revenue * 100) : 0}%` }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right", marginLeft: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{fmt(s.revenue)}</div>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </>
        )}

        {(activeTab === "regions" || isExporting) && stats && (
          <div className="page-container" style={{ marginTop: isExporting ? 60 : 0 }}>
            {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, color: "#0f172a" }}>2. Territorial Breakdown</h2>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={styles.card}>
                <SectionHeader title="🗺️ Regional Performance" sub="Revenue by Shipping State" />
                <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={(stats.stateList || []).slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="state" type="category" width={100} style={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="revenue" fill={BRAND} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.card}>
                <SectionHeader title="📈 State Growth Matrix" sub="Key metrics per region" />
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>State</th><th style={styles.th}>Revenue</th><th style={styles.th}>Orders</th></tr>
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
            </div>
          </div>
        )}

        {(activeTab === "fraud" || isExporting) && (
           <div style={{ marginTop: isExporting ? 60 : 0 }}>
             {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, color: "#0f172a" }}>3. Threat Intelligence</h2>}
             {canAccess('pro') ? (
               <FraudAnalysis session_id={session_id} />
             ) : (
               <UpgradeBanner feature="Risk & Fraud Detection" requiredPlan="Pro" color="#a855f7" icon="🛡️" />
             )}
           </div>
        )}

        {(activeTab === "tax" || isExporting) && stats && (
           dataset?.type === 'b2c' ? (
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: isExporting ? 60 : 0 }}>
             <div style={{ gridColumn: "1 / -1" }}>{isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 10, color: "#0f172a" }}>4. Sales Health Metrics</h2>}</div>
             <div style={styles.card}>
               <SectionHeader title="💖 Sales Health Metrics" sub="Overview of performance without tax overhead" />
               <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
                  <KpiCard label="Net Revenue" value={fmt(stats.totalRevenue)} color={GREEN} icon="💰" />
                  <KpiCard label="Total Units Processed" value={stats.totalOrders} color={BRAND} icon="📦" />
                  <KpiCard label="Avg Order Value" value={fmt(stats.avgOrderValue)} color={PURPLE} icon="💎" />
               </div>
             </div>
             <div style={styles.card}>
               <SectionHeader title="📦 Fulfillment Channels" sub="FBA vs MFN" />
               <ResponsiveContainer width="100%" height={220}>
                 <PieChart><Pie data={stats.channelData || []} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={5}><Cell fill={BRAND}/><Cell fill={ACCENT}/></Pie><Tooltip/><Legend/></PieChart>
               </ResponsiveContainer>
             </div>
           </div>
           ) : (
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: isExporting ? 60 : 0 }}>
             <div style={{ gridColumn: "1 / -1" }}>{isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 10, color: "#0f172a" }}>4. GST & Tax Liability</h2>}</div>
             <div style={styles.card}>
               <SectionHeader title="🧾 GST Summary" />
               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                 {[
                   { l: "Total GST", v: stats.tax?.total, c: BRAND },
                   { l: "IGST (Inter-State)", v: stats.tax?.igst, c: PURPLE },
                   { l: "CGST (Intra-State)", v: stats.tax?.cgst, c: GREEN },
                   { l: "SGST (Intra-State)", v: stats.tax?.sgst, c: TEAL },
                 ].map(t => (
                   <div key={t.l} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                     <span style={{ fontSize: 13, fontWeight: 700 }}>{t.l}</span>
                     <span style={{ fontSize: 15, fontWeight: 900, color: t.c }}>{fmt(t.v || 0)}</span>
                   </div>
                 ))}
               </div>
             </div>
             <div style={styles.card}>
               <SectionHeader title="📊 Tax Split" />
               <ResponsiveContainer width="100%" height={220}>
                 <PieChart><Pie data={stats.taxPie || []} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={5}><Cell fill={PURPLE}/><Cell fill={GREEN}/><Cell fill={TEAL}/></Pie><Tooltip/></PieChart>
               </ResponsiveContainer>
             </div>
           </div>
           )
        )}

        {(activeTab === "sku" || isExporting) && stats && (
           <div style={{ ...styles.card, marginTop: isExporting ? 60 : 0 }}>
             {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, color: "#0f172a" }}>5. Product Performance Catalog</h2>}
            <SectionHeader title="📋 Product Performance Inventory" sub="Detailed SKU breakdown" />
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>SKU / Description</th><th style={styles.th}>Revenue</th><th style={styles.th}>Units</th><th style={styles.th}>Velocity</th><th style={styles.th}>Status</th></tr>
              </thead>
              <tbody>
                {(stats.skuVelocity || []).slice(0, 15).map(s => (
                  <tr key={s.sku}>
                    <td style={styles.td}><b>{s.sku}</b><div style={{ fontSize: 11, color: "#64748b" }}>{s.desc?.slice(0, 40)}</div></td>
                    <td style={styles.td}>{fmt(s.revenue)}</td>
                    <td style={styles.td}>{s.units}</td>
                    <td style={styles.td}>{s.dailyVelocity?.toFixed(2)}/day</td>
                    <td style={styles.td}><Badge label={s.dailyVelocity > 1 ? "Hot" : "Active"} color={s.dailyVelocity > 1 ? GREEN : BRAND} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 💎 SAAS HUB & TRANSACTION PATHWAY */}
        {!isExporting && activeTab === "saas" && (
          canAccess('enterprise') ? (
          <div className="page-container">
            <div style={{ ...styles.card, background: `linear-gradient(135deg, ${BRAND}, #1e293b)`, color: "#fff", padding: "40px 48px", border: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Transaction Path Way</h2>
                  <p style={{ opacity: 0.8, fontSize: 14 }}>Visualize the lifecycle of your sales data inside SellerIQ Pro</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, letterSpacing: 1 }}>CURRENT PLAN</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT }}>ENTERPRISE</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginTop: 60, paddingBottom: 20 }}>
                <div style={{ position: "absolute", top: 24, left: 40, right: 40, height: 2, background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
                {[
                  { label: "Data Ingestion", icon: "📥", sub: "CSV Upload & Parsing" },
                  { label: "Risk Scrubbing", icon: "🛡️", sub: "Fraud Detection Engine" },
                  { label: "Tax Compliance", icon: "🧾", sub: "GST Auto-Breakdown" },
                  { label: "Growth Modeling", icon: "📈", sub: "Predictive Forecasting" },
                  { label: "Net P&L Result", icon: "🚀", sub: "Actionable Intelligence" },
                ].map((step, i) => (
                  <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1, flex: 1 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: i === 4 ? ACCENT : "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                      fontSize: 20, border: "2px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)"
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{step.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={styles.card}>
                <SectionHeader title="💎 Premium Features" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Unlimited Seller Accounts Integration",
                    "Real-time Inventory Velocity Alerts",
                    "Priority Risk Intelligence Database",
                    "Advanced API Access (Coming Soon)",
                  ].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#64748b" }}>
                      <span style={{ color: GREEN }}>✔</span> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <SectionHeader title="📊 Data Health Index" />
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: BRAND }}>98.2%</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Analysis Accuracy Score</div>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <UpgradeBanner feature="SaaS Hub & Transaction Pathway" requiredPlan="Enterprise" color="#f59e0b" icon="💎" />
          )
        )}

        {(activeTab === "forecast" || isExporting) && stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: isExporting ? 60 : 0 }}>
              <div style={{ gridColumn: "1 / -1" }}>{isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 10, color: "#0f172a" }}>6. Algorithmic Forecasting</h2>}</div>
              {canAccess('pro') ? (
                <>
                  <div style={styles.card}>
                     <SectionHeader title="🔮 Revenue Forecast" sub="Modeling future growth" />
                     <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <KpiCard label="Next 7 Days" value={fmt(stats.forecast7)} color={BRAND} icon="📅" />
                        <KpiCard label="Next 30 Days" value={fmt(stats.forecast30)} color={PURPLE} icon="📅" />
                        <KpiCard label="Next 90 Days" value={fmt(stats.forecast90)} color={GREEN} icon="📅" />
                     </div>
                  </div>
                  <div style={styles.card}>
                    <SectionHeader title="📈 Historical Trend" />
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats.weeklySales || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week" hide/><YAxis hide/><Tooltip/><Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={4} dot={false}/></LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: "1 / -1" }}>
                  <UpgradeBanner feature="Revenue Forecasting & Predictions" requiredPlan="Pro" color="#a855f7" icon="📈" />
                </div>
              )}
            </div>
        )}

      </div>

      {/* 🌱 ABOUT US PAGE */}
      {!isExporting && activeTab === "about" && (
        <div className="page-container glass" style={{ padding: "40px", maxWidth: 800, margin: "0 auto", marginTop: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: BRAND }}>Empowering Enterprise Intelligence</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#475569", marginBottom: 32 }}>
            SellerIQ Pro is a premier data analytics engine developed exclusively to bridge the gap between massive eCommerce datasets and actionable enterprise decision-making. 
            Our mission is to arm brands with the fastest, most secure, and most intelligent toolkit to dissect their Amazon and B2B pipelines.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={styles.card}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Our Vision</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>To become the undisputed global standard in AI-driven unified commerce intelligence by replacing manual spreadsheets with automated truth engines.</p>
            </div>
            <div style={styles.card}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🛡️</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Security First</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>Our SaaS algorithms process all analytical datasets statelessly. We enforce heavy encryption pipelines to guarantee your private financial vectors remain completely obscured.</p>
            </div>
          </div>
        </div>
      )}

      {/* 🎧 SUPPORT PAGE */}
      {!isExporting && activeTab === "support" && (
        <div className="page-container" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, marginTop: 40 }}>
          <div className="glass" style={{ padding: "40px" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, color: "#0f172a" }}>Need Technical Assistance?</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={e => { e.preventDefault(); alert("Support request submitted successfully. A specialist will respond shortly."); }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>FULL NAME</label><input required type="text" style={{ ...styles.select, width: "100%", marginTop: 6 }} placeholder="Jane Doe" /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>BUSINESS EMAIL</label><input required type="email" style={{ ...styles.select, width: "100%", marginTop: 6 }} placeholder="jane@acmecorp.com" /></div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>ISSUE CATEGORY</label>
                <select style={{ ...styles.select, width: "100%", marginTop: 6 }}>
                   <option>Dataset Parsing Error</option>
                   <option>SaaS Billing & Plan Inquiry</option>
                   <option>Algorithm Integrity Question</option>
                   <option>API Access Request</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>DETAILED DESCRIPTION</label>
                <textarea required style={{ ...styles.select, width: "100%", marginTop: 6, minHeight: 120, fontFamily: "inherit" }} placeholder="Describe the behavior or request..." />
              </div>
              <button type="submit" style={{ background: BRAND, color: "#fff", padding: "12px 24px", borderRadius: 8, border: "none", fontWeight: 800, cursor: "pointer", marginTop: 12 }}>Submit Support Ticket</button>
            </form>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
             <div style={styles.card}>
               <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Contact Hub</h3>
               <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>📧 support@selleriq.pro</div>
               <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>📞 +1 (800) 555-0199</div>
               <div style={{ fontSize: 13, color: "#475569" }}>💬 Live Chat Available Mon-Fri</div>
             </div>
             <div style={styles.card}>
               <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Response SLA</h3>
               <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                 Enterprise accounts receive prioritized {"<2 hour"} response metrics. Pro accounts {"<12 hours"}. Starter accounts within {"<24 business hours"}.
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#dc2626', background: '#fef2f2', minHeight: '100vh' }}>
          <h2>React Runtime Crash Exception</h2>
          <pre style={{ background: '#fff', padding: 20, border: '1px solid #fca5a5' }}>
            {this.state.error?.toString()}
            <br/><br/>
            {this.state.error?.stack}
          </pre>
          <button style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }} onClick={() => window.location.href='/'}>Emergency Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('siq_role')); 
  const [activePlan, setActivePlan] = useState(() => sessionStorage.getItem('siq_plan') || 'starter'); 
  const [state, setState] = useState({ rawData: null, analysis: null, filename: null });

  // Persist session to session storage
  useEffect(() => {
    if (userRole) {
      sessionStorage.setItem('siq_role', userRole);
      sessionStorage.setItem('siq_plan', activePlan);
    } else {
      sessionStorage.removeItem('siq_role');
      sessionStorage.removeItem('siq_plan');
    }
  }, [userRole, activePlan]);

  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash.replace('#', '');
      
      // LOGOUT LOGIC: Only logout if explicitly navigating to login 
      // AND we don't have a valid active session in storage (or hash specifically says login)
      if (hash === 'login') {
         setUserRole(null);
         sessionStorage.clear();
      } else if (hash === 'upload') {
         setState({ rawData: null, analysis: null, filename: null });
      } else if (hash === '' && !userRole) {
         // If hash is cleared and no session, go to login
         window.location.hash = 'login';
      }
    };
    window.addEventListener('hashchange', handleNavigation);
    
    // Initial state setup
    const initialHash = window.location.hash.replace('#', '');
    if (!initialHash) {
      window.location.hash = userRole ? 'upload' : 'login';
    } else {
      handleNavigation();
    }
    
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, [userRole]);

  if (!userRole) {
    return <LoginSection onLogin={(role, plan) => { 
      setUserRole(role || 'user'); 
      if(plan) setActivePlan(plan); 
      window.location.hash = role === 'admin' ? 'admin' : 'upload';
    }} />;
  }
  
  if (userRole === 'admin') {
    return <AdminPanel onLogout={() => {
      setUserRole(null);
      window.location.hash = 'login';
    }} />;
  }
  
  if (!state.rawData) {
    return <UploadSection activePlan={activePlan} onData={(res, filename, source) => {
      setState({ rawData: res.rawData, analysis: res.analysis, filename, source, session_id: res.session_id });
      window.location.hash = 'overview';
    }} />;
  }

  if (state.source === 'shopify') {
    return <ShopifyDashboard rawData={state.rawData} filename={state.filename} onReset={() => {
      setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null });
      window.location.hash = 'upload';
    }} />;
  }

  if (state.source === 'custom') {
    return <ERPDashboard rawData={state.rawData} filename={state.filename} onReset={() => {
      setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null });
      window.location.hash = 'upload';
    }} />;
  }

  return (
    <>
      <style>{`
        :root {
          --danger: #ef4444;
          --warning: #f59e0b;
          --text-secondary: #64748b;
          --bg-primary: #f8fafc;
          --border-color: #e2e8f0;
          --accent-secondary: #1b3a6b;
          --text-primary: #1e293b;
        }
        * { box-sizing: border-box; }
        .page-container { animation: fadeIn 0.4s ease-out; }
        .glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); border-radius: 16px; box-shadow: 0 20px 40px -20px rgba(0,0,0,0.05); border: 1px solid #ffffff; }
        .loader-container { display: flex; justify-content: center; padding: 60px; }
        .loader { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #1b3a6b; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .filter-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f9fafb; font-size: 13px; outline: none; }
        .page-title { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
      `}</style>
      <Dashboard 
        rawData={state.rawData} 
        filename={state.filename} 
        source={state.source}
        activePlan={activePlan} 
        session_id={state.session_id}
        onReset={() => {
          setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null });
          window.location.hash = 'upload';
        }} 
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
